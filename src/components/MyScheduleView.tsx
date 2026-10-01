import React, { useState } from 'react';
import { 
  Star, 
  CalendarPlus, 
  Printer, 
  Trash2, 
  ExternalLink, 
  Share2, 
  Calendar, 
  Clock, 
  MapPin, 
  Smartphone, 
  Table as TableIcon, 
  LayoutGrid, 
  Columns,
  FileSpreadsheet,
  FolderUp,
  CheckCircle2,
  Lock,
  Eye
} from 'lucide-react';
import { ExamItem, TeacherUser } from '../types/exam';
import { getGoogleCalendarUrl, downloadICS } from '../utils/calendar';
import { calculateCountdown } from '../utils/notifications';
import { exportExamsToExcel } from '../utils/excelExport';
import { isLecturerMatch } from '../utils/teacherMatching';
import { ExamUploadDriveModal } from './ExamUploadDriveModal';

interface MyScheduleViewProps {
  exams: ExamItem[];
  savedExamIds: string[];
  onToggleSave: (id: string) => void;
  onClearAllSaved: () => void;
  onBatchSaveByYear: (year: number, status: 'บรรพชิต' | 'คฤหัสถ์') => void;
  onPrint: () => void;
  onOpenAlertForExam: (exam: ExamItem) => void;
  isWidescreen?: boolean;
  currentUser?: TeacherUser | null;
  centralDriveFolderUrl?: string;
  onToggleSubmissionStatus?: (examId: string) => void;
  webhookUrl?: string;
  onUploadExamSuccess?: (examId: string, fileUrl: string, uploadedDate: string) => void;
  onViewExamDetails?: (exam: ExamItem) => void;
}

