import React, { useState, useRef, useMemo } from 'react';
import { 
  X, 
  Upload, 
  Files, 
  FolderUp, 
  CheckCircle2, 
  AlertCircle, 
  Sparkles, 
  Trash2, 
  FileText, 
  Search, 
  RefreshCw,
  FolderCheck,
  Wand2
} from 'lucide-react';
import { ExamItem, TeacherUser } from '../types/exam';

export interface BatchFileItem {
  id: string;
  file: File;
  originalName: string;
  matchedExamId: string | null;
  matchConfidence: 'exact_code' | 'exact_name' | 'content_text' | 'keyword' | 'manual' | 'unmatched';
  matchNote: string;
  status: 'ready' | 'uploading' | 'success' | 'error';
  errorMessage?: string;
  uploadedUrl?: string;
}

interface AdminBatchExamUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  exams: ExamItem[];
  currentUser: TeacherUser | null;
  centralDriveFolderUrl: string;
  webhookUrl?: string;
  onBatchUploadSuccess: (updates: { examId: string; fileUrl?: string; uploadedDate: string; fileName: string }[]) => void;
}

// Convert Thai numerals (๐-๙) to Arabic (0-9)
function thaiToArabicDigits(str: string): string {
  return str.replace(/[๐-๙]/g, d => '๐๑๒๓๔๕๖๗๘๙'.indexOf(d).toString());
}

// Clean lecturer names into individual searchable keywords
function getLecturerKeywords(lecturer: string): string[] {
  const clean = lecturer
    .replace(/ผศ\.|ดร\.|พ\.ต\.ท\.|จ\.ส\.อ\.|ว่าที่พันตรี|อาจารย์|อ\.|พระครู|พระมหา|พระปลัด|พระสมุห์|พระสุธีวชิราภรณ์|พระ/g, ' ')
    .replace(/[,/]/g, ' ')
    .replace(/\u0E3A/g, '') // remove phinthu
    .trim();
  
  return clean.split(/\s+/).filter(w => w.length >= 3);
}

// Extract Status: 'บรรพชิต' | 'คฤหัสถ์' | null from text
function detectStudentStatus(text: string): 'บรรพชิต' | 'คฤหัสถ์' | null {
  if (/บรรพชิต|พระภิกษุ|สามเณร/i.test(text)) return 'บรรพชิต';
  if (/คฤหัสถ์|ฆราวาส|บุคคลทั่วไป/i.test(text)) return 'คฤหัสถ์';
  return null;
}

// Extract Year: 1 | 2 | 3 | 4 | null from text
function detectYearLevel(text: string): number | null {
  const norm = thaiToArabicDigits(text);
  const match = norm.match(/(?:ชั้นปีที่|ชั้นปี|ปีที่|ปี|year|b\.a\.)\s*([1-4])/i);
  if (match) return parseInt(match[1], 10);
  return null;
}

