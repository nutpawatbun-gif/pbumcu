import React, { useState } from 'react';
import { 
  Star, 
  Edit3, 
  ExternalLink, 
  Share2, 
  ArrowUpDown,
  FileSpreadsheet,
  Clock,
  MapPin,
  Calendar,
  Smartphone,
  Table as TableIcon,
  RotateCcw,
  CheckCircle2,
  Building2,
  User,
  Maximize2,
  Minimize2,
  LayoutGrid,
  Columns,
  Printer,
  Plus,
  Eye,
  Sparkles
} from 'lucide-react';
import { ExamItem, TeacherUser } from '../types/exam';
import { getGoogleCalendarUrl } from '../utils/calendar';
import { calculateCountdown } from '../utils/notifications';
import { exportExamsToExcel } from '../utils/excelExport';
import { isLecturerMatch } from '../utils/teacherMatching';

interface OfficialTableViewProps {
  exams: ExamItem[];
  savedExamIds: string[];
  onToggleSave: (id: string) => void;
  currentUser: TeacherUser | null;
  onAddNewExam?: () => void;
  onEditExam: (exam: ExamItem) => void;
  onOpenAlertForExam: (exam: ExamItem) => void;
  onViewExamDetails?: (exam: ExamItem) => void;
  filterYear: number | 'all';
  setFilterYear: (y: number | 'all') => void;
  filterStatus: 'all' | 'บรรพชิต' | 'คฤหัสถ์';
  setFilterStatus: (s: 'all' | 'บรรพชิต' | 'คฤหัสถ์') => void;
  filterFaculty: string;
  setFilterFaculty: (f: string) => void;
  filterDate: string;
  setFilterDate: (d: string) => void;
  distinctFaculties: string[];
  distinctDates: string[];
  sortKey: 'orderNo' | 'examDateISO' | 'courseCode' | 'yearLevel';
  setSortKey: (k: 'orderNo' | 'examDateISO' | 'courseCode' | 'yearLevel') => void;
  sortAsc: boolean;
  setSortAsc: (asc: boolean) => void;
  onResetFilters: () => void;
  onExportExcel?: () => void;
  onPrint?: () => void;
  onAddNewExam?: () => void;
  isWidescreen?: boolean;
  onToggleWidescreen?: () => void;
}

