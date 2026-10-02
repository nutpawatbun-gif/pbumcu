import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { 
  Account, 
  Course, 
  ExamSubmission, 
  ExamVersion, 
  AuditLog 
} from '../types.js';

export interface StorageAdapter {
  getAccounts(): Promise<Account[]>;
  getAccountById(accountId: string): Promise<Account | null>;
  getAccountByEmail(email: string): Promise<Account | null>;
  upsertAccount(account: Account): Promise<void>;

  getCourses(): Promise<Course[]>;
  getCourseById(courseId: string): Promise<Course | null>;
  upsertCourse(course: Course): Promise<void>;

  getSubmissions(): Promise<ExamSubmission[]>;
  getSubmissionByCourseId(courseId: string): Promise<ExamSubmission | null>;
  upsertSubmission(sub: ExamSubmission): Promise<void>;

  getVersions(courseId: string): Promise<ExamVersion[]>;
  addVersion(version: ExamVersion): Promise<void>;

  addAuditLog(log: AuditLog): Promise<void>;
  getAuditLogs(limit?: number): Promise<AuditLog[]>;

  storeExamFile(
    courseId: string, 
    version: number, 
    safeFileName: string, 
    buffer: Buffer, 
    mime: string
  ): Promise<{ fileId: string; storagePath: string }>;

  getExamFile(fileId: string): Promise<{ buffer: Buffer; fileName: string; mime: string } | null>;

  acquireLock(resourceKey: string, ttlMs?: number): Promise<() => void>;
}

/**
 * Isolated Storage Implementation for local development and automated testing
 * Ensures 100% test isolation, no accidental deletion or manipulation of live Google Drive
 */
export class FileStorageAdapter implements StorageAdapter {
  private baseDir: string;
  private filesDir: string;
  private dbPath: string;
  private activeLocks: Map<string, Promise<void>> = new Map();

  constructor(customBaseDir?: string) {
    this.baseDir = customBaseDir || path.resolve(process.cwd(), 'data', 'isolated_storage');
    this.filesDir = path.join(this.baseDir, 'drive_files');
    this.dbPath = path.join(this.baseDir, 'sheets_database.json');
    this.initStorage();
  }

  private initStorage() {
    if (!fs.existsSync(this.baseDir)) {
      fs.mkdirSync(this.baseDir, { recursive: true });
    }
    if (!fs.existsSync(this.filesDir)) {
      fs.mkdirSync(this.filesDir, { recursive: true });
    }
    if (!fs.existsSync(this.dbPath)) {
      const initialDb = this.getInitialSeedData();
      fs.writeFileSync(this.dbPath, JSON.stringify(initialDb, null, 2), 'utf-8');
    }
  }

  private readDb(): {
    accounts: Account[];
    courses: Course[];
    submissions: ExamSubmission[];
    versions: ExamVersion[];
    auditLogs: AuditLog[];
    fileRegistry: Record<string, { fileName: string; mime: string; localPath: string }>;
  } {
    try {
      const raw = fs.readFileSync(this.dbPath, 'utf-8');
      return JSON.parse(raw);
    } catch {
      return this.getInitialSeedData();
    }
  }

  private writeDb(data: any) {
    fs.writeFileSync(this.dbPath, JSON.stringify(data, null, 2), 'utf-8');
  }