export const AdminBatchExamUploadModal: React.FC<AdminBatchExamUploadModalProps> = ({
  isOpen,
  onClose,
  exams,
  currentUser,
  centralDriveFolderUrl,
  webhookUrl,
  onBatchUploadSuccess
}) => {
  if (!isOpen) return null;

  const [filesQueue, setFilesQueue] = useState<BatchFileItem[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [scannedProgress, setScannedProgress] = useState<{ current: number; total: number }>({ current: 0, total: 0 });
  const [progressIndex, setProgressIndex] = useState(0);
  const [searchFilter, setSearchFilter] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const [successReport, setSuccessReport] = useState<{ total: number; message: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Extract folder ID from centralDriveFolderUrl
  const effectiveFolderId = useMemo(() => {
    let folderId = '1yc7VLWVCYtH8n1NqWymKmeu1kaNJRDBa';
    const match = centralDriveFolderUrl.match(/folders\/([a-zA-Z0-9_-]+)/);
    if (match && match[1]) {
      folderId = match[1];
    }
    return folderId;
  }, [centralDriveFolderUrl]);

  // Read partial text snippet from first page of file for content inspection
  const readFileTextSnippet = (file: File): Promise<string> => {
    return new Promise((resolve) => {
      try {
        // Read first 64 KB as text snippet
        const slice = file.slice(0, 65536);
        const reader = new FileReader();
        reader.onload = () => {
          resolve((reader.result as string) || '');
        };
        reader.onerror = () => resolve('');
        reader.readAsText(slice);
      } catch {
        resolve('');
      }
    });
  };

  // Convert File to Base64
  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        const result = reader.result as string;
        const base64 = result.split(',')[1];
        resolve(base64);
      };
      reader.onerror = (error) => reject(error);
    });
  };

  // Ultra-Smart Four-Factor Course Matcher (Status + Year + Code/Name + Lecturer)
  const smartMatchCourse = async (file: File): Promise<{
    matchedExamId: string | null;
    confidence: BatchFileItem['matchConfidence'];
    note: string;
  }> => {
    const rawFileName = file.name;
    const contentSnippet = await readFileTextSnippet(file);

    const combinedText = (rawFileName + ' ' + contentSnippet).toLowerCase();
    const normCombined = thaiToArabicDigits(combinedText);

    // 1. Detect student status (บรรพชิต vs คฤหัสถ์) and year level (1-4)
    const detectedStatus = detectStudentStatus(normCombined);
    const detectedYear = detectYearLevel(normCombined);

    // 2. Filter candidates based on status and year
    let candidates = exams;
    if (detectedStatus) {
      candidates = candidates.filter(e => e.status === detectedStatus);
    }
    if (detectedYear) {
      const yearFiltered = candidates.filter(e => e.yearLevel === detectedYear);
      if (yearFiltered.length > 0) {
        candidates = yearFiltered;
      }
    }

    // 3. Match Course Code (Arabic + Thai numerals, e.g. 000 136, SP 101)
    for (const exam of candidates) {
      const rawExamCode = exam.courseCode.toLowerCase();
      const cleanExamCode = rawExamCode.replace(/[\s-_.]/g, '');

      const codeRegex = new RegExp(`(^|[^a-zA-Z0-9])${cleanExamCode}([^a-zA-Z0-9]|$)`, 'i');
      const spaceRegex = new RegExp(`(^|[^a-zA-Z0-9])${rawExamCode.replace(/\s+/g, '\\s*[-_.]?\\s*')}([^a-zA-Z0-9]|$)`, 'i');

      if (codeRegex.test(normCombined) || spaceRegex.test(normCombined)) {
        return {
          matchedExamId: exam.id,
          confidence: 'exact_code',
          note: `รหัสวิชา ${exam.courseCode} (${exam.status} ปี ${exam.yearLevel})`
        };
      }
    }

    // 4. Match Course Name (full or distinct sub-phrase)
    for (const exam of candidates) {
      const cleanCourseName = exam.courseName.trim().toLowerCase().replace(/\s*\([^)]*\)/g, '');
      if (cleanCourseName.length >= 3 && normCombined.includes(cleanCourseName)) {
        return {
          matchedExamId: exam.id,
          confidence: 'exact_name',
          note: `ชื่อวิชา ${exam.courseName} (${exam.status} ปี ${exam.yearLevel})`
        };
      }
      if (cleanCourseName.length >= 8 && normCombined.includes(cleanCourseName.substring(0, 15))) {
        return {
          matchedExamId: exam.id,
          confidence: 'exact_name',
          note: `ชื่อวิชา ${exam.courseName} (${exam.status} ปี ${exam.yearLevel})`
        };
      }
    }

    // 5. Match Lecturer keywords
    for (const exam of candidates) {
      const keywords = getLecturerKeywords(exam.lecturer);
      for (const kw of keywords) {
        if (kw.length >= 4 && normCombined.includes(kw.toLowerCase())) {
          return {
            matchedExamId: exam.id,
            confidence: 'keyword',
            note: `ตรงกับอาจารย์ ${exam.lecturer} (${exam.status} ปี ${exam.yearLevel})`
          };
        }
      }
    }

    // Fallback search across all exams if candidate filter was too restrictive
    if (detectedStatus || detectedYear) {
      for (const exam of exams) {
        const cleanExamCode = exam.courseCode.toLowerCase().replace(/[\s-_.]/g, '');
        if (cleanExamCode.length >= 4 && normCombined.includes(cleanExamCode)) {
          return {
            matchedExamId: exam.id,
            confidence: 'exact_code',
            note: `รหัสวิชา ${exam.courseCode} (${exam.status} ปี ${exam.yearLevel})`
          };
        }
      }
    }

    return {
      matchedExamId: null,
      confidence: 'unmatched',
      note: 'ยังไม่พบรายวิชาที่ตรงกัน (คลิกเลือกวิชาได้ทันที)'
    };
  };

  // Handle file addition (via file picker or drag & drop)
  const handleAddFiles = async (files: FileList | File[]) => {
    const fileArray = Array.from(files);
    if (fileArray.length === 0) return;

    setSuccessReport(null);
    setIsScanning(true);
    setScannedProgress({ current: 0, total: fileArray.length });

    const newItems: BatchFileItem[] = [];
    for (let i = 0; i < fileArray.length; i++) {
      const f = fileArray[i];
      setScannedProgress({ current: i + 1, total: fileArray.length });
      const matchResult = await smartMatchCourse(f);
      newItems.push({
        id: `batch-${Date.now()}-${i}-${Math.random().toString(36).substr(2, 6)}`,
        file: f,
        originalName: f.name,
        matchedExamId: matchResult.matchedExamId,
        matchConfidence: matchResult.confidence,
        matchNote: matchResult.note,
        status: 'ready'
      });
    }

    setFilesQueue(prev => [...prev, ...newItems]);
    setIsScanning(false);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      await handleAddFiles(e.dataTransfer.files);
    }
  };

  // Change course for a specific item
  const handleSelectExamForItem = (itemId: string, newExamId: string) => {
    setFilesQueue(prev => prev.map(item => {
      if (item.id !== itemId) return item;
      const targetExam = exams.find(e => e.id === newExamId);
      return {
        ...item,
        matchedExamId: newExamId || null,
        matchConfidence: newExamId ? 'manual' : 'unmatched',
        matchNote: targetExam ? `เลือกโดยแอดมิน: [ปี ${targetExam.yearLevel}][${targetExam.status}] ${targetExam.courseCode} ${targetExam.courseName}` : 'ไม่ได้เลือก'
      };
    }));
  };

  // Quick Action 1: Auto-assign unmatched files to exams currently pending ("รอข้อสอบ")
  const handleAutoFillPendingExams = () => {
    const alreadyAssignedExamIds = new Set(filesQueue.map(f => f.matchedExamId).filter(Boolean));
    const pendingExams = exams.filter(e => e.examSubmissionStatus !== 'submitted' && !alreadyAssignedExamIds.has(e.id));

    if (pendingExams.length === 0) {
      alert('ไม่มีรายวิชาที่สถานะ "รอข้อสอบ" ให้จับคู่เพิ่มเติม');
      return;
    }

    let assignedCount = 0;
    let pendingIndex = 0;

    setFilesQueue(prev => prev.map(item => {
      if (item.matchedExamId === null && pendingIndex < pendingExams.length) {
        const targetExam = pendingExams[pendingIndex++];
        assignedCount++;
        return {
          ...item,
          matchedExamId: targetExam.id,
          matchConfidence: 'manual',
          matchNote: `จับคู่ตามวิชาที่รอข้อสอบ: [ปี ${targetExam.yearLevel}][${targetExam.status}] ${targetExam.courseCode} ${targetExam.courseName}`
        };
      }
      return item;
    }));

    if (assignedCount > 0) {
      alert(`จับคู่รายวิชาที่รอข้อสอบเข้ากับ ${assignedCount} ไฟล์เรียบร้อยแล้ว!`);
    } else {
      alert('ทุกไฟล์มีรายวิชาจับคู่อยู่แล้ว');
    }
  };

  // Quick Action 2: Re-run matching on all unmatched files
  const handleReMatchAll = async () => {
    setIsScanning(true);
    const unmatchedItems = filesQueue.filter(f => f.matchedExamId === null);
    setScannedProgress({ current: 0, total: unmatchedItems.length });

    let count = 0;
    for (const item of unmatchedItems) {
      count++;
      setScannedProgress({ current: count, total: unmatchedItems.length });
      const res = await smartMatchCourse(item.file);
      if (res.matchedExamId) {
        setFilesQueue(prev => prev.map(q => q.id === item.id ? {
          ...q,
          matchedExamId: res.matchedExamId,
          matchConfidence: res.confidence,
          matchNote: res.note
        } : q));
      }
    }
    setIsScanning(false);
  };

  // Remove single item from queue
  const handleRemoveItem = (itemId: string) => {
    setFilesQueue(prev => prev.filter(item => item.id !== itemId));
  };

  // Clear all items
  const handleClearAll = () => {
    if (filesQueue.length > 0 && window.confirm('ต้องการล้างรายการไฟล์ทั้งหมดที่เลือกไว้หรือไม่?')) {
      setFilesQueue([]);
      setSuccessReport(null);
    }
  };

  // Helper to format standardized file name (Style B with [ปี X][บรรพชิต/คฤหัสถ์][สาขา][รหัส] ชื่อวิชา - อาจารย์.ext)
  const getStandardFileName = (exam: ExamItem, originalFileName: string) => {
    const ext = originalFileName.includes('.') 
      ? originalFileName.substring(originalFileName.lastIndexOf('.')) 
      : '.pdf';
    return `[ปี ${exam.yearLevel}][${exam.status || 'บรรพชิต'}][${exam.major || exam.faculty}][${exam.courseCode}] ${exam.courseName} - ${exam.lecturer}${ext}`;
  };

  // 1. Batch Execution via Google Apps Script Webhook
  const handleStartBatchUpload = async () => {
    if (filesQueue.length === 0) {
      alert('⚠️ ยังไม่มีไฟล์ในรายการ กรุณาเลือกไฟล์ข้อสอบก่อนครับ');
      return;
    }

    const validItems = filesQueue.filter(item => item.matchedExamId !== null && item.status !== 'success');
    const unmatchedItems = filesQueue.filter(item => item.matchedExamId === null);

    if (validItems.length === 0) {
      alert(
        `⚠️ คุณได้เลือกไฟล์ไว้ ${filesQueue.length} ไฟล์แล้ว แต่ยังไม่ได้ระบุรายวิชาให้กับไฟล์ใดเลย\n\n` +
        `กรุณาคลิกเลือกรายวิชาในช่องสีส้ม ("เลือกรายวิชา") ของแต่ละไฟล์ให้ตรงกับวิชาที่ต้องการก่อนกดส่งครับ`
      );
      return;
    }

    if (unmatchedItems.length > 0) {
      const confirmProceed = window.confirm(
        `📌 รายงานการตรวจสอบ:\n` +
        `- ไฟล์ที่ระบุรายวิชาเรียบร้อยแล้ว: ${validItems.length} วิชา\n` +
        `- ไฟล์ที่ยังไม่ได้ระบุรายวิชา: ${unmatchedItems.length} ไฟล์\n\n` +
        `ต้องการอัปโหลดเฉพาะ ${validItems.length} วิชาที่พร้อมสอบเลยหรือไม่?`
      );
      if (!confirmProceed) return;
    }

    if (!webhookUrl) {
      if (window.confirm('⚠️ ยังไม่ได้ระบุ Apps Script Webhook URL ในระบบ ต้องการใช้ "โหมดยืนยันบันทึกสถานะพร้อมสอบทันที (Direct Confirm)" แทนหรือไม่?')) {
        handleDirectConfirmAll();
      }
      return;
    }

    setIsProcessing(true);
    setProgressIndex(0);
    const updatesToApply: { examId: string; fileUrl?: string; uploadedDate: string; fileName: string }[] = [];

    const now = new Date();
    const thaiDate = now.toLocaleDateString('th-TH', { 
      day: 'numeric', 
      month: 'short', 
      year: '2-digit' 
    });
    const thaiTime = now.toLocaleTimeString('th-TH', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
    const uploadedDateStr = `${thaiDate} ${thaiTime} น.`;

    for (let i = 0; i < filesQueue.length; i++) {
      const item = filesQueue[i];
      if (!item.matchedExamId || item.status === 'success') continue;

      const exam = exams.find(e => e.id === item.matchedExamId);
      if (!exam) continue;

      setProgressIndex(i + 1);

      // Update status to uploading
      setFilesQueue(prev => prev.map(q => q.id === item.id ? { ...q, status: 'uploading' } : q));

      try {
        const base64Data = await fileToBase64(item.file);
        const standardName = getStandardFileName(exam, item.originalName);

        const payload = {
          action: 'upload_exam',
          folderId: effectiveFolderId,
          yearLevel: exam.yearLevel,
          studentStatus: exam.status || 'บรรพชิต',
          major: exam.major,
          faculty: exam.faculty,
          teacherName: exam.lecturer,
          courseCode: exam.courseCode,
          courseName: exam.courseName,
          fileName: standardName,
          fileMime: item.file.type || 'application/pdf',
          fileData: base64Data
        };

        const res = await fetch(webhookUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'text/plain;charset=utf-8' },
          body: JSON.stringify(payload)
        });

        const data = await res.json();
        const fileUrl = data.fileUrl || `${centralDriveFolderUrl} (ชั้นปีที่ ${exam.yearLevel} ${exam.status})`;

        setFilesQueue(prev => prev.map(q => q.id === item.id ? { 
          ...q, 
          status: 'success', 
          uploadedUrl: fileUrl 
        } : q));

        updatesToApply.push({
          examId: exam.id,
          fileUrl: fileUrl,
          uploadedDate: uploadedDateStr,
          fileName: standardName
        });
      } catch (err) {
        setFilesQueue(prev => prev.map(q => q.id === item.id ? { 
          ...q, 
          status: 'error', 
          errorMessage: (err as Error).message 
        } : q));
      }
    }

    setIsProcessing(false);

    if (updatesToApply.length > 0) {
      onBatchUploadSuccess(updatesToApply);
      setSuccessReport({
        total: updatesToApply.length,
        message: `อัปโหลดเข้า Google Drive (แยกโฟลเดอร์ตามชั้นปีและบรรพชิต/คฤหัสถ์) และบันทึกสถานะ "พร้อมสอบ ✔" สำเร็จจำนวน ${updatesToApply.length} รายวิชา!`
      });
    }
  };

  // 2. Direct Confirmation Mode (Instant, No Webhook required)
  const handleDirectConfirmAll = () => {
    if (filesQueue.length === 0) {
      alert('⚠️ ยังไม่มีไฟล์ในรายการ กรุณาเลือกไฟล์ข้อสอบก่อนครับ');
      return;
    }

    const validItems = filesQueue.filter(item => item.matchedExamId !== null);
    const unmatchedItems = filesQueue.filter(item => item.matchedExamId === null);

    if (validItems.length === 0) {
      alert(
        `⚠️ คุณได้เลือกไฟล์ไว้ ${filesQueue.length} ไฟล์แล้ว แต่ยังไม่ได้ระบุรายวิชาให้กับไฟล์ใดเลย\n\n` +
        `กรุณาคลิกเลือกรายวิชาในช่องสีส้ม ("เลือกรายวิชา") ของแต่ละไฟล์ให้ตรงกับวิชาที่ต้องการก่อนกดบันทึกครับ`
      );
      return;
    }

    if (unmatchedItems.length > 0) {
      const confirmProceed = window.confirm(
        `📌 รายงานการตรวจสอบ:\n` +
        `- ไฟล์ที่ระบุรายวิชาเรียบร้อยแล้ว: ${validItems.length} วิชา\n` +
        `- ไฟล์ที่ยังไม่ได้ระบุรายวิชา: ${unmatchedItems.length} ไฟล์\n\n` +
        `ต้องการบันทึกสถานะ "พร้อมสอบ ✔" ให้เฉพาะ ${validItems.length} วิชาที่ระบุแล้วนี้เลยหรือไม่?`
      );
      if (!confirmProceed) return;
    }

    const now = new Date();
    const thaiDate = now.toLocaleDateString('th-TH', { 
      day: 'numeric', 
      month: 'short', 
      year: '2-digit' 
    });
    const thaiTime = now.toLocaleTimeString('th-TH', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
    const uploadedDateStr = `${thaiDate} ${thaiTime} น.`;

    const updatesToApply: { examId: string; fileUrl?: string; uploadedDate: string; fileName: string }[] = [];

    validItems.forEach(item => {
      const exam = exams.find(e => e.id === item.matchedExamId);
      if (exam) {
        const standardName = getStandardFileName(exam, item.originalName);
        updatesToApply.push({
          examId: exam.id,
          fileUrl: centralDriveFolderUrl,
          uploadedDate: uploadedDateStr,
          fileName: standardName
        });
      }
    });

    onBatchUploadSuccess(updatesToApply);

    setFilesQueue(prev => prev.map(q => q.matchedExamId ? { 
      ...q, 
      status: 'success',
      uploadedUrl: centralDriveFolderUrl
    } : q));

    setSuccessReport({
      total: updatesToApply.length,
      message: `บันทึกสถานะ "พร้อมสอบ ✔" และจัดระเบียบชื่อไฟล์ตามมาตรฐานให้รายวิชาของอาจารย์ทั้ง ${updatesToApply.length} วิชาเรียบร้อยแล้ว!`
    });
  };

  // Filtered files in queue
  const filteredQueue = useMemo(() => {
    if (!searchFilter.trim()) return filesQueue;
    const q = searchFilter.toLowerCase().trim();
    return filesQueue.filter(item => {
      const exam = exams.find(e => e.id === item.matchedExamId);
      return item.originalName.toLowerCase().includes(q) ||
        (exam && (
          exam.courseCode.toLowerCase().includes(q) ||
          exam.courseName.toLowerCase().includes(q) ||
          exam.lecturer.toLowerCase().includes(q) ||
          exam.status.toLowerCase().includes(q)
        ));
    });
  }, [filesQueue, searchFilter, exams]);

  // Statistics
  const matchedCount = filesQueue.filter(f => f.matchedExamId !== null).length;
  const unmatchedCount = filesQueue.length - matchedCount;
  const successCount = filesQueue.filter(f => f.status === 'success').length;

  const monkCount = filesQueue.filter(f => {
    const exam = exams.find(e => e.id === f.matchedExamId);
    return exam && exam.status === 'บรรพชิต';
  }).length;

  const layCount = filesQueue.filter(f => {
    const exam = exams.find(e => e.id === f.matchedExamId);
    return exam && exam.status === 'คฤหัสถ์';
  }).length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-3xl border border-[#F8D7E3] shadow-2xl max-w-5xl w-full overflow-hidden flex flex-col max-h-[92vh] animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="bg-[#FFF0F5] px-5 sm:px-6 py-4 border-b border-[#F8D7E3] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#9D174D] text-white flex items-center justify-center shadow-xs">
              <Files className="w-5 h-5 text-rose-100" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold text-[#701A4B]">
                  อัปโหลดและจับคู่ข้อสอบชุดใหญ่ (Admin Batch Upload)
                </h2>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#701A4B] text-white shadow-2xs">
                  รูปแบบ ข (บรรพชิต / คฤหัสถ์ ชั้นปี 1-4)
                </span>
              </div>
              <p className="text-xs text-[#854D67]">
                ระบบอ่านข้อมูลหน้าแรกของไฟล์ ตรวจจับรหัสวิชา ชั้นปี และแยกกลุ่ม <b>"บรรพชิต"</b> vs <b>"คฤหัสถ์"</b> เพื่อเปลี่ยนชื่อไฟล์และจัดเข้า 8 โฟลเดอร์ปลายทางให้อัตโนมัติ
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            disabled={isProcessing}
            className="p-2 text-[#854D67] hover:text-[#701A4B] hover:bg-[#FCE7F3] rounded-xl transition cursor-pointer disabled:opacity-50"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
          
          {/* Drag & Drop Zone */}
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all ${
              isDragging 
                ? 'border-[#9D174D] bg-[#FFF0F5] scale-[0.99]' 
                : 'border-[#F8D7E3] hover:border-[#9D174D] hover:bg-[#FFF8FA] bg-white'
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept=".pdf,.doc,.docx,.zip,.rar"
              onChange={(e) => {
                if (e.target.files) handleAddFiles(e.target.files);
                e.target.value = '';
              }}
              className="hidden"
            />
            <div className="w-12 h-12 rounded-2xl bg-[#FFF0F5] text-[#9D174D] flex items-center justify-center mx-auto mb-3 border border-[#F8D7E3]">
              <Upload className="w-6 h-6" />
            </div>
            <h4 className="font-bold text-sm text-slate-800">
              ลากไฟล์ข้อสอบทั้งหมดมาวางที่นี่ หรือ <span className="text-[#9D174D] underline font-bold">คลิกเพื่อเลือกไฟล์</span>
            </h4>
            <p className="text-xs text-[#854D67] mt-1">
              รองรับไฟล์ PDF, Word (.docx, .doc), ZIP/RAR หลายไฟล์พร้อมกัน ระบบจะอ่านหน้าแรกเพื่อจับคู่รายวิชา
            </p>
          </div>

          {/* Scanning Progress Banner */}
          {isScanning && (
            <div className="p-3.5 bg-blue-50 border border-blue-200 rounded-2xl text-xs text-blue-900 flex items-center justify-between gap-3 shadow-xs animate-pulse">
              <span className="flex items-center gap-2 font-semibold">
                <RefreshCw className="w-4 h-4 animate-spin text-blue-600" />
                <span>กำลังอ่านหน้าแรกและจับคู่รายวิชา (บรรพชิต/คฤหัสถ์ ปี 1-4) ({scannedProgress.current}/{scannedProgress.total} ไฟล์)...</span>
              </span>
              <span className="font-mono text-blue-800 font-bold">
                {scannedProgress.total > 0 ? Math.round((scannedProgress.current / scannedProgress.total) * 100) : 0}%
              </span>
            </div>
          )}

          {/* Success Banner */}
          {successReport && (
            <div className="p-4 bg-emerald-50 border border-emerald-300 rounded-2xl text-xs text-emerald-900 flex items-start gap-3 shadow-xs">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="font-bold text-sm text-emerald-950">{successReport.message}</p>
                <p className="text-emerald-800">
                  รายวิชาเหล่านี้จะปรากฏเป็นสถานะ <b>"พร้อมสอบ ✔"</b> ในหน้าวิชาของอาจารย์ผู้สอนแต่ละท่าน และในตารางสอบสาธารณะทันที
                </p>
              </div>
            </div>
          )}

          {/* Unmatched Warning Banner */}
          {filesQueue.length > 0 && unmatchedCount > 0 && (
            <div className="p-3.5 bg-amber-50 border border-amber-300 rounded-2xl text-xs text-amber-950 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs">
              <div className="flex items-center gap-2.5">
                <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                <span>
                  มี <b>{unmatchedCount} ไฟล์</b> ที่ยังไม่ได้ระบุรายวิชา (แถบสีส้ม) กรุณาคลิกเลือกวิชาให้ตรงกัน หรือใช้ตัวช่วยด้านขวา:
                </span>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={handleAutoFillPendingExams}
                  className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl font-bold transition flex items-center gap-1.5 cursor-pointer shadow-2xs text-[11px]"
                  title="จับคู่ไฟล์ที่ยังไม่ได้ระบุวิชาเข้ากับวิชาที่สถานะ 'รอข้อสอบ' อัตโนมัติ"
                >
                  <Wand2 className="w-3.5 h-3.5" />
                  <span>🪄 จับคู่ตามวิชาที่รอข้อสอบ</span>
                </button>

                <button
                  type="button"
                  onClick={handleReMatchAll}
                  className="px-3 py-1.5 bg-white hover:bg-amber-100 text-amber-900 border border-amber-300 rounded-xl font-semibold transition flex items-center gap-1 cursor-pointer text-[11px]"
                >
                  <RefreshCw className="w-3.5 h-3.5 text-amber-700" />
                  <span>สแกนใหม่</span>
                </button>
              </div>
            </div>
          )}

          {/* Queue Overview & Stats Bar */}
          {filesQueue.length > 0 && (
            <div className="space-y-3">
              <div className="bg-[#FFF8FA] p-3 sm:p-4 rounded-2xl border border-[#F8D7E3] flex flex-wrap items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-2.5 flex-wrap">
                  <span className="font-bold text-[#701A4B] flex items-center gap-1.5">
                    <FileText className="w-4 h-4 text-[#9D174D]" />
                    <span>ไฟล์ทั้งหมด: <b>{filesQueue.length}</b> ไฟล์</span>
                  </span>
                  <span className="px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200 font-semibold">
                    จับคู่สำเร็จ: <b>{matchedCount}</b> วิชา
                  </span>
                  {monkCount > 0 && (
                    <span className="px-2 py-0.5 rounded-md bg-amber-50 text-amber-900 border border-amber-200 font-medium">
                      บรรพชิต {monkCount} วิชา
                    </span>
                  )}
                  {layCount > 0 && (
                    <span className="px-2 py-0.5 rounded-md bg-sky-50 text-sky-900 border border-sky-200 font-medium">
                      คฤหัสถ์ {layCount} วิชา
                    </span>
                  )}
                  {unmatchedCount > 0 && (
                    <span className="px-2.5 py-1 rounded-lg bg-amber-100 text-amber-900 border border-amber-300 font-bold">
                      รอระบุวิชา: <b>{unmatchedCount}</b> ไฟล์
                    </span>
                  )}
                  {successCount > 0 && (
                    <span className="px-2.5 py-1 rounded-lg bg-blue-50 text-blue-800 border border-blue-200 font-semibold">
                      สำเร็จแล้ว: <b>{successCount}</b> วิชา
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <div className="relative">
                    <Search className="w-3.5 h-3.5 text-[#854D67] absolute left-2.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={searchFilter}
                      onChange={(e) => setSearchFilter(e.target.value)}
                      placeholder="กรองชื่อไฟล์/รหัสวิชา/บรรพชิต..."
                      className="pl-8 pr-3 py-1 bg-white border border-[#F8D7E3] rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-[#9D174D] text-slate-800"
                    />
                  </div>
                  <button
                    onClick={handleClearAll}
                    disabled={isProcessing}
                    className="px-2.5 py-1 bg-white hover:bg-rose-50 text-rose-700 border border-rose-200 rounded-xl transition cursor-pointer disabled:opacity-50"
                  >
                    ล้างรายการ
                  </button>
                </div>
              </div>

              {/* Progress Bar (during batch processing) */}
              {isProcessing && (
                <div className="p-3 bg-white rounded-2xl border border-[#F8D7E3] space-y-1.5 shadow-xs">
                  <div className="flex items-center justify-between text-xs font-semibold text-[#701A4B]">
                    <span className="flex items-center gap-1.5">
                      <RefreshCw className="w-3.5 h-3.5 animate-spin text-[#9D174D]" />
                      <span>กำลังประมวลผลและอัปโหลดไฟล์ ({progressIndex}/{filesQueue.length})...</span>
                    </span>
                    <span>{Math.round((progressIndex / filesQueue.length) * 100)}%</span>
                  </div>
                  <div className="w-full bg-[#FCE7F3] rounded-full h-2 overflow-hidden">
                    <div 
                      className="bg-[#9D174D] h-2 rounded-full transition-all duration-300"
                      style={{ width: `${(progressIndex / filesQueue.length) * 100}%` }}
                    />
                  </div>
                </div>
              )}

              {/* File Matching Table */}
              <div className="bg-white rounded-2xl border border-[#F8D7E3] shadow-xs overflow-hidden">
                <div className="overflow-x-auto max-h-[380px] overflow-y-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead className="sticky top-0 bg-[#FCE7F3]/90 backdrop-blur-xs text-[#701A4B] font-bold border-b border-[#F8D7E3] z-10">
                      <tr>
                        <th className="py-2.5 px-3 w-[26%] border-r border-[#F8D7E3]/60">ไฟล์ต้นฉบับ</th>
                        <th className="py-2.5 px-3 w-[34%] border-r border-[#F8D7E3]/60">จับคู่กับรายวิชา</th>
                        <th className="py-2.5 px-3 w-[26%] border-r border-[#F8D7E3]/60">ชื่อไฟล์ใหม่ & ปลายทางโฟลเดอร์ (รูปแบบ ข)</th>
                        <th className="py-2.5 px-2 text-center w-[14%]">สถานะ</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#FCE7F3]/60">
                      {filteredQueue.map((item) => {
                        const matchedExam = exams.find(e => e.id === item.matchedExamId);
                        const standardFileName = matchedExam 
                          ? getStandardFileName(matchedExam, item.originalName)
                          : '-';

                        const isRowUnmatched = !item.matchedExamId;

                        return (
                          <tr 
                            key={item.id} 
                            className={`transition-colors ${
                              isRowUnmatched 
                                ? 'bg-amber-50/40 hover:bg-amber-50/70' 
                                : 'hover:bg-[#FFF8FA]'
                            }`}
                          >
                            {/* 1. Original File */}
                            <td className="py-2 px-3 align-top border-r border-[#FCE7F3]/60">
                              <div className="font-semibold text-slate-800 break-all">
                                {item.originalName}
                              </div>
                              <div className="text-[11px] text-[#854D67] mt-0.5">
                                ขนาด: {(item.file.size / 1024).toFixed(1)} KB
                              </div>
                            </td>

                            {/* 2. Matched Exam Course Selector */}
                            <td className="py-2 px-3 align-top border-r border-[#FCE7F3]/60">
                              <select
                                value={item.matchedExamId || ''}
                                onChange={(e) => handleSelectExamForItem(item.id, e.target.value)}
                                disabled={isProcessing || item.status === 'success'}
                                className={`w-full p-2 text-xs rounded-xl border font-medium focus:outline-none focus:ring-2 focus:ring-[#9D174D] cursor-pointer ${
                                  item.matchedExamId
                                    ? 'bg-emerald-50/80 border-emerald-300 text-emerald-950 font-bold'
                                    : 'bg-amber-100/80 border-amber-400 text-amber-950 font-bold animate-pulse'
                                }`}
                              >
                                <option value="">⚠️ -- กรุณาคลิกเลือกรายวิชาสำหรับไฟล์นี้ --</option>
                                <optgroup label="=== รายวิชาสำหรับ บรรพชิต (ชั้นปีที่ 1 - 4) ===">
                                  {exams.filter(e => e.status === 'บรรพชิต').map(exam => (
                                    <option key={exam.id} value={exam.id}>
                                      [ปี {exam.yearLevel}][บรรพชิต] {exam.courseCode} - {exam.courseName} ({exam.lecturer}) {exam.examSubmissionStatus === 'submitted' ? '✔' : ''}
                                    </option>
                                  ))}
                                </optgroup>
                                <optgroup label="=== รายวิชาสำหรับ คฤหัสถ์ (ชั้นปีที่ 1 - 4) ===">
                                  {exams.filter(e => e.status === 'คฤหัสถ์').map(exam => (
                                    <option key={exam.id} value={exam.id}>
                                      [ปี {exam.yearLevel}][คฤหัสถ์] {exam.courseCode} - {exam.courseName} ({exam.lecturer}) {exam.examSubmissionStatus === 'submitted' ? '✔' : ''}
                                    </option>
                                  ))}
                                </optgroup>
                              </select>

                              {/* Confidence Note Badge */}
                              <div className="mt-1 flex items-center gap-1.5 flex-wrap">
                                {item.matchConfidence === 'exact_code' && (
                                  <span className="text-[10px] px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 font-bold border border-emerald-200">
                                    🎯 {item.matchNote}
                                  </span>
                                )}
                                {item.matchConfidence === 'exact_name' && (
                                  <span className="text-[10px] px-2 py-0.5 rounded-md bg-blue-100 text-blue-800 font-bold border border-blue-200">
                                    📘 {item.matchNote}
                                  </span>
                                )}
                                {item.matchConfidence === 'content_text' && (
                                  <span className="text-[10px] px-2 py-0.5 rounded-md bg-purple-100 text-purple-800 font-bold border border-purple-200">
                                    🔍 {item.matchNote}
                                  </span>
                                )}
                                {item.matchConfidence === 'keyword' && (
                                  <span className="text-[10px] px-2 py-0.5 rounded-md bg-teal-100 text-teal-800 font-bold border border-teal-200">
                                    👨‍🏫 {item.matchNote}
                                  </span>
                                )}
                                {item.matchConfidence === 'manual' && (
                                  <span className="text-[10px] px-2 py-0.5 rounded-md bg-indigo-100 text-indigo-800 font-bold border border-indigo-200">
                                    ✏️ ระบุโดยแอดมิน
                                  </span>
                                )}
                                {item.matchConfidence === 'unmatched' && (
                                  <span className="text-[10px] px-2 py-0.5 rounded-md bg-amber-200 text-amber-900 font-bold border border-amber-300">
                                    ⚠️ โปรดเลือกวิชาในช่องด้านบน
                                  </span>
                                )}
                              </div>
                            </td>

                            {/* 3. New Standard File Name & Target Subfolder (Style B) */}
                            <td className="py-2 px-3 align-top border-r border-[#FCE7F3]/60">
                              {matchedExam ? (
                                <div className="space-y-1">
                                  <div className="font-mono text-[11px] text-slate-800 bg-[#FFF0F5] p-1.5 rounded-lg border border-[#F8D7E3] break-all">
                                    {standardFileName}
                                  </div>
                                  <div className="flex items-center gap-1.5 text-[11px] text-[#854D67] flex-wrap">
                                    <span className="font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-300">
                                      📁 ชั้นปีที่ {matchedExam.yearLevel} ({matchedExam.status})
                                    </span>
                                    <span>· {matchedExam.lecturer}</span>
                                  </div>
                                </div>
                              ) : (
                                <span className="text-amber-800 text-[11px] italic font-semibold">
                                  👈 เลือกวิชาทางซ้าย เพื่อสร้างชื่อและโฟลเดอร์
                                </span>
                              )}
                            </td>

                            {/* 4. Status & Action */}
                            <td className="py-2 px-2 text-center align-top">
                              <div className="flex flex-col items-center gap-1">
                                {item.status === 'ready' && (
                                  <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-md ${
                                    item.matchedExamId 
                                      ? 'text-emerald-700 bg-emerald-50 border border-emerald-200' 
                                      : 'text-amber-800 bg-amber-100'
                                  }`}>
                                    {item.matchedExamId ? 'พร้อม' : 'รอเลือกวิชา'}
                                  </span>
                                )}
                                {item.status === 'uploading' && (
                                  <span className="text-[11px] font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md flex items-center gap-1">
                                    <RefreshCw className="w-3 h-3 animate-spin text-blue-600" />
                                    <span>กำลังส่ง...</span>
                                  </span>
                                )}
                                {item.status === 'success' && (
                                  <span className="text-[11px] font-bold text-emerald-800 bg-emerald-50 border border-emerald-300 px-2 py-0.5 rounded-md flex items-center gap-1">
                                    <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                    <span>พร้อมสอบ ✔</span>
                                  </span>
                                )}
                                {item.status === 'error' && (
                                  <span className="text-[10px] font-semibold text-rose-800 bg-rose-50 border border-rose-200 px-1.5 py-0.5 rounded-md" title={item.errorMessage}>
                                    เกิดข้อผิดพลาด
                                  </span>
                                )}

                                {!isProcessing && item.status !== 'success' && (
                                  <button
                                    onClick={() => handleRemoveItem(item.id)}
                                    title="ลบไฟล์นี้ออกจากรายการ"
                                    className="p-1 text-slate-400 hover:text-rose-600 transition cursor-pointer mt-1"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* Quick Notice Info */}
          <div className="bg-[#FFF8FA] p-3.5 rounded-2xl border border-[#F8D7E3] text-xs text-[#854D67] space-y-1">
            <p className="font-bold text-[#701A4B] flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-[#E11D48]" />
              <span>การจัดหมวดหมู่ Google Drive โครงสร้างรูปแบบ ข:</span>
            </p>
            <p>
              1. <b>แยก 8 โฟลเดอร์ปลายทาง:</b> ไฟล์จะถูกส่งเข้าโฟลเดอร์ <code className="bg-white px-1.5 py-0.5 rounded border border-[#F8D7E3] font-mono text-emerald-800">ชั้นปีที่ 1 - 4 (บรรพชิต)</code> และ <code className="bg-white px-1.5 py-0.5 rounded border border-[#F8D7E3] font-mono text-sky-800">ชั้นปีที่ 1 - 4 (คฤหัสถ์)</code> อัตโนมัติ
            </p>
            <p>
              2. <b>ชื่อไฟล์มาตรฐานใหม่:</b> <code className="bg-white px-1.5 py-0.5 rounded border border-[#F8D7E3] font-mono text-[#701A4B]">[ปี X][บรรพชิต/คฤหัสถ์][สาขาวิชา][รหัสวิชา] ชื่อวิชา - อาจารย์ผู้สอน.ext</code> เพื่อความชัดเจนสูงสุด
            </p>
            <p>
              3. <b>ผลลัพธ์:</b> ทุกวิชาที่ถูกประมวลผลจะเปลี่ยนเป็นสถานะ <b>"พร้อมสอบ ✔"</b> ปรากฏที่ตารางสอบของอาจารย์ผู้สอนทันที
            </p>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="bg-white px-5 sm:px-6 py-4 border-t border-[#F8D7E3] flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="text-xs text-[#854D67]">
            {filesQueue.length === 0 ? (
              <span>ยังไม่มีไฟล์ในรายการ เลือกไฟล์ด้านบนเพื่อเริ่มต้น</span>
            ) : (
              <span>
                พร้อมประมวลผล <b className="text-[#9D174D]">{matchedCount}</b> / {filesQueue.length} รายวิชา 
                {unmatchedCount > 0 && <span className="text-amber-700 ml-1.5 font-semibold">(รอระบุวิชา {unmatchedCount} ไฟล์)</span>}
              </span>
            )}
          </div>

          <div className="flex items-center gap-2 flex-wrap w-full sm:w-auto justify-end">
            <button
              onClick={onClose}
              disabled={isProcessing}
              className="px-4 py-2 bg-white hover:bg-slate-50 text-slate-700 font-semibold text-xs rounded-xl border border-slate-200 transition cursor-pointer disabled:opacity-50"
            >
              ปิดหน้าต่าง
            </button>

            {/* Direct Instant Confirmation Button */}
            <button
              onClick={handleDirectConfirmAll}
              disabled={isProcessing || filesQueue.length === 0}
              className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white font-semibold text-xs rounded-xl shadow-xs transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              title="บันทึกสถานะ 'พร้อมสอบ ✔' ทันทีทุกวิชาที่จับคู่ไว้ (ไม่ต้องรอ Webhook)"
            >
              <FolderCheck className="w-3.5 h-3.5" />
              <span>⚡ บันทึก "พร้อมสอบ ✔" ทันที ({matchedCount} วิชา)</span>
            </button>

            {/* Google Drive Webhook Upload Button */}
            <button
              onClick={handleStartBatchUpload}
              disabled={isProcessing || filesQueue.length === 0}
              className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs rounded-xl shadow-xs transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              {isProcessing ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>กำลังอัปโหลด ({progressIndex}/{filesQueue.length})...</span>
                </>
              ) : (
                <>
                  <FolderUp className="w-3.5 h-3.5" />
                  <span>🚀 อัปโหลดขึ้น Google Drive + บันทึกพร้อมสอบ</span>
                </>
              )}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
