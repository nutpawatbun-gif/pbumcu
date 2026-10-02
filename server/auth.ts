import crypto from 'crypto';
import { Account, Course, SessionData } from './types.js';
import { StorageAdapter } from './storage/storageAdapter.js';

export interface VerifyGoogleTokenResult {
  valid: boolean;
  email?: string;
  sub?: string;
  name?: string;
  error?: string;
}

const SESSION_TTL_MS = 8 * 60 * 60 * 1000; // 8 hours session duration
const sessions: Map<string, SessionData> = new Map();

/**
 * Verifies Google ID Token server-side
 * Supports live Google OAuth2 tokeninfo verification,
 * and isolated dev/test token verification when explicitly configured.
 */
export async function verifyGoogleIdToken(
  idToken: string,
  googleClientId?: string
): Promise<VerifyGoogleTokenResult> {
  if (!idToken || typeof idToken !== 'string') {
    return { valid: false, error: 'ไม่พบ ID Token หรือรูปแบบไม่ถูกต้อง' };
  }

  // 1. Allow Dev/Test Token in test environment or development
  if (
    (process.env.NODE_ENV === 'test' || process.env.ALLOW_DEV_LOGIN === 'true') &&
    idToken.startsWith('mock_google_token_')
  ) {
    const email = idToken.replace('mock_google_token_', '');
    return {
      valid: true,
      email: email.toLowerCase().trim(),
      sub: `mock_sub_${crypto.createHash('md5').update(email).digest('hex')}`,
      name: `ผู้ใช้ทดสอบ (${email})`
    };
  }

  // 2. Real Google Verification via Google's tokeninfo endpoint
  try {
    const res = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(idToken)}`);
    if (!res.ok) {
      return { valid: false, error: 'Google ID Token หมดอายุหรือไม่ถูกต้อง' };
    }
    const payload = await res.json();

    // Verify audience matches expected Client ID if configured
    if (googleClientId && payload.aud !== googleClientId) {
      return { valid: false, error: 'Google ID Token Client ID (aud) ไม่ตรงกับระบบ' };
    }

    // Verify issuer is Google
    if (payload.iss !== 'accounts.google.com' && payload.iss !== 'https://accounts.google.com') {
      return { valid: false, error: 'Google ID Token Issuer (iss) ไม่ถูกต้อง' };
    }

    // Verify email is present and verified
    if (!payload.email || payload.email_verified !== 'true' && payload.email_verified !== true) {
      return { valid: false, error: 'อีเมล Google ยังไม่ได้รับการยืนยันตัวตน (Email not verified)' };
    }

    return {
      valid: true,
      email: payload.email.toLowerCase().trim(),
      sub: payload.sub,
      name: payload.name || payload.email
    };
  } catch (err) {
    return { valid: false, error: `เกิดข้อผิดพลาดในการตรวจสอบสิทธิ์กับ Google: ${(err as Error).message}` };
  }
}

/**
 * Creates an authenticated session in memory with CSRF token and expiration
 */
export function createSession(accountId: string): { sessionId: string; csrfToken: string; expiresAt: number } {
  const sessionId = crypto.randomBytes(32).toString('hex');
  const csrfToken = crypto.randomBytes(24).toString('hex');
  const now = Date.now();
  const expiresAt = now + SESSION_TTL_MS;

  sessions.set(sessionId, {
    sessionId,
    accountId,
    csrfToken,
    createdAt: now,
    expiresAt
  });

  return { sessionId, csrfToken, expiresAt };
}

/**
 * Validates a session ID and checks for expiration
 */
export function getSession(sessionId?: string): SessionData | null {
  if (!sessionId) return null;
  const session = sessions.get(sessionId);
  if (!session) return null;

  if (Date.now() > session.expiresAt) {
    sessions.delete(sessionId);
    return null;
  }

  return session;
}

/**
 * Invalidates and destroys a session upon logout
 */
export function destroySession(sessionId?: string): boolean {
  if (!sessionId) return false;
  return sessions.delete(sessionId);
}

/**
 * Clears all sessions (useful for tests)
 */
export function clearAllSessions(): void {
  sessions.clear();
}

/**
 * Strict Server-side Course Authorization Checker
 * Enforces Default Deny.
 */
export function authorizeCourseAction(
  account: Account,
  course: Course,
  action: 'read' | 'upload' | 'verify' | 'print'
): { allowed: boolean; reason?: string } {
  // 1. Account status must be active
  if (account.status !== 'active') {
    return { allowed: false, reason: 'บัญชีของท่านถูกระงับสิทธิ์หรือยังไม่ได้รับการอนุมัติ (Status: ' + account.status + ')' };
  }

  // 2. Action: 'upload' - Only assigned teachers
  if (action === 'upload') {
    if (account.role !== 'teacher') {
      return { allowed: false, reason: 'เฉพาะอาจารย์ผู้สอนประจำรายวิชาเท่านั้นที่มีสิทธิ์ส่งข้อสอบ' };
    }
    const isAssigned = course.assignedLecturerIds.includes(account.accountId) ||
      account.assignedScope.includes(course.courseCode) ||
      account.assignedScope.includes(course.courseId);
    if (!isAssigned) {
      return { allowed: false, reason: `ท่านไม่ได้รับมอบหมายให้เป็นผู้สอนในรายวิชา ${course.courseCode} (${course.courseName})` };
    }
    return { allowed: true };
  }

  // 3. Action: 'verify' (Inspect, approve, reject) - Only exam staff or admin
  if (action === 'verify') {
    if (account.role !== 'staff' && account.role !== 'admin') {
      return { allowed: false, reason: 'เฉพาะเจ้าหน้าที่ฝ่ายจัดสอบเท่านั้นที่มีสิทธิ์ตรวจรับหรือส่งกลับข้อสอบ' };
    }
    // Check staff scope
    if (account.role === 'staff') {
      const inScope = account.assignedScope.includes('all') ||
        account.assignedScope.includes(course.faculty) ||
        account.assignedScope.includes(course.major) ||
        account.assignedScope.includes(course.courseCode);
      if (!inScope) {
        return { allowed: false, reason: 'รายวิชานี้อยู่นอกขอบเขตคณะ/สาขาวิชาที่ท่านได้รับมอบหมาย' };
      }
    }
    return { allowed: true };
  }

  // 4. Action: 'print' - Only authorized staff or admin with canReadExamContent
  if (action === 'print') {
    if (account.role === 'staff') {
      const inScope = account.assignedScope.includes('all') ||
        account.assignedScope.includes(course.faculty) ||
        account.assignedScope.includes(course.courseCode);
      if (!inScope) {
        return { allowed: false, reason: 'รายวิชานี้อยู่นอกขอบเขตที่ท่านมีสิทธิ์สั่งพิมพ์' };
      }
      return { allowed: true };
    }
    if (account.role === 'admin') {
      if (!account.canReadExamContent) {
        return { allowed: false, reason: 'ผู้ดูแลระบบต้องได้รับสิทธิ์อ่านและพิมพ์ข้อสอบ (canReadExamContent) จึงจะสั่งพิมพ์ได้' };
      }
      return { allowed: true };
    }
    return { allowed: false, reason: 'อาจารย์ผู้สอนไม่ได้รับสิทธิ์สั่งพิมพ์ข้อสอบจากระบบส่วนกลาง' };
  }

  // 5. Action: 'read' - Details and file access
  if (action === 'read') {
    if (account.role === 'teacher') {
      const isAssigned = course.assignedLecturerIds.includes(account.accountId) ||
        account.assignedScope.includes(course.courseCode) ||
        account.assignedScope.includes(course.courseId);
      if (!isAssigned) {
        return { allowed: false, reason: 'อาจารย์สามารถดูได้เฉพาะรายวิชาที่ตนเองได้รับมอบหมายเท่านั้น' };
      }
      return { allowed: true };
    }

    if (account.role === 'staff') {
      const inScope = account.assignedScope.includes('all') ||
        account.assignedScope.includes(course.faculty) ||
        account.assignedScope.includes(course.courseCode);
      if (!inScope) {
        return { allowed: false, reason: 'รายวิชานี้อยู่นอกขอบเขตของเจ้าหน้าที่' };
      }
      return { allowed: true };
    }

    if (account.role === 'admin') {
      return { allowed: true };
    }
  }

  return { allowed: false, reason: 'ปฏิเสธคำขอตามนโยบายความมั่นคงปลอดภัย (Default Deny)' };
}