  private getInitialSeedData() {
    return {
      accounts: [
        {
          accountId: 'usr_admin_01',
          googleEmail: 'admin@mcu.ac.th',
          googleSub: 'google_sub_admin_01',
          fullName: 'ผู้ดูแลระบบส่วนกลาง (Admin)',
          role: 'admin' as const,
          status: 'active' as const,
          assignedScope: ['all'],
          canReadExamContent: true,
          createdAt: new Date('2026-01-01').toISOString(),
          lastLoginAt: new Date().toISOString()
        },
        {
          accountId: 'usr_staff_01',
          googleEmail: 'staff.exam@mcu.ac.th',
          googleSub: 'google_sub_staff_01',
          fullName: 'เจ้าหน้าที่ฝ่ายจัดพิมพ์ข้อสอบ',
          role: 'staff' as const,
          status: 'active' as const,
          assignedScope: ['all'],
          canReadExamContent: true,
          createdAt: new Date('2026-01-01').toISOString(),
          lastLoginAt: new Date().toISOString()
        },
        {
          accountId: 'usr_teacher_panya',
          googleEmail: 'panya.kan@mcu.ac.th',
          googleSub: 'google_sub_panya',
          fullName: 'ผศ.ปัญญา กันภัย',
          role: 'teacher' as const,
          status: 'active' as const,
          assignedScope: ['000 136'],
          canReadExamContent: false,
          createdAt: new Date('2026-01-01').toISOString(),
          lastLoginAt: new Date().toISOString()
        },
        {
          accountId: 'usr_teacher_bhak',
          googleEmail: 'bhak.pha@mcu.ac.th',
          googleSub: 'google_sub_bhak',
          fullName: 'พระมหาภาคภูมิ ภทฺทเมธี',
          role: 'teacher' as const,
          status: 'active' as const,
          assignedScope: ['SP 101'],
          canReadExamContent: false,
          createdAt: new Date('2026-01-01').toISOString(),
          lastLoginAt: new Date().toISOString()
        }
      ],
      courses: [
        {
          courseId: 'crs_000136_monk',
          courseCode: '000 136',
          courseName: 'ภาษาบาลี',
          yearLevel: 1,
          faculty: 'พุทธศาสตร์',
          major: 'สาขาวิชาพระพุทธศาสนา',
          studentStatus: 'บรรพชิต' as const,
          examDateThai: '5 ตุลาคม 2569',
          examDateISO: '2026-10-05',
          examTimeThai: '09.00 - 11.30 น.',
          room: 'ห้องประชุมชั้น 1',
          assignedLecturerIds: ['usr_teacher_panya']
        },
        {
          courseId: 'crs_sp101_monk',
          courseCode: 'SP 101',
          courseName: 'บาลี 1',
          yearLevel: 1,
          faculty: 'พุทธศาสตร์',
          major: 'สาขาวิชาพระพุทธศาสนา',
          studentStatus: 'บรรพชิต' as const,
          examDateThai: '5 ตุลาคม 2569',
          examDateISO: '2026-10-05',
          examTimeThai: '12.30 - 15.00 น.',
          room: 'ห้องประชุมชั้น 1',
          assignedLecturerIds: ['usr_teacher_bhak']
        }
      ],
      submissions: [
        {
          submissionId: 'sub_crs_000136_monk',
          courseId: 'crs_000136_monk',
          currentVersion: 0,
          status: 'pending' as const
        },
        {
          submissionId: 'sub_crs_sp101_monk',
          courseId: 'crs_sp101_monk',
          currentVersion: 0,
          status: 'pending' as const
        }
      ],
      versions: [],
      auditLogs: [],
      fileRegistry: {}
    };
  }

  async acquireLock(resourceKey: string, ttlMs: number = 10000): Promise<() => void> {
    while (this.activeLocks.has(resourceKey)) {
      await this.activeLocks.get(resourceKey);
    }
    let releaseFn: () => void;
    const lockPromise = new Promise<void>((resolve) => {
      releaseFn = resolve;
    });
    this.activeLocks.set(resourceKey, lockPromise);

    const timer = setTimeout(() => {
      if (this.activeLocks.get(resourceKey) === lockPromise) {
        this.activeLocks.delete(resourceKey);
        releaseFn();
      }
    }, ttlMs);

    return () => {
      clearTimeout(timer);
      if (this.activeLocks.get(resourceKey) === lockPromise) {
        this.activeLocks.delete(resourceKey);
        releaseFn();
      }
    };
  }

  async getAccounts(): Promise<Account[]> {
    return this.readDb().accounts;
  }

  async getAccountById(accountId: string): Promise<Account | null> {
    const acc = this.readDb().accounts.find(a => a.accountId === accountId);
    return acc || null;
  }

  async getAccountByEmail(email: string): Promise<Account | null> {
    const cleanEmail = email.toLowerCase().trim();
    const acc = this.readDb().accounts.find(a => a.googleEmail.toLowerCase().trim() === cleanEmail);
    return acc || null;
  }

  async upsertAccount(account: Account): Promise<void> {
    const unlock = await this.acquireLock('accounts_table');
    try {
      const db = this.readDb();
      const idx = db.accounts.findIndex(a => a.accountId === account.accountId);
      if (idx !== -1) {
        db.accounts[idx] = account;
      } else {
        db.accounts.push(account);
      }
      this.writeDb(db);
    } finally {
      unlock();
    }
  }

  async getCourses(): Promise<Course[]> {
    return this.readDb().courses;
  }

  async getCourseById(courseId: string): Promise<Course | null> {
    const c = this.readDb().courses.find(item => item.courseId === courseId);
    return c || null;
  }

  async upsertCourse(course: Course): Promise<void> {
    const unlock = await this.acquireLock('courses_table');
    try {
      const db = this.readDb();
      const idx = db.courses.findIndex(c => c.courseId === course.courseId);
      if (idx !== -1) {
        db.courses[idx] = course;
      } else {
        db.courses.push(course);
      }
      this.writeDb(db);
    } finally {
      unlock();
    }
  }

