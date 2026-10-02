import express, { Request, Response, NextFunction } from 'express';
import { StorageAdapter, FileStorageAdapter } from './storage/storageAdapter.js';
import { 
  verifyGoogleIdToken, 
  createSession, 
  getSession, 
  destroySession, 
  authorizeCourseAction 
} from './auth.js';
import { validateExamFile } from './fileValidator.js';
import { Account, AuditLog } from './types.js';

export interface AppOptions {
  storage?: StorageAdapter;
  googleClientId?: string;
  allowDevLogin?: boolean;
}

export function createServerApp(options: AppOptions = {}) {
  const app = express();
  const storage = options.storage || new FileStorageAdapter();
  const googleClientId = options.googleClientId || process.env.GOOGLE_CLIENT_ID;
  const allowDevLogin = options.allowDevLogin !== undefined 
    ? options.allowDevLogin 
    : (process.env.NODE_ENV === 'test' || process.env.ALLOW_DEV_LOGIN === 'true');

  // 1. Basic security headers
  app.use((_req: Request, res: Response, next: NextFunction) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'SAMEORIGIN');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    next();
  });

  // 2. Cookie parser helper
  app.use((req: Request, _res: Response, next: NextFunction) => {
    const cookieHeader = req.headers.cookie || '';
    const cookies: Record<string, string> = {};
    cookieHeader.split(';').forEach(pair => {
      const parts = pair.split('=');
      if (parts.length >= 2) {
        cookies[parts[0].trim()] = decodeURIComponent(parts.slice(1).join('=').trim());
      }
    });
    (req as any).cookies = cookies;
    next();
  });

  // 3. Body parser with 30MB limit for exam files
  app.use(express.json({ limit: '30mb' }));
  app.use(express.urlencoded({ limit: '30mb', extended: true }));

  // 4. Rate limiter (in-memory)
  const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
  const checkRateLimit = (key: string, maxRequests: number, windowMs: number): boolean => {
    if (process.env.NODE_ENV === 'test' || allowDevLogin) {
      return true;
    }
    const now = Date.now();
    const entry = rateLimitMap.get(key);
    if (!entry || now > entry.resetAt) {
      rateLimitMap.set(key, { count: 1, resetAt: now + windowMs });
      return true;
    }
    if (entry.count >= maxRequests) {
      return false;
    }
    entry.count++;
    return true;
  };

  // 5. Authentication middleware
  const authenticate = async (req: Request, res: Response, next: NextFunction) => {
    const cookies = (req as any).cookies || {};
    const authHeader = req.headers.authorization;
    let sessionId = cookies['mcu_session'];

    if (!sessionId && authHeader && authHeader.startsWith('Bearer ')) {
      sessionId = authHeader.substring(7).trim();
    }

    if (!sessionId) {
      res.status(401).json({ error: 'กรุณาเข้าสู่ระบบก่อนใช้งาน (Unauthorized)', code: 'UNAUTHORIZED' });
      return;
    }

    const session = getSession(sessionId);
    if (!session) {
      res.status(401).json({ error: 'เซสชันหมดอายุหรือถูกเพิกถอนแล้ว กรุณาเข้าสู่ระบบใหม่', code: 'SESSION_EXPIRED' });
      return;
    }

    const account = await storage.getAccountById(session.accountId);
    if (!account || account.status !== 'active') {
      destroySession(sessionId);
      res.status(403).json({ error: 'บัญชีของท่านถูกระงับหรือยังไม่ได้รับการอนุมัติ (Forbidden)', code: 'ACCOUNT_INACTIVE' });
      return;
    }

    (req as any).user = account;
    (req as any).session = session;
    next();
  };

  // 6. CSRF Check middleware for mutative requests
  const requireCsrf = (req: Request, res: Response, next: NextFunction) => {
    // If authenticated via Bearer token in header, CSRF is inherently mitigated;
    // but if cookie is used, check X-CSRF-Token header
    const session = (req as any).session;
    if (!session) {
      next();
      return;
    }
    const clientCsrf = req.headers['x-csrf-token'];
    if (!clientCsrf || clientCsrf !== session.csrfToken) {
      res.status(403).json({ error: 'CSRF Token ไม่ถูกต้องหรือไม่พบ (Invalid CSRF Token)', code: 'INVALID_CSRF' });
      return;
    }
    next();
  };

  // Helper: Sanitize account before returning to client (strip sensitive internal sub if needed)
  const sanitizeAccount = (account: Account) => ({
    accountId: account.accountId,
    googleEmail: account.googleEmail,
    fullName: account.fullName,
    role: account.role,
    status: account.status,
    assignedScope: account.assignedScope,
    canReadExamContent: account.canReadExamContent
  });

  // Helper: log audit
  const logAudit = async (
    req: Request, 
    action: AuditLog['action'], 
    details: string, 
    courseId?: string, 
    fileId?: string,
    fallbackAccount?: { accountId: string; googleEmail: string }
  ) => {
    const user = (req as any).user || fallbackAccount || { accountId: 'anonymous', googleEmail: 'anonymous' };
    const ip = req.ip || req.socket.remoteAddress || 'unknown';
    await storage.addAuditLog({
      logId: `log_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      timestamp: new Date().toISOString(),
      accountId: user.accountId,
      accountEmail: user.googleEmail,
      action,
      courseId,
      fileId,
      ipAddress: String(ip),
      details
    });
  };

  // ==========================================
  // Routes: Auth
  // ==========================================

  app.post('/api/auth/google-login', async (req: Request, res: Response) => {
    const ip = req.ip || 'unknown';
    if (!checkRateLimit(`login_${ip}`, 10, 60000)) {
      res.status(429).json({ error: 'คำขอเข้าสู่ระบบบ่อยเกินไป กรุณารอสักครู่แล้วลองใหม่', code: 'RATE_LIMITED' });
      return;
    }

    const { idToken, devEmail } = req.body || {};

    let targetEmail = '';
    let targetSub = '';
    let targetName = '';

    if (devEmail && allowDevLogin) {
      targetEmail = String(devEmail).toLowerCase().trim();
      targetSub = `dev_sub_${targetEmail}`;
      targetName = `Dev User (${targetEmail})`;
    } else {
      if (!idToken) {
        res.status(400).json({ error: 'ไม่พบ Google ID Token ในคำขอ', code: 'MISSING_TOKEN' });
        return;
      }
      const tokenRes = await verifyGoogleIdToken(idToken, googleClientId);
      if (!tokenRes.valid || !tokenRes.email) {
        await logAudit(req, 'LOGIN_FAILED', `Google token verify failed: ${tokenRes.error}`);
        res.status(401).json({ error: tokenRes.error || 'ยืนยันตัวตน Google ไม่สำเร็จ', code: 'INVALID_TOKEN' });
        return;
      }
      targetEmail = tokenRes.email;
      targetSub = tokenRes.sub || '';
      targetName = tokenRes.name || targetEmail;
    }

    // Verify account exists and is approved in storage (Google Sheets Accounts table)
    let account = await storage.getAccountByEmail(targetEmail);
    if (!account) {
      await logAudit(req, 'LOGIN_FAILED', `Unapproved account tried login: ${targetEmail}`);
      res.status(403).json({
        error: `บัญชี Google (${targetEmail}) ยังไม่ได้รับการอนุมัติให้เข้าใช้งานระบบภายในมหาวิทยาลัย กรุณาติดต่อผู้ดูแลระบบ`,
        code: 'ACCOUNT_NOT_APPROVED'
      });
      return;
    }

    if (account.status !== 'active') {
      await logAudit(req, 'LOGIN_FAILED', `Inactive/Suspended account login: ${targetEmail} (status: ${account.status})`);
      res.status(403).json({
        error: `บัญชีของท่านมีสถานะ '${account.status}' ยังไม่สามารถเข้าใช้งานระบบได้`,
        code: 'ACCOUNT_NOT_ACTIVE'
      });
      return;
    }

    // Update lastLoginAt and Google Sub if changed
    account.lastLoginAt = new Date().toISOString();
    if (targetSub && !account.googleSub) {
      account.googleSub = targetSub;
    }
    await storage.upsertAccount(account);

    // Create session
    const { sessionId, csrfToken, expiresAt } = createSession(account.accountId);

    // Set secure HttpOnly cookie
    const isProd = process.env.NODE_ENV === 'production';
    res.setHeader(
      'Set-Cookie',
      `mcu_session=${sessionId}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${8 * 3600}${isProd ? '; Secure' : ''}`
    );

    await logAudit(req, 'LOGIN', `Login successful as ${account.role}`, undefined, undefined, account);

    res.json({
      success: true,
      user: sanitizeAccount(account),
      csrfToken,
      expiresAt
    });
  });

  app.get('/api/auth/me', authenticate, (req: Request, res: Response) => {
    const user = (req as any).user as Account;
    const session = (req as any).session;
    res.json({
      user: sanitizeAccount(user),
      csrfToken: session?.csrfToken
    });
  });

  app.post('/api/auth/logout', authenticate, async (req: Request, res: Response) => {
    const session = (req as any).session;
    if (session) {
      destroySession(session.sessionId);
    }
    res.setHeader('Set-Cookie', 'mcu_session=; Path=/; HttpOnly; Max-Age=0');
    await logAudit(req, 'LOGOUT', 'Logged out');
    res.json({ success: true, message: 'ออกจากระบบสำเร็จ' });
  });

  // ==========================================
  // Routes: Courses
  // ==========================================

  app.get('/api/courses', authenticate, async (req: Request, res: Response) => {
    const user = (req as any).user as Account;
    const allCourses = await storage.getCourses();
    const submissions = await storage.getSubmissions();

    // Filter courses strictly based on user's authorized scope
    const accessibleCourses = allCourses.filter(course => {
      const authResult = authorizeCourseAction(user, course, 'read');
      return authResult.allowed;
    });

    const subMap = new Map(submissions.map(s => [s.courseId, s]));

    const result = accessibleCourses.map(course => {
      const sub = subMap.get(course.courseId);
      return {
        ...course,
        submissionStatus: sub?.status || 'pending',
        currentVersion: sub?.currentVersion || 0,
        latestFileName: sub?.latestFileName,
        latestFileSize: sub?.latestFileSize,
        submittedAt: sub?.submittedAt,
        submittedByAccountName: sub?.submittedByAccountName,
        verifiedAt: sub?.verifiedAt,
        verifiedByAccountName: sub?.verifiedByAccountName,
        rejectionReason: sub?.rejectionReason
      };
    });

    res.json({ courses: result });
  });

  app.get('/api/courses/:courseId', authenticate, async (req: Request, res: Response) => {
    const user = (req as any).user as Account;
    const { courseId } = req.params;
    const course = await storage.getCourseById(courseId);

    if (!course) {
      res.status(404).json({ error: 'ไม่พบข้อมูลรายวิชา', code: 'COURSE_NOT_FOUND' });
      return;
    }

    const auth = authorizeCourseAction(user, course, 'read');
    if (!auth.allowed) {
      res.status(403).json({ error: auth.reason || 'ท่านไม่มีสิทธิ์เข้าถึงรายวิชานี้', code: 'FORBIDDEN' });
      return;
    }

    const submission = await storage.getSubmissionByCourseId(courseId);
    const versions = await storage.getVersions(courseId);

    res.json({
      course,
      submission: submission || {
        submissionId: `sub_${courseId}`,
        courseId,
        currentVersion: 0,
        status: 'pending'
      },
      versions
    });
  });

  // ==========================================
  // Routes: Exam Upload (Teacher)
  // ==========================================

  app.post('/api/exams/:courseId/upload', authenticate, requireCsrf, async (req: Request, res: Response) => {
    const user = (req as any).user as Account;
    const { courseId } = req.params;

    const course = await storage.getCourseById(courseId);
    if (!course) {
      res.status(404).json({ error: 'ไม่พบรายวิชาที่ระบุ', code: 'COURSE_NOT_FOUND' });
      return;
    }

    const auth = authorizeCourseAction(user, course, 'upload');
    if (!auth.allowed) {
      await logAudit(req, 'SECURITY_VIOLATION', `Unauthorized upload attempt on ${courseId}`, courseId);
      res.status(403).json({ error: auth.reason || 'ท่านไม่มีสิทธิ์ส่งข้อสอบในรายวิชานี้', code: 'FORBIDDEN' });
      return;
    }

    const ip = req.ip || 'unknown';
    if (!checkRateLimit(`upload_${user.accountId}_${ip}`, 20, 60000)) {
      res.status(429).json({ error: 'ส่งไฟล์บ่อยเกินไป กรุณารอสักครู่แล้วลองใหม่', code: 'RATE_LIMITED' });
      return;
    }

    const { fileName, fileBase64, fileMime, notes } = req.body || {};
    if (!fileName || !fileBase64) {
      res.status(400).json({ error: 'กรุณาแนบไฟล์และชื่อไฟล์ข้อสอบ', code: 'MISSING_FILE' });
      return;
    }

    let buffer: Buffer;
    try {
      buffer = Buffer.from(fileBase64, 'base64');
    } catch {
      res.status(400).json({ error: 'การเข้ารหัส Base64 ของไฟล์ไม่ถูกต้อง', code: 'INVALID_BASE64' });
      return;
    }

    // Acquire concurrency lock for this course submission
    const unlock = await storage.acquireLock(`sub_upload_${courseId}`);
    try {
      let sub = await storage.getSubmissionByCourseId(courseId);
      const nextVersion = (sub?.currentVersion || 0) + 1;

      // Validate file: magic bytes, MIME, size, extension
      const validation = validateExamFile(fileName, buffer, fileMime || '', course.courseCode, nextVersion);
      if (!validation.isValid) {
        res.status(400).json({
          error: validation.error || 'ไฟล์ข้อสอบไม่ผ่านการตรวจสอบความปลอดภัย',
          code: 'FILE_VALIDATION_FAILED'
        });
        return;
      }

      // Store private file
      const { fileId, storagePath } = await storage.storeExamFile(
        courseId,
        nextVersion,
        validation.safeFileName,
        buffer,
        validation.detectedMime
      );

      const nowIso = new Date().toISOString();

      // Record Exam Version (keep historical versions)
      const versionRecord = {
        versionId: `ver_${courseId}_v${nextVersion}`,
        submissionId: sub?.submissionId || `sub_${courseId}`,
        courseId,
        version: nextVersion,
        driveFileId: fileId,
        driveFileName: validation.safeFileName,
        fileMime: validation.detectedMime,
        fileSizeBytes: validation.fileSizeBytes,
        sha256: validation.sha256,
        uploadedByAccountId: user.accountId,
        uploadedByAccountName: user.fullName,
        uploadedAt: nowIso,
        notes: notes || undefined
      };
      await storage.addVersion(versionRecord);

      // Update or create submission
      const updatedSubmission = {
        submissionId: sub?.submissionId || `sub_${courseId}`,
        courseId,
        currentVersion: nextVersion,
        status: 'submitted' as const,
        latestFileId: fileId,
        latestFileName: validation.safeFileName,
        latestFileSize: validation.fileSizeBytes,
        latestFileMime: validation.detectedMime,
        submittedByAccountId: user.accountId,
        submittedByAccountName: user.fullName,
        submittedAt: nowIso,
        verifiedByAccountId: undefined,
        verifiedByAccountName: undefined,
        verifiedAt: undefined,
        rejectionReason: undefined,
        quarantineStatus: validation.quarantineStatus
      };
      await storage.upsertSubmission(updatedSubmission);

      await logAudit(
        req, 
        'UPLOAD_EXAM', 
        `Uploaded version ${nextVersion} (${validation.safeFileName}, ${(validation.fileSizeBytes/1024).toFixed(1)} KB, SHA256: ${validation.sha256.substring(0,8)})`,
        courseId,
        fileId
      );

      res.json({
        success: true,
        message: `ส่งข้อสอบรายวิชา ${course.courseCode} (${course.courseName}) เวอร์ชันที่ ${nextVersion} เรียบร้อยแล้ว`,
        submission: updatedSubmission,
        version: versionRecord,
        scanNotice: validation.scanNotice
      });
    } finally {
      unlock();
    }
  });

  // ==========================================
  // Routes: File Access (View & Download)
  // ==========================================

  app.get('/api/exams/:courseId/files/:versionId/view', authenticate, async (req: Request, res: Response) => {
    const user = (req as any).user as Account;
    const { courseId, versionId } = req.params;

    const course = await storage.getCourseById(courseId);
    if (!course) {
      res.status(404).json({ error: 'ไม่พบรายวิชา', code: 'NOT_FOUND' });
      return;
    }

    // Role check:
    // Teachers can view if assigned
    // Staff can view if in scope
    // Admin can view ONLY if canReadExamContent is true
    let canView = false;
    if (user.role === 'teacher') {
      canView = course.assignedLecturerIds.includes(user.accountId) || user.assignedScope.includes(course.courseCode);
    } else if (user.role === 'staff') {
      canView = user.assignedScope.includes('all') || user.assignedScope.includes(course.faculty) || user.assignedScope.includes(course.courseCode);
    } else if (user.role === 'admin') {
      canView = user.canReadExamContent === true;
    }

    if (!canView) {
      await logAudit(req, 'SECURITY_VIOLATION', `Unauthorized file view attempt on ${courseId}`, courseId);
      res.status(403).json({
        error: user.role === 'admin'
          ? 'ผู้ดูแลระบบต้องได้รับสิทธิ์อ่านเนื้อหาข้อสอบ (canReadExamContent) จึงจะเปิดดูไฟล์ได้'
          : 'ท่านไม่มีสิทธิ์เปิดอ่านไฟล์ข้อสอบของรายวิชานี้',
        code: 'FORBIDDEN'
      });
      return;
    }

    const versions = await storage.getVersions(courseId);
    const targetVersion = versions.find(v => v.versionId === versionId || String(v.version) === versionId);

    if (!targetVersion) {
      res.status(404).json({ error: 'ไม่พบประวัติเวอร์ชันข้อสอบที่ระบุ', code: 'VERSION_NOT_FOUND' });
      return;
    }

    const file = await storage.getExamFile(targetVersion.driveFileId);
    if (!file) {
      res.status(404).json({ error: 'ไม่พบไฟล์ข้อสอบในที่จัดเก็บ', code: 'FILE_NOT_FOUND' });
      return;
    }

    await logAudit(req, 'OPEN_EXAM', `Viewed file v${targetVersion.version} (${file.fileName})`, courseId, targetVersion.driveFileId);

    res.setHeader('Content-Type', file.mime);
    res.setHeader('Content-Disposition', `inline; filename="${encodeURIComponent(file.fileName)}"`);
    res.send(file.buffer);
  });

  // ==========================================
  // Routes: Verification & Staff Actions
  // ==========================================

  app.post('/api/exams/:courseId/verify', authenticate, requireCsrf, async (req: Request, res: Response) => {
    const user = (req as any).user as Account;
    const { courseId } = req.params;
    const { action, reason } = req.body || {};

    const course = await storage.getCourseById(courseId);
    if (!course) {
      res.status(404).json({ error: 'ไม่พบรายวิชา', code: 'COURSE_NOT_FOUND' });
      return;
    }

    const auth = authorizeCourseAction(user, course, 'verify');
    if (!auth.allowed) {
      res.status(403).json({ error: auth.reason || 'ท่านไม่มีสิทธิ์ตรวจรับข้อสอบ', code: 'FORBIDDEN' });
      return;
    }

    const sub = await storage.getSubmissionByCourseId(courseId);
    if (!sub || sub.status === 'pending') {
      res.status(400).json({ error: 'ยังไม่มีการส่งข้อสอบในรายวิชานี้ ไม่สามารถตรวจรับได้', code: 'NO_SUBMISSION' });
      return;
    }

    if (action === 'accept') {
      sub.status = 'accepted';
      sub.verifiedByAccountId = user.accountId;
      sub.verifiedByAccountName = user.fullName;
      sub.verifiedAt = new Date().toISOString();
      sub.rejectionReason = undefined;
      await storage.upsertSubmission(sub);
      await logAudit(req, 'APPROVE_EXAM', `Approved submission v${sub.currentVersion}`, courseId);
      res.json({ success: true, message: 'ตรวจรับข้อสอบเรียบร้อยแล้ว', submission: sub });
    } else if (action === 'reject') {
      if (!reason || !String(reason).trim()) {
        res.status(400).json({ error: 'กรุณาระบุเหตุผลที่ส่งกลับให้อาจารย์แก้ไข', code: 'MISSING_REASON' });
        return;
      }
      sub.status = 'rejected';
      sub.verifiedByAccountId = user.accountId;
      sub.verifiedByAccountName = user.fullName;
      sub.verifiedAt = new Date().toISOString();
      sub.rejectionReason = String(reason).trim();
      await storage.upsertSubmission(sub);
      await logAudit(req, 'REJECT_EXAM', `Rejected submission v${sub.currentVersion}: ${sub.rejectionReason}`, courseId);
      res.json({ success: true, message: 'ส่งกลับให้อาจารย์ผู้สอนแก้ไขข้อสอบเรียบร้อยแล้ว', submission: sub });
    } else {
      res.status(400).json({ error: "ค่า action ต้องเป็น 'accept' หรือ 'reject'", code: 'INVALID_ACTION' });
    }
  });

  app.post('/api/exams/:courseId/print-log', authenticate, requireCsrf, async (req: Request, res: Response) => {
    const user = (req as any).user as Account;
    const { courseId } = req.params;
    const { printPhase, copies } = req.body || {};

    const course = await storage.getCourseById(courseId);
    if (!course) {
      res.status(404).json({ error: 'ไม่พบรายวิชา', code: 'COURSE_NOT_FOUND' });
      return;
    }

    const auth = authorizeCourseAction(user, course, 'print');
    if (!auth.allowed) {
      await logAudit(req, 'SECURITY_VIOLATION', `Unauthorized print attempt on ${courseId}`, courseId);
      res.status(403).json({ error: auth.reason || 'ท่านไม่มีสิทธิ์สั่งพิมพ์ข้อสอบรายวิชานี้', code: 'FORBIDDEN' });
      return;
    }

    const actionType = printPhase === 'confirmed' ? 'PRINT_CONFIRM' : 'PRINT_REQUEST';
    const detailMsg = printPhase === 'confirmed'
      ? `Confirmed paper print completion (${copies || 1} copies)`
      : `Initiated print preparation/view dialog (${copies || 1} copies)`;

    await logAudit(req, actionType, detailMsg, courseId);
    res.json({ success: true, logged: actionType, message: 'บันทึกประวัติการสั่งพิมพ์เรียบร้อยแล้ว' });
  });

  // ==========================================
  // Routes: Admin Management
  // ==========================================

  app.get('/api/admin/accounts', authenticate, async (req: Request, res: Response) => {
    const user = (req as any).user as Account;
    if (user.role !== 'admin') {
      res.status(403).json({ error: 'เฉพาะผู้ดูแลระบบเท่านั้นที่มีสิทธิ์เข้าถึง', code: 'FORBIDDEN' });
      return;
    }
    const accounts = await storage.getAccounts();
    res.json({ accounts: accounts.map(sanitizeAccount) });
  });

  app.post('/api/admin/accounts', authenticate, requireCsrf, async (req: Request, res: Response) => {
    const user = (req as any).user as Account;
    if (user.role !== 'admin') {
      res.status(403).json({ error: 'เฉพาะผู้ดูแลระบบเท่านั้นที่มีสิทธิ์แก้ไขบัญชี', code: 'FORBIDDEN' });
      return;
    }

    const { googleEmail, fullName, role, status, assignedScope, canReadExamContent } = req.body || {};
    if (!googleEmail || !role) {
      res.status(400).json({ error: 'กรุณากรอกอีเมล Google และบทบาทผู้ใช้งาน', code: 'MISSING_FIELDS' });
      return;
    }

    const cleanEmail = String(googleEmail).toLowerCase().trim();
    let acc = await storage.getAccountByEmail(cleanEmail);

    if (!acc) {
      acc = {
        accountId: `usr_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        googleEmail: cleanEmail,
        googleSub: '',
        fullName: fullName || cleanEmail,
        role: role || 'teacher',
        status: status || 'active',
        assignedScope: Array.isArray(assignedScope) ? assignedScope : [],
        canReadExamContent: Boolean(canReadExamContent),
        createdAt: new Date().toISOString(),
        lastLoginAt: ''
      };
    } else {
      if (fullName) acc.fullName = fullName;
      if (role) acc.role = role;
      if (status) acc.status = status;
      if (assignedScope && Array.isArray(assignedScope)) acc.assignedScope = assignedScope;
      if (canReadExamContent !== undefined) acc.canReadExamContent = Boolean(canReadExamContent);
    }

    await storage.upsertAccount(acc);
    await logAudit(req, 'UPDATE_ACCOUNT', `Updated account ${cleanEmail} (role: ${acc.role}, canRead: ${acc.canReadExamContent})`);
    res.json({ success: true, account: sanitizeAccount(acc) });
  });

  app.post('/api/admin/assignments', authenticate, requireCsrf, async (req: Request, res: Response) => {
    const user = (req as any).user as Account;
    if (user.role !== 'admin') {
      res.status(403).json({ error: 'เฉพาะผู้ดูแลระบบเท่านั้นที่มีสิทธิ์มอบหมายรายวิชา', code: 'FORBIDDEN' });
      return;
    }

    const { courseId, lecturerAccountIds } = req.body || {};
    const course = await storage.getCourseById(courseId);
    if (!course) {
      res.status(404).json({ error: 'ไม่พบรายวิชา', code: 'COURSE_NOT_FOUND' });
      return;
    }

    if (!Array.isArray(lecturerAccountIds)) {
      res.status(400).json({ error: 'lecturerAccountIds ต้องเป็น Array ของรหัสบัญชีอาจารย์', code: 'INVALID_FORMAT' });
      return;
    }

    course.assignedLecturerIds = lecturerAccountIds;
    await storage.upsertCourse(course);
    await logAudit(req, 'ASSIGN_COURSE', `Assigned ${lecturerAccountIds.join(',')} to course ${course.courseCode}`, courseId);

    res.json({ success: true, course });
  });

  app.get('/api/audit-logs', authenticate, async (req: Request, res: Response) => {
    const user = (req as any).user as Account;
    if (user.role !== 'admin' && user.role !== 'staff') {
      res.status(403).json({ error: 'ไม่มีสิทธิ์เข้าถึงบันทึกประวัติการใช้งาน', code: 'FORBIDDEN' });
      return;
    }

    const logs = await storage.getAuditLogs(150);
    res.json({ auditLogs: logs });
  });

  // ==========================================
  // Global Error Handler
  // ==========================================
  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const isDev = process.env.NODE_ENV !== 'production';
    res.status(500).json({
      error: 'เกิดข้อผิดพลาดภายในระบบเซิร์ฟเวอร์ กรุณาติดต่อผู้ดูแลระบบ',
      code: 'INTERNAL_SERVER_ERROR',
      details: isDev ? err.message : undefined
    });
  });

  return { app, storage };
}
