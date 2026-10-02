export interface ExamItem {
  id: string;
  orderNo: number;
  yearLevel: number; // 1, 2, 3, 4
  faculty: string; // e.g. "พุทธศาสตร์", "สังคมศาสตร์", "ทุกคณะ"
  major: string; // e.g. "สาขาวิชาศาสนาและปรัชญา"
  examDateThai: string; // e.g. "5 ตุลาคม 2569"
  examDateISO: string; // "2026-10-05"
  examTimeThai: string; // "09.00 - 11.30 น."
  startTime: string; // "09:00"
  endTime: string; // "11:30"
  courseCode: string; // "000 136"
  courseName: string; // "ภาษาบาลี"
  lecturer: string; // "ผศ.ปัญญา กันภัย"
  notes: string; // "ข้อสอบกลาง", ""
  status: 'บรรพชิต' | 'คฤหัสถ์' | string;
  room?: string; // e.g. "ห้องประชุมชั้น 1"
  examType?: 'onsite' | 'online';
  examLink?: string; // Zoom / Meet / Google Form link
  driveFolderUrl?: string; // Google Drive folder or Google Form link for uploading exam paper
  examSubmissionStatus?: 'pending' | 'submitted'; // สถานะการส่งข้อสอบ: 'pending' (รอส่ง), 'submitted' (ส่งแล้ว)
  examSubmissionDate?: string; // วันเวลาที่ส่งข้อสอบ
  examFileName?: string; // ชื่อไฟล์ข้อสอบมาตรฐานที่บันทึก
  proctors?: string[]; // รายนามกรรมการคุมสอบ
  studentCount?: number; // จำนวนนิสิตผู้เข้าสอบ
  lastUpdated?: string;
  updatedBy?: string;
}

export interface TeacherUser {
  id: string;
  name: string;
  code?: string; // Optional Passcode / Teacher ID
  faculty?: string;
  role: 'admin' | 'teacher' | 'staff';
  googleEmail?: string;
  status?: 'active' | 'pending' | 'suspended';
  assignedScope?: string[];
  canReadExamContent?: boolean;
}

export interface NotificationSetting {
  enableBrowserAlerts: boolean;
  alertBeforeMinutes: number; // e.g. 15, 60, 1440 (1 day)
  soundEnabled: boolean;
  lineNotifyToken: string;
  webhookUrl: string;
  centralDriveFolderUrl?: string; // โฟลเดอร์ Google Drive รับข้อสอบกลางของวิทยาลัย
}