  async getSubmissions(): Promise<ExamSubmission[]> {
    return this.readDb().submissions;
  }

  async getSubmissionByCourseId(courseId: string): Promise<ExamSubmission | null> {
    const s = this.readDb().submissions.find(item => item.courseId === courseId);
    return s || null;
  }

  async upsertSubmission(sub: ExamSubmission): Promise<void> {
    const unlock = await this.acquireLock(`sub_${sub.courseId}`);
    try {
      const db = this.readDb();
      const idx = db.submissions.findIndex(item => item.courseId === sub.courseId);
      if (idx !== -1) {
        db.submissions[idx] = sub;
      } else {
        db.submissions.push(sub);
      }
      this.writeDb(db);
    } finally {
      unlock();
    }
  }

  async getVersions(courseId: string): Promise<ExamVersion[]> {
    return this.readDb().versions
      .filter(v => v.courseId === courseId)
      .sort((a, b) => b.version - a.version);
  }

  async addVersion(version: ExamVersion): Promise<void> {
    const unlock = await this.acquireLock(`ver_${version.courseId}`);
    try {
      const db = this.readDb();
      // Ensure no duplicate version
      const existing = db.versions.find(
        v => v.courseId === version.courseId && v.version === version.version
      );
      if (!existing) {
        db.versions.push(version);
        this.writeDb(db);
      }
    } finally {
      unlock();
    }
  }

  async addAuditLog(log: AuditLog): Promise<void> {
    const unlock = await this.acquireLock('audit_logs');
    try {
      const db = this.readDb();
      db.auditLogs.unshift(log); // prepend latest
      // Cap audit logs at 5000 to manage storage
      if (db.auditLogs.length > 5000) {
        db.auditLogs = db.auditLogs.slice(0, 5000);
      }
      this.writeDb(db);
    } finally {
      unlock();
    }
  }

  async getAuditLogs(limit: number = 100): Promise<AuditLog[]> {
    return this.readDb().auditLogs.slice(0, limit);
  }

  async storeExamFile(
    courseId: string, 
    version: number, 
    safeFileName: string, 
    buffer: Buffer, 
    mime: string
  ): Promise<{ fileId: string; storagePath: string }> {
    const fileId = `drv_${crypto.randomBytes(12).toString('hex')}`;
    const targetPath = path.join(this.filesDir, `${fileId}_${safeFileName}`);
    fs.writeFileSync(targetPath, buffer);

    const unlock = await this.acquireLock('file_registry');
    try {
      const db = this.readDb();
      db.fileRegistry = db.fileRegistry || {};
      db.fileRegistry[fileId] = {
        fileName: safeFileName,
        mime,
        localPath: targetPath
      };
      this.writeDb(db);
    } finally {
      unlock();
    }

    return { fileId, storagePath: targetPath };
  }

  async getExamFile(fileId: string): Promise<{ buffer: Buffer; fileName: string; mime: string } | null> {
    const db = this.readDb();
    const entry = db.fileRegistry?.[fileId];
    if (!entry || !fs.existsSync(entry.localPath)) {
      return null;
    }
    const buffer = fs.readFileSync(entry.localPath);
    return {
      buffer,
      fileName: entry.fileName,
      mime: entry.mime
    };
  }

  /**
   * Helper to seed full courses from an external array (e.g. RAW_EXAMS_DATA)
   */
  async seedCourses(rawCourses: any[]): Promise<void> {
    const unlock = await this.acquireLock('courses_seed');
    try {
      const db = this.readDb();
      for (const raw of rawCourses) {
        const courseId = `crs_${raw.courseCode.replace(/[^a-zA-Z0-9]/g, '_')}_${raw.status === 'บรรพชิต' ? 'monk' : 'lay'}`;
        if (!db.courses.some(c => c.courseId === courseId)) {
          db.courses.push({
            courseId,
            courseCode: raw.courseCode,
            courseName: raw.courseName,
            yearLevel: raw.yearLevel,
            faculty: raw.faculty,
            major: raw.major,
            studentStatus: raw.status === 'บรรพชิต' ? 'บรรพชิต' : 'คฤหัสถ์',
            examDateThai: raw.examDateThai,
            examDateISO: raw.examDateISO,
            examTimeThai: raw.examTimeThai,
            room: raw.room || 'ห้องประชุมชั้น 1',
            assignedLecturerIds: []
          });
        }
        if (!db.submissions.some(s => s.courseId === courseId)) {
          db.submissions.push({
            submissionId: `sub_${courseId}`,
            courseId,
            currentVersion: 0,
            status: 'pending'
          });
        }
      }
      this.writeDb(db);
    } finally {
      unlock();
    }
  }
}
