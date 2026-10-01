import React, { useState, useMemo } from 'react';
import {
  ArrowLeft,
  ChevronRight,
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

export interface PendingExamsPageProps {
  exams: ExamItem[];
  initialMode?: 'pending' | 'submitted' | 'all';
  onBack: () => void;
  onNavigateToSchedule?: (
    facultyFilter?: string,
    yearFilter?: number | 'all',
    dateFilter?: string,
    searchFilter?: string
  ) => void;
  onViewExamDetails?: (exam: ExamItem) => void;
}

export const PendingExamsPage: React.FC<PendingExamsPageProps> = ({
  exams,
  initialMode = 'pending',
  onBack,
  onNavigateToSchedule,
  onViewExamDetails
}) => {
  const [submissionTab, setSubmissionTab] = useState<'pending' | 'submitted' | 'all'>(initialMode);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'บรรพชิต' | 'คฤหัสถ์'>('all');
  const [yearFilter, setYearFilter] = useState<number | 'all'>('all');
  const [facultyFilter, setFacultyFilter] = useState<string>('all');
  const [copied, setCopied] = useState(false);

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
      const isSubmitted = exam.examSubmissionStatus === 'submitted';
      if (submissionTab === 'pending' && isSubmitted) return false;
      if (submissionTab === 'submitted' && !isSubmitted) return false;

      if (statusFilter !== 'all' && exam.status !== statusFilter) {
        return false;
      }

      if (yearFilter !== 'all' && exam.yearLevel !== yearFilter) {
        return false;
      }

      if (facultyFilter !== 'all' && exam.faculty !== facultyFilter) {
        return false;
      }

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchCourse = exam.courseName.toLowerCase().includes(q);
        const matchCode = exam.courseCode.toLowerCase().includes(q);
        const matchLecturer = (exam.lecturer || '').toLowerCase().includes(q);
        const matchFaculty = (exam.faculty || '').toLowerCase().includes(q);
        if (!matchCourse && !matchCode && !matchLecturer && !matchFaculty) {
          return false;
        }
      }

      return true;
    });
  }, [exams, submissionTab, statusFilter, yearFilter, facultyFilter, searchQuery]);

  // Copy Reminder Message for LINE Group
  const handleCopyLineReminder = () => {
    const pendingList = filteredList.filter(e => e.examSubmissionStatus !== 'submitted');
    if (pendingList.length === 0) {
      alert('ไม่พบรายวิชาที่ค้างส่งข้อสอบตามตัวกรองนี้');
      return;
    }

    let message = `📢 [แจ้งเตือน] รายวิชาที่รอส่งต้นฉบับข้อสอบปลายภาค 2/2568\n`;
    message += `วิทยาลัยสงฆ์พ่อขุนผาเมือง มจร\n`;
    message += `(ข้อมูล ณ ${new Date().toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: 'numeric' })})\n\n`;

    // Group by status & year
    const groups: { [key: string]: ExamItem[] } = {};
    pendingList.forEach(e => {
      const key = `${e.status} ชั้นปีที่ ${e.yearLevel}`;
      if (!groups[key]) groups[key] = [];
      groups[key].push(e);
    });

    Object.keys(groups).sort().forEach(groupTitle => {
      message += `📌 ${groupTitle}:\n`;
      groups[groupTitle].forEach((item, idx) => {
        message += `  ${idx + 1}. [${item.courseCode}] ${item.courseName}\n`;
        message += `     อาจารย์: ${item.lecturer}\n`;
        message += `     วันสอบ: ${item.examDateThai} (${item.examTimeThai})\n`;
      });
      message += `\n`;
    });

    message += `👉 รบกวนท่านอาจารย์จัดส่งไฟล์ข้อสอบในระบบ หรือติดต่อฝ่ายวิชาการ ขอบคุณครับ/ค่ะ`;

    navigator.clipboard.writeText(message).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    });
  };

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
            <span>กลับหน้า Dashboard</span>
          </button>
          <div className="flex items-center gap-2 text-xs sm:text-sm text-slate-500">
            <button onClick={onBack} className="hover:text-[#9D174D] transition cursor-pointer">หน้าหลัก</button>
            <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
            <button onClick={onBack} className="hover:text-[#9D174D] transition cursor-pointer">Dashboard</button>
            <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
            <span className="font-semibold text-[#9D174D]">ติดตามสถานะการส่งข้อสอบ</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleCopyLineReminder}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 text-white font-bold text-xs shadow-xs transition cursor-pointer"
          >
            {copied ? (
              <>
                <Check className="w-4 h-4 text-emerald-200" />
                <span>คัดลอกข้อความ LINE แล้ว!</span>
              </>
            ) : (
              <>
                <Copy className="w-4 h-4" />
                <span>คัดลอกข้อความแจ้งเตือน LINE</span>
              </>
            )}
          </button>
          <button
            onClick={() => window.print()}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 hover:text-[#9D174D] text-xs font-semibold shadow-xs transition cursor-pointer"
          >
            <Printer className="w-4 h-4 text-[#9D174D]" />
            <span className="hidden sm:inline">พิมพ์รายงาน</span>
          </button>
        </div>
      </div>

      {/* 2. Top Overview & Mode Tabs */}
      <div className="bg-white rounded-3xl border border-[#F8D7E3] p-6 shadow-sm space-y-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 flex items-center gap-2.5">
              <span className="p-2 rounded-xl bg-[#FFF0F5] text-[#9D174D] border border-[#F8D7E3]">
                <Layers className="w-6 h-6" />
              </span>
              <span>ติดตามสถานะการส่งข้อสอบปลายภาค</span>
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              วิทยาลัยสงฆ์พ่อขุนผาเมือง มหาวิทยาลัยมหาจุฬาลงกรณราชวิทยาลัย (MCU)
            </p>
          </div>

          {/* Tab Switcher: Pending / Submitted / All */}
          <div className="flex items-center p-1.5 bg-slate-100/90 rounded-2xl border border-slate-200/80 gap-1 self-start md:self-auto">
            <button
              onClick={() => setSubmissionTab('pending')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition cursor-pointer ${
                submissionTab === 'pending'
                  ? 'bg-amber-500 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
              }`}
            >
              <Clock className="w-4 h-4" />
              <span>รอส่งข้อสอบ</span>
              <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                submissionTab === 'pending' ? 'bg-amber-600 text-white' : 'bg-slate-200 text-slate-700'
              }`}>
                {pendingCount}
              </span>
            </button>

            <button
              onClick={() => setSubmissionTab('submitted')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition cursor-pointer ${
                submissionTab === 'submitted'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
              }`}
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>พร้อมสอบแล้ว</span>
              <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                submissionTab === 'submitted' ? 'bg-emerald-700 text-white' : 'bg-slate-200 text-slate-700'
              }`}>
                {submittedCount}
              </span>
            </button>

            <button
              onClick={() => setSubmissionTab('all')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition cursor-pointer ${
                submissionTab === 'all'
                  ? 'bg-[#9D174D] text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
              }`}
            >
              <span>ทั้งหมด</span>
              <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                submissionTab === 'all' ? 'bg-[#701A4B] text-white' : 'bg-slate-200 text-slate-700'
              }`}>
                {totalCount}
              </span>
            </button>
          </div>
        </div>

        {/* 3. Search & Filter Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3 pt-4 border-t border-slate-100">
          {/* Search input */}
          <div className="lg:col-span-5 relative">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="ค้นหารหัสวิชา, ชื่อวิชา, ชื่ออาจารย์ผู้สอน..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50/70 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#9D174D]/20 focus:border-[#9D174D] text-xs sm:text-sm text-slate-800 transition"
            />
          </div>

          {/* Student Status Filter (บรรพชิต / คฤหัสถ์) */}
          <div className="lg:col-span-3 flex items-center bg-slate-100/80 p-1 rounded-xl border border-slate-200/80 text-xs">
            <button
              onClick={() => setStatusFilter('all')}
              className={`flex-1 py-1.5 text-center font-bold rounded-lg transition cursor-pointer ${
                statusFilter === 'all' ? 'bg-white text-[#9D174D] shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              ทั้งหมด
            </button>
            <button
              onClick={() => setStatusFilter('บรรพชิต')}
              className={`flex-1 py-1.5 text-center font-bold rounded-lg transition cursor-pointer ${
                statusFilter === 'บรรพชิต' ? 'bg-amber-100 text-amber-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              บรรพชิต
            </button>
            <button
              onClick={() => setStatusFilter('คฤหัสถ์')}
              className={`flex-1 py-1.5 text-center font-bold rounded-lg transition cursor-pointer ${
                statusFilter === 'คฤหัสถ์' ? 'bg-blue-100 text-blue-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              คฤหัสถ์
            </button>
          </div>

          {/* Year level filter */}
          <div className="lg:col-span-2">
            <select
              value={yearFilter}
              onChange={(e) => setYearFilter(e.target.value === 'all' ? 'all' : Number(e.target.value))}
              className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50/70 focus:bg-white text-xs sm:text-sm text-slate-700 cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#9D174D]/20 focus:border-[#9D174D]"
            >
              <option value="all">ทุกชั้นปี (ปี 1-4)</option>
              <option value="1">ชั้นปีที่ 1</option>
              <option value="2">ชั้นปีที่ 2</option>
              <option value="3">ชั้นปีที่ 3</option>
              <option value="4">ชั้นปีที่ 4</option>
            </select>
          </div>

          {/* Faculty filter */}
          <div className="lg:col-span-2">
            <select
              value={facultyFilter}
              onChange={(e) => setFacultyFilter(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50/70 focus:bg-white text-xs sm:text-sm text-slate-700 cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#9D174D]/20 focus:border-[#9D174D]"
            >
              <option value="all">ทุกคณะ / สาขา</option>
              {faculties.map(f => (
                <option key={f} value={f}>{f}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* 4. Filter Results Summary & Action Table */}
      <div className="bg-white rounded-3xl border border-[#F8D7E3] shadow-sm overflow-hidden">
        <div className="px-6 py-4 bg-slate-50/80 border-b border-slate-200 flex items-center justify-between text-xs sm:text-sm text-slate-600">
          <div className="flex items-center gap-2">
            <span>พบทั้งหมด:</span>
            <span className="font-bold text-[#9D174D] text-base">{filteredList.length}</span>
            <span>รายวิชา</span>
            {searchQuery && (
              <span className="text-slate-400">
                (จากคำค้น "{searchQuery}")
              </span>
            )}
          </div>
          {onNavigateToSchedule && (
            <button
              onClick={() => onNavigateToSchedule(facultyFilter !== 'all' ? facultyFilter : undefined, yearFilter !== 'all' ? yearFilter : undefined, undefined, searchQuery || undefined)}
              className="text-xs text-[#9D174D] hover:underline font-semibold flex items-center gap-1 cursor-pointer"
            >
              <span>เปิดดูในตารางสอบทางการ</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Courses Table */}
        {filteredList.length === 0 ? (
          <div className="p-12 text-center text-slate-500 space-y-3">
            <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto text-slate-400">
              <Search className="w-6 h-6" />
            </div>
            <div className="font-bold text-slate-700">ไม่พบรายวิชาที่ตรงกับเงื่อนไข</div>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              ลองเปลี่ยนคำค้นหา หรือรีเซ็ตตัวกรองชั้นปีและคณะด้านบน
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/60 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  <th className="py-3 px-4 w-12 text-center">ลำดับ</th>
                  <th className="py-3 px-4 w-28">รหัสวิชา</th>
                  <th className="py-3 px-4">ชื่อรายวิชา</th>
                  <th className="py-3 px-4 w-44">อาจารย์ผู้สอน</th>
                  <th className="py-3 px-4 w-32">ชั้นปี / กลุ่ม</th>
                  <th className="py-3 px-4 w-40">วัน-เวลาสอบ</th>
                  <th className="py-3 px-4 w-32 text-center">สถานะข้อสอบ</th>
                  <th className="py-3 px-4 w-24 text-center">จัดการ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs sm:text-sm">
                {filteredList.map((exam, index) => {
                  const isSubmitted = exam.examSubmissionStatus === 'submitted';
                  const isMonk = exam.status === 'บรรพชิต';

                  return (
                    <tr
                      key={exam.id}
                      className="hover:bg-[#FFF0F5]/40 transition group"
                    >
                      <td className="py-3 px-4 text-center text-slate-400 font-mono text-xs">
                        {index + 1}
                      </td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 rounded font-mono font-bold text-xs bg-slate-100 text-slate-700 border border-slate-200">
                          {exam.courseCode}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <button
                          onClick={() => onViewExamDetails && onViewExamDetails(exam)}
                          className="font-bold text-slate-800 hover:text-[#9D174D] text-left transition cursor-pointer flex items-center gap-1.5 group-hover:underline"
                        >
                          <span>{exam.courseName}</span>
                        </button>
                        <div className="text-[11px] text-slate-400 mt-0.5">
                          {exam.faculty} {exam.major ? `(${exam.major})` : ''}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="text-xs text-slate-700 font-medium">
                          {exam.lecturer}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1">
                          <span className={`px-2 py-0.5 rounded text-[11px] font-semibold ${
                            isMonk 
                              ? 'bg-amber-50 text-amber-800 border border-amber-200' 
                              : 'bg-blue-50 text-blue-800 border border-blue-200'
                          }`}>
                            {exam.status} (ปี {exam.yearLevel})
                          </span>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="text-xs text-slate-800">{exam.examDateThai}</div>
                        <div className="text-[11px] text-[#9D174D] font-medium">{exam.examTimeThai} น.</div>
                      </td>
                      <td className="py-3 px-4 text-center">
                        {isSubmitted ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                            <span>พร้อมสอบ</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200">
                            <Clock className="w-3.5 h-3.5 text-amber-600" />
                            <span>รอส่งข้อสอบ</span>
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <button
                          onClick={() => onViewExamDetails && onViewExamDetails(exam)}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-[#FFF0F5] text-slate-700 hover:text-[#9D174D] border border-slate-200 text-xs font-medium transition cursor-pointer shadow-xs"
                          title="ดูรายละเอียดรายวิชา"
                        >
                          <Eye className="w-3.5 h-3.5 text-[#9D174D]" />
                          <span>ดูวิชา</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
