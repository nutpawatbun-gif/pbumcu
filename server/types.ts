/**
 * Server-side core types for MCU Exam Secure Portal
 */

export type UserRole = 'teacher' | 'staff' | 'admin';
export type AccountStatus = 'active' | 'pending' | 'suspended';
export type ExamSubmissionStatus = 'pending' | 'validating' | 'submitted' | 'accepted' | 'rejected';

export interface Account {
  accountId: string;          // Stable ID e.g. "usr_1001"
  googleEmail: string;        // Verified Google Account Email
  googleSub: string;          // Google User ID (sub claim)
  fullName: string;
  role: UserRole;
  status: AccountStatus;
  assignedScope: string[];    // Array of courseCodes (for teachers) or faculties/departments (for staff)
  canReadExamContent: boolean;// Explicit permission to open/read/download exam papers
  createdAt: string;
  lastLoginAt: string;
}

export interface Course {
  courseId: string;           // Stable unique ID e.g. "crs_000136_monk"
  courseCode: string;         // e.g. "000 136"
  courseName: string;         // e.g. "ภาษาบาลี"
  yearLevel: number;          // 1, 2, 3, 4
  faculty: string;            // e.g. "พุทธศาสตร์"
  major: string;              // e.g. "สาขาวิชาพระพุทธศาสนา"
  studentStatus: 'บรรพชิต' | 'คฤหัสถ์';
  examDateThai: string;
  examDateISO: string;
  examTimeThai: string;
  room: string;
  assignedLecturerIds: string[]; // Supports multiple lecturers per course
}

export interface ExamSubmission {
  submissionId: string;
  courseId: string;
  currentVersion: number;
  status: ExamSubmissionStatus;
  latestFileId?: string;
  latestFileName?: string;
  latestFileSize?: number;
  latestFileMime?: string;
  submittedByAccountId?: string;
  submittedByAccountName?: string;
  submittedAt?: string;
  verifiedByAccountId?: string;
  verifiedByAccountName?: string;
  verifiedAt?: string;
  rejectionReason?: string;
  quarantineStatus?: 'safe_structural' | 'quarantined' | 'pending_scan';
}

export interface ExamVersion {
  versionId: string;
  submissionId: string;
  courseId: string;
  version: number;
  driveFileId: string;
  driveFileName: string;
  fileMime: string;
  fileSizeBytes: number;
  sha256: string;
  uploadedByAccountId: string;
  uploadedByAccountName: string;
  uploadedAt: string;
  notes?: string;
}

export interface AuditLog {
  logId: string;
  timestamp: string;
  accountId: string;
  accountEmail: string;
  action: 
    | 'LOGIN'
    | 'LOGIN_FAILED'
    | 'LOGOUT'
    | 'UPLOAD_EXAM'
    | 'UPLOAD_RETRY'
    | 'OPEN_EXAM'
    | 'DOWNLOAD_EXAM'
    | 'PRINT_REQUEST'
    | 'PRINT_CONFIRM'
    | 'APPROVE_EXAM'
    | 'REJECT_EXAM'
    | 'ASSIGN_COURSE'
    | 'UPDATE_ACCOUNT'
    | 'SECURITY_VIOLATION';
  courseId?: string;
  fileId?: string;
  ipAddress: string;
  details: string; // Must NEVER contain passwords, tokens, or exam content
}

export interface SessionData {
  sessionId: string;
  accountId: string;
  csrfToken: string;
  createdAt: number;
  expiresAt: number;
}
