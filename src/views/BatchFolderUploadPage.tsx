import React, { useState, useRef, useMemo, useEffect } from 'react';
import {
  ArrowLeft,
  ChevronRight,
  FolderUp,
  Folder,
  FileText,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Search,
  Check,
  RefreshCw,
  Trash2,
  ExternalLink,
  BookOpen,
  GraduationCap,
  Users,
  Zap,
  Info,
  Link as LinkIcon,
  Copy,
  ChevronDown,
  ChevronUp,
  ShieldCheck,
  AlertTriangle,
  Play
} from 'lucide-react';
import { ExamItem, TeacherUser } from '../types/exam';
import { matchFileToExam, ScannedExamFile } from '../utils/folderExamMatcher';
import { isLecturerMatch } from '../utils/teacherMatching';
import { apiClient } from '../utils/apiClient';

export interface BatchFolderUploadPageProps {
  exams: ExamItem[];
  currentUser: TeacherUser | null;
  centralDriveFolderUrl?: string;
  webhookUrl?: string;
  onUpdateWebhookUrl?: (url: string) => void;
  onBack: () => void;
  onBatchUploadSuccess: (
    updates: { examId: string; fileUrl?: string; uploadedDate: string; fileName: string }[]
  ) => void;
}

interface UploadSuccessDetail {
  total: number;
  driveSuccessCount: number;
  driveFailCount: number;
  successList: {
    courseName: string;
    courseCode: string;
    fileName: string;
    fileUrl?: string;
    folderName?: string;
  }[];
  failedList: {
    courseName: string;
    fileName: string;
    error: string;
  }[];
  timestamp: string;
}