export const OfficialTableView: React.FC<OfficialTableViewProps> = ({
  exams,
  savedExamIds,
  onToggleSave,
  currentUser,
  onAddNewExam,
  onEditExam,
  onOpenAlertForExam,
  onViewExamDetails,
  filterYear,
  setFilterYear,
  filterStatus,
  setFilterStatus,
  filterFaculty,
  setFilterFaculty,
  filterDate,
  setFilterDate,
  distinctFaculties,
  distinctDates,
  sortKey,
  setSortKey,
  sortAsc,
  setSortAsc,
  onResetFilters,
  onExportExcel,
  onPrint,
  isWidescreen,
  onToggleWidescreen
}) => {
  // Mobile layout mode: 'adaptive' (compact tabular cards) or 'wide' (scrollable full table)
  const [mobileLayoutMode, setMobileLayoutMode] = useState<'adaptive' | 'wide'>('adaptive');
  
  // Desktop/Tablet layout mode: 'autofit' (expands & auto-fits 100% width without horizontal scroll) or 'full' (13 separate columns)
  const [tableLayoutMode, setTableLayoutMode] = useState<'autofit' | 'full'>('autofit');

  const handleSort = (key: typeof sortKey) => {
    if (sortKey === key) {
      setSortAsc(!sortAsc);
    } else {
      setSortKey(key);
      setSortAsc(true);
    }
  };

  const handleExport = () => {
    if (onExportExcel) {
      onExportExcel();
    } else {
      exportExamsToExcel(exams, 'mcu-exam-schedule-2569', 'ตารางสอบทั้งหมด');
    }
  };

  return (
    <div className="space-y-4">
      {/* University Standard Notice & Overview Banner (Soft Pastel Pink) */}
      <div className="no-print bg-white/95 rounded-2xl p-4 sm:p-5 border border-[#F8D7E3] shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-[#FCE7F3]">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#E11D48]/80 animate-pulse"></span>
              <h2 className="text-base sm:text-lg font-bold text-[#701A4B]">
                ตารางสอบไล่ ประจำภาคการศึกษาที่ 1 ปีการศึกษา 2569
              </h2>
            </div>
            <p className="text-xs sm:text-sm text-[#854D67] mt-0.5">
              วิทยาลัยสงฆ์พ่อขุนผาเมือง เพชรบูรณ์ · สำนักทะเบียนและประมวลผล · จัดสอบ ณ <span className="font-semibold text-[#701A4B]">ห้องประชุมชั้น 1 ทุกชั้นเรียน</span>
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap text-xs">
            {currentUser && onAddNewExam && (
              <button
                type="button"
                onClick={onAddNewExam}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#9D174D] hover:bg-[#831843] text-white font-semibold transition shadow-2xs cursor-pointer"
                title="เพิ่มรายวิชาใหม่"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>เพิ่มรายวิชา</span>
              </button>
            )}

            {/* Export Excel Button */}
            <button
              type="button"
              onClick={handleExport}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold transition shadow-2xs cursor-pointer"
              title="ส่งออกตารางสอบเป็นไฟล์ Microsoft Excel (.xlsx)"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>ส่งออกเป็น Excel ({exams.length} วิชา)</span>
            </button>

            {/* Print Official Schedule */}
            <button
              type="button"
              onClick={onPrint || (() => window.print())}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white hover:bg-[#FFF0F5] text-[#701A4B] border border-[#F8D7E3] font-semibold transition shadow-2xs cursor-pointer"
              title="พิมพ์ตารางสอบทางการ (A4)"
            >
              <Printer className="w-3.5 h-3.5 text-[#9D174D]" />
              <span className="hidden sm:inline">พิมพ์ตารางสอบ (A4)</span>
            </button>

            <span className="px-3 py-1 rounded-full bg-[#FFF0F5] text-[#9D174D] font-semibold border border-[#F8D7E3]">
              รวม {exams.length} รายวิชา
            </span>
            <span className="px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 font-semibold border border-emerald-200 flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              <span>ระบบพร้อมใช้งาน</span>
            </span>
          </div>
        </div>

        {/* View Mode & Quick Year Filter Chips */}
        <div className="pt-3 flex items-center justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none w-full sm:w-auto">
            <span className="text-xs font-semibold text-[#854D67] shrink-0 mr-1">ชั้นปี:</span>
            <button
              onClick={() => setFilterYear('all')}
              className={`px-3 py-1 text-xs rounded-lg transition-colors whitespace-nowrap ${
                filterYear === 'all'
                  ? 'bg-[#FCE7F3] text-[#701A4B] font-bold border border-[#F8D7E3] shadow-2xs'
                  : 'bg-white text-slate-600 hover:bg-[#FFF5F8] border border-slate-200'
              }`}
            >
              ทุกชั้นปี
            </button>
            {[1, 2, 3, 4].map(y => (
              <button
                key={y}
                onClick={() => setFilterYear(y)}
                className={`px-3 py-1 text-xs rounded-lg transition-colors whitespace-nowrap ${
                  filterYear === y
                    ? 'bg-[#FCE7F3] text-[#701A4B] font-bold border border-[#F8D7E3] shadow-2xs'
                    : 'bg-white text-slate-600 hover:bg-[#FFF5F8] border border-slate-200'
                }`}
              >
                ชั้นปีที่ {y}
              </button>
            ))}
          </div>

          {/* Desktop & Mobile Display Mode Selector */}
          <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-end flex-wrap">
            {/* Desktop / Tablet: Auto-Fit vs Full 13 Columns */}
            <div className="hidden md:flex items-center bg-[#FFF0F5] p-1 rounded-xl border border-[#F8D7E3] text-xs">
              <button
                type="button"
                onClick={() => setTableLayoutMode('autofit')}
                title="ขยายพอดีหน้าจออัตโนมัติ ไม่ต้องเลื่อนสกอร์บาร์ซ้าย-ขวา"
                className={`flex items-center gap-1.5 px-3 py-1 rounded-lg transition ${
                  tableLayoutMode === 'autofit'
                    ? 'bg-white text-[#701A4B] font-bold shadow-2xs'
                    : 'text-[#854D67] hover:text-[#701A4B]'
                }`}
              >
                <LayoutGrid className="w-3.5 h-3.5 text-[#9D174D]" />
                <span>พอดีจออัตโนมัติ (ไม่ต้องเลื่อน)</span>
              </button>
              <button
                type="button"
                onClick={() => setTableLayoutMode('full')}
                title="ตารางแยกละเอียดครบทั้ง 13 คอลัมน์"
                className={`flex items-center gap-1.5 px-3 py-1 rounded-lg transition ${
                  tableLayoutMode === 'full'
                    ? 'bg-white text-[#701A4B] font-bold shadow-2xs'
                    : 'text-[#854D67] hover:text-[#701A4B]'
                }`}
              >
                <Columns className="w-3.5 h-3.5 text-[#9D174D]" />
                <span>แยก 13 คอลัมน์</span>
              </button>
            </div>

            {/* Widescreen Toggle (if available) */}
            {onToggleWidescreen && (
              <button
                type="button"
                onClick={onToggleWidescreen}
                title={isWidescreen ? 'ปรับขนาดตารางกลับเป็นขนาดปกติ' : 'ขยายความกว้างเต็มจอ 100%'}
                className="hidden lg:flex items-center gap-1 text-xs text-[#701A4B] hover:text-[#9D174D] bg-[#FFF0F5] hover:bg-[#FCE7F3] border border-[#F8D7E3] px-2.5 py-1.5 rounded-xl transition"
              >
                {isWidescreen ? (
                  <>
                    <Minimize2 className="w-3 h-3" />
                    <span>ขนาดปกติ</span>
                  </>
                ) : (
                  <>
                    <Maximize2 className="w-3 h-3" />
                    <span>ขยายเต็มจอ 100%</span>
                  </>
                )}
              </button>
            )}

            {/* Mobile Display Toggle */}
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
                  <span>บัตรตาราง</span>
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
                  <span>ตารางเต็ม</span>
                </span>
              </button>
            </div>

            {(filterYear !== 'all' || filterStatus !== 'all' || filterFaculty !== 'all' || filterDate !== 'all') && (
              <button
                onClick={onResetFilters}
                className="flex items-center gap-1 text-xs text-[#9D174D] hover:text-[#701A4B] hover:underline font-semibold ml-auto sm:ml-0"
              >
                <RotateCcw className="w-3 h-3" />
                <span>ล้างตัวกรอง</span>
              </button>
            )}
          </div>
        </div>

        {/* Detailed Filter Dropdowns */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 mt-3 pt-3 border-t border-[#FCE7F3]/70">
          <div>
            <label className="block text-[11px] font-semibold text-[#854D67] mb-1">กลุ่มผู้สอบ (สถานะ)</label>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as any)}
              className="w-full px-2.5 py-1.5 text-xs bg-[#FFF8FA] border border-[#F8D7E3] rounded-lg focus:outline-none focus:ring-1 focus:ring-[#E11D48] focus:bg-white text-slate-800 transition"
            >
              <option value="all">ทั้งหมด (บรรพชิต & คฤหัสถ์)</option>
              <option value="บรรพชิต">บรรพชิต (พระภิกษุ-สามเณร)</option>
              <option value="คฤหัสถ์">คฤหัสถ์ (นิสิตทั่วไป)</option>
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-[#854D67] mb-1">ชั้นปี</label>
            <select
              value={filterYear}
              onChange={(e) => setFilterYear(e.target.value === 'all' ? 'all' : Number(e.target.value))}
              className="w-full px-2.5 py-1.5 text-xs bg-[#FFF8FA] border border-[#F8D7E3] rounded-lg focus:outline-none focus:ring-1 focus:ring-[#E11D48] focus:bg-white text-slate-800 font-semibold transition"
            >
              <option value="all">ทุกชั้นปี (ปี 1 - 4)</option>
              <option value={1}>ชั้นปีที่ 1</option>
              <option value={2}>ชั้นปีที่ 2</option>
              <option value={3}>ชั้นปีที่ 3</option>
              <option value={4}>ชั้นปีที่ 4</option>
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-[#854D67] mb-1">คณะ</label>
            <select
              value={filterFaculty}
              onChange={(e) => setFilterFaculty(e.target.value)}
              className="w-full px-2.5 py-1.5 text-xs bg-[#FFF8FA] border border-[#F8D7E3] rounded-lg focus:outline-none focus:ring-1 focus:ring-[#E11D48] focus:bg-white text-slate-800 transition"
            >
              <option value="all">ทุกคณะ</option>
              {distinctFaculties.map(f => (
                <option key={f} value={f}>{f}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-[#854D67] mb-1">วันสอบ</label>
            <select
              value={filterDate}
              onChange={(e) => setFilterDate(e.target.value)}
              className="w-full px-2.5 py-1.5 text-xs bg-[#FFF8FA] border border-[#F8D7E3] rounded-lg focus:outline-none focus:ring-1 focus:ring-[#E11D48] focus:bg-white text-slate-800 font-medium transition"
            >
              <option value="all">ทุกวันสอบ (5 - 17 ต.ค. 69)</option>
              {distinctDates.map(d => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* MOBILE ADAPTIVE VIEW (Card Table mode optimized for phones) */}
      <div className={`md:hidden space-y-3 no-print ${mobileLayoutMode === 'wide' ? 'hidden' : 'block'}`}>
        {exams.length === 0 ? (
          <div className="bg-white rounded-2xl p-8 text-center border border-[#F8D7E3]">
            <FileSpreadsheet className="w-10 h-10 text-[#F8D7E3] mx-auto mb-2" />
            <p className="text-xs font-bold text-slate-700">ไม่พบรายวิชาตามตัวกรองที่เลือก</p>
            <button onClick={onResetFilters} className="mt-2 text-xs text-[#9D174D] underline font-semibold">
              ล้างตัวกรองทั้งหมด
            </button>
          </div>
        ) : (
          exams.map((exam) => {
            const isSaved = savedExamIds.includes(exam.id);
            const countdown = calculateCountdown(exam);
            const isOwner = currentUser && (currentUser.role === 'admin' || isLecturerMatch(exam.lecturer, currentUser));

            return (
              <div
                key={exam.id}
                className={`bg-white rounded-2xl overflow-hidden border transition-all shadow-2xs ${
                  isSaved ? 'border-[#E11D48]/60 bg-[#FFF5F8]' : isOwner ? 'border-[#9D174D]/40 ring-1 ring-[#9D174D]/20' : 'border-[#F8D7E3]'
                }`}
              >
                {/* Mobile Card Table Header (Soft Pastel Pink) */}
                <div className="bg-[#FCE7F3]/70 px-3.5 py-2.5 border-b border-[#F8D7E3] flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-mono font-bold text-xs px-2 py-0.5 rounded bg-white text-[#701A4B] border border-[#F8D7E3] shadow-2xs">
                      {exam.courseCode}
                    </span>
                    <span className="text-xs font-semibold px-2 py-0.5 rounded bg-[#FFF0F5] text-[#9D174D] border border-[#F8D7E3]">
                      ชั้นปีที่ {exam.yearLevel}
                    </span>
                    <span className={`text-[11px] font-medium px-2 py-0.5 rounded border ${
                      exam.status === 'บรรพชิต' 
                        ? 'bg-amber-50 text-amber-900 border-amber-200' 
                        : 'bg-white text-slate-700 border-slate-200'
                    }`}>
                      {exam.status}
                    </span>
                    {isOwner && (
                      <span className="inline-flex items-center gap-1 text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-[#701A4B] text-white shadow-2xs">
                        <Sparkles className="w-2.5 h-2.5 text-amber-300" />
                        <span>วิชาของท่าน</span>
                      </span>
                    )}
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
                    className="p-1.5 rounded-lg text-[#E11D48] hover:bg-white transition cursor-pointer"
                    title={isSaved ? 'นำออกจากวิชาของฉัน' : 'บันทึกวิชาสอบ'}
                    aria-label="บันทึกวิชาสอบ"
                  >
                    <Star className={`w-4 h-4 ${isSaved ? 'fill-[#E11D48] text-[#E11D48]' : 'text-slate-300'}`} />
                  </button>
                </div>

                {/* Course Name Title (Clickable for Course Details) */}
                <div className="p-3.5">
                  <div
                    onClick={() => onViewExamDetails?.(exam)}
                    className="flex items-center justify-between gap-2 group cursor-pointer"
                  >
                    <h3 className="font-bold text-sm text-slate-900 leading-snug group-hover:text-[#9D174D] transition-colors">
                      {exam.courseName}
                    </h3>
                    <span className="shrink-0 inline-flex items-center gap-1 text-[11px] font-semibold text-[#9D174D] bg-[#FFF0F5] px-2 py-0.5 rounded-lg border border-[#F8D7E3] group-hover:bg-[#9D174D] group-hover:text-white transition">
                      <Eye className="w-3 h-3" />
                      <span>ดูรายละเอียด</span>
                    </span>
                  </div>

                  {/* Structured Tabular Grid for Mobile */}
                  <div className="mt-2.5 border border-[#FCE7F3] rounded-xl overflow-hidden text-xs divide-y divide-[#FCE7F3]">
                    {/* Row: วันที่ & เวลาสอบ */}
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

                    {/* Row: สถานที่สอบ */}
                    <div className="p-2 flex items-center gap-1.5 bg-white text-slate-800">
                      <MapPin className="w-3.5 h-3.5 text-[#E11D48] shrink-0" />
                      <span className="font-semibold text-[#701A4B]">สถานที่สอบ:</span>
                      <span className="text-slate-700">ห้องประชุมชั้น 1</span>
                    </div>

                    {/* Row: อาจารย์ผู้บรรยาย */}
                    <div className="p-2 flex items-center gap-1.5 bg-[#FFF8FA]/40 text-slate-800">
                      <User className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                      <span className="text-slate-500">อาจารย์:</span>
                      <span className="font-medium text-slate-800 truncate">{exam.lecturer}</span>
                    </div>

                    {/* Row: คณะและสาขา */}
                    <div className="p-2 flex items-center gap-1.5 bg-white text-slate-800">
                      <Building2 className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                      <span className="text-slate-600 truncate">{exam.faculty} ({exam.major})</span>
                    </div>
                  </div>

                  {/* Actions & Countdown Footer */}
                  <div className="mt-3 pt-2.5 border-t border-[#FCE7F3] flex items-center justify-between gap-2">
                    <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full ${
                      countdown.status === 'ongoing'
                        ? 'bg-emerald-100 text-emerald-800 animate-pulse border border-emerald-300'
                        : 'bg-[#FFF0F5] text-[#9D174D] border border-[#F8D7E3]'
                    }`}>
                      {countdown.label}
                    </span>

                    <div className="flex items-center gap-1">
                      {currentUser && (
                        <button
                          onClick={() => onEditExam(exam)}
                          className="p-2 text-[#701A4B] hover:bg-[#FFF0F5] rounded-lg transition"
                          title="แก้ไขวิชา"
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
          })
        )}
      </div>

      {/* ========================================================================= */}
      {/* MODE 1: AUTO-FIT RESPONSIVE TABLE (100% Screen Width - NO SCROLLBAR!)     */}
      {/* ========================================================================= */}
      {tableLayoutMode === 'autofit' && (
        <div className={`bg-white rounded-2xl border border-[#F8D7E3] shadow-xs overflow-hidden no-print ${
          mobileLayoutMode === 'adaptive' ? 'hidden md:block' : 'block'
        }`}>
          {/* Header indicator informing user that table auto-fits screen width */}
          <div className="px-3.5 py-2 bg-[#FFF8FA] border-b border-[#FCE7F3] text-xs text-[#854D67] flex items-center justify-between no-print">
            <span className="flex items-center gap-1.5 font-medium">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              <span>ตารางขยายพอดีหน้าจออัตโนมัติ (Auto-Fit) ครบทุกรายละเอียดโดยไม่ต้องเลื่อนสกอร์บาร์</span>
            </span>
            <button
              onClick={() => setTableLayoutMode('full')}
              className="text-[#9D174D] hover:underline font-semibold flex items-center gap-1"
            >
              <span>สลับเป็นตารางแยก 13 คอลัมน์</span>
              <Columns className="w-3 h-3" />
            </button>
          </div>

          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-[#FCE7F3]/80 text-[#701A4B] font-bold border-b border-[#F8D7E3] select-none">
                {/* 1. ชั้นปี & สังกัด */}
                <th 
                  onClick={() => handleSort('yearLevel')} 
                  className="py-3 px-3 cursor-pointer hover:bg-[#FCE7F3] transition w-[16%] border-r border-[#F8D7E3]/70"
                >
                  <div className="flex items-center gap-1">
                    <span>ชั้นปี & คณะ / สาขา</span>
                    <ArrowUpDown className="w-3 h-3 text-[#9D174D]" />
                  </div>
                </th>

                {/* 2. วัน & เวลาสอบ */}
                <th 
                  onClick={() => handleSort('examDateISO')} 
                  className="py-3 px-3 cursor-pointer hover:bg-[#FCE7F3] transition w-[17%] border-r border-[#F8D7E3]/70"
                >
                  <div className="flex items-center gap-1">
                    <span>วัน & เวลาสอบ</span>
                    <ArrowUpDown className="w-3 h-3 text-[#9D174D]" />
                  </div>
                </th>

                {/* 3. รหัสวิชา & รายวิชา */}
                <th 
                  onClick={() => handleSort('courseCode')} 
                  className="py-3 px-3 cursor-pointer hover:bg-[#FCE7F3] transition w-[28%] border-r border-[#F8D7E3]/70"
                >
                  <div className="flex items-center gap-1">
                    <span>รหัส & รายวิชา</span>
                    <ArrowUpDown className="w-3 h-3 text-[#9D174D]" />
                  </div>
                </th>

                {/* 4. อาจารย์ผู้บรรยาย */}
                <th className="py-3 px-3 w-[15%] border-r border-[#F8D7E3]/70">
                  อาจารย์ผู้บรรยาย
                </th>

                {/* 5. สถานที่ & สถานะ */}
                <th className="py-3 px-3 w-[12%] border-r border-[#F8D7E3]/70">
                  สถานที่ & สถานะ
                </th>

                {/* 6. นับถอยหลัง & จัดการ */}
                <th className="py-3 px-2.5 text-center w-[12%] no-print">
                  นับถอยหลัง & จัดการ
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#FCE7F3]/70">
              {exams.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-500">
                    <FileSpreadsheet className="w-8 h-8 mx-auto text-[#F8D7E3] mb-2" />
                    <p className="font-semibold text-sm text-slate-700">ไม่พบข้อมูลรายวิชาตามตัวกรองที่เลือก</p>
                    <button
                      onClick={onResetFilters}
                      className="mt-2 text-xs text-[#9D174D] underline font-semibold"
                    >
                      ล้างตัวกรองทั้งหมด
                    </button>
                  </td>
                </tr>
              ) : (
                exams.map((exam, index) => {
                  const isSaved = savedExamIds.includes(exam.id);
                  const isEven = index % 2 === 0;
                  const countdown = calculateCountdown(exam);
                  const isOwner = currentUser && (currentUser.role === 'admin' || isLecturerMatch(exam.lecturer, currentUser));

                  return (
                    <tr
                      key={exam.id}
                      className={`hover:bg-[#FFF0F5] transition-colors ${
                        isSaved 
                          ? 'bg-[#FFF2F6] font-medium' 
                          : isOwner
                          ? 'bg-[#FFF8FA] font-medium'
                          : isEven ? 'bg-white' : 'bg-[#FFF8FA]/50'
                      } ${isOwner ? 'border-l-4 border-l-[#9D174D]' : ''}`}
                    >
                      {/* 1. ชั้นปี & สังกัด */}
                      <td className="py-2.5 px-3 border-r border-[#FCE7F3]/70 align-top">
                        <div className="flex items-center gap-1.5 mb-1">
                          <span className="inline-block px-2 py-0.5 rounded bg-[#FFF0F5] text-[#9D174D] font-bold text-[11px] border border-[#F8D7E3]">
                            ปี {exam.yearLevel}
                          </span>
                          <span className="font-semibold text-slate-800 text-[11px]">
                            {exam.faculty}
                          </span>
                        </div>
                        <div className="text-[11px] text-[#854D67] leading-tight">
                          {exam.major}
                        </div>
                      </td>

                      {/* 2. วัน & เวลาสอบ */}
                      <td className="py-2.5 px-3 border-r border-[#FCE7F3]/70 align-top">
                        <div className="font-bold text-slate-900 text-xs">
                          {exam.examDateThai}
                        </div>
                        <div className="flex items-center gap-1 font-mono text-[#701A4B] text-[11px] mt-0.5">
                          <Clock className="w-3 h-3 text-[#9D174D]/70 shrink-0" />
                          <span>{exam.examTimeThai}</span>
                        </div>
                      </td>

                      {/* 3. รหัสวิชา & รายวิชา */}
                      <td className="py-2.5 px-3 border-r border-[#FCE7F3]/70 align-top">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="font-mono font-bold text-xs text-[#701A4B] bg-[#FFF0F5] px-1.5 py-0.5 rounded border border-[#F8D7E3]">
                            {exam.courseCode}
                          </span>
                          {isOwner && (
                            <span className="inline-flex items-center gap-1 text-[10px] font-extrabold px-2 py-0.2 rounded-full bg-[#701A4B] text-white shadow-2xs">
                              <Sparkles className="w-2.5 h-2.5 text-amber-300" />
                              <span>วิชาของท่าน</span>
                            </span>
                          )}
                          {exam.examSubmissionStatus === 'submitted' ? (
                            <span 
                              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300 font-bold text-[10px]"
                              title={exam.examSubmissionDate ? `พร้อมสอบ (ส่งข้อสอบเมื่อ: ${exam.examSubmissionDate})` : 'พร้อมสอบ'}
                            >
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                              <span>พร้อมสอบ ✔</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200 text-[10px]">
                              <Clock className="w-2.5 h-2.5 text-slate-400" />
                              <span>รอข้อสอบ</span>
                            </span>
                          )}
                        </div>
                        <div 
                          onClick={() => onViewExamDetails?.(exam)}
                          className="font-bold text-slate-900 text-xs mt-1 leading-snug hover:text-[#9D174D] cursor-pointer flex items-center justify-between group"
                          title="คลิกเพื่อดูรายละเอียดวิชา"
                        >
                          <span>{exam.courseName}</span>
                          <span className="text-[10px] font-medium text-[#9D174D] opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-0.5">
                            <Eye className="w-3 h-3" />
                            <span>ดูวิชา</span>
                          </span>
                        </div>
                      </td>

                      {/* 4. อาจารย์ผู้บรรยาย */}
                      <td className="py-2.5 px-3 text-slate-700 border-r border-[#FCE7F3]/70 align-top">
                        <div className="font-medium text-slate-800 text-xs">
                          {exam.lecturer}
                        </div>
                      </td>

                      {/* 5. สถานที่ & สถานะ */}
                      <td className="py-2.5 px-3 border-r border-[#FCE7F3]/70 align-top">
                        <div className="text-[#701A4B] font-semibold text-[11px] flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-[#E11D48] shrink-0" />
                          <span>ห้องประชุมชั้น 1</span>
                        </div>
                        <div className="mt-1 flex items-center gap-1 flex-wrap">
                          <span className={`inline-block px-1.5 py-0.2 rounded text-[10px] font-medium border ${
                            exam.status === 'บรรพชิต'
                              ? 'bg-amber-50 text-amber-900 border-amber-200'
                              : 'bg-[#FFF0F5] text-[#9D174D] border-[#F8D7E3]'
                          }`}>
                            {exam.status}
                          </span>
                          {exam.notes && (
                            <span className="inline-block px-1.5 py-0.2 rounded bg-slate-100 text-slate-600 text-[10px]">
                              {exam.notes}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* 6. นับถอยหลัง & จัดการ */}
                      <td className="py-2.5 px-2.5 text-center no-print align-top">
                        <span className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded-full mb-1.5 ${
                          countdown.status === 'ongoing'
                            ? 'bg-emerald-100 text-emerald-800 animate-pulse border border-emerald-300'
                            : 'bg-[#FFF0F5] text-[#9D174D] border border-[#F8D7E3]'
                        }`}>
                          {countdown.label}
                        </span>

                        <div className="flex items-center justify-center gap-1">
                          {/* View details button */}
                          <button
                            onClick={() => onViewExamDetails?.(exam)}
                            title="ดูรายละเอียดวิชานี้"
                            className={`p-1.5 rounded-lg transition cursor-pointer ${
                              isOwner 
                                ? 'text-[#9D174D] bg-[#FFF0F5] hover:bg-[#FCE7F3] border border-[#F8D7E3]' 
                                : 'text-slate-400 hover:text-slate-700 hover:bg-slate-100'
                            }`}
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>

                          <button
                            onClick={() => onToggleSave(exam.id)}
                            title={isSaved ? 'นำออกจากวิชาของฉัน' : 'บันทึกเป็นวิชาของฉัน'}
                            className={`p-1.5 rounded-lg transition cursor-pointer ${
                              isSaved 
                                ? 'text-[#E11D48] bg-[#FCE7F3] hover:bg-[#FBCFE8]' 
                                : 'text-slate-400 hover:text-[#E11D48] hover:bg-[#FFF0F5]'
                            }`}
                          >
                            <Star className={`w-3.5 h-3.5 ${isSaved ? 'fill-[#E11D48] text-[#E11D48]' : ''}`} />
                          </button>

                          {currentUser && (
                            <button
                              onClick={() => onEditExam(exam)}
                              title="อาจารย์แก้ไขวิชานี้"
                              className="p-1.5 text-slate-500 hover:text-[#701A4B] hover:bg-[#FCE7F3] rounded-lg transition cursor-pointer"
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
                            title="เปิดระบบแจ้งเตือน LINE สำหรับวิชานี้"
                            className="p-1.5 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition"
                          >
                            <Share2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODE 2: CLASSIC 13 SEPARATE COLUMNS (Scrollable when needed)             */}
      {/* ========================================================================= */}
      {tableLayoutMode === 'full' && (
        <div className={`bg-white rounded-2xl border border-[#F8D7E3] shadow-xs overflow-hidden no-print ${
          mobileLayoutMode === 'adaptive' ? 'hidden md:block' : 'block'
        }`}>
          {/* Header indicator */}
          <div className="px-3.5 py-2 bg-[#FFF8FA] border-b border-[#FCE7F3] text-xs text-[#854D67] flex items-center justify-between no-print">
            <span className="flex items-center gap-1">
              <span>ตารางแยก 13 คอลัมน์ทางการ: เลื่อนจอซ้าย-ขวาเพื่อดูข้อมูลทุกคอลัมน์</span>
            </span>
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
                <tr className="bg-[#FCE7F3]/80 text-[#701A4B] font-bold border-b border-[#F8D7E3] select-none">
                  {/* 1. ชั้นปี */}
                  <th 
                    onClick={() => handleSort('yearLevel')} 
                    className="py-3 px-3 text-center cursor-pointer hover:bg-[#FCE7F3] transition w-16 border-r border-[#F8D7E3]/70"
                  >
                    <div className="flex items-center justify-center gap-1">
                      <span>ชั้นปี</span>
                      <ArrowUpDown className="w-3 h-3 text-[#9D174D]" />
                    </div>
                  </th>

                  {/* 2. คณะ */}
                  <th className="py-3 px-3 border-r border-[#F8D7E3]/70 min-w-[95px]">คณะ</th>

                  {/* 3. สาขาวิชา */}
                  <th className="py-3 px-3 border-r border-[#F8D7E3]/70 min-w-[130px]">สาขาวิชา</th>

                  {/* 4. วันสอบ */}
                  <th 
                    onClick={() => handleSort('examDateISO')} 
                    className="py-3 px-3 cursor-pointer hover:bg-[#FCE7F3] transition min-w-[115px] border-r border-[#F8D7E3]/70"
                  >
                    <div className="flex items-center gap-1">
                      <span>วันสอบ</span>
                      <ArrowUpDown className="w-3 h-3 text-[#9D174D]" />
                    </div>
                  </th>

                  {/* 5. เวลาสอบ */}
                  <th className="py-3 px-3 min-w-[115px] border-r border-[#F8D7E3]/70 font-medium">เวลาสอบ</th>

                  {/* 6. รหัสวิชา */}
                  <th 
                    onClick={() => handleSort('courseCode')} 
                    className="py-3 px-3 cursor-pointer hover:bg-[#FCE7F3] transition min-w-[90px] border-r border-[#F8D7E3]/70"
                  >
                    <div className="flex items-center gap-1">
                      <span>รหัสวิชา</span>
                      <ArrowUpDown className="w-3 h-3 text-[#9D174D]" />
                    </div>
                  </th>

                  {/* 7. รายวิชา */}
                  <th className="py-3 px-3.5 min-w-[170px] border-r border-[#F8D7E3]/70">รายวิชา</th>

                  {/* 8. อาจารย์ผู้บรรยาย */}
                  <th className="py-3 px-3 min-w-[140px] border-r border-[#F8D7E3]/70">อาจารย์ผู้บรรยาย</th>

                  {/* 9. สถานที่ / ห้องสอบ */}
                  <th className="py-3 px-3 min-w-[125px] border-r border-[#F8D7E3]/70">สถานที่ / ห้องสอบ</th>

                  {/* 10. หมายเหตุ */}
                  <th className="py-3 px-2 text-center border-r border-[#F8D7E3]/70 min-w-[80px]">หมายเหตุ</th>

                  {/* 11. สถานะ */}
                  <th className="py-3 px-2 text-center w-20 border-r border-[#F8D7E3]/70">สถานะ</th>

                  {/* 12. นับถอยหลัง (no-print) */}
                  <th className="py-3 px-2.5 text-center min-w-[110px] border-r border-[#F8D7E3]/70 no-print">เวลานับถอยหลัง</th>

                  {/* 13. การจัดการ (no-print) */}
                  <th className="py-3 px-2 text-center w-24 no-print">การจัดการ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#FCE7F3]/70">
                {exams.length === 0 ? (
                  <tr>
                    <td colSpan={13} className="py-12 text-center text-slate-500">
                      <FileSpreadsheet className="w-8 h-8 mx-auto text-[#F8D7E3] mb-2" />
                      <p className="font-semibold text-sm text-slate-700">ไม่พบข้อมูลรายวิชาตามตัวกรองที่เลือก</p>
                      <button
                        onClick={onResetFilters}
                        className="mt-2 text-xs text-[#9D174D] underline font-semibold"
                      >
                        ล้างตัวกรองทั้งหมด
                      </button>
                    </td>
                  </tr>
                ) : (
                  exams.map((exam, index) => {
                    const isSaved = savedExamIds.includes(exam.id);
                    const isEven = index % 2 === 0;
                    const countdown = calculateCountdown(exam);
                    const isOwner = currentUser && (currentUser.role === 'admin' || isLecturerMatch(exam.lecturer, currentUser));

                    return (
                      <tr
                        key={exam.id}
                        className={`hover:bg-[#FFF0F5] transition-colors ${
                          isSaved 
                            ? 'bg-[#FFF2F6] font-medium' 
                            : isOwner
                            ? 'bg-[#FFF8FA] font-medium'
                            : isEven ? 'bg-white' : 'bg-[#FFF8FA]/50'
                        } ${isOwner ? 'border-l-4 border-l-[#9D174D]' : ''}`}
                      >
                        {/* 1. ชั้นปี */}
                        <td className="py-2.5 px-3 text-center border-r border-[#FCE7F3]/70">
                          <span className="inline-block px-2 py-0.5 rounded bg-[#FFF0F5] text-[#9D174D] font-bold text-[11px] border border-[#F8D7E3]">
                            ปี {exam.yearLevel}
                          </span>
                        </td>

                        {/* 2. คณะ */}
                        <td className="py-2.5 px-3 font-medium text-slate-800 border-r border-[#FCE7F3]/70">
                          {exam.faculty}
                        </td>

                        {/* 3. สาขาวิชา */}
                        <td className="py-2.5 px-3 text-slate-700 border-r border-[#FCE7F3]/70">
                          {exam.major}
                        </td>

                        {/* 4. วันสอบ */}
                        <td className="py-2.5 px-3 font-semibold text-slate-900 whitespace-nowrap border-r border-[#FCE7F3]/70">
                          {exam.examDateThai}
                        </td>

                        {/* 5. เวลาสอบ */}
                        <td className="py-2.5 px-3 font-mono text-slate-800 whitespace-nowrap border-r border-[#FCE7F3]/70">
                          {exam.examTimeThai}
                        </td>

                        {/* 6. รหัสวิชา */}
                        <td className="py-2.5 px-3 font-mono font-bold text-[#701A4B] whitespace-nowrap border-r border-[#FCE7F3]/70">
                          {exam.courseCode}
                        </td>

                        {/* 7. รายวิชา */}
                        <td className="py-2.5 px-3.5 font-bold text-slate-900 border-r border-[#FCE7F3]/70">
                          <div 
                            onClick={() => onViewExamDetails?.(exam)}
                            className="hover:text-[#9D174D] cursor-pointer flex items-center justify-between group"
                            title="คลิกเพื่อดูรายละเอียดวิชา"
                          >
                            <span>{exam.courseName}</span>
                            <Eye className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 text-[#9D174D] transition-opacity shrink-0 ml-1" />
                          </div>
                          <div className="mt-1 flex items-center gap-1.5 flex-wrap">
                            {isOwner && (
                              <span className="inline-flex items-center gap-1 text-[10px] font-extrabold px-1.5 py-0.2 rounded-full bg-[#701A4B] text-white shadow-2xs">
                                <Sparkles className="w-2.5 h-2.5 text-amber-300" />
                                <span>วิชาของท่าน</span>
                              </span>
                            )}
                            {exam.examSubmissionStatus === 'submitted' ? (
                              <span 
                                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300 font-bold text-[10px]"
                                title={exam.examSubmissionDate ? `พร้อมสอบ (ส่งข้อสอบเมื่อ: ${exam.examSubmissionDate})` : 'พร้อมสอบ'}
                              >
                                <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                <span>พร้อมสอบ ✔</span>
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200 text-[10px]">
                                <Clock className="w-2.5 h-2.5 text-slate-400" />
                                <span>รอข้อสอบ</span>
                              </span>
                            )}
                          </div>
                        </td>

                        {/* 8. อาจารย์ผู้บรรยาย */}
                        <td className="py-2.5 px-3 text-slate-700 border-r border-[#FCE7F3]/70">
                          {exam.lecturer}
                        </td>

                        {/* 9. สถานที่ / ห้องสอบ */}
                        <td className="py-2.5 px-3 text-[#701A4B] font-semibold border-r border-[#FCE7F3]/70 text-[11px] whitespace-nowrap">
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3 h-3 text-[#E11D48] shrink-0" />
                            <span>ห้องประชุมชั้น 1</span>
                          </span>
                        </td>

                        {/* 10. หมายเหตุ */}
                        <td className="py-2.5 px-2 text-center border-r border-[#FCE7F3]/70">
                          {exam.notes ? (
                            <span className="inline-block px-2 py-0.5 rounded-full bg-[#FFF0F5] text-[#9D174D] text-[10px] font-semibold border border-[#F8D7E3]">
                              {exam.notes}
                            </span>
                          ) : (
                            <span className="text-slate-300">-</span>
                          )}
                        </td>

                        {/* 11. สถานะ */}
                        <td className="py-2.5 px-2 text-center border-r border-[#FCE7F3]/70">
                          <span className={`inline-block px-2 py-0.5 rounded text-[11px] font-medium border ${
                            exam.status === 'บรรพชิต'
                              ? 'bg-amber-50 text-amber-900 border-amber-200'
                              : 'bg-[#FFF0F5] text-[#9D174D] border-[#F8D7E3]'
                          }`}>
                            {exam.status}
                          </span>
                        </td>

                        {/* 12. เวลานับถอยหลัง (no-print) */}
                        <td className="py-2.5 px-2.5 text-center no-print border-r border-[#FCE7F3]/70">
                          <span className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded-full whitespace-nowrap ${
                            countdown.status === 'ongoing'
                              ? 'bg-emerald-100 text-emerald-800 animate-pulse border border-emerald-300'
                              : 'bg-[#FFF0F5] text-[#9D174D] border border-[#F8D7E3]'
                          }`}>
                            {countdown.label}
                          </span>
                        </td>

                        {/* 13. การจัดการ (no-print) */}
                        <td className="py-2.5 px-2 text-center no-print">
                          <div className="flex items-center justify-center gap-1">
                            {/* View details button */}
                            <button
                              onClick={() => onViewExamDetails?.(exam)}
                              title="ดูรายละเอียดวิชา"
                              className={`p-1.5 rounded-lg transition cursor-pointer ${
                                isOwner 
                                  ? 'text-[#9D174D] bg-[#FFF0F5] hover:bg-[#FCE7F3] border border-[#F8D7E3]' 
                                  : 'text-slate-400 hover:text-slate-700 hover:bg-slate-100'
                              }`}
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </button>

                            <button
                              onClick={() => onToggleSave(exam.id)}
                              title={isSaved ? 'นำออกจากวิชาของฉัน' : 'บันทึกเป็นวิชาของฉัน'}
                              className={`p-1.5 rounded-lg transition cursor-pointer ${
                                isSaved 
                                  ? 'text-[#E11D48] bg-[#FCE7F3] hover:bg-[#FBCFE8]' 
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
                              title="เปิดระบบแจ้งเตือน LINE สำหรับวิชานี้"
                              className="p-1.5 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition"
                            >
                              <Share2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