export const MyScheduleView: React.FC<MyScheduleViewProps> = ({
  exams,
  savedExamIds,
  onToggleSave,
  onClearAllSaved,
  onBatchSaveByYear,
  onPrint,
  onOpenAlertForExam,
  isWidescreen,
  currentUser,
  centralDriveFolderUrl = 'https://drive.google.com/drive/folders/1yc7VLWVCYtH8n1NqWymKmeu1kaNJRDBa?usp=sharing',
  onToggleSubmissionStatus,
  webhookUrl,
  onUploadExamSuccess,
  onViewExamDetails
}) => {
  const [mobileLayoutMode, setMobileLayoutMode] = useState<'adaptive' | 'wide'>('adaptive');
  const [tableLayoutMode, setTableLayoutMode] = useState<'autofit' | 'full'>('autofit');
  const [uploadModalExam, setUploadModalExam] = useState<ExamItem | null>(null);

  const isTeacher = currentUser && currentUser.role !== 'admin';
  const teacherCourses = isTeacher 
    ? exams.filter(e => isLecturerMatch(e.lecturer, currentUser)).sort((a, b) => (a.examDateISO + a.startTime).localeCompare(b.examDateISO + b.startTime))
    : [];

  const [viewMode, setViewMode] = useState<'teaching' | 'saved'>(isTeacher ? 'teaching' : 'saved');

  React.useEffect(() => {
    if (isTeacher) {
      setViewMode('teaching');
    }
  }, [currentUser]);

  const savedExams = exams
    .filter(e => savedExamIds.includes(e.id))
    .sort((a, b) => (a.examDateISO + a.startTime).localeCompare(b.examDateISO + b.startTime));

  const activeExams = (isTeacher && viewMode === 'teaching') ? teacherCourses : savedExams;

  return (
    <div className={`${isWidescreen ? 'max-w-[98%] 2xl:max-w-[1720px]' : 'max-w-7xl'} mx-auto px-2 sm:px-4 md:px-6 py-4 sm:py-6 space-y-4`}>
      {/* Top Banner (University Standard & Soft Pastel Pink) */}
      <div className="no-print bg-white/95 rounded-2xl p-4 sm:p-5 border border-[#F8D7E3] shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Star className="w-5 h-5 text-[#E11D48] fill-[#E11D48]" />
            <h1 className="text-base sm:text-lg font-bold text-[#701A4B]">
              {isTeacher 
                ? `ตารางวิชาข้อสอบของฉัน: ${currentUser?.name}`
                : 'ตารางวิชาสอบของฉัน (My Exam Schedule)'
              }
            </h1>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-[#FFF0F5] text-[#9D174D] font-bold border border-[#F8D7E3]">
              {activeExams.length} วิชา
            </span>
          </div>
          <p className="text-xs sm:text-sm text-[#854D67]">
            วิทยาลัยสงฆ์พ่อขุนผาเมือง เพชรบูรณ์ · {isTeacher 
              ? `รายวิชาที่ท่านเป็นอาจารย์ผู้บรรยาย (${currentUser?.name}) · ตรวจสอบ พิมพ์ใบตาราง หรือส่งออกข้อมูล`
              : 'เฉพาะรายวิชาที่ท่านบันทึกไว้สำหรับเข้าสอบ · สถานที่สอบ: ห้องประชุมชั้น 1 ทุกชั้นเรียน'
            }
          </p>

          {isTeacher && (
            <div className="pt-1 flex items-center gap-1.5 flex-wrap">
              <button
                type="button"
                onClick={() => setViewMode('teaching')}
                className={`px-3 py-1 rounded-xl text-xs font-semibold transition ${
                  viewMode === 'teaching' 
                    ? 'bg-[#9D174D] text-white shadow-2xs font-bold' 
                    : 'bg-[#FFF0F5] text-[#701A4B] hover:bg-[#FCE7F3] border border-[#F8D7E3]'
                }`}
              >
                📋 รายวิชาที่สอนโดยตรง ({teacherCourses.length} วิชา)
              </button>
              <button
                type="button"
                onClick={() => setViewMode('saved')}
                className={`px-3 py-1 rounded-xl text-xs font-semibold transition ${
                  viewMode === 'saved' 
                    ? 'bg-[#9D174D] text-white shadow-2xs font-bold' 
                    : 'bg-[#FFF0F5] text-[#701A4B] hover:bg-[#FCE7F3] border border-[#F8D7E3]'
                }`}
              >
                ⭐ วิชาที่ติดดาวไว้ ({savedExams.length} วิชา)
              </button>
            </div>
          )}
        </div>

        {activeExams.length > 0 && (
          <div className="flex flex-wrap items-center gap-2 no-print">
            {/* Export My Exams to Excel */}
            <button
              onClick={() => {
                const sheetName = isTeacher ? `วิชาสอบ_${currentUser?.name}` : 'วิชาสอบของฉัน';
                const fileName = isTeacher 
                  ? `my-exams-${currentUser?.name?.replace(/\s+/g, '_') || 'teacher'}-2569`
                  : 'my-exam-schedule-2569';
                exportExamsToExcel(activeExams, fileName, sheetName);
              }}
              className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs rounded-xl shadow-2xs transition flex items-center gap-1.5 cursor-pointer"
              title="ส่งออกวิชาสอบของฉันเป็นไฟล์ Microsoft Excel (.xlsx)"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>ส่งออก Excel ({activeExams.length} วิชา)</span>
            </button>

            {/* Desktop Table View Toggle */}
            <div className="hidden md:flex items-center bg-[#FFF0F5] p-1 rounded-xl border border-[#F8D7E3] text-xs">
              <button
                type="button"
                onClick={() => setTableLayoutMode('autofit')}
                title="ขยายพอดีหน้าจออัตโนมัติ ไม่ต้องเลื่อนสกอร์บาร์"
                className={`flex items-center gap-1.5 px-3 py-1 rounded-lg transition ${
                  tableLayoutMode === 'autofit'
                    ? 'bg-white text-[#701A4B] font-bold shadow-2xs'
                    : 'text-[#854D67] hover:text-[#701A4B]'
                }`}
              >
                <LayoutGrid className="w-3.5 h-3.5 text-[#9D174D]" />
                <span>พอดีจออัตโนมัติ</span>
              </button>
              <button
                type="button"
                onClick={() => setTableLayoutMode('full')}
                title="ตารางแยกครบทุกคอลัมน์"
                className={`flex items-center gap-1.5 px-3 py-1 rounded-lg transition ${
                  tableLayoutMode === 'full'
                    ? 'bg-white text-[#701A4B] font-bold shadow-2xs'
                    : 'text-[#854D67] hover:text-[#701A4B]'
                }`}
              >
                <Columns className="w-3.5 h-3.5 text-[#9D174D]" />
                <span>แยกคอลัมน์</span>
              </button>
            </div>

            {/* Mobile View Toggle */}
            <div className="md:hidden flex items-center bg-[#FFF0F5] p-0.5 rounded-lg border border-[#F8D7E3] text-xs">
              <button
                type="button"
                onClick={() => setMobileLayoutMode('adaptive')}
                className={`px-2.5 py-1 rounded-md transition ${
                  mobileLayoutMode === 'adaptive' ? 'bg-white font-bold text-[#701A4B] shadow-2xs' : 'text-[#854D67]'
                }`}
              >
                <span className="flex items-center gap-1">
                  <Smartphone className="w-3.5 h-3.5" />
                  <span>บัตร</span>
                </span>
              </button>
              <button
                type="button"
                onClick={() => setMobileLayoutMode('wide')}
                className={`px-2.5 py-1 rounded-md transition ${
                  mobileLayoutMode === 'wide' ? 'bg-white font-bold text-[#701A4B] shadow-2xs' : 'text-[#854D67]'
                }`}
              >
                <span className="flex items-center gap-1">
                  <TableIcon className="w-3.5 h-3.5" />
                  <span>ตาราง</span>
                </span>
              </button>
            </div>

            <button
              onClick={() => downloadICS(activeExams, 'my-exam-schedule.ics')}
              className="px-3.5 py-2 bg-[#FFF0F5] hover:bg-[#FCE7F3] text-[#701A4B] font-semibold text-xs rounded-xl border border-[#F8D7E3] shadow-2xs transition flex items-center gap-1.5"
            >
              <CalendarPlus className="w-3.5 h-3.5 text-[#9D174D]" />
              <span>โหลดปฏิทิน (.ics)</span>
            </button>

            <button
              onClick={onPrint}
              className="px-3.5 py-2 bg-white hover:bg-[#FFF0F5] text-slate-700 font-semibold text-xs rounded-xl border border-[#F8D7E3] shadow-2xs transition flex items-center gap-1.5"
            >
              <Printer className="w-3.5 h-3.5 text-[#9D174D]" />
              <span>พิมพ์ใบตาราง (A4)</span>
            </button>

            <button
              onClick={onClearAllSaved}
              className="px-3 py-2 text-rose-600 hover:text-rose-800 hover:bg-rose-50 text-xs rounded-xl transition flex items-center gap-1"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>ล้างทั้งหมด</span>
            </button>
          </div>
        )}
      </div>

      {/* Empty State */}
      {activeExams.length === 0 ? (
        <div className="bg-white rounded-2xl p-8 sm:p-12 text-center border border-[#F8D7E3] space-y-4 shadow-xs">
          <div className="w-14 h-14 rounded-2xl bg-[#FFF0F5] text-[#9D174D] flex items-center justify-center mx-auto border border-[#F8D7E3]">
            <Star className="w-7 h-7" />
          </div>
          <div className="space-y-1">
            <h2 className="text-base sm:text-lg font-bold text-slate-900">
              {isTeacher
                ? `ไม่พบรายวิชาที่สอนโดย: ${currentUser?.name || 'ท่าน'}`
                : 'ยังไม่มีรายวิชาใน "วิชาสอบของฉัน"'
              }
            </h2>
            <p className="text-xs sm:text-sm text-[#854D67] max-w-md mx-auto">
              {isTeacher
                ? 'ท่านสามารถสลับไปที่แท็บ "จัดการสอบ (อาจารย์)" เพื่อเพิ่มรายวิชา หรือคลิกเลือก "วิชาที่ติดดาวไว้" ได้ครับ'
                : 'ท่านสามารถกดที่เครื่องหมายรูปดาว ⭐ ในหน้า "ตารางสอบทั้งหมด" เพื่อบันทึกรายวิชาที่ต้องสอบ หรือเลือกบันทึกตามชั้นปีด้านล่างได้ทันที'
              }
            </p>
          </div>

          {/* Quick preset selector by year */}
          {!isTeacher && (
            <div className="pt-2 max-w-lg mx-auto">
              <p className="text-xs font-semibold text-[#701A4B] mb-2">เลือกบันทึกด่วนตามชั้นปี:</p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {[1, 2, 3, 4].map(year => (
                  <button
                    key={year}
                    onClick={() => onBatchSaveByYear(year, 'บรรพชิต')}
                    className="px-3 py-2 bg-[#FFF0F5] hover:bg-[#FCE7F3] text-[#701A4B] font-semibold text-xs rounded-xl border border-[#F8D7E3] transition"
                  >
                    ปี {year} (บรรพชิต)
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      ) : (
        <>
          {/* MOBILE ADAPTIVE VIEW (Card Table) */}
          <div className={`md:hidden space-y-3 no-print ${mobileLayoutMode === 'wide' ? 'hidden' : 'block'}`}>
            {activeExams.map((exam) => {
              const countdown = calculateCountdown(exam);

              return (
                <div
                  key={exam.id}
                  className="bg-white rounded-2xl overflow-hidden border border-[#F8D7E3] shadow-2xs"
                >
                  <div className="bg-[#FCE7F3]/70 px-3.5 py-2.5 border-b border-[#F8D7E3] flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono font-bold text-xs px-2 py-0.5 rounded bg-white text-[#701A4B] border border-[#F8D7E3]">
                        {exam.courseCode}
                      </span>
                      <span className="text-xs font-semibold px-2 py-0.5 rounded bg-[#FFF0F5] text-[#9D174D] border border-[#F8D7E3]">
                        ชั้นปีที่ {exam.yearLevel}
                      </span>
                    </div>

                    <button
                      onClick={() => onToggleSave(exam.id)}
                      className="p-1 text-[#E11D48] hover:bg-white rounded-lg transition"
                      title="นำออกจากวิชาของฉัน"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="p-3.5">
                    <div 
                      onClick={() => onViewExamDetails?.(exam)}
                      className="flex items-center justify-between gap-1 group cursor-pointer"
                    >
                      <h3 className="font-bold text-sm text-slate-900 leading-snug group-hover:text-[#9D174D] transition-colors">
                        {exam.courseName}
                      </h3>
                      <span className="shrink-0 inline-flex items-center gap-1 text-[11px] text-[#9D174D] bg-[#FFF0F5] px-2 py-0.5 rounded-lg border border-[#F8D7E3]">
                        <Eye className="w-3 h-3" />
                        <span>รายละเอียด</span>
                      </span>
                    </div>

                    <div className="mt-2.5 border border-[#FCE7F3] rounded-xl overflow-hidden text-xs divide-y divide-[#FCE7F3]">
                      <div className="grid grid-cols-2 divide-x divide-[#FCE7F3] bg-[#FFF8FA]/60">
                        <div className="p-2 flex items-center gap-1.5 text-slate-800">
                          <Calendar className="w-3.5 h-3.5 text-[#E11D48] shrink-0" />
                          <span className="font-semibold text-[#701A4B] truncate">{exam.examDateThai}</span>
                        </div>
                        <div className="p-2 flex items-center gap-1.5 text-slate-800">
                          <Clock className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                          <span className="font-mono text-slate-800 truncate">{exam.examTimeThai}</span>
                        </div>
                      </div>
                      <div className="p-2 flex items-center gap-1.5 bg-white text-slate-800">
                        <MapPin className="w-3.5 h-3.5 text-[#E11D48] shrink-0" />
                        <span className="font-semibold text-[#701A4B]">สถานที่สอบ:</span>
                        <span className="text-slate-700">ห้องประชุมชั้น 1</span>
                      </div>
                      <div className="p-2 flex items-center gap-1.5 bg-[#FFF8FA]/40 text-slate-800">
                        <span className="text-slate-500">อาจารย์:</span>
                        <span className="font-medium text-slate-800 truncate">{exam.lecturer}</span>
                      </div>
                    </div>

                    <div className="mt-3 pt-2.5 border-t border-[#FCE7F3] flex items-center justify-between gap-2">
                      <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full ${
                        countdown.status === 'ongoing'
                          ? 'bg-emerald-100 text-emerald-800 animate-pulse border border-emerald-300'
                          : 'bg-[#FFF0F5] text-[#9D174D] border border-[#F8D7E3]'
                      }`}>
                        {countdown.label}
                      </span>

                      <div className="flex items-center gap-1">
                        <a
                          href={getGoogleCalendarUrl(exam)}
                          target="_blank"
                          rel="noreferrer"
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition"
                          title="เพิ่มลง Google Calendar"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </a>
                        <button
                          onClick={() => onOpenAlertForExam(exam)}
                          className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg transition"
                          title="ส่งแจ้งเตือน LINE"
                        >
                          <Share2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {/* Google Drive Upload Row for Teachers */}
                    {isTeacher && viewMode === 'teaching' && (
                      <div className="mt-2.5 pt-2 border-t border-[#FCE7F3] flex items-center justify-between gap-2 flex-wrap">
                        {exam.examSubmissionStatus === 'submitted' ? (
                          <span
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-slate-100 text-slate-500 rounded-lg text-xs font-semibold border border-slate-200 cursor-not-allowed select-none"
                            title="ส่งข้อสอบแล้ว (ระบบล็อกห้ามอัปโหลดซ้ำ เพื่อป้องกันความซ้ำซ้อน)"
                          >
                            <Lock className="w-3.5 h-3.5 text-slate-400" />
                            <span>ส่งแล้ว (ห้ามส่งซ้ำ)</span>
                          </span>
                        ) : (
                          <button
                            type="button"
                            onClick={() => setUploadModalExam(exam)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold shadow-2xs transition cursor-pointer"
                          >
                            <FolderUp className="w-3.5 h-3.5" />
                            <span>ส่งข้อสอบ (Drive)</span>
                          </button>
                        )}

                        {exam.examSubmissionStatus === 'submitted' ? (
                          <span
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10.5px] font-bold border bg-emerald-50 text-emerald-900 border-emerald-300"
                            title={exam.examSubmissionDate ? `พร้อมสอบ (ส่งข้อสอบเมื่อ: ${exam.examSubmissionDate})` : 'พร้อมสอบ'}
                          >
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                            <span>พร้อมสอบ ✔ {exam.examSubmissionDate ? `(${exam.examSubmissionDate})` : ''}</span>
                          </span>
                        ) : (
                          <button
                            type="button"
                            onClick={() => onToggleSubmissionStatus && onToggleSubmissionStatus(exam.id)}
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10.5px] font-bold border transition bg-amber-50 text-amber-900 border-amber-300 hover:bg-amber-100 cursor-pointer"
                          >
                            <Clock className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                            <span>รอข้อสอบ</span>
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* MODE 1: AUTO-FIT TABLE (NO SCROLLBAR) */}
          {tableLayoutMode === 'autofit' && (
            <div className={`bg-white rounded-2xl border border-[#F8D7E3] shadow-xs overflow-hidden no-print ${
              mobileLayoutMode === 'adaptive' ? 'hidden md:block' : 'block'
            }`}>
              <div className="px-3.5 py-2 bg-[#FFF8FA] border-b border-[#FCE7F3] text-xs text-[#854D67] flex items-center justify-between no-print">
                <span className="flex items-center gap-1.5 font-medium">
                  <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                  <span>ตารางวิชาของฉัน ขยายพอดีหน้าจออัตโนมัติ (Auto-Fit) ครบทุกรายละเอียด</span>
                </span>
                <button
                  onClick={() => setTableLayoutMode('full')}
                  className="text-[#9D174D] hover:underline font-semibold flex items-center gap-1"
                >
                  <span>สลับเป็นตารางแยกคอลัมน์</span>
                  <Columns className="w-3 h-3" />
                </button>
              </div>

              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-[#FCE7F3]/80 text-[#701A4B] font-bold border-b border-[#F8D7E3]">
                    <th className="py-3 px-3 w-[16%] border-r border-[#F8D7E3]/70">ชั้นปี & คณะ / สาขา</th>
                    <th className="py-3 px-3 w-[18%] border-r border-[#F8D7E3]/70">วัน & เวลาสอบ</th>
                    <th className="py-3 px-3 w-[28%] border-r border-[#F8D7E3]/70">รหัส & รายวิชา</th>
                    <th className="py-3 px-3 w-[15%] border-r border-[#F8D7E3]/70">อาจารย์ผู้บรรยาย</th>
                    <th className="py-3 px-3 w-[11%] border-r border-[#F8D7E3]/70">สถานที่ & สถานะ</th>
                    <th className="py-3 px-2 text-center w-[12%] no-print">การจัดการ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#FCE7F3]/70">
                  {activeExams.map((exam, index) => {
                    const isEven = index % 2 === 0;
                    const countdown = calculateCountdown(exam);

                    return (
                      <tr
                        key={exam.id}
                        className={`hover:bg-[#FFF0F5] transition-colors ${
                          isEven ? 'bg-white' : 'bg-[#FFF8FA]/50'
                        }`}
                      >
                        <td className="py-2.5 px-3 border-r border-[#FCE7F3]/70 align-top">
                          <div className="flex items-center gap-1.5 mb-1">
                            <span className="inline-block px-2 py-0.5 rounded bg-[#FFF0F5] text-[#9D174D] font-bold text-[11px] border border-[#F8D7E3]">
                              ปี {exam.yearLevel}
                            </span>
                            <span className="font-semibold text-slate-800 text-[11px]">
                              {exam.faculty}
                            </span>
                          </div>
                          <div className="text-[11px] text-[#854D67]">
                            {exam.major}
                          </div>
                        </td>

                        <td className="py-2.5 px-3 border-r border-[#FCE7F3]/70 align-top">
                          <div className="font-bold text-slate-900 text-xs">
                            {exam.examDateThai}
                          </div>
                          <div className="flex items-center gap-1 font-mono text-[#701A4B] text-[11px] mt-0.5">
                            <Clock className="w-3 h-3 text-[#9D174D]/70 shrink-0" />
                            <span>{exam.examTimeThai}</span>
                          </div>
                        </td>

                        <td className="py-2.5 px-3 border-r border-[#FCE7F3]/70 align-top">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="font-mono font-bold text-xs text-[#701A4B] bg-[#FFF0F5] px-1.5 py-0.5 rounded border border-[#F8D7E3]">
                              {exam.courseCode}
                            </span>
                            {exam.examSubmissionStatus === 'submitted' ? (
                              <span 
                                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300 font-bold text-[10px]"
                                title={exam.examSubmissionDate ? `พร้อมสอบ (ส่งข้อสอบเมื่อ: ${exam.examSubmissionDate})` : 'พร้อมสอบ'}
                              >
                                <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                <span>พร้อมสอบ ✔</span>
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-slate-100 text-slate-500 border border-slate-200 text-[10px]">
                                <Clock className="w-2.5 h-2.5 text-slate-400" />
                                <span>รอข้อสอบ</span>
                              </span>
                            )}
                          </div>
                          <div 
                            onClick={() => onViewExamDetails?.(exam)}
                            className="font-bold text-slate-900 text-xs mt-1 hover:text-[#9D174D] cursor-pointer flex items-center justify-between group"
                            title="คลิกดูรายละเอียดวิชา"
                          >
                            <span>{exam.courseName}</span>
                            <Eye className="w-3 h-3 text-[#9D174D] opacity-0 group-hover:opacity-100 transition-opacity shrink-0 ml-1" />
                          </div>
                        </td>

                        <td className="py-2.5 px-3 text-slate-700 border-r border-[#FCE7F3]/70 align-top">
                          <div className="font-medium text-slate-800 text-xs">
                            {exam.lecturer}
                          </div>
                        </td>

                        <td className="py-2.5 px-3 border-r border-[#FCE7F3]/70 align-top">
                          <div className="text-[#701A4B] font-semibold text-[11px] flex items-center gap-1">
                            <MapPin className="w-3 h-3 text-[#E11D48] shrink-0" />
                            <span>ห้องประชุม 1</span>
                          </div>
                          <span className={`inline-block mt-1 px-1.5 py-0.2 rounded text-[10px] font-medium border ${
                            exam.status === 'บรรพชิต'
                              ? 'bg-amber-50 text-amber-900 border-amber-200'
                              : 'bg-[#FFF0F5] text-[#9D174D] border-[#F8D7E3]'
                          }`}>
                            {exam.status}
                          </span>
                        </td>

                        <td className="py-2.5 px-2 text-center no-print align-top">
                          <span className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded-full mb-1.5 ${
                            countdown.status === 'ongoing'
                              ? 'bg-emerald-100 text-emerald-800 animate-pulse border border-emerald-300'
                              : 'bg-[#FFF0F5] text-[#9D174D] border border-[#F8D7E3]'
                          }`}>
                            {countdown.label}
                          </span>

                          <div className="flex items-center justify-center gap-1">
                            {onViewExamDetails && (
                              <button
                                onClick={() => onViewExamDetails(exam)}
                                title="ดูรายละเอียดวิชาและข้อมูลข้อสอบ"
                                className="p-1.5 text-[#9D174D] hover:bg-[#FFF0F5] rounded-lg transition cursor-pointer"
                              >
                                <Eye className="w-3.5 h-3.5" />
                              </button>
                            )}

                            <a
                              href={getGoogleCalendarUrl(exam)}
                              target="_blank"
                              rel="noreferrer"
                              title="เพิ่มลง Google Calendar"
                              className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition"
                            >
                              <ExternalLink className="w-3.5 h-3.5" />
                            </a>

                            <button
                              onClick={() => onOpenAlertForExam(exam)}
                              title="เปิดระบบแจ้งเตือน LINE"
                              className="p-1.5 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition"
                            >
                              <Share2 className="w-3.5 h-3.5" />
                            </button>

                            <button
                              onClick={() => onToggleSave(exam.id)}
                              title="นำออกจากวิชาของฉัน"
                              className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* MODE 2: FULL SEPARATE COLUMNS */}
          {tableLayoutMode === 'full' && (
            <div className={`bg-white rounded-2xl border border-[#F8D7E3] shadow-xs overflow-hidden no-print ${
              mobileLayoutMode === 'adaptive' ? 'hidden md:block' : 'block'
            }`}>
              <div className="px-3.5 py-2 bg-[#FFF8FA] border-b border-[#FCE7F3] text-xs text-[#854D67] flex items-center justify-between no-print">
                <span>ตารางแยกคอลัมน์: เลื่อนจอซ้าย-ขวาเพื่อดูข้อมูลทุกคอลัมน์</span>
                <button
                  onClick={() => setTableLayoutMode('autofit')}
                  className="text-[#9D174D] hover:underline font-semibold flex items-center gap-1"
                >
                  <span>กลับไปโหมดพอดีจอ (Auto-Fit)</span>
                  <LayoutGrid className="w-3 h-3" />
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-[#FCE7F3]/80 text-[#701A4B] font-bold border-b border-[#F8D7E3]">
                      <th className="py-3 px-3 text-center w-16 border-r border-[#F8D7E3]/70">ชั้นปี</th>
                      <th className="py-3 px-3 border-r border-[#F8D7E3]/70 min-w-[95px]">คณะ</th>
                      <th className="py-3 px-3 border-r border-[#F8D7E3]/70 min-w-[130px]">สาขาวิชา</th>
                      <th className="py-3 px-3 border-r border-[#F8D7E3]/70 min-w-[115px]">วันสอบ</th>
                      <th className="py-3 px-3 border-r border-[#F8D7E3]/70 min-w-[115px]">เวลาสอบ</th>
                      <th className="py-3 px-3 border-r border-[#F8D7E3]/70 min-w-[90px]">รหัสวิชา</th>
                      <th className="py-3 px-3.5 border-r border-[#F8D7E3]/70 min-w-[170px]">รายวิชา</th>
                      <th className="py-3 px-3 border-r border-[#F8D7E3]/70 min-w-[140px]">อาจารย์ผู้บรรยาย</th>
                      <th className="py-3 px-3 border-r border-[#F8D7E3]/70 min-w-[125px]">สถานที่ / ห้องสอบ</th>
                      <th className="py-3 px-2 text-center border-r border-[#F8D7E3]/70 min-w-[80px]">สถานะ</th>
                      <th className="py-3 px-2.5 text-center min-w-[110px] border-r border-[#F8D7E3]/70 no-print">เวลานับถอยหลัง</th>
                      <th className="py-3 px-2 text-center w-24 no-print">การจัดการ</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#FCE7F3]/70">
                    {activeExams.map((exam, index) => {
                      const isEven = index % 2 === 0;
                      const countdown = calculateCountdown(exam);

                      return (
                        <tr
                          key={exam.id}
                          className={`hover:bg-[#FFF0F5] transition-colors ${
                            isEven ? 'bg-white' : 'bg-[#FFF8FA]/50'
                          }`}
                        >
                          <td className="py-2.5 px-3 text-center border-r border-[#FCE7F3]/70">
                            <span className="inline-block px-2 py-0.5 rounded bg-[#FFF0F5] text-[#9D174D] font-bold text-[11px] border border-[#F8D7E3]">
                              ปี {exam.yearLevel}
                            </span>
                          </td>
                          <td className="py-2.5 px-3 font-medium text-slate-800 border-r border-[#FCE7F3]/70">
                            {exam.faculty}
                          </td>
                          <td className="py-2.5 px-3 text-slate-700 border-r border-[#FCE7F3]/70">
                            {exam.major}
                          </td>
                          <td className="py-2.5 px-3 font-semibold text-slate-900 whitespace-nowrap border-r border-[#FCE7F3]/70">
                            {exam.examDateThai}
                          </td>
                          <td className="py-2.5 px-3 font-mono text-slate-800 whitespace-nowrap border-r border-[#FCE7F3]/70">
                            {exam.examTimeThai}
                          </td>
                          <td className="py-2.5 px-3 font-mono font-bold text-[#701A4B] whitespace-nowrap border-r border-[#FCE7F3]/70">
                            {exam.courseCode}
                          </td>
                          <td className="py-2.5 px-3.5 font-bold text-slate-900 border-r border-[#FCE7F3]/70">
                            <div>{exam.courseName}</div>
                            <div className="mt-1 flex items-center gap-1.5 flex-wrap">
                              {exam.examSubmissionStatus === 'submitted' ? (
                                <span 
                                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300 font-bold text-[10px]"
                                  title={exam.examSubmissionDate ? `พร้อมสอบ (ส่งข้อสอบเมื่อ: ${exam.examSubmissionDate})` : 'พร้อมสอบ'}
                                >
                                  <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                  <span>พร้อมสอบ ✔</span>
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-slate-100 text-slate-500 border border-slate-200 text-[10px]">
                                  <Clock className="w-2.5 h-2.5 text-slate-400" />
                                  <span>รอข้อสอบ</span>
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="py-2.5 px-3 text-slate-700 border-r border-[#FCE7F3]/70">
                            {exam.lecturer}
                          </td>
                          <td className="py-2.5 px-3 text-[#701A4B] font-semibold border-r border-[#FCE7F3]/70 text-[11px] whitespace-nowrap">
                            <span className="flex items-center gap-1">
                              <MapPin className="w-3 h-3 text-[#E11D48] shrink-0" />
                              <span>ห้องประชุมชั้น 1</span>
                            </span>
                          </td>
                          <td className="py-2.5 px-2 text-center border-r border-[#FCE7F3]/70">
                            <span className={`inline-block px-2 py-0.5 rounded text-[11px] font-medium border ${
                              exam.status === 'บรรพชิต'
                                ? 'bg-amber-50 text-amber-900 border-amber-200'
                                : 'bg-[#FFF0F5] text-[#9D174D] border-[#F8D7E3]'
                            }`}>
                              {exam.status}
                            </span>
                          </td>
                          <td className="py-2.5 px-2.5 text-center no-print border-r border-[#FCE7F3]/70">
                            <span className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded-full whitespace-nowrap ${
                              countdown.status === 'ongoing'
                                ? 'bg-emerald-100 text-emerald-800 animate-pulse border border-emerald-300'
                              : 'bg-[#FFF0F5] text-[#9D174D] border border-[#F8D7E3]'
                            }`}>
                              {countdown.label}
                            </span>
                          </td>
                          <td className="py-2.5 px-2 text-center no-print">
                            <div className="flex items-center justify-center gap-1">
                              <a
                                href={getGoogleCalendarUrl(exam)}
                                target="_blank"
                                rel="noreferrer"
                                title="เพิ่มลง Google Calendar"
                                className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition"
                              >
                                <ExternalLink className="w-3.5 h-3.5" />
                              </a>

                              <button
                                onClick={() => onOpenAlertForExam(exam)}
                                title="เปิดระบบแจ้งเตือน LINE"
                                className="p-1.5 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition"
                              >
                                <Share2 className="w-3.5 h-3.5" />
                              </button>

                              <button
                                onClick={() => onToggleSave(exam.id)}
                                title="นำออกจากวิชาของฉัน"
                                className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}

      {/* Modal for Uploading Exam Paper to Google Drive */}
      <ExamUploadDriveModal
        isOpen={!!uploadModalExam}
        onClose={() => setUploadModalExam(null)}
        exam={uploadModalExam}
        currentUser={currentUser ?? null}
        centralDriveFolderUrl={centralDriveFolderUrl}
        webhookUrl={webhookUrl}
        onUploadSuccess={(examId, fileUrl, dateStr) => {
          if (onUploadExamSuccess) {
            onUploadExamSuccess(examId, fileUrl, dateStr);
          }
        }}
      />
    </div>
  );
};
