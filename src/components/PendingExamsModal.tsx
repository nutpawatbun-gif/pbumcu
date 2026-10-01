import React, { useState, useMemo } from 'react';
import {
  X,
  Clock,
  CheckCircle2,
  AlertCircle,
  Search,
  Filter,
  Copy,
  Check,
  Printer,
  ExternalLink,
  BookOpen,
  GraduationCap,
  Users,
  Building2,
  Calendar,
  Layers,
  FileText,
  Eye
} from 'lucide-react';
import { ExamItem } from '../types/exam';

export interface PendingExamsModalProps {
  isOpen: boolean;
  onClose: () => void;
  exams: ExamItem[];
  initialMode?: 'pending' | 'submitted' | 'all';
  onNavigateToSchedule?: (
    facultyFilter?: string,
    yearFilter?: number | 'all',
    dateFilter?: string,
    searchFilter?: string
  ) => void;
  onViewExamDetails?: (exam: ExamItem) => void;
}

export const PendingExamsModal: React.FC<PendingExamsModalProps> = ({
  isOpen,
  onClose,
  exams,
  initialMode = 'pending',
  onNavigateToSchedule,
  onViewExamDetails
}) => {
  const [submissionTab, setSubmissionTab] = useState<'pending' | 'submitted' | 'all'>(initialMode);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'บรรพชิต' | 'คฤหัสถ์'>('all');
  const [yearFilter, setYearFilter] = useState<number | 'all'>('all');
  const [facultyFilter, setFacultyFilter] = useState<string>('all');
  const [copied, setCopied] = useState(false);

  // Sync tab with initialMode whenever modal opens or initialMode changes
  React.useEffect(() => {
    if (isOpen) {
      setSubmissionTab(initialMode);
      setSearchQuery('');
      setStatusFilter('all');
      setYearFilter('all');
      setFacultyFilter('all');
      setCopied(false);
    }
  }, [isOpen, initialMode]);

  // Distinct faculties for filter dropdown
  const faculties = useMemo(() => {
    const list = Array.from(new Set(exams.map(e => e.faculty).filter(Boolean)));
    return list.sort();
  }, [exams]);

  // Overall counts
  const totalCount = exams.length;
  const submittedCount = exams.filter(e => e.examSubmissionStatus === 'submitted').length;
  const pendingCount = totalCount - submittedCount;

  // Filtered exams according to current filters
  const filteredList = useMemo(() => {
    return exams.filter(exam => {
      // 1. Submission status tab
      const isSubmitted = exam.examSubmissionStatus === 'submitted';
      if (submissionTab === 'pending' && isSubmitted) return false;
      if (submissionTab === 'submitted' && !isSubmitted) return false;

      // 2. Student status filter (บรรพชิต / คฤหัสถ์)
      if (statusFilter !== 'all' && exam.status !== statusFilter) {
        return false;
      }

      // 3. Year filter (1-4)
      if (yearFilter !== 'all' && exam.yearLevel !== yearFilter) {
        return false;
      }

      // 4. Faculty filter
      if (facultyFilter !== 'all' && exam.faculty !== facultyFilter) {
        return false;
      }

      // 5. Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchCode = exam.courseCode.toLowerCase().includes(q);
        const matchName = exam.courseName.toLowerCase().includes(q);
        const matchLecturer = exam.lecturer.toLowerCase().includes(q);
        const matchFaculty = (exam.faculty || '').toLowerCase().includes(q);
        const matchMajor = (exam.major || '').toLowerCase().includes(q);
        const matchDate = (exam.examDateThai || '').toLowerCase().includes(q);
        const matchNotes = (exam.notes || '').toLowerCase().includes(q);
        return matchCode || matchName || matchLecturer || matchFaculty || matchMajor || matchDate || matchNotes;
      }

      return true;
    }).sort((a, b) => {
      // Sort by Year Level, then Student Status, then Course Code
      if (a.yearLevel !== b.yearLevel) return a.yearLevel - b.yearLevel;
      if (a.status !== b.status) return a.status.localeCompare(b.status);
      return a.courseCode.localeCompare(b.courseCode);
    });
  }, [exams, submissionTab, statusFilter, yearFilter, facultyFilter, searchQuery]);

  // Subgroup statistics of the currently active view tab
  const activeTabExams = useMemo(() => {
    return exams.filter(exam => {
      const isSubmitted = exam.examSubmissionStatus === 'submitted';
      if (submissionTab === 'pending') return !isSubmitted;
      if (submissionTab === 'submitted') return isSubmitted;
      return true;
    });
  }, [exams, submissionTab]);

  const monkCount = activeTabExams.filter(e => e.status === 'บรรพชิต').length;
  const layCount = activeTabExams.filter(e => e.status === 'คฤหัสถ์').length;

  // Copy list to clipboard
  const handleCopyList = () => {
    if (filteredList.length === 0) return;

    const title = submissionTab === 'pending'
      ? '📋 รายชื่อวิชาที่ยังไม่ได้ส่งข้อสอบ ภาคการศึกษา 1/2569'
      : submissionTab === 'submitted'
      ? '✅ รายชื่อวิชาที่ส่งข้อสอบแล้ว (พร้อมสอบ) ภาคการศึกษา 1/2569'
      : '📚 รายชื่อวิชาทั้งหมด ภาคการศึกษา 1/2569';

    const lines = filteredList.map((e, idx) => {
      const group = `[ชั้นปีที่ ${e.yearLevel} | ${e.status}]`;
      const timeInfo = `สอบ: ${e.examDateThai} (${e.examTimeThai})`;
      return `${idx + 1}. ${group} ${e.courseCode} ${e.courseName}\n   อาจารย์ผู้บรรยาย: ${e.lecturer} | ${e.faculty || ''}\n   ${timeInfo}`;
    });

    const fullText = `${title}\nรวมทั้งหมด ${filteredList.length} วิชา\n----------------------------------------\n${lines.join('\n\n')}\n----------------------------------------\nข้อมูล ณ วันที่: ${new Date().toLocaleDateString('th-TH')}`;

    navigator.clipboard.writeText(fullText).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    });
  };

  // Direct print view
  const handlePrint = () => {
    window.print();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-3xl border border-[#F8D7E3] shadow-2xl max-w-5xl w-full overflow-hidden flex flex-col max-h-[92vh] animate-in fade-in zoom-in-95 duration-200">
        
        {/* 1. Modal Header */}
        <div className="bg-gradient-to-r from-[#FFF0F5] via-[#FFF5F8] to-[#FFF0F5] px-5 sm:px-6 py-4 border-b border-[#F8D7E3] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shadow-xs transition-colors ${
              submissionTab === 'pending' 
                ? 'bg-amber-500 text-white' 
                : submissionTab === 'submitted' 
                ? 'bg-emerald-600 text-white' 
                : 'bg-[#9D174D] text-white'
            }`}>
              {submissionTab === 'pending' ? (
                <Clock className="w-5 h-5" />
              ) : submissionTab === 'submitted' ? (
                <CheckCircle2 className="w-5 h-5" />
              ) : (
                <BookOpen className="w-5 h-5" />
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold text-[#701A4B]">
                  {submissionTab === 'pending' && 'รายวิชาที่ยังไม่ได้ส่งข้อสอบ (รอข้อสอบ)'}
                  {submissionTab === 'submitted' && 'รายวิชาที่ส่งข้อสอบแล้ว (พร้อมสอบ)'}
                  {submissionTab === 'all' && 'รายวิชาทั้งหมดในตารางสอบ'}
                </h2>
                <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold shadow-2xs ${
                  submissionTab === 'pending' 
                    ? 'bg-amber-100 text-amber-900 border border-amber-300' 
                    : submissionTab === 'submitted'
                    ? 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                    : 'bg-[#701A4B] text-white'
                }`}>
                  {filteredList.length} วิชา
                </span>
              </div>
              <p className="text-xs text-[#854D67]">
                {submissionTab === 'pending' && 'ตรวจสอบและติดตามรายวิชาที่อาจารย์ยังไม่ได้อัปโหลดหรือส่งไฟล์ข้อสอบเข้าสู่ระบบ'}
                {submissionTab === 'submitted' && 'รายวิชาที่ได้รับไฟล์ข้อสอบและตรวจสอบความพร้อมเรียบร้อยแล้ว'}
                {submissionTab === 'all' && 'ภาพรวมสถานะการส่งข้อสอบของทุกรายวิชา'}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-[#854D67] hover:text-[#701A4B] hover:bg-[#FCE7F3] rounded-xl transition cursor-pointer"
            title="ปิดหน้าต่าง"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 2. Top Tabs: รอข้อสอบ vs ส่งแล้ว vs ทั้งหมด */}
        <div className="bg-[#FFF8FA] px-5 sm:px-6 pt-3 pb-2 border-b border-[#F8D7E3] flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-1.5 p-1 bg-white rounded-2xl border border-[#F8D7E3] shadow-2xs">
            <button
              onClick={() => setSubmissionTab('pending')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                submissionTab === 'pending'
                  ? 'bg-amber-500 text-white shadow-xs'
                  : 'text-[#854D67] hover:bg-amber-50 hover:text-amber-800'
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
              <span>รอข้อสอบ</span>
              <span className={`ml-1 px-1.5 py-0.2 rounded-full text-[10px] font-extrabold ${
                submissionTab === 'pending' ? 'bg-amber-600 text-white' : 'bg-amber-100 text-amber-800'
              }`}>
                {pendingCount}
              </span>
            </button>

            <button
              onClick={() => setSubmissionTab('submitted')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                submissionTab === 'submitted'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-[#854D67] hover:bg-emerald-50 hover:text-emerald-800'
              }`}
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>ส่งแล้ว (พร้อมสอบ)</span>
              <span className={`ml-1 px-1.5 py-0.2 rounded-full text-[10px] font-extrabold ${
                submissionTab === 'submitted' ? 'bg-emerald-700 text-white' : 'bg-emerald-100 text-emerald-800'
              }`}>
                {submittedCount}
              </span>
            </button>

            <button
              onClick={() => setSubmissionTab('all')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                submissionTab === 'all'
                  ? 'bg-[#9D174D] text-white shadow-xs'
                  : 'text-[#854D67] hover:bg-[#FFF0F5] hover:text-[#701A4B]'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>ทุกรายวิชา</span>
              <span className={`ml-1 px-1.5 py-0.2 rounded-full text-[10px] font-extrabold ${
                submissionTab === 'all' ? 'bg-[#701A4B] text-white' : 'bg-[#F8D7E3] text-[#701A4B]'
              }`}>
                {totalCount}
              </span>
            </button>
          </div>

          {/* Action buttons (Copy list & Print) */}
          <div className="flex items-center gap-2">
            <button
              onClick={handleCopyList}
              disabled={filteredList.length === 0}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white hover:bg-[#FFF0F5] border border-[#F8D7E3] text-xs font-semibold text-[#701A4B] shadow-2xs transition cursor-pointer disabled:opacity-50"
              title="คัดลอกรายชื่อวิชาไปส่งแจ้งเตือนในไลน์หรือเอกสาร"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  <span className="text-emerald-700 font-bold">คัดลอกแล้ว!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 text-[#9D174D]" />
                  <span>คัดลอกรายชื่อ</span>
                </>
              )}
            </button>

            <button
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white hover:bg-[#FFF0F5] border border-[#F8D7E3] text-xs font-semibold text-[#701A4B] shadow-2xs transition cursor-pointer"
              title="พิมพ์เอกสารรายชื่อ"
            >
              <Printer className="w-3.5 h-3.5 text-[#9D174D]" />
              <span className="hidden sm:inline">พิมพ์รายชื่อ</span>
            </button>
          </div>
        </div>

        {/* 3. Filter & Search Controls */}
        <div className="p-4 sm:px-6 sm:py-3 bg-white border-b border-[#F8D7E3]/60 space-y-3">
          {/* Search bar & Faculty Dropdown */}
          <div className="flex flex-col sm:flex-row gap-2.5">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-[#854D67] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="ค้นหารหัสวิชา, ชื่อวิชา, หรืออาจารย์ผู้บรรยาย..."
                className="w-full pl-9 pr-8 py-2 rounded-xl border border-[#F8D7E3] text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-[#9D174D]/30 focus:border-[#9D174D] bg-[#FFFDFE]"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Faculty Dropdown */}
            <div className="sm:w-56">
              <select
                value={facultyFilter}
                onChange={e => setFacultyFilter(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-[#F8D7E3] text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-[#9D174D]/30 focus:border-[#9D174D] bg-[#FFFDFE] text-[#701A4B]"
              >
                <option value="all">ทุกคณะ ({activeTabExams.length})</option>
                {faculties.map(f => {
                  const c = activeTabExams.filter(e => e.faculty === f).length;
                  return (
                    <option key={f} value={f}>
                      {f} ({c})
                    </option>
                  );
                })}
              </select>
            </div>
          </div>

          {/* Quick Filter Pills: บรรพชิต / คฤหัสถ์ and ชั้นปี 1-4 */}
          <div className="flex flex-wrap items-center justify-between gap-2 pt-1 text-xs">
            {/* Student Group Filter */}
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-semibold text-[#854D67]">กลุ่มผู้เรียน:</span>
              <button
                onClick={() => setStatusFilter('all')}
                className={`px-2.5 py-1 rounded-lg font-medium transition cursor-pointer ${
                  statusFilter === 'all'
                    ? 'bg-[#701A4B] text-white shadow-2xs font-bold'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                ทั้งหมด ({activeTabExams.length})
              </button>
              <button
                onClick={() => setStatusFilter('บรรพชิต')}
                className={`px-2.5 py-1 rounded-lg font-medium transition cursor-pointer ${
                  statusFilter === 'บรรพชิต'
                    ? 'bg-purple-700 text-white shadow-2xs font-bold'
                    : 'bg-purple-50 text-purple-800 border border-purple-200 hover:bg-purple-100'
                }`}
              >
                บรรพชิต ({monkCount})
              </button>
              <button
                onClick={() => setStatusFilter('คฤหัสถ์')}
                className={`px-2.5 py-1 rounded-lg font-medium transition cursor-pointer ${
                  statusFilter === 'คฤหัสถ์'
                    ? 'bg-amber-700 text-white shadow-2xs font-bold'
                    : 'bg-amber-50 text-amber-800 border border-amber-200 hover:bg-amber-100'
                }`}
              >
                คฤหัสถ์ ({layCount})
              </button>
            </div>

            {/* Year Level Filter */}
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-semibold text-[#854D67]">ชั้นปี:</span>
              <button
                onClick={() => setYearFilter('all')}
                className={`px-2 py-0.5 rounded-md font-medium transition cursor-pointer ${
                  yearFilter === 'all' ? 'bg-[#9D174D] text-white font-bold' : 'text-[#854D67] hover:bg-[#FFF0F5]'
                }`}
              >
                ทุกปี
              </button>
              {[1, 2, 3, 4].map(y => (
                <button
                  key={y}
                  onClick={() => setYearFilter(y)}
                  className={`px-2 py-0.5 rounded-md font-medium transition cursor-pointer ${
                    yearFilter === y ? 'bg-[#9D174D] text-white font-bold' : 'text-[#854D67] hover:bg-[#FFF0F5]'
                  }`}
                >
                  ปี {y}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* 4. List Content (Scrollable) */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-3 bg-[#FFFDFE]">
          {filteredList.length === 0 ? (
            <div className="text-center py-12 px-4">
              <div className="w-14 h-14 rounded-3xl bg-[#FFF0F5] border border-[#F8D7E3] text-[#9D174D] flex items-center justify-center mx-auto mb-3">
                {submissionTab === 'pending' ? (
                  <CheckCircle2 className="w-8 h-8 text-emerald-600" />
                ) : (
                  <Search className="w-8 h-8 text-[#854D67]" />
                )}
              </div>
              <h3 className="text-base font-bold text-[#701A4B]">
                {submissionTab === 'pending' && searchQuery === '' && statusFilter === 'all' && yearFilter === 'all' && facultyFilter === 'all'
                  ? 'ยินดีด้วย! ไม่มีรายวิชาที่รอส่งข้อสอบแล้ว'
                  : 'ไม่พบรายวิชาตามเงื่อนไขการค้นหา'}
              </h3>
              <p className="text-xs text-[#854D67] max-w-sm mx-auto mt-1">
                {submissionTab === 'pending' && searchQuery === '' && statusFilter === 'all' && yearFilter === 'all' && facultyFilter === 'all'
                  ? 'ทุกรายวิชาในระบบได้รับการอัปโหลดข้อสอบและพร้อมสอบครบถ้วน 100%'
                  : 'ลองเปลี่ยนคำค้นหา ปรับเงื่อนไขชั้นปี หรือล้างตัวกรองเพื่อดูรายการทั้งหมด'}
              </p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {filteredList.map((exam, index) => {
                const isSubmitted = exam.examSubmissionStatus === 'submitted';
                const isMonk = exam.status === 'บรรพชิต';

                return (
                  <div
                    key={exam.id}
                    className="p-3.5 sm:p-4 rounded-2xl bg-white border border-[#F8D7E3] hover:border-[#9D174D]/50 hover:shadow-xs transition flex flex-col md:flex-row md:items-center justify-between gap-3 group"
                  >
                    {/* Left: Code, Name, Badges, Lecturer */}
                    <div className="space-y-1.5 flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        {/* Index */}
                        <span className="text-xs font-bold text-slate-400 w-5">
                          {index + 1}.
                        </span>

                        {/* Year Badge */}
                        <span className="px-2 py-0.5 rounded-lg text-xs font-bold bg-[#FFF0F5] text-[#9D174D] border border-[#F8D7E3]">
                          ปี {exam.yearLevel}
                        </span>

                        {/* Monk vs Layperson Badge */}
                        <span className={`px-2 py-0.5 rounded-lg text-xs font-bold border ${
                          isMonk
                            ? 'bg-purple-50 text-purple-800 border-purple-200'
                            : 'bg-amber-50 text-amber-800 border-amber-200'
                        }`}>
                          {exam.status}
                        </span>

                        {/* Course Code */}
                        <span className="font-mono font-bold text-xs sm:text-sm text-[#701A4B]">
                          {exam.courseCode}
                        </span>

                        {/* Submission status pill */}
                        {isSubmitted ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200 ml-auto md:ml-0">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            <span>พร้อมสอบ (ส่งแล้ว)</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-900 border border-amber-300 ml-auto md:ml-0">
                            <Clock className="w-3 h-3 text-amber-600" />
                            <span>รอส่งข้อสอบ</span>
                          </span>
                        )}
                      </div>

                      {/* Course Name */}
                      <div 
                        onClick={() => {
                          if (onViewExamDetails) {
                            onClose();
                            onViewExamDetails(exam);
                          }
                        }}
                        className={`font-bold text-sm sm:text-base text-slate-900 ${
                          onViewExamDetails ? 'hover:text-[#9D174D] cursor-pointer' : ''
                        }`}
                        title={onViewExamDetails ? 'คลิกดูรายละเอียดวิชา' : undefined}
                      >
                        {exam.courseName}
                      </div>

                      {/* Metadata: Lecturer, Faculty, Exam Date */}
                      <div className="flex flex-wrap items-center gap-y-1 gap-x-3 text-xs text-[#854D67]">
                        <span className="flex items-center gap-1 text-[#701A4B] font-medium">
                          <Users className="w-3.5 h-3.5 text-[#9D174D]" />
                          <span>อาจารย์: <b>{exam.lecturer}</b></span>
                        </span>

                        {exam.faculty && (
                          <span className="flex items-center gap-1">
                            <Building2 className="w-3.5 h-3.5 text-[#854D67]" />
                            <span>{exam.faculty} ({exam.major || '-'})</span>
                          </span>
                        )}

                        <span className="flex items-center gap-1 text-slate-600">
                          <Calendar className="w-3.5 h-3.5 text-amber-600" />
                          <span>{exam.examDateThai} ({exam.examTimeThai})</span>
                        </span>
                      </div>
                    </div>

                    {/* Right Action: Navigate to schedule & View details */}
                    <div className="flex items-center justify-end gap-2 pt-2 md:pt-0 border-t md:border-t-0 border-slate-100">
                      {onViewExamDetails && (
                        <button
                          onClick={() => {
                            onClose();
                            onViewExamDetails(exam);
                          }}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white hover:bg-[#FFF0F5] text-[#701A4B] border border-[#F8D7E3] text-xs font-bold transition shadow-2xs cursor-pointer hover:border-[#9D174D]"
                          title="ดูรายละเอียดวิชาและข้อมูลข้อสอบ"
                        >
                          <Eye className="w-3.5 h-3.5 text-[#9D174D]" />
                          <span>รายละเอียด</span>
                        </button>
                      )}

                      {onNavigateToSchedule && (
                        <button
                          onClick={() => {
                            onClose();
                            onNavigateToSchedule(
                              exam.faculty,
                              exam.yearLevel,
                              undefined,
                              exam.courseCode
                            );
                          }}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#FFF0F5] hover:bg-[#9D174D] text-[#701A4B] hover:text-white border border-[#F8D7E3] hover:border-[#9D174D] text-xs font-bold transition shadow-2xs cursor-pointer group-hover:scale-[1.02]"
                          title="เปิดดูรายวิชานี้ในตารางสอบรวม"
                        >
                          <span>เปิดในตารางสอบ</span>
                          <ExternalLink className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* 5. Modal Footer */}
        <div className="bg-[#FFF0F5] px-5 sm:px-6 py-3 border-t border-[#F8D7E3] flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 text-[#854D67]">
            <span className="font-semibold">สถานะภาพรวม:</span>
            <span className="text-amber-800 font-bold">รอข้อสอบ {pendingCount} วิชา</span>
            <span>·</span>
            <span className="text-emerald-800 font-bold">พร้อมสอบ {submittedCount} วิชา</span>
            <span>·</span>
            <span>รวม {totalCount} วิชา</span>
          </div>

          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-white hover:bg-slate-50 border border-[#F8D7E3] text-[#701A4B] font-bold text-xs transition shadow-2xs cursor-pointer text-center"
          >
            ปิดหน้าต่าง
          </button>
        </div>

      </div>
    </div>
  );
};
