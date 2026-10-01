import React, { useState } from 'react';
import { 
  Calendar as CalendarIcon, 
  Clock, 
  MapPin, 
  Star, 
  ExternalLink, 
  Edit3, 
  Share2, 
  CalendarPlus, 
  FileSpreadsheet,
  Smartphone,
  Table as TableIcon,
  Sun,
  Sunset,
  LayoutGrid,
  Columns,
  CheckCircle2
} from 'lucide-react';
import { ExamItem, TeacherUser } from '../types/exam';
import { getGoogleCalendarUrl, downloadICS } from '../utils/calendar';
import { calculateCountdown } from '../utils/notifications';
import { exportExamsToExcel } from '../utils/excelExport';

interface CalendarViewProps {
  exams: ExamItem[];
  savedExamIds: string[];
  onToggleSave: (id: string) => void;
  currentUser: TeacherUser | null;
  onEditExam: (exam: ExamItem) => void;
  onOpenAlertForExam: (exam: ExamItem) => void;
  isWidescreen?: boolean;
}

export const CalendarView: React.FC<CalendarViewProps> = ({
  exams,
  savedExamIds,
  onToggleSave,
  currentUser,
  onEditExam,
  onOpenAlertForExam,
  isWidescreen
}) => {
  const dates = Array.from(new Set(exams.map(e => e.examDateThai))).filter(Boolean);
  const [selectedDate, setSelectedDate] = useState<string>(dates[0] || '5 ตุลาคม 2569');
  const [filterStatus, setFilterStatus] = useState<'all' | 'บรรพชิต' | 'คฤหัสถ์'>('all');
  const [mobileLayoutMode, setMobileLayoutMode] = useState<'adaptive' | 'wide'>('adaptive');
  const [tableLayoutMode, setTableLayoutMode] = useState<'autofit' | 'full'>('autofit');

  const filteredExams = exams
    .filter(e => {
      const matchDate = e.examDateThai === selectedDate;
      const matchStatus = filterStatus === 'all' || e.status === filterStatus;
      return matchDate && matchStatus;
    })
    .sort((a, b) => a.startTime.localeCompare(b.startTime));

  const morningExams = filteredExams.filter(e => e.startTime < '12:00');
  const afternoonExams = filteredExams.filter(e => e.startTime >= '12:00');

  return (
    <div className={`${isWidescreen ? 'max-w-[98%] 2xl:max-w-[1720px]' : 'max-w-7xl'} mx-auto px-2 sm:px-4 md:px-6 py-4 sm:py-6 space-y-4`}>
      {/* Date Header Picker (Soft Pastel Pink) */}
      <div className="bg-white/95 rounded-2xl p-4 sm:p-5 border border-[#F8D7E3] shadow-xs space-y-3.5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <CalendarIcon className="w-5 h-5 text-[#9D174D]" />
              <h2 className="text-base sm:text-lg font-bold text-[#701A4B]">
                ตารางสอบไล่รายวัน ประจำปีการศึกษา 2569
              </h2>
            </div>
            <p className="text-xs sm:text-sm text-[#854D67] mt-0.5">
              เลือกวันที่สอบด้านล่างเพื่อแสดงตารางสอบของวันนั้น · ทุกวิชาสอบ ณ <span className="font-semibold text-[#701A4B]">ห้องประชุมชั้น 1</span>
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* Status toggle */}
            <div className="flex items-center gap-1 p-1 bg-[#FFF0F5] rounded-xl text-xs border border-[#F8D7E3]">
              <button
                onClick={() => setFilterStatus('all')}
                className={`px-3 py-1 rounded-lg transition ${
                  filterStatus === 'all' ? 'bg-white text-[#701A4B] shadow-2xs font-bold' : 'text-[#854D67] hover:text-[#701A4B]'
                }`}
              >
                ทั้งหมด
              </button>
              <button
                onClick={() => setFilterStatus('บรรพชิต')}
                className={`px-3 py-1 rounded-lg transition ${
                  filterStatus === 'บรรพชิต' ? 'bg-[#FCE7F3] text-[#701A4B] shadow-2xs font-bold' : 'text-[#854D67] hover:text-[#701A4B]'
                }`}
              >
                บรรพชิต
              </button>
              <button
                onClick={() => setFilterStatus('คฤหัสถ์')}
                className={`px-3 py-1 rounded-lg transition ${
                  filterStatus === 'คฤหัสถ์' ? 'bg-[#FCE7F3] text-[#701A4B] shadow-2xs font-bold' : 'text-[#854D67] hover:text-[#701A4B]'
                }`}
              >
                คฤหัสถ์
              </button>
            </div>

            {/* Desktop Table View Toggle */}
            <div className="hidden md:flex items-center bg-[#FFF0F5] p-1 rounded-xl border border-[#F8D7E3] text-xs">
              <button
                type="button"
                onClick={() => setTableLayoutMode('autofit')}
                title="ขยายพอดีหน้าจออัตโนมัติ"
                className={`flex items-center gap-1.5 px-3 py-1 rounded-lg transition ${
                  tableLayoutMode === 'autofit'
                    ? 'bg-white text-[#701A4B] font-bold shadow-2xs'
                    : 'text-[#854D67] hover:text-[#701A4B]'
                }`}
              >
                <LayoutGrid className="w-3.5 h-3.5 text-[#9D174D]" />
                <span>พอดีจอ</span>
              </button>
              <button
                type="button"
                onClick={() => setTableLayoutMode('full')}
                title="ตารางแยกทุกคอลัมน์"
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
              onClick={() => exportExamsToExcel(filteredExams, `mcu-exams-${selectedDate}`, `ตารางสอบ ${selectedDate}`)}
              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs rounded-xl shadow-2xs transition flex items-center gap-1.5 cursor-pointer"
              title="ส่งออกรายวิชาของวันนี้เป็นไฟล์ Microsoft Excel (.xlsx)"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>ส่งออก Excel วันนี้ ({filteredExams.length})</span>
            </button>

            <button
              onClick={() => downloadICS(filteredExams, `exam-schedule-${selectedDate}.ics`)}
              className="px-3 py-1.5 bg-[#FFF0F5] hover:bg-[#FCE7F3] text-[#701A4B] font-semibold text-xs rounded-xl border border-[#F8D7E3] transition flex items-center gap-1.5"
            >
              <CalendarPlus className="w-3.5 h-3.5 text-[#9D174D]" />
              <span className="hidden sm:inline">โหลดปฏิทินวันนี้ (.ics)</span>
            </button>
          </div>
        </div>

        {/* Date Selector Buttons */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none pt-1">
          {dates.map(date => {
            const countForDate = exams.filter(e => e.examDateThai === date).length;
            const isSelected = selectedDate === date;
            return (
              <button
                key={date}
                onClick={() => setSelectedDate(date)}
                className={`px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-2 ${
                  isSelected
                    ? 'bg-[#FCE7F3] text-[#701A4B] font-bold border border-[#F8D7E3] shadow-xs ring-1 ring-[#9D174D]/20'
                    : 'bg-white text-slate-700 hover:bg-[#FFF5F8] border border-slate-200'
                }`}
              >
                <span>{date}</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                  isSelected ? 'bg-white text-[#701A4B]' : 'bg-[#FFF0F5] text-[#854D67]'
                }`}>
                  {countForDate} วิชา
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Overview for Selected Day */}
      <div className="flex items-center justify-between px-1">
        <h3 className="font-bold text-sm text-[#701A4B] flex items-center gap-2">
          <span>ตารางสอบวันที่ {selectedDate}</span>
          <span className="text-xs px-2.5 py-0.5 rounded-full bg-[#FFF0F5] text-[#9D174D] border border-[#F8D7E3] font-semibold">
            {filteredExams.length} รายวิชา
          </span>
        </h3>
        <span className="text-xs text-[#854D67]">
          ภาคเช้า ({morningExams.length}) · ภาคบ่าย ({afternoonExams.length})
        </span>
      </div>

      {filteredExams.length === 0 ? (
        <div className="bg-white rounded-2xl p-10 text-center border border-[#F8D7E3]">
          <FileSpreadsheet className="w-10 h-10 text-[#F8D7E3] mx-auto mb-2" />
          <p className="text-sm font-bold text-slate-700">ไม่มีวิชาสอบในวันที่เลือกหรือตามเงื่อนไขตัวกรอง</p>
          <button onClick={() => setFilterStatus('all')} className="mt-2 text-xs text-[#9D174D] underline font-semibold">
            แสดงวิชาสอบทั้งหมดของวันนี้
          </button>
        </div>
      ) : (
        <>
          {/* MOBILE ADAPTIVE VIEW */}
          <div className={`md:hidden space-y-3 ${mobileLayoutMode === 'wide' ? 'hidden' : 'block'}`}>
            {filteredExams.map((exam) => {
              const isSaved = savedExamIds.includes(exam.id);
              const countdown = calculateCountdown(exam);

              return (
                <div
                  key={exam.id}
                  className={`bg-white rounded-2xl overflow-hidden border transition-all shadow-2xs ${
                    isSaved ? 'border-[#E11D48]/60 bg-[#FFF5F8]' : 'border-[#F8D7E3]'
                  }`}
                >
                  <div className="bg-[#FCE7F3]/70 px-3.5 py-2.5 border-b border-[#F8D7E3] flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono font-bold text-xs px-2 py-0.5 rounded bg-white text-[#701A4B] border border-[#F8D7E3]">
                        {exam.courseCode}
                      </span>
                      <span className="text-xs font-semibold px-2 py-0.5 rounded bg-[#FFF0F5] text-[#9D174D] border border-[#F8D7E3]">
                        ปี {exam.yearLevel}
                      </span>
                      <span className="text-[11px] font-mono font-semibold text-slate-700 bg-white px-2 py-0.5 rounded border border-slate-200">
                        {exam.startTime < '12:00' ? '🌅 เช้า' : '🌇 บ่าย'} {exam.examTimeThai}
                      </span>
                      {exam.examSubmissionStatus === 'submitted' ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          <span>พร้อมสอบ ✔</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[10px] text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full border border-slate-200">
                          <Clock className="w-2.5 h-2.5 text-slate-400" />
                          <span>รอข้อสอบ</span>
                        </span>
                      )}
                    </div>

                    <button
                      onClick={() => onToggleSave(exam.id)}
                      className="p-1 rounded-lg text-[#E11D48] hover:bg-white transition"
                    >
                      <Star className={`w-4 h-4 ${isSaved ? 'fill-[#E11D48] text-[#E11D48]' : 'text-slate-300'}`} />
                    </button>
                  </div>

                  <div className="p-3.5">
                    <h4 className="font-bold text-sm text-slate-900 leading-snug">
                      {exam.courseName}
                    </h4>

                    <div className="mt-2.5 border border-[#FCE7F3] rounded-xl overflow-hidden text-xs divide-y divide-[#FCE7F3]">
                      <div className="p-2 flex items-center gap-1.5 bg-white text-slate-800">
                        <MapPin className="w-3.5 h-3.5 text-[#E11D48] shrink-0" />
                        <span className="font-semibold text-[#701A4B]">สถานที่สอบ:</span>
                        <span className="text-slate-700">ห้องประชุมชั้น 1</span>
                      </div>
                      <div className="p-2 flex items-center gap-1.5 bg-[#FFF8FA]/40 text-slate-800">
                        <span className="text-slate-500">อาจารย์:</span>
                        <span className="font-medium text-slate-800 truncate">{exam.lecturer}</span>
                      </div>
                      <div className="p-2 flex items-center gap-1.5 bg-white text-slate-800">
                        <span className="text-slate-500">คณะ:</span>
                        <span className="text-slate-700 truncate">{exam.faculty} ({exam.major})</span>
                      </div>
                    </div>

                    <div className="mt-3 pt-2.5 border-t border-[#FCE7F3] flex items-center justify-between gap-2">
                      <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-[#FFF0F5] text-[#9D174D] border border-[#F8D7E3]">
                        {countdown.label}
                      </span>

                      <div className="flex items-center gap-1">
                        {currentUser && (
                          <button
                            onClick={() => onEditExam(exam)}
                            className="p-2 text-[#701A4B] hover:bg-[#FFF0F5] rounded-lg transition"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                        )}
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
                  </div>
                </div>
              );
            })}
          </div>

          {/* MODE 1: AUTO-FIT TABLE (NO SCROLLBAR) */}
          {tableLayoutMode === 'autofit' && (
            <div className={`bg-white rounded-2xl border border-[#F8D7E3] shadow-xs overflow-hidden ${
              mobileLayoutMode === 'adaptive' ? 'hidden md:block' : 'block'
            }`}>
              <div className="px-3.5 py-2 bg-[#FFF8FA] border-b border-[#FCE7F3] text-xs text-[#854D67] flex items-center justify-between no-print">
                <span className="flex items-center gap-1.5 font-medium">
                  <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                  <span>ตารางสอบวันนี้ ขยายพอดีหน้าจออัตโนมัติ (Auto-Fit)</span>
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
                    <th className="py-3 px-3 w-[16%] border-r border-[#F8D7E3]/70">เวลาสอบ</th>
                    <th className="py-3 px-3 w-[30%] border-r border-[#F8D7E3]/70">รหัส & รายวิชา</th>
                    <th className="py-3 px-3 w-[15%] border-r border-[#F8D7E3]/70">อาจารย์ผู้บรรยาย</th>
                    <th className="py-3 px-3 w-[11%] border-r border-[#F8D7E3]/70">สถานที่ & สถานะ</th>
                    <th className="py-3 px-2 text-center w-[12%] no-print">การจัดการ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#FCE7F3]/70">
                  {filteredExams.map((exam, index) => {
                    const isSaved = savedExamIds.includes(exam.id);
                    const isEven = index % 2 === 0;
                    const countdown = calculateCountdown(exam);

                    return (
                      <tr
                        key={exam.id}
                        className={`hover:bg-[#FFF0F5] transition-colors ${
                          isSaved ? 'bg-[#FFF2F6] font-medium' : isEven ? 'bg-white' : 'bg-[#FFF8FA]/50'
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
                          <div className="flex items-center gap-1 font-mono text-[#701A4B] text-[11px]">
                            {exam.startTime < '12:00' ? (
                              <Sun className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                            ) : (
                              <Sunset className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                            )}
                            <span className="font-bold">{exam.examTimeThai}</span>
                          </div>
                          <div className="text-[10px] text-slate-500 mt-0.5">
                            {exam.startTime < '12:00' ? 'ภาคเช้า' : 'ภาคบ่าย'}
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
                          <div className="font-bold text-slate-900 text-xs mt-1">
                            {exam.courseName}
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
                            <button
                              onClick={() => onToggleSave(exam.id)}
                              title={isSaved ? 'นำออกจากวิชาของฉัน' : 'บันทึกเป็นวิชาของฉัน'}
                              className={`p-1.5 rounded-lg transition ${
                                isSaved 
                                  ? 'text-[#E11D48] bg-[#FCE7F3]' 
                                  : 'text-slate-400 hover:text-[#E11D48] hover:bg-[#FFF0F5]'
                              }`}
                            >
                              <Star className={`w-3.5 h-3.5 ${isSaved ? 'fill-[#E11D48] text-[#E11D48]' : ''}`} />
                            </button>

                            {currentUser && (
                              <button
                                onClick={() => onEditExam(exam)}
                                title="อาจารย์แก้ไขวิชานี้"
                                className="p-1.5 text-slate-500 hover:text-[#701A4B] hover:bg-[#FCE7F3] rounded-lg transition"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
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
                              title="ส่งแจ้งเตือน LINE สำหรับวิชานี้"
                              className="p-1.5 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition"
                            >
                              <Share2 className="w-3.5 h-3.5" />
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
            <div className={`bg-white rounded-2xl border border-[#F8D7E3] shadow-xs overflow-hidden ${
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
                      <th className="py-3 px-3 border-r border-[#F8D7E3]/70 min-w-[120px]">เวลาสอบ</th>
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
                    {filteredExams.map((exam, index) => {
                      const isSaved = savedExamIds.includes(exam.id);
                      const isEven = index % 2 === 0;
                      const countdown = calculateCountdown(exam);

                      return (
                        <tr
                          key={exam.id}
                          className={`hover:bg-[#FFF0F5] transition-colors ${
                            isSaved ? 'bg-[#FFF2F6] font-medium' : isEven ? 'bg-white' : 'bg-[#FFF8FA]/50'
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
                          <td className="py-2.5 px-3 font-mono text-slate-800 whitespace-nowrap border-r border-[#FCE7F3]/70">
                            <span className="flex items-center gap-1">
                              {exam.startTime < '12:00' ? (
                                <Sun className="w-3 h-3 text-amber-500" />
                              ) : (
                                <Sunset className="w-3 h-3 text-rose-500" />
                              )}
                              <span>{exam.examTimeThai}</span>
                            </span>
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
                              <button
                                onClick={() => onToggleSave(exam.id)}
                                title={isSaved ? 'นำออกจากวิชาของฉัน' : 'บันทึกเป็นวิชาของฉัน'}
                                className={`p-1.5 rounded-lg transition ${
                                  isSaved 
                                    ? 'text-[#E11D48] bg-[#FCE7F3]' 
                                    : 'text-slate-400 hover:text-[#E11D48] hover:bg-[#FFF0F5]'
                                }`}
                              >
                                <Star className={`w-3.5 h-3.5 ${isSaved ? 'fill-[#E11D48] text-[#E11D48]' : ''}`} />
                              </button>

                              {currentUser && (
                                <button
                                  onClick={() => onEditExam(exam)}
                                  title="อาจารย์แก้ไขวิชานี้"
                                  className="p-1.5 text-slate-500 hover:text-[#701A4B] hover:bg-[#FCE7F3] rounded-lg transition"
                                >
                                  <Edit3 className="w-3.5 h-3.5" />
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
                                title="ส่งแจ้งเตือน LINE สำหรับวิชานี้"
                                className="p-1.5 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition"
                              >
                                <Share2 className="w-3.5 h-3.5" />
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
    </div>
  );
};