export const BatchFolderUploadPage: React.FC<BatchFolderUploadPageProps> = ({
  exams,
  currentUser,
  centralDriveFolderUrl,
  webhookUrl = '',
  onUpdateWebhookUrl,
  onBack,
  onBatchUploadSuccess
}) => {
  const [scannedFiles, setScannedFiles] = useState<ScannedExamFile[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentUploadIndex, setCurrentUploadIndex] = useState(0);
  const [currentUploadFileName, setCurrentUploadFileName] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterConfidence, setFilterConfidence] = useState<'all' | 'exact' | 'unmatched'>('all');

  // Upload results summary
  const [uploadSuccessResult, setUploadSuccessResult] = useState<UploadSuccessDetail | null>(null);

  const folderInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isAdmin = currentUser?.role === 'admin';

  // Available candidate exams for the logged in user
  const selectableExams = useMemo(() => {
    if (isAdmin || !currentUser) {
      return exams;
    }
    const myCourses = exams.filter(e => isLecturerMatch(e.lecturer, currentUser));
    return myCourses.length > 0 ? myCourses : exams;
  }, [exams, currentUser, isAdmin]);

  // Handle files selected from folder or file input
  const handleFilesSelected = (files: FileList | null) => {
    if (!files || files.length === 0) return;

    setIsProcessing(true);
    setUploadSuccessResult(null);

    const fileArray = Array.from(files);
    // Filter out hidden files or system files
    const validFiles = fileArray.filter(f => !f.name.startsWith('.') && !f.name.startsWith('~'));

    const parsedResults = validFiles.map(file => {
      return matchFileToExam(file, exams, currentUser);
    });

    setScannedFiles(prev => [...prev, ...parsedResults]);
    setIsProcessing(false);
  };

  const handleManualExamChange = (scannedFileId: string, targetExamId: string) => {
    setScannedFiles(prev => prev.map(item => {
      if (item.id !== scannedFileId) return item;
      const targetExam = exams.find(e => e.id === targetExamId);
      return {
        ...item,
        matchedExamId: targetExamId || null,
        detectedCourseName: targetExam ? targetExam.courseName : null,
        matchConfidence: targetExamId ? 'exact' : 'none'
      };
    }));
  };

  const handleRemoveItem = (scannedFileId: string) => {
    setScannedFiles(prev => prev.filter(item => item.id !== scannedFileId));
  };

  const handleClearAll = () => {
    if (scannedFiles.length === 0) return;
    if (window.confirm('คุณต้องการล้างรายการไฟล์ที่เลือกทั้งหมดหรือไม่?')) {
      setScannedFiles([]);
      setUploadSuccessResult(null);
    }
  };

  // Auto-fill unassigned files with pending exams
  const handleAutoFillPending = () => {
    const assignedIds = new Set(scannedFiles.map(f => f.matchedExamId).filter(Boolean));
    const pendingExams = selectableExams.filter(e => e.examSubmissionStatus !== 'submitted' && !assignedIds.has(e.id));

    if (pendingExams.length === 0) {
      alert('ไม่พบรายวิชาที่ยังค้างส่งข้อสอบสำหรับจับคู่');
      return;
    }

    let pendingIdx = 0;
    setScannedFiles(prev => prev.map(item => {
      if (item.matchedExamId === null && pendingIdx < pendingExams.length) {
        const nextExam = pendingExams[pendingIdx++];
        return {
          ...item,
          matchedExamId: nextExam.id,
          detectedCourseName: nextExam.courseName,
          matchConfidence: 'high'
        };
      }
      return item;
    }));
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

  // Confirm and submit
  const handleConfirmSubmit = async () => {
    const validMatches = scannedFiles.filter(f => f.matchedExamId !== null);
    if (validMatches.length === 0) {
      alert('⚠️ กรุณาเลือกไฟล์และจับคู่รายวิชาอย่างน้อย 1 วิชา ก่อนกดยืนยัน');
      return;
    }

    setIsProcessing(true);
    setUploadSuccessResult(null);

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
    const uploadDateStr = `${thaiDate} ${thaiTime} น.`;

    const updates: { examId: string; fileUrl?: string; uploadedDate: string; fileName: string }[] = [];
    const successList: UploadSuccessDetail['successList'] = [];
    const failedList: UploadSuccessDetail['failedList'] = [];

    let fileIndex = 0;

    for (const match of validMatches) {
      fileIndex++;
      setCurrentUploadIndex(fileIndex);

      const exam = exams.find(e => e.id === match.matchedExamId);
      if (!exam) continue;

      const teacherName = (currentUser?.name || exam.lecturer || 'อาจารย์ผู้สอน').trim();
      const ext = match.file.name.includes('.') ? match.file.name.substring(match.file.name.lastIndexOf('.')) : '.pdf';
      const stdName = `[ปี ${exam.yearLevel}][${exam.status}][${exam.major || exam.faculty}][${exam.courseCode}] ${exam.courseName} - ${teacherName}${ext}`;

      setCurrentUploadFileName(stdName);

      try {
        const base64Content = await fileToBase64(match.file);

        // Upload securely via API Client (Server validates magic bytes, size <= 25MB, writes to private storage & logs audit)
        const uploadRes = await apiClient.uploadExam(exam.id, {
          fileName: stdName,
          fileMime: match.file.type || 'application/pdf',
          fileBase64: base64Content,
          notes: `Batch folder upload by ${teacherName}`
        });

        if (uploadRes && uploadRes.success) {
          successList.push({
            courseName: exam.courseName,
            courseCode: exam.courseCode,
            fileName: stdName,
            fileUrl: uploadRes.version?.driveFileId,
            folderName: `ชั้นปีที่ ${exam.yearLevel} (${exam.status})`
          });

          // ONLY mark as updated/submitted if server upload truly succeeded!
          updates.push({
            examId: exam.id,
            fileUrl: uploadRes.version?.driveFileId || '',
            uploadedDate: uploadDateStr,
            fileName: stdName
          });
        } else {
          failedList.push({
            courseName: exam.courseName,
            fileName: stdName,
            error: uploadRes?.message || 'การอัปโหลดไม่สำเร็จจากเซิร์ฟเวอร์'
          });
        }
      } catch (err: any) {
        const errorMsg = err?.message || 'ไม่สามารถส่งไฟล์เข้าสู่ระบบได้ (การเชื่อมต่อล้มเหลว)';
        failedList.push({
          courseName: exam.courseName,
          fileName: stdName,
          error: errorMsg
        });
      }
    }

    if (updates.length > 0) {
      onBatchUploadSuccess(updates);
    }

    setIsProcessing(false);
    setCurrentUploadIndex(0);
    setCurrentUploadFileName('');

    setUploadSuccessResult({
      total: validMatches.length,
      driveSuccessCount: successList.length,
      driveFailCount: failedList.length,
      successList,
      failedList,
      timestamp: uploadDateStr
    });
  };

  // Filtered files for table preview
  const displayFiles = useMemo(() => {
    return scannedFiles.filter(item => {
      if (filterConfidence === 'exact' && item.matchConfidence !== 'exact') return false;
      if (filterConfidence === 'unmatched' && item.matchedExamId !== null) return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchName = item.originalName.toLowerCase().includes(q);
        const matchCourse = (item.detectedCourseName || '').toLowerCase().includes(q);
        const matchCode = (item.detectedCourseCode || '').toLowerCase().includes(q);
        if (!matchName && !matchCourse && !matchCode) return false;
      }
      return true;
    });
  }, [scannedFiles, filterConfidence, searchQuery]);

  const matchedCount = scannedFiles.filter(f => f.matchedExamId !== null).length;
  const unmatchedCount = scannedFiles.length - matchedCount;

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* 1. Navigation Breadcrumb Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white/90 backdrop-blur-sm p-4 rounded-2xl border border-[#F8D7E3] shadow-xs">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-[#FFF0F5] text-slate-700 hover:text-[#9D174D] border border-slate-200 hover:border-[#F8D7E3] font-medium text-sm transition cursor-pointer shadow-xs"
          >
            <ArrowLeft className="w-4 h-4 text-[#9D174D]" />
            <span>ย้อนกลับ</span>
          </button>
          <div className="flex items-center gap-2 text-xs sm:text-sm text-slate-500">
            <button onClick={onBack} className="hover:text-[#9D174D] transition cursor-pointer">หน้าหลัก</button>
            <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
            <span className="font-semibold text-[#9D174D]">อัปโหลดข้อสอบแบบเลือกโฟลเดอร์ (Batch Folder Upload)</span>
          </div>
        </div>

        {scannedFiles.length > 0 && (
          <div className="flex items-center gap-2">
            <button
              onClick={handleAutoFillPending}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 text-xs font-bold transition shadow-xs cursor-pointer"
            >
              <Zap className="w-3.5 h-3.5" />
              <span>⚡ จับคู่อัตโนมัติทุกวิชาที่รอส่ง</span>
            </button>
            <button
              onClick={handleClearAll}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-50 hover:bg-rose-50 text-slate-600 hover:text-rose-700 border border-slate-200 text-xs font-medium transition cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>ล้างรายการ</span>
            </button>
          </div>
        )}
      </div>

      {/* 2. Google Drive Destination & Security Status Card */}
      <div className="bg-white rounded-3xl border border-[#F8D7E3] shadow-xs overflow-hidden">
        <div className="p-4 sm:p-5 bg-gradient-to-r from-[#FFF0F5] via-[#FFF9FB] to-[#FFF0F5] border-b border-[#F8D7E3]">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#9D174D]/10 text-[#9D174D]">
                  <Folder className="w-3.5 h-3.5" />
                  <span>ระบบจัดเก็บข้อสอบส่วนกลาง (Google Drive / Secure Server)</span>
                </span>
                <span className="text-xs text-slate-500 font-mono hidden sm:inline">
                  (Private University Storage)
                </span>
              </div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2">
                <span>วิทยาลัยสงฆ์พ่อขุนผาเมือง</span>
                <span className="text-xs font-normal text-slate-500">
                  (จัดเก็บแยกตามชั้นปีและสถานะนิสิต พร้อมประวัติเวอร์ชันและบันทึกตรวจสอบ)
                </span>
              </h2>
            </div>

            <div className="flex items-center gap-2">
              <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-semibold">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>ความปลอดภัยระดับองค์กร (RBAC & Antivirus)</span>
              </div>
            </div>
          </div>
        </div>

        {/* Security & Validation Notice */}
        <div className="p-4 sm:p-5 bg-slate-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2.5 text-slate-600">
            <div className="w-8 h-8 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            </div>
            <div>
              <p className="font-semibold text-slate-800">
                ระบบคัดกรองไฟล์ฝั่งเซิร์ฟเวอร์อัตโนมัติ (Server-Side Magic Bytes & Size Limits)
              </p>
              <p className="text-[11px] text-slate-500">
                รองรับไฟล์ PDF (%PDF-) และ Word (.docx) ขนาดสูงสุด 25MB ป้องกันชื่อไฟล์และ Path traversal
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 text-[11px] text-slate-500 shrink-0">
            <span className="px-2 py-1 bg-white border border-slate-200 rounded-lg">🔒 ปลายทาง: Private Google Drive</span>
            <span className="px-2 py-1 bg-white border border-slate-200 rounded-lg">🛡️ Zero Anyone-With-Link</span>
          </div>
        </div>
      </div>

      {/* 3. Main Folder Selection & Upload Section */}
      <div className="bg-white rounded-3xl border border-[#F8D7E3] shadow-sm overflow-hidden">
        <div className="bg-gradient-to-r from-[#FFF0F5] via-[#FFF5F8] to-[#FFF0F5] border-b border-[#F8D7E3] p-6 sm:p-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-start gap-4">
              <div className="w-14 h-14 rounded-2xl bg-[#9D174D] text-white flex items-center justify-center shrink-0 shadow-md">
                <FolderUp className="w-8 h-8 text-rose-100" />
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-2 mb-1.5">
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#9D174D]/10 text-[#9D174D]">
                    ระบบสแกนโฟลเดอร์อัจฉริยะ (Smart Folder Extraction)
                  </span>
                  {isAdmin ? (
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-purple-100 text-purple-800 border border-purple-300">
                      สิทธิ์ผู้ดูแลระบบ (Admin)
                    </span>
                  ) : (
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                      {currentUser?.name || 'อาจารย์ผู้สอน'}
                    </span>
                  )}
                </div>
                <h1 className="text-xl sm:text-2xl font-bold text-slate-900">
                  อัปโหลดและจับคู่ข้อสอบปลายภาคจากโฟลเดอร์
                </h1>
                <p className="text-xs sm:text-sm text-slate-600 mt-1">
                  เลือกโฟลเดอร์ในเครื่องที่มีไฟล์ข้อสอบ ระบบจะอ่าน <strong>ชั้นปี (1-4)</strong>, <strong>บรรพชิต หรือ คฤหัสถ์ (โยม)</strong> และจับคู่กับตารางสอบให้อัตโนมัติทันที
                </p>
              </div>
            </div>

            {/* Folder / Files Selection Buttons */}
            <div className="flex flex-wrap sm:flex-col gap-2 shrink-0">
              <input
                type="file"
                ref={folderInputRef}
                /* @ts-ignore */
                webkitdirectory=""
                directory=""
                multiple
                onChange={(e) => handleFilesSelected(e.target.files)}
                className="hidden"
              />
              <input
                type="file"
                ref={fileInputRef}
                multiple
                accept=".pdf,.doc,.docx"
                onChange={(e) => handleFilesSelected(e.target.files)}
                className="hidden"
              />

              <button
                type="button"
                onClick={() => folderInputRef.current?.click()}
                disabled={isProcessing}
                className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-gradient-to-r from-[#9D174D] to-[#701A4B] hover:opacity-95 text-white font-bold text-xs sm:text-sm shadow-md transition cursor-pointer"
              >
                <Folder className="w-5 h-5" />
                <span>📂 เลือกโฟลเดอร์ข้อสอบ</span>
              </button>

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isProcessing}
                className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-xs font-semibold transition shadow-xs cursor-pointer"
              >
                <FileText className="w-4 h-4 text-slate-500" />
                <span>หรือเลือกแบบหลายไฟล์</span>
              </button>
            </div>
          </div>
        </div>

        {/* Real-time Uploading Progress Banner */}
        {isProcessing && currentUploadIndex > 0 && (
          <div className="m-6 p-5 rounded-2xl bg-purple-50 border border-purple-200 text-purple-900 space-y-3 animate-in fade-in">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 font-bold text-sm">
                <RefreshCw className="w-4 h-4 text-purple-600 animate-spin" />
                <span>กำลังอัปโหลดไฟล์เข้า Google Drive ({currentUploadIndex} จาก {scannedFiles.filter(f => f.matchedExamId).length} ไฟล์)...</span>
              </div>
              <span className="text-xs font-mono text-purple-700">
                {Math.round((currentUploadIndex / (scannedFiles.filter(f => f.matchedExamId).length || 1)) * 100)}%
              </span>
            </div>
            <div className="w-full bg-purple-200 rounded-full h-2 overflow-hidden">
              <div
                className="bg-purple-600 h-2 transition-all duration-300"
                style={{ width: `${(currentUploadIndex / (scannedFiles.filter(f => f.matchedExamId).length || 1)) * 100}%` }}
              ></div>
            </div>
            <p className="text-xs text-purple-800 truncate" title={currentUploadFileName}>
              📄 {currentUploadFileName}
            </p>
          </div>
        )}

        {/* Upload Success / Detailed Result Report */}
        {uploadSuccessResult && (
          <div className="m-6 p-5 rounded-2xl border space-y-4 animate-in fade-in bg-white shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
                  uploadSuccessResult.driveFailCount === 0
                    ? 'bg-emerald-100 text-emerald-700'
                    : 'bg-amber-100 text-amber-700'
                }`}>
                  {uploadSuccessResult.driveFailCount === 0 ? (
                    <CheckCircle2 className="w-6 h-6" />
                  ) : (
                    <AlertTriangle className="w-6 h-6" />
                  )}
                </div>
                <div>
                  <h4 className="font-bold text-base text-slate-900">
                    รายงานผลการนำเข้าข้อสอบ ({uploadSuccessResult.total} รายวิชา)
                  </h4>
                  <p className="text-xs text-slate-500">
                    บันทึกสถานะเมื่อ {uploadSuccessResult.timestamp}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <a
                  href={centralDriveFolderUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="px-3.5 py-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 font-bold text-xs flex items-center gap-1.5 transition"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>📂 ตรวจสอบใน Google Drive</span>
                </a>
                <button
                  onClick={onBack}
                  className="px-4 py-2 rounded-xl bg-[#9D174D] hover:bg-[#831843] text-white font-bold text-xs shadow-xs transition"
                >
                  กลับไปหน้าหลัก
                </button>
              </div>
            </div>

            {/* Metrics Breakdown */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs">
                <span className="text-slate-500 block">จำนวนวิชาที่บันทึกสถานะ:</span>
                <span className="text-base font-bold text-slate-900">{uploadSuccessResult.total} รายวิชา</span>
              </div>
              <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 text-xs">
                <span className="text-emerald-700 block">อัปโหลดเข้า Drive สำเร็จ:</span>
                <span className="text-base font-bold text-emerald-800">{uploadSuccessResult.driveSuccessCount} ไฟล์</span>
              </div>
              <div className={`p-3 rounded-xl border text-xs ${
                uploadSuccessResult.driveFailCount > 0
                  ? 'bg-rose-50 border-rose-200 text-rose-800'
                  : 'bg-slate-50 border-slate-200 text-slate-600'
              }`}>
                <span className="block">ส่งเข้า Drive ไม่สำเร็จ:</span>
                <span className="text-base font-bold">{uploadSuccessResult.driveFailCount} ไฟล์</span>
              </div>
            </div>

            {/* Failed uploads notice */}
            {uploadSuccessResult.driveFailCount > 0 && (
              <div className="p-3.5 bg-rose-50 rounded-xl border border-rose-200 space-y-2 text-xs text-rose-900">
                <div className="font-bold flex items-center gap-1.5">
                  <AlertCircle className="w-4 h-4 text-rose-600" />
                  <span>รายวิชาที่ส่งเข้า Google Drive ไม่สำเร็จ ({uploadSuccessResult.driveFailCount} รายการ):</span>
                </div>
                <ul className="list-disc list-inside space-y-1 text-rose-800 font-mono text-[11px]">
                  {uploadSuccessResult.failedList.map((f, i) => (
                    <li key={i}>
                      <strong>{f.courseName}</strong>: {f.error}
                    </li>
                  ))}
                </ul>
                <p className="text-[11px] text-rose-700">
                  คำแนะนำ: ระบบได้บันทึกสถานะ "พร้อมสอบ ✔" ในหน้าเว็บให้แล้ว ท่านสามารถคลิกปุ่ม <strong>"📂 ตรวจสอบใน Google Drive"</strong> เพื่อนำไฟล์ไปใส่ในโฟลเดอร์ของรายวิชาดังกล่าวได้โดยตรง
                </p>
              </div>
            )}

            {/* Success uploaded files list */}
            {uploadSuccessResult.driveSuccessCount > 0 && (
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2 text-xs">
                <div className="font-bold text-slate-800 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>รายการไฟล์ที่อัปโหลดเข้า Drive สำเร็จ:</span>
                </div>
                <div className="max-h-40 overflow-y-auto divide-y divide-slate-200">
                  {uploadSuccessResult.successList.map((s, i) => (
                    <div key={i} className="py-1.5 flex items-center justify-between gap-2 text-[11px]">
                      <span className="font-medium text-slate-800 truncate" title={s.fileName}>
                        📁 {s.folderName} &gt; {s.fileName}
                      </span>
                      {s.fileUrl && (
                        <a
                          href={s.fileUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="text-[#9D174D] hover:underline font-semibold shrink-0 flex items-center gap-1"
                        >
                          <span>เปิดดูไฟล์</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* 4. Empty State / Drag & Drop Dropzone */}
        {scannedFiles.length === 0 ? (
          <div className="p-8 sm:p-14 text-center">
            <div
              onClick={() => folderInputRef.current?.click()}
              className="border-2 border-dashed border-slate-300 hover:border-[#9D174D] rounded-3xl p-8 sm:p-12 transition bg-slate-50/50 hover:bg-[#FFF0F5]/20 cursor-pointer max-w-2xl mx-auto space-y-4"
            >
              <div className="w-16 h-16 rounded-3xl bg-[#FFF0F5] text-[#9D174D] flex items-center justify-center mx-auto shadow-xs border border-[#F8D7E3]">
                <FolderUp className="w-8 h-8" />
              </div>
              <div className="space-y-1.5">
                <h3 className="font-bold text-base sm:text-lg text-slate-800">
                  คลิกเพื่อเลือกโฟลเดอร์ข้อสอบจากเครื่องคอมพิวเตอร์
                </h3>
                <p className="text-xs sm:text-sm text-slate-500 max-w-md mx-auto">
                  ระบบจะสแกนไฟล์ PDF หรือ Word ทั้งหมดในโฟลเดอร์ พร้อมถอดรหัสจับคู่กับรายวิชาให้โดยอัตโนมัติ
                </p>
              </div>

              {/* Information pill */}
              <div className="inline-flex flex-wrap items-center justify-center gap-2 p-3 bg-white rounded-2xl border border-slate-200/80 text-xs text-slate-600">
                <span className="flex items-center gap-1 font-semibold text-[#701A4B]">
                  <GraduationCap className="w-4 h-4 text-[#9D174D]" />
                  <span>ตรวจชั้นปี: ปี 1-4</span>
                </span>
                <span>·</span>
                <span className="flex items-center gap-1 font-semibold text-amber-800">
                  <Users className="w-4 h-4 text-amber-600" />
                  <span>ตรวจกลุ่ม: บรรพชิต / โยม (คฤหัสถ์)</span>
                </span>
                <span>·</span>
                <span className="flex items-center gap-1 font-semibold text-blue-800">
                  <BookOpen className="w-4 h-4 text-blue-600" />
                  <span>ตรวจรหัสวิชา: 6 หลัก</span>
                </span>
              </div>
            </div>
          </div>
        ) : (
          /* 5. Scanned Results Table & Matching Toolbar */
          <div className="p-6 sm:p-8 space-y-6">
            {/* Metrics & Filter Bar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="px-3.5 py-1.5 rounded-xl bg-slate-100 text-slate-700 text-xs font-bold">
                  พบทั้งหมด: <span className="text-[#9D174D] font-extrabold">{scannedFiles.length}</span> ไฟล์
                </div>
                <div className="px-3.5 py-1.5 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-bold">
                  จับคู่ได้แล้ว: <span className="text-emerald-700 font-extrabold">{matchedCount}</span> วิชา
                </div>
                {unmatchedCount > 0 && (
                  <div className="px-3.5 py-1.5 rounded-xl bg-amber-50 text-amber-800 border border-amber-200 text-xs font-bold">
                    ยังไม่จับคู่: <span className="text-amber-700 font-extrabold">{unmatchedCount}</span> วิชา
                  </div>
                )}
              </div>

              {/* Filter pills */}
              <div className="flex items-center gap-2">
                <div className="relative">
                  <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    placeholder="ค้นหาชื่อไฟล์..."
                    className="pl-8 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#9D174D]"
                  />
                </div>
                <div className="flex items-center bg-slate-100 p-1 rounded-xl text-xs">
                  <button
                    onClick={() => setFilterConfidence('all')}
                    className={`px-2.5 py-1 rounded-lg font-semibold transition ${
                      filterConfidence === 'all' ? 'bg-white text-[#9D174D] shadow-2xs' : 'text-slate-600'
                    }`}
                  >
                    ทั้งหมด
                  </button>
                  <button
                    onClick={() => setFilterConfidence('exact')}
                    className={`px-2.5 py-1 rounded-lg font-semibold transition ${
                      filterConfidence === 'exact' ? 'bg-white text-emerald-800 shadow-2xs' : 'text-slate-600'
                    }`}
                  >
                    แม่นยำ 100%
                  </button>
                  <button
                    onClick={() => setFilterConfidence('unmatched')}
                    className={`px-2.5 py-1 rounded-lg font-semibold transition ${
                      filterConfidence === 'unmatched' ? 'bg-white text-amber-800 shadow-2xs' : 'text-slate-600'
                    }`}
                  >
                    ยังไม่จับคู่
                  </button>
                </div>
              </div>
            </div>

            {/* Matching Table */}
            <div className="overflow-x-auto rounded-2xl border border-slate-200">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                    <th className="py-3 px-4 w-10 text-center">#</th>
                    <th className="py-3 px-4 min-w-[220px]">ชื่อไฟล์ต้นฉบับ</th>
                    <th className="py-3 px-4 w-44">ข้อมูลที่อ่านพบจากไฟล์</th>
                    <th className="py-3 px-4 min-w-[280px]">รายวิชาที่จับคู่กับระบบ</th>
                    <th className="py-3 px-4 w-28 text-center">ความมั่นใจ</th>
                    <th className="py-3 px-4 w-16 text-center">ลบ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {displayFiles.map((item, index) => {
                    return (
                      <tr key={item.id} className="hover:bg-slate-50/80 transition">
                        <td className="py-3 px-4 text-center font-mono text-slate-400">
                          {index + 1}
                        </td>
                        <td className="py-3 px-4">
                          <div className="font-bold text-slate-800 truncate max-w-xs" title={item.originalName}>
                            📄 {item.originalName}
                          </div>
                          {item.relativePath && item.relativePath !== item.originalName && (
                            <div className="text-[10px] text-slate-400 truncate max-w-xs font-mono" title={item.relativePath}>
                              📁 {item.relativePath}
                            </div>
                          )}
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex flex-wrap gap-1">
                            {item.detectedYearLevel ? (
                              <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-pink-100 text-[#9D174D]">
                                ปี {item.detectedYearLevel}
                              </span>
                            ) : (
                              <span className="px-1.5 py-0.5 rounded text-[10px] bg-slate-100 text-slate-400">
                                ไม่ระบุปี
                              </span>
                            )}
                            {item.detectedStatus ? (
                              <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                                item.detectedStatus === 'บรรพชิต' 
                                  ? 'bg-amber-100 text-amber-900 border border-amber-300' 
                                  : 'bg-blue-100 text-blue-900 border border-blue-300'
                              }`}>
                                {item.detectedStatus === 'คฤหัสถ์' ? 'โยม (คฤหัสถ์)' : 'บรรพชิต'}
                              </span>
                            ) : (
                              <span className="px-1.5 py-0.5 rounded text-[10px] bg-slate-100 text-slate-400">
                                ไม่ระบุกลุ่ม
                              </span>
                            )}
                            {item.detectedCourseCode && (
                              <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-slate-200 text-slate-700">
                                {item.detectedCourseCode}
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <select
                            value={item.matchedExamId || ''}
                            onChange={(e) => handleManualExamChange(item.id, e.target.value)}
                            className={`w-full px-2.5 py-2 rounded-xl text-xs border transition cursor-pointer ${
                              item.matchedExamId
                                ? 'bg-white border-emerald-300 text-slate-800 font-medium'
                                : 'bg-amber-50/70 border-amber-300 text-amber-900 font-bold'
                            }`}
                          >
                            <option value="">-- กรุณาเลือกรายวิชาที่ตรงกัน --</option>
                            {selectableExams.map(ex => (
                              <option key={ex.id} value={ex.id}>
                                [{ex.courseCode}] {ex.courseName} ({ex.status} ปี {ex.yearLevel}) - {ex.lecturer}
                              </option>
                            ))}
                          </select>
                        </td>
                        <td className="py-3 px-4 text-center">
                          {item.matchConfidence === 'exact' ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                              <span>ตรง 100%</span>
                            </span>
                          ) : item.matchConfidence === 'high' ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800">
                              <Sparkles className="w-3 h-3 text-blue-600" />
                              <span>แนะนำ</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-500">
                              <span>ยังไม่จับคู่</span>
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <button
                            type="button"
                            onClick={() => handleRemoveItem(item.id)}
                            className="p-1 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer"
                            title="ลบไฟล์นี้ออกจากรายการ"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Bottom Actions Bar */}
            <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4">
              <button
                type="button"
                onClick={onBack}
                className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs sm:text-sm transition cursor-pointer"
              >
                ย้อนกลับ
              </button>

              <div className="flex flex-col sm:flex-row items-center gap-2 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={() => folderInputRef.current?.click()}
                  className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs sm:text-sm font-semibold transition cursor-pointer"
                >
                  <span>+ เพิ่มโฟลเดอร์อื่นอีก</span>
                </button>

                <button
                  type="button"
                  onClick={handleConfirmSubmit}
                  disabled={isProcessing || matchedCount === 0}
                  className={`w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 text-white font-bold text-xs sm:text-sm shadow-md transition cursor-pointer ${
                    isProcessing || matchedCount === 0 ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>
                    {isProcessing ? `กำลังอัปโหลด (${currentUploadIndex}/${matchedCount})...` : `ยืนยันการนำเข้าข้อสอบ (${matchedCount} วิชา)`}
                  </span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
