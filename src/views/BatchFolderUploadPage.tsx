import React, { useState, useRef, useMemo } from 'react';
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
  UploadCloud,
  Send,
  ExternalLink,
  BookOpen,
  GraduationCap,
  Users,
  ShieldCheck,
  Zap,
  Info
} from 'lucide-react';
import { ExamItem, TeacherUser } from '../types/exam';
import { matchFileToExam, ScannedExamFile } from '../utils/folderExamMatcher';
import { isLecturerMatch } from '../utils/teacherMatching';

export interface BatchFolderUploadPageProps {
  exams: ExamItem[];
  currentUser: TeacherUser | null;
  centralDriveFolderUrl: string;
  webhookUrl?: string;
  onBack: () => void;
  onBatchUploadSuccess: (
    updates: { examId: string; fileUrl?: string; uploadedDate: string; fileName: string }[]
  ) => void;
}

export const BatchFolderUploadPage: React.FC<BatchFolderUploadPageProps> = ({
  exams,
  currentUser,
  centralDriveFolderUrl,
  webhookUrl,
  onBack,
  onBatchUploadSuccess
}) => {
  const [scannedFiles, setScannedFiles] = useState<ScannedExamFile[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterConfidence, setFilterConfidence] = useState<'all' | 'exact' | 'unmatched'>('all');
  const [uploadSuccessResult, setUploadSuccessResult] = useState<{
    count: number;
    timestamp: string;
  } | null>(null);

  const folderInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isAdmin = currentUser?.role === 'admin';

  // Available candidate exams for the logged in user
  const selectableExams = useMemo(() => {
    if (isAdmin || !currentUser) {
      return exams;
    }
    // Teacher sees their own courses first, then others
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
      alert('กรุณาเลือกไฟล์และจับคู่รายวิชาอย่างน้อย 1 วิชา ก่อนกดยืนยัน');
      return;
    }

    setIsProcessing(true);

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

    // Optional: send to Google Apps Script webhook if available
    for (const match of validMatches) {
      const exam = exams.find(e => e.id === match.matchedExamId);
      if (!exam) continue;

      const teacherName = (currentUser?.name || exam.lecturer || 'อาจารย์ผู้สอน').trim();
      const ext = match.file.name.includes('.') ? match.file.name.substring(match.file.name.lastIndexOf('.')) : '.pdf';
      const stdName = `[ปี ${exam.yearLevel}][${exam.status}][${exam.major || exam.faculty}][${exam.courseCode}] ${exam.courseName} - ${teacherName}${ext}`;

      let remoteFileUrl: string | undefined = undefined;

      if (webhookUrl) {
        try {
          const base64Content = await fileToBase64(match.file);
          const payload = {
            action: 'uploadExamFile',
            courseCode: exam.courseCode,
            courseName: exam.courseName,
            yearLevel: exam.yearLevel,
            status: exam.status,
            faculty: exam.faculty,
            major: exam.major || '',
            lecturer: teacherName,
            examDateThai: exam.examDateThai,
            examTimeThai: exam.examTimeThai,
            fileName: stdName,
            mimeType: match.file.type || 'application/pdf',
            fileContent: base64Content
          };

          const resp = await fetch(webhookUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'text/plain;charset=utf-8' },
            body: JSON.stringify(payload)
          });
          const res = await resp.json();
          if (res.success && res.fileUrl) {
            remoteFileUrl = res.fileUrl;
          }
        } catch {
          // ignore webhook failure and continue recording locally
        }
      }

      updates.push({
        examId: exam.id,
        fileUrl: remoteFileUrl || exam.examLink || centralDriveFolderUrl,
        uploadedDate: uploadDateStr,
        fileName: stdName
      });
    }

    onBatchUploadSuccess(updates);

    setIsProcessing(false);
    setUploadSuccessResult({
      count: updates.length,
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

      {/* 2. Banner Header */}
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
              {/* Hidden directory input */}
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
              {/* Hidden individual files input */}
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

        {/* Success Alert */}
        {uploadSuccessResult && (
          <div className="m-6 p-5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 flex flex-col sm:flex-row sm:items-center justify-between gap-4 animate-in fade-in">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700 shrink-0">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div>
                <h4 className="font-bold text-sm sm:text-base text-emerald-950">
                  บันทึกการส่งข้อสอบสำเร็จเรียบร้อยแล้ว {uploadSuccessResult.count} รายวิชา!
                </h4>
                <p className="text-xs text-emerald-800">
                  ระบบได้ปรับสถานะเป็น [พร้อมสอบแล้ว ✔] ณ วันที่ {uploadSuccessResult.timestamp}
                </p>
              </div>
            </div>
            <button
              onClick={onBack}
              className="px-4 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs shadow-xs transition"
            >
              กลับไปดูตารางสอบ
            </button>
          </div>
        )}

        {/* 3. Empty State / Drag & Drop Dropzone */}
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
          /* 4. Scanned Results Table & Matching Toolbar */
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
                    const matchedExam = exams.find(e => e.id === item.matchedExamId);

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
                    {isProcessing ? 'กำลังประมวลผล...' : `ยืนยันการนำเข้าข้อสอบ (${matchedCount} วิชา)`}
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
