import { ExamItem, TeacherUser } from '../types/exam';
import { isLecturerMatch } from './teacherMatching';

export interface ScannedExamFile {
  file: File;
  id: string;
  originalName: string;
  relativePath: string;
  detectedYearLevel: number | null;
  detectedStatus: 'บรรพชิต' | 'คฤหัสถ์' | null;
  detectedCourseCode: string | null;
  detectedCourseName: string | null;
  matchedExamId: string | null;
  matchConfidence: 'exact' | 'high' | 'medium' | 'none';
  status: 'pending' | 'success' | 'error';
  errorMessage?: string;
}

/**
 * Clean Thai text for relaxed keyword matching
 */
const cleanText = (text: string): string => {
  return text
    .toLowerCase()
    .replace(/[_\-\.\s\(\)\[\]\/\\+]/g, '')
    .trim();
};

/**
 * Extract Year Level (1-4) from file name or path
 */
export const detectYearLevel = (text: string): number | null => {
  const normalized = text.toLowerCase();

  // Pattern: ปี 1-4, ชั้นปีที่ 1-4, ปีที่ 1-4, ปี๑-๔
  if (/(ชั้นปีที่\s*1|ปีที่\s*1|ปี\s*1|ปี๑|year\s*1|yr\s*1|\[ปี\s*1\])/i.test(normalized)) {
    return 1;
  }
  if (/(ชั้นปีที่\s*2|ปีที่\s*2|ปี\s*2|ปี๒|year\s*2|yr\s*2|\[ปี\s*2\])/i.test(normalized)) {
    return 2;
  }
  if (/(ชั้นปีที่\s*3|ปีที่\s*3|ปี\s*3|ปี๓|year\s*3|yr\s*3|\[ปี\s*3\])/i.test(normalized)) {
    return 3;
  }
  if (/(ชั้นปีที่\s*4|ปีที่\s*4|ปี\s*4|ปี๔|year\s*4|yr\s*4|\[ปี\s*4\])/i.test(normalized)) {
    return 4;
  }

  // Fallback: standalone numbers with prefix
  const match = normalized.match(/p([1-4])/);
  if (match) {
    return parseInt(match[1], 10);
  }

  return null;
};

/**
 * Extract Status: 'บรรพชิต' vs 'คฤหัสถ์' (โยมคือคฤหัสถ์)
 */
export const detectStatus = (text: string): 'บรรพชิต' | 'คฤหัสถ์' | null => {
  const normalized = text.toLowerCase();

  // 1. Layman (คฤหัสถ์ / โยม / ฆราวาส)
  const isLayman = /(คฤหัสถ์|คฤหัสถ|โยม|ฆราวาส|layman)/i.test(normalized);

  // 2. Monk (บรรพชิต / พระ / เณร / สามเณร / ภิกษุ)
  const isMonk = /(บรรพชิต|พระภิกษุ|สามเณร|เณร|พระ|monk)/i.test(normalized);

  if (isLayman && !isMonk) {
    return 'คฤหัสถ์';
  }
  if (isMonk && !isLayman) {
    return 'บรรพชิต';
  }

  // If both or ambiguous, check exact keywords with brackets or priority
  if (normalized.includes('โยม') || normalized.includes('คฤหัสถ์')) {
    return 'คฤหัสถ์';
  }
  if (normalized.includes('พระ') || normalized.includes('บรรพชิต')) {
    return 'บรรพชิต';
  }

  return null;
};

/**
 * Extract Course Code (e.g. 000 139, 000139, 600 205)
 */
export const detectCourseCode = (text: string): string | null => {
  // Regex for 6-digit codes with optional space (e.g. 000 139 or 000139), not flanked by other digits
  const match = text.match(/(?:^|[^\d])([0-9]{3})\s+([0-9]{3})(?:[^\d]|$)/);
  if (match) {
    return `${match[1]} ${match[2]}`;
  }

  const matchJoined = text.match(/(?:^|[^\d])([0-9]{6})(?:[^\d]|$)/);
  if (matchJoined) {
    const raw = matchJoined[1];
    return `${raw.substring(0, 3)} ${raw.substring(3)}`;
  }

  return null;
};

/**
 * Match scanned file against available exams list
 */
export const matchFileToExam = (
  file: File,
  exams: ExamItem[],
  currentUser: TeacherUser | null
): ScannedExamFile => {
  const fullPath = (file.webkitRelativePath || file.name).trim();
  const fileName = file.name;
  const searchCorpus = `${fullPath} ${fileName}`;

  const detectedYear = detectYearLevel(searchCorpus);
  const detectedStatus = detectStatus(searchCorpus);
  const detectedCode = detectCourseCode(searchCorpus);

  let bestExamId: string | null = null;
  let bestConfidence: 'exact' | 'high' | 'medium' | 'none' = 'none';

  // 1. Try Exact match by Course Code + Status + Year
  if (detectedCode) {
    const cleanDetectedCode = detectedCode.replace(/\s+/g, '');
    const codeCandidates = exams.filter(e => e.courseCode.replace(/\s+/g, '') === cleanDetectedCode);

    if (codeCandidates.length === 1) {
      bestExamId = codeCandidates[0].id;
      bestConfidence = (detectedStatus && codeCandidates[0].status === detectedStatus) ? 'exact' : 'high';
    } else if (codeCandidates.length > 1) {
      // Differentiate by Status (บรรพชิต vs คฤหัสถ์ / โยม)
      let statusFiltered = codeCandidates;
      if (detectedStatus) {
        statusFiltered = codeCandidates.filter(e => e.status === detectedStatus);
      }

      // Differentiate by Year Level (1-4)
      if (statusFiltered.length > 1 && detectedYear !== null) {
        const yearFiltered = statusFiltered.filter(e => e.yearLevel === detectedYear);
        if (yearFiltered.length > 0) {
          statusFiltered = yearFiltered;
        }
      }

      if (statusFiltered.length >= 1) {
        bestExamId = statusFiltered[0].id;
        bestConfidence = (detectedStatus && detectedYear) ? 'exact' : 'high';
      }
    }
  }

  // 2. Try Match by Course Name if no code match
  if (!bestExamId) {
    const cleanSearchCorpus = cleanText(searchCorpus);
    let nameCandidates: { exam: ExamItem; score: number }[] = [];

    for (const exam of exams) {
      const cleanExamName = cleanText(exam.courseName);
      if (cleanExamName.length >= 3 && cleanSearchCorpus.includes(cleanExamName)) {
        let score = cleanExamName.length;

        // Bonus if Status matches
        if (detectedStatus && exam.status === detectedStatus) {
          score += 50;
        }
        // Bonus if Year matches
        if (detectedYear !== null && exam.yearLevel === detectedYear) {
          score += 30;
        }

        nameCandidates.push({ exam, score });
      }
    }

    if (nameCandidates.length > 0) {
      nameCandidates.sort((a, b) => b.score - a.score);
      const top = nameCandidates[0];
      bestExamId = top.exam.id;
      bestConfidence = (detectedStatus && detectedYear) ? 'high' : 'medium';
    }
  }

  return {
    file,
    id: `file-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
    originalName: fileName,
    relativePath: fullPath,
    detectedYearLevel: detectedYear,
    detectedStatus,
    detectedCourseCode: detectedCode,
    detectedCourseName: bestExamId ? (exams.find(e => e.id === bestExamId)?.courseName || null) : null,
    matchedExamId: bestExamId,
    matchConfidence: bestConfidence,
    status: 'pending'
  };
};
