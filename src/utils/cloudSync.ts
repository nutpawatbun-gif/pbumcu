import { ExamItem } from '../types/exam';
import { 
  detectYearLevel, 
  detectStatus, 
  detectCourseCode 
} from './folderExamMatcher';

const cleanCourseTitle = (text: string): string => {
  return text
    .toLowerCase()
    .replace(/[_\-\.\s\(\)\[\]\/\\+]/g, '')
    .trim();
};

export interface DriveExamFile {
  id: string;
  name: string;
  url: string;
  downloadUrl?: string;
  folderName?: string;
  folderId?: string;
  size?: number;
  updated?: string;
}

export interface CloudSyncResult {
  success: boolean;
  message: string;
  driveFilesCount: number;
  syncedCount: number;
  matchedDetails: {
    examId: string;
    courseCode: string;
    courseName: string;
    fileName: string;
    folderName?: string;
    fileUrl: string;
  }[];
  updatedExams: ExamItem[];
}

/**
 * Fetch list of exam files directly from Google Drive via Google Apps Script Webhook
 */
export async function fetchGoogleDriveExamStatus(
  webhookUrl: string,
  folderId: string = '1yc7VLWVCYtH8n1NqWymKmeu1kaNJRDBa'
): Promise<DriveExamFile[]> {
  const url = webhookUrl.trim();
  if (!url) {
    throw new Error('กรุณาระบุ Google Apps Script Webhook URL');
  }

  // 1. Try GET request with folderId parameter first
  try {
    const getUrl = `${url}${url.includes('?') ? '&' : '?'}folderId=${encodeURIComponent(folderId)}`;
    const res = await fetch(getUrl, {
      method: 'GET'
    });
    if (res.ok) {
      const data = await res.json();
      if (data && Array.isArray(data.driveFiles)) {
        return data.driveFiles;
      }
    }
  } catch {
    // If GET fails (e.g. CORS or parameter format), fallback to POST
  }

  // 2. Try POST request with action: 'get_drive_status'
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({
        action: 'get_drive_status',
        folderId: folderId
      })
    });
    if (res.ok) {
      const data = await res.json();
      if (data && Array.isArray(data.driveFiles)) {
        return data.driveFiles;
      }
    }
  } catch (err) {
    throw new Error(`ไม่สามารถเชื่อมต่อ Google Drive Webhook ได้: ${(err as Error).message}`);
  }

  return [];
}

/**
 * Match scanned Google Drive files against exams and update their statuses
 */
export function matchDriveFilesToExams(
  driveFiles: DriveExamFile[],
  currentExams: ExamItem[]
): {
  updatedExams: ExamItem[];
  matchedDetails: CloudSyncResult['matchedDetails'];
} {
  const matchedDetails: CloudSyncResult['matchedDetails'] = [];
  const updatedExams = currentExams.map(exam => ({ ...exam }));

  for (const file of driveFiles) {
    // Ignore non-exam files or system files
    if (file.name.startsWith('.') || file.name.startsWith('~')) continue;

    const combinedInfo = `${file.folderName || ''} ${file.name}`;
    const detectedYear = detectYearLevel(combinedInfo);
    const detectedStatus = detectStatus(combinedInfo);
    const detectedCode = detectCourseCode(combinedInfo);

    // Scoring candidates
    let bestExam: ExamItem | null = null;
    let highestScore = 0;

    for (const exam of updatedExams) {
      let score = 0;

      // 1. Course Code Match (Most reliable: 50 pts, penalty -40 if mismatch)
      if (detectedCode) {
        const normCourseCode = exam.courseCode.replace(/\s+/g, '');
        const normDetectedCode = detectedCode.replace(/\s+/g, '');
        if (normCourseCode === normDetectedCode) {
          score += 50;
        } else if (normCourseCode.includes(normDetectedCode) || normDetectedCode.includes(normCourseCode)) {
          score += 35;
        } else {
          // Penalty if course code is clearly different
          score -= 40;
        }
      }

      // 2. Student Status Match (บรรพชิต vs คฤหัสถ์: 25 pts)
      if (detectedStatus && exam.status) {
        if (exam.status === detectedStatus) {
          score += 25;
        } else {
          // Penalty if conflicting status
          score -= 30;
        }
      }

      // 3. Year Level Match (1-4: 25 pts)
      if (detectedYear && exam.yearLevel) {
        if (exam.yearLevel === detectedYear) {
          score += 25;
        } else {
          // Penalty if conflicting year
          score -= 20;
        }
      }

      // 4. Course Name Substring Match (15 pts)
      const cleanTitle = cleanCourseTitle(exam.courseName);
      if (cleanTitle && cleanTitle.length >= 4 && file.name.includes(cleanTitle)) {
        score += 15;
      }

      if (score > highestScore && score >= 50) {
        highestScore = score;
        bestExam = exam;
      }
    }

    if (bestExam) {
      const targetExam = updatedExams.find(e => e.id === bestExam!.id);
      if (targetExam) {
        // Format upload date from file timestamp
        let thaiDateStr = '';
        if (file.updated) {
          try {
            const d = new Date(file.updated);
            const dStr = d.toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: '2-digit' });
            const tStr = d.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' });
            thaiDateStr = `${dStr} ${tStr} น.`;
          } catch {}
        }
        if (!thaiDateStr) {
          const now = new Date();
          thaiDateStr = `${now.toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: '2-digit' })} ${now.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })} น.`;
        }

        targetExam.examSubmissionStatus = 'submitted';
        targetExam.examLink = file.url || targetExam.examLink;
        targetExam.examFileName = file.name;
        targetExam.examSubmissionDate = targetExam.examSubmissionDate || thaiDateStr;

        matchedDetails.push({
          examId: targetExam.id,
          courseCode: targetExam.courseCode,
          courseName: targetExam.courseName,
          fileName: file.name,
          folderName: file.folderName,
          fileUrl: file.url
        });
      }
    }
  }

  return { updatedExams, matchedDetails };
}

/**
 * High-level function: Fetch files from Google Drive and sync with exams state
 */
export async function syncExamsWithGoogleDrive(
  webhookUrl: string,
  currentExams: ExamItem[],
  folderId: string = '1yc7VLWVCYtH8n1NqWymKmeu1kaNJRDBa'
): Promise<CloudSyncResult> {
  try {
    const driveFiles = await fetchGoogleDriveExamStatus(webhookUrl, folderId);
    
    if (driveFiles.length === 0) {
      return {
        success: true,
        message: 'เชื่อมต่อ Google Drive สำเร็จ แต่ยังไม่พบไฟล์ข้อสอบในโฟลเดอร์',
        driveFilesCount: 0,
        syncedCount: 0,
        matchedDetails: [],
        updatedExams: currentExams
      };
    }

    const { updatedExams, matchedDetails } = matchDriveFilesToExams(driveFiles, currentExams);

    return {
      success: true,
      message: `ซิงค์สถานะจาก Google Drive สำเร็จ! พบไฟล์ทั้งหมด ${driveFiles.length} ไฟล์ จับคู่รายวิชาพร้อมสอบได้ ${matchedDetails.length} วิชา`,
      driveFilesCount: driveFiles.length,
      syncedCount: matchedDetails.length,
      matchedDetails,
      updatedExams
    };
  } catch (err) {
    return {
      success: false,
      message: (err as Error).message || 'เกิดข้อผิดพลาดในการซิงค์ข้อมูลจาก Google Drive',
      driveFilesCount: 0,
      syncedCount: 0,
      matchedDetails: [],
      updatedExams: currentExams
    };
  }
}
