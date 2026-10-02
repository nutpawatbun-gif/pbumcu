/**
 * Secure API Client for MCU Exam Secure Portal
 * Enforces session-based credentials and CSRF protection on all requests.
 */

let csrfTokenCache: string | null = null;

export function setCsrfToken(token: string | null) {
  csrfTokenCache = token;
}

export function getCsrfToken(): string | null {
  return csrfTokenCache;
}

export interface ApiUser {
  accountId: string;
  googleEmail: string;
  fullName: string;
  role: 'teacher' | 'staff' | 'admin';
  status: 'active' | 'pending' | 'suspended';
  assignedScope: string[];
  canReadExamContent: boolean;
}

export interface ApiCourse {
  courseId: string;
  courseCode: string;
  courseName: string;
  yearLevel: number;
  faculty: string;
  major: string;
  studentStatus: 'บรรพชิต' | 'คฤหัสถ์';
  examDateThai: string;
  examDateISO: string;
  examTimeThai: string;
  room: string;
  assignedLecturerIds: string[];
  submissionStatus: 'pending' | 'validating' | 'submitted' | 'accepted' | 'rejected';
  currentVersion: number;
  latestFileName?: string;
  latestFileSize?: number;
  submittedAt?: string;
  submittedByAccountName?: string;
  verifiedAt?: string;
  verifiedByAccountName?: string;
  rejectionReason?: string;
}

export interface ApiExamVersion {
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

export interface ApiAuditLog {
  logId: string;
  timestamp: string;
  accountId: string;
  accountEmail: string;
  action: string;
  courseId?: string;
  fileId?: string;
  ipAddress: string;
  details: string;
}

async function request<T = any>(
  path: string, 
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' = 'GET',
  body?: any
): Promise<T> {
  const headers: Record<string, string> = {};

  if (body) {
    headers['Content-Type'] = 'application/json';
  }

  // Include CSRF Token on mutative requests
  if (method !== 'GET' && csrfTokenCache) {
    headers['X-CSRF-Token'] = csrfTokenCache;
  }

  const res = await fetch(path, {
    method,
    headers,
    credentials: 'include', // sends and receives HttpOnly session cookies
    body: body ? JSON.stringify(body) : undefined
  });

  const text = await res.text();
  let json: any;
  try {
    json = JSON.parse(text);
  } catch {
    json = { error: text || 'Unknown response' };
  }

  if (!res.ok) {
    const errorMsg = json?.error || `เกิดข้อผิดพลาด (${res.status})`;
    const errorObj = new Error(errorMsg);
    (errorObj as any).status = res.status;
    (errorObj as any).code = json?.code;
    throw errorObj;
  }

  return json;
}

export const apiClient = {
  async loginWithGoogle(idToken?: string, devEmail?: string): Promise<{ user: ApiUser; csrfToken: string }> {
    const res = await request<{ success: boolean; user: ApiUser; csrfToken: string }>(
      '/api/auth/google-login',
      'POST',
      { idToken, devEmail }
    );
    setCsrfToken(res.csrfToken);
    return res;
  },

  async getCurrentUser(): Promise<ApiUser | null> {
    try {
      const res = await request<{ user: ApiUser; csrfToken: string }>('/api/auth/me', 'GET');
      setCsrfToken(res.csrfToken);
      return res.user;
    } catch {
      setCsrfToken(null);
      return null;
    }
  },

  async logout(): Promise<void> {
    try {
      await request('/api/auth/logout', 'POST', {});
    } finally {
      setCsrfToken(null);
    }
  },

  async getCourses(): Promise<ApiCourse[]> {
    const res = await request<{ courses: ApiCourse[] }>('/api/courses', 'GET');
    return res.courses;
  },

  async getCourseDetail(courseId: string): Promise<{ course: ApiCourse; submission: any; versions: ApiExamVersion[] }> {
    return await request(`/api/courses/${encodeURIComponent(courseId)}`, 'GET');
  },

  async uploadExam(
    courseId: string, 
    payload: { fileName: string; fileBase64: string; fileMime: string; notes?: string }
  ): Promise<{ success: boolean; message: string; submission: any; version: ApiExamVersion; scanNotice: string }> {
    return await request(`/api/exams/${encodeURIComponent(courseId)}/upload`, 'POST', payload);
  },

  async verifyExam(
    courseId: string, 
    action: 'accept' | 'reject', 
    reason?: string
  ): Promise<{ success: boolean; message: string; submission: any }> {
    return await request(`/api/exams/${encodeURIComponent(courseId)}/verify`, 'POST', { action, reason });
  },

  async logPrint(
    courseId: string, 
    printPhase: 'request' | 'confirmed', 
    copies: number = 1
  ): Promise<{ success: boolean; logged: string; message: string }> {
    return await request(`/api/exams/${encodeURIComponent(courseId)}/print-log`, 'POST', { printPhase, copies });
  },

  async getAdminAccounts(): Promise<ApiUser[]> {
    const res = await request<{ accounts: ApiUser[] }>('/api/admin/accounts', 'GET');
    return res.accounts;
  },

  async updateAdminAccount(payload: {
    googleEmail: string;
    fullName?: string;
    role: 'teacher' | 'staff' | 'admin';
    status?: 'active' | 'pending' | 'suspended';
    assignedScope?: string[];
    canReadExamContent?: boolean;
  }): Promise<{ success: boolean; account: ApiUser }> {
    return await request('/api/admin/accounts', 'POST', payload);
  },

  async assignCourse(courseId: string, lecturerAccountIds: string[]): Promise<{ success: boolean; course: ApiCourse }> {
    return await request('/api/admin/assignments', 'POST', { courseId, lecturerAccountIds });
  },

  async getAuditLogs(): Promise<ApiAuditLog[]> {
    const res = await request<{ auditLogs: ApiAuditLog[] }>('/api/audit-logs', 'GET');
    return res.auditLogs;
  },

  getExamFileViewUrl(courseId: string, versionId: number | string): string {
    return `/api/exams/${encodeURIComponent(courseId)}/files/${encodeURIComponent(versionId)}/view`;
  }
};
