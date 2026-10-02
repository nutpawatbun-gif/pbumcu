import { ExamItem, NotificationSetting } from '../types/exam';

export interface McuBackupData {
  version: string;
  exportedAt: string;
  exams: ExamItem[];
  settings?: NotificationSetting;
  savedExamIds?: string[];
  centralDriveFolderUrl?: string;
  metrics: {
    totalExams: number;
    submittedExams: number;
    pendingExams: number;
  };
}

/**
 * Export current exam data, submission status, and settings to a JSON file
 */
export function exportBackupJson(
  exams: ExamItem[],
  settings?: NotificationSetting,
  savedExamIds?: string[],
  centralDriveFolderUrl?: string
): void {
  const now = new Date();
  const dateStr = now.toISOString().slice(0, 10);
  const timeStr = now.toTimeString().slice(0, 8).replace(/:/g, '-');

  const submittedCount = exams.filter(e => e.examSubmissionStatus === 'submitted').length;
  const pendingCount = exams.length - submittedCount;

  const backupData: McuBackupData = {
    version: '2.0',
    exportedAt: now.toISOString(),
    exams,
    settings,
    savedExamIds,
    centralDriveFolderUrl,
    metrics: {
      totalExams: exams.length,
      submittedExams: submittedCount,
      pendingExams: pendingCount
    }
  };

  const jsonString = JSON.stringify(backupData, null, 2);
  const blob = new Blob([jsonString], { type: 'application/json;charset=utf-8' });
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.href = url;
  link.download = `mcu-exam-backup-${dateStr}_${timeStr}.json`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Validate and parse backup JSON string
 */
export function parseBackupJson(jsonString: string): McuBackupData {
  const parsed = JSON.parse(jsonString);

  if (!parsed || typeof parsed !== 'object') {
    throw new Error('โครงสร้างไฟล์สำรองข้อมูลไม่ถูกต้อง');
  }

  if (!Array.isArray(parsed.exams) || parsed.exams.length === 0) {
    throw new Error('ไม่พบข้อมูลรายวิชา (exams) ในไฟล์สำรองข้อมูล');
  }

  // Validate basic exam fields
  const firstExam = parsed.exams[0];
  if (!firstExam.courseCode && !firstExam.courseName) {
    throw new Error('ข้อมูลรายวิชาในไฟล์สำรองไม่ตรงกับรูปแบบของ MCU Exam Portal');
  }

  return parsed as McuBackupData;
}

/**
 * Read backup file from user's local disk
 */
export function readBackupFile(file: File): Promise<McuBackupData> {
  return new Promise((resolve, reject) => {
    if (!file.name.endsWith('.json')) {
      return reject(new Error('กรุณาเลือกไฟล์สำรองข้อมูลนามสกุล .json เท่านั้น'));
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        const data = parseBackupJson(text);
        resolve(data);
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = () => reject(new Error('เกิดข้อผิดพลาดในการอ่านไฟล์'));
    reader.readAsText(file);
  });
}
