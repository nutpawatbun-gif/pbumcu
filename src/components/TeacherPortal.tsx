import React, { useState } from 'react';
import { 
  UserCheck, 
  Plus, 
  Edit3, 
  Trash2, 
  Send, 
  Download, 
  Upload, 
  RotateCcw, 
  Sparkles, 
  ShieldCheck, 
  FileSpreadsheet, 
  Search, 
  Smartphone, 
  Table as TableIcon, 
  Calendar, 
  Clock, 
  MapPin, 
  LayoutGrid, 
  Columns, 
  Printer, 
  FolderUp, 
  ExternalLink, 
  CheckCircle2, 
  Settings2,
  X,
  Save,
  Lock,
  Files,
  Eye
} from 'lucide-react';
import { ExamItem, TeacherUser } from '../types/exam';
import { formatLineNotifyMessage, sendLineNotifyNotification } from '../utils/notifications';
import { exportExamsToExcel } from '../utils/excelExport';
import { isLecturerMatch, TEACHER_PROFILES } from '../utils/teacherMatching';
import { ExamUploadDriveModal } from './ExamUploadDriveModal';
import { AdminBatchExamUploadModal } from './AdminBatchExamUploadModal';

interface TeacherPortalProps {
  currentUser: TeacherUser | null;
  onOpenLogin: () => void;
  exams: ExamItem[];
  onAddNewExam: () => void;
  onEditExam: (exam: ExamItem) => void;
  onDeleteExam: (id: string) => void;
  onResetToDefault: () => void;
  onExportCSV: () => void;
  onExportExcel?: () => void;
  onPrint?: () => void;
  onImportJSON: (e: React.ChangeEvent<HTMLInputElement>) => void;
  lineNotifyToken?: string;
  webhookUrl?: string;
  isWidescreen?: boolean;
  centralDriveFolderUrl?: string;
  onUpdateCentralDriveFolder?: (url: string) => void;
  onToggleSubmissionStatus?: (examId: string) => void;
  onUploadExamSuccess?: (examId: string, fileUrl: string, uploadedDate: string) => void;
  onBatchUploadSuccess?: (updates: { examId: string; fileUrl?: string; uploadedDate: string; fileName: string }[]) => void;
  onViewExamDetails?: (exam: ExamItem) => void;
}

export const TeacherPortal: React.FC<TeacherPortalProps> = ({
  currentUser,
  onOpenLogin,
  exams,
  onAddNewExam,
  onViewExamDetails,
  onEditExam,
  onDeleteExam,
  onResetToDefault,
  onExportCSV,
  onExportExcel,
  onPrint,
  onImportJSON,
  lineNotifyToken,
  webhookUrl,
  isWidescreen,
  centralDriveFolderUrl = 'https://drive.google.com/drive/folders/1yc7VLWVCYtH8n1NqWymKmeu1kaNJRDBa?usp=sharing',
  onUpdateCentralDriveFolder,
  onToggleSubmissionStatus,
  onUploadExamSuccess,
  onBatchUploadSuccess
}) => {
  const isAdmin = currentUser?.role === 'admin';
  const [filterMyCoursesOnly, setFilterMyCoursesOnly] = useState(currentUser ? currentUser.role !== 'admin' : true);
  const [adminSelectedTeacherId, setAdminSelectedTeacherId] = useState<string>('all');
  const [broadcastStatus, setBroadcastStatus] = useState<string | null>(null);
  const [tableSearch, setTableSearch] = useState('');
  const [mobileLayoutMode, setMobileLayoutMode] = useState<'adaptive' | 'wide'>('adaptive');
  const [tableLayoutMode, setTableLayoutMode] = useState<'autofit' | 'full'>('autofit');

  // Modal for changing central Google Drive folder URL
  const [isEditDriveModalOpen, setIsEditDriveModalOpen] = useState(false);
  const [tempDriveUrl, setTempDriveUrl] = useState(centralDriveFolderUrl);

  // Modal for uploading exam paper directly with auto-created folder & file naming
  const [uploadModalExam, setUploadModalExam] = useState<ExamItem | null>(null);

  // Modal for admin batch uploading multiple exams
  const [isBatchUploadModalOpen, setIsBatchUploadModalOpen] = useState(false);

  const effectiveCentralDriveUrl = centralDriveFolderUrl || 'https://drive.google.com/drive/folders/';

  // If not logged in
  if (!currentUser) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center space-y-6">
        <div className="w-16 h-16 rounded-2xl bg-[#FFF0F5] text-[#9D174D] flex items-center justify-center mx-auto shadow-xs border border-[#F8D7E3]">
          <UserCheck className="w-8 h-8" />
        </div>
        <div className="space-y-2">
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900">เข้าสู่ระบบสำหรับอาจารย์ผู้สอน</h2>
          <p className="text-xs sm:text-sm text-[#854D67] max-w-md mx-auto">
            กรุณาเข้าสู่ระบบด้วยรหัสผ่านอาจารย์ เพื่อตั้งเวลาสอบ แก้ไขรายวิชา ส่งข้อสอบขึ้น Google Drive หรือยิงแจ้งเตือนนิสิต
          </p>
        </div>

        <button
          onClick={onOpenLogin}
          className="px-6 py-2.5 bg-[#9D174D] hover:bg-[#831843] text-white font-semibold text-xs sm:text-sm rounded-xl shadow-xs transition inline-flex items-center gap-2"
        >
          <UserCheck className="w-4 h-4" />
          <span>คลิกเข้าสู่ระบบอาจารย์ (Passcode)</span>
        </button>

        <div className="p-4 bg-white rounded-2xl border border-[#F8D7E3] text-xs text-slate-800 text-left max-w-md mx-auto space-y-1.5 shadow-2xs">
          <p className="font-bold flex items-center gap-1.5 text-[#701A4B]">
            <Sparkles className="w-4 h-4 text-[#E11D48]" />
            <span>รหัสสาธิตสำหรับทดสอบระบบ (Demo Passcodes):</span>
          </p>
          <p>• ผศ.ปัญญา กันภัย: <code className="font-bold font-mono bg-[#FFF0F5] text-[#701A4B] px-2 py-0.5 rounded border border-[#F8D7E3]">PANYA99</code></p>
          <p>• พระมหาภาคภูมิ ภทฺทเมธี: <code className="font-bold font-mono bg-[#FFF0F5] text-[#701A4B] px-2 py-0.5 rounded border border-[#F8D7E3]">BHAK88</code></p>
          <p>• ผศ.ดร.สุพล ศิริ: <code className="font-bold font-mono bg-[#FFF0F5] text-[#701A4B] px-2 py-0.5 rounded border border-[#F8D7E3]">SUPOL77</code></p>
        </div>
      </div>
    );
  }

  // Filter exams for teacher using accurate matching
  const myExams = exams.filter(e => {
    if (tableSearch.trim()) {
      const q = tableSearch.toLowerCase().trim();
      const match = e.courseCode.toLowerCase().includes(q) ||
                    e.courseName.toLowerCase().includes(q) ||
                    e.lecturer.toLowerCase().includes(q) ||
                    e.faculty.toLowerCase().includes(q) ||
                    e.major.toLowerCase().includes(q);
      if (!match) return false;
    }

    if (isAdmin) {
      if (adminSelectedTeacherId !== 'all') {
        const targetTeacher = TEACHER_PROFILES.find(t => t.id === adminSelectedTeacherId);
        return isLecturerMatch(e.lecturer, targetTeacher);
      }
      return true;
    }

    if (filterMyCoursesOnly) {
      return isLecturerMatch(e.lecturer, currentUser);
    }
    return true;
  });

  const submittedCount = myExams.filter(e => e.examSubmissionStatus === 'submitted').length;
  const submissionPercentage = myExams.length > 0 ? Math.round((submittedCount / myExams.length) * 100) : 0;

  const handleBroadcastCourse = async (exam: ExamItem) => {
    setBroadcastStatus(`กำลังส่งการแจ้งเตือนวิชา ${exam.courseCode}...`);
    const msg = formatLineNotifyMessage(exam, 'ประกาศกำหนดการสอบจากอาจารย์');
    const res = await sendLineNotifyNotification(msg, lineNotifyToken, webhookUrl);
    setBroadcastStatus(res.message);
    setTimeout(() => setBroadcastStatus(null), 4000);
  };

  const handleBroadcastAll = async () => {
    if (myExams.length === 0) return;
    setBroadcastStatus('กำลังส่งข้อความแจ้งเตือน...');
    let successCount = 0;
    for (const ex of myExams.slice(0, 3)) {
      const msg = formatLineNotifyMessage(ex, 'ประกาศจากอาจารย์ผู้สอน');
      const res = await sendLineNotifyNotification(msg, lineNotifyToken, webhookUrl);
      if (res.success) successCount++;
    }
    setBroadcastStatus(`ยิงการแจ้งเตือนวิชาสอบเรียบร้อยแล้ว (${successCount} รายการ)`);
    setTimeout(() => setBroadcastStatus(null), 4000);
  };

  const handleSaveDriveUrl = (e: React.FormEvent) => {
    e.preventDefault();
    if (onUpdateCentralDriveFolder) {
      onUpdateCentralDriveFolder(tempDriveUrl.trim());
    }
    setIsEditDriveModalOpen(false);
  };

  return (
    <div className={`${isWidescreen ? 'max-w-[98%] 2xl:max-w-[1720px]' : 'max-w-7xl'} mx-auto px-2 sm:px-4 md:px-6 py-4 sm:py-6 space-y-4`}>
      {/* Top Banner for Teacher (Soft Pastel Pink) */}
      <div className="bg-white/95 rounded-2xl p-4 sm:p-5 border border-[#F8D7E3] shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="space-y-0.5">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-[#9D174D]" />
            <h1 className="text-base sm:text-lg font-bold text-[#701A4B]">
              ระบบจัดการสอบออนไลน์: {currentUser.name}
            </h1>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-[#FFF0F5] text-[#9D174D] font-bold border border-[#F8D7E3]">
              {isAdmin ? 'สิทธิ์ผู้ดูแลระบบ (Admin)' : 'อาจารย์ผู้บรรยาย'}
            </span>
          </div>
          <p className="text-xs sm:text-sm text-[#854D67]">
            วิทยาลัยสงฆ์พ่อขุนผาเมือง เพชรบูรณ์ · มหาวิทยาลัยมหาจุฬาลงกรณราชวิทยาลัย (MCU) · ตั้งวันเวลาสอบ แก้ไขห้องสอบ ส่งข้อสอบเข้า Google Drive หรือยิงแจ้งเตือนนิสิต
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 no-print">
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

          {isAdmin && (
            <button
              type="button"
              onClick={() => setIsBatchUploadModalOpen(true)}
              className="px-3.5 py-2 bg-[#FFF0F5] hover:bg-[#FCE7F3] text-[#701A4B] border border-[#F8D7E3] font-semibold text-xs rounded-xl shadow-2xs transition flex items-center gap-1.5 cursor-pointer"
              title="อัปโหลดข้อสอบหลายไฟล์พร้อมกันและจับคู่รายวิชาอัตโนมัติ (Admin)"
            >
              <Files className="w-3.5 h-3.5 text-[#9D174D]" />
              <span>⚡ อัปโหลดหลายไฟล์</span>
            </button>
          )}

          <button
            onClick={onAddNewExam}
            className="px-3.5 py-2 bg-[#9D174D] hover:bg-[#831843] text-white font-semibold text-xs rounded-xl shadow-2xs transition flex items-center gap-1.5"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>เพิ่มรายวิชาใหม่</span>
          </button>

          <button
            onClick={handleBroadcastAll}
            className="px-3.5 py-2 bg-white hover:bg-[#FFF0F5] text-[#701A4B] border border-[#F8D7E3] font-semibold text-xs rounded-xl shadow-2xs transition flex items-center gap-1.5 cursor-pointer"
          >
            <Send className="w-3.5 h-3.5 text-[#E11D48]" />
            <span>ยิงเตือน LINE</span>
          </button>

          <button
            onClick={() => onPrint ? onPrint() : window.print()}
            className="px-3.5 py-2 bg-white hover:bg-[#FFF0F5] text-[#701A4B] border border-[#F8D7E3] font-semibold text-xs rounded-xl shadow-2xs transition flex items-center gap-1.5 cursor-pointer"
            title="พิมพ์ตารางอาจารย์ (A4)"
          >
            <Printer className="w-3.5 h-3.5 text-[#9D174D]" />
            <span>พิมพ์ตาราง (A4)</span>
          </button>
        </div>
      </div>

      {/* Google Drive Central Exam Paper Submission Banner (รูปแบบที่ 1) */}
      <div className="bg-gradient-to-r from-emerald-50 via-emerald-100/50 to-emerald-50 border border-emerald-200 rounded-2xl p-4 sm:p-4.5 shadow-2xs no-print flex flex-col md:flex-row md:items-center justify-between gap-3.5">
        <div className="flex items-start sm:items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-white border border-emerald-300 text-emerald-700 flex items-center justify-center shrink-0 shadow-2xs">
            <FolderUp className="w-5 h-5 text-emerald-600" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-bold text-sm text-emerald-950">
                ระบบส่งต้นฉบับข้อสอบ (Google Drive) · วิทยาลัยสงฆ์พ่อขุนผาเมือง
              </h3>
              <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-white text-emerald-800 border border-emerald-200">
                พร้อมสอบ {submittedCount}/{myExams.length} วิชา ({submissionPercentage}%)
              </span>
            </div>
            <p className="text-xs text-emerald-800/80 mt-0.5">
              อาจารย์ผู้บรรยายสามารถคลิกปุ่ม <span className="font-bold text-emerald-950">"ส่งข้อสอบ (Drive)"</span> ในแต่ละวิชาเพื่อเปิดโฟลเดอร์ Google Drive และทำเครื่องหมายสถานะได้ทันที
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <a
            href={effectiveCentralDriveUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs rounded-xl shadow-2xs transition flex items-center gap-1.5 cursor-pointer"
          >
            <FolderUp className="w-3.5 h-3.5" />
            <span>เปิด Google Drive กลาง</span>
            <ExternalLink className="w-3 h-3 opacity-80" />
          </a>

          {isAdmin && (
            <>
              <button
                type="button"
                onClick={() => setIsBatchUploadModalOpen(true)}
                className="px-3.5 py-2 bg-[#9D174D] hover:bg-[#831843] text-white font-semibold text-xs rounded-xl shadow-2xs transition flex items-center gap-1.5 cursor-pointer"
                title="อัปโหลดข้อสอบหลายไฟล์พร้อมกันและจับคู่รายวิชาอัตโนมัติ (เฉพาะผู้ดูแลระบบ)"
              >
                <Files className="w-3.5 h-3.5 text-rose-200" />
                <span>⚡ อัปโหลดหลายไฟล์ (Admin Batch)</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setTempDriveUrl(effectiveCentralDriveUrl);
                  setIsEditDriveModalOpen(true);
                }}
                className="px-3 py-2 bg-white hover:bg-emerald-50 text-emerald-900 border border-emerald-300 font-semibold text-xs rounded-xl shadow-2xs transition flex items-center gap-1 cursor-pointer"
                title="ตั้งค่า/เปลี่ยนลิงก์ Google Drive กลาง (เฉพาะผู้ดูแลระบบ)"
              >
                <Settings2 className="w-3.5 h-3.5 text-emerald-700" />
                <span className="hidden sm:inline">ตั้งค่าโฟลเดอร์</span>
              </button>
            </>
          )}
        </div>
      </div>

      {broadcastStatus && (
        <div className="p-3 bg-[#FFF0F5] text-[#701A4B] border border-[#F8D7E3] rounded-2xl text-xs flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-[#E11D48] shrink-0" />
          <span>{broadcastStatus}</span>
        </div>
      )}

      {/* Control Bar: Filter, Search & Data Tools */}
      <div className="bg-white/95 rounded-2xl p-3.5 sm:p-4 border border-[#F8D7E3] shadow-xs flex flex-wrap items-center justify-between gap-3 no-print">
        <div className="flex flex-wrap items-center gap-3">
          {isAdmin ? (
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-[#701A4B] whitespace-nowrap">ตัวกรองรายวิชา (Admin):</span>
              <select
                value={adminSelectedTeacherId}
                onChange={(e) => setAdminSelectedTeacherId(e.target.value)}
                className="px-2.5 py-1.5 text-xs bg-[#FFF8FA] border border-[#F8D7E3] rounded-xl text-slate-800 font-medium focus:outline-none focus:ring-1 focus:ring-[#9D174D]"
              >
                <option value="all">👑 แสดงทั้งหมด ({exams.length} รายวิชา)</option>
                {TEACHER_PROFILES.filter(t => t.role !== 'admin').map(t => {
                  const count = exams.filter(e => isLecturerMatch(e.lecturer, t)).length;
                  return (
                    <option key={t.id} value={t.id}>
                      👨‍🏫 {t.name} ({count} รายวิชา)
                    </option>
                  );
                })}
              </select>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={filterMyCoursesOnly}
                  onChange={(e) => setFilterMyCoursesOnly(e.target.checked)}
                  className="w-4 h-4 text-[#9D174D] rounded focus:ring-[#F8D7E3]"
                />
                <span>แสดงเฉพาะวิชาที่ฉันสอน ({myExams.length} วิชา)</span>
              </label>
              {filterMyCoursesOnly && (
                <span className="text-[11px] px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 font-semibold border border-emerald-200">
                  ตรงกับ {currentUser.name}
                </span>
              )}
            </div>
          )}

          <div className="relative">
            <Search className="w-3.5 h-3.5 text-[#854D67] absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={tableSearch}
              onChange={(e) => setTableSearch(e.target.value)}
              placeholder="ค้นหารหัสวิชา, ชื่อวิชา..."
              className="pl-8 pr-3 py-1.5 text-xs bg-[#FFF8FA] border border-[#F8D7E3] rounded-xl focus:outline-none focus:ring-1 focus:ring-[#9D174D] text-slate-800"
            />
          </div>
        </div>

        {/* Data Tools */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => {
              exportExamsToExcel(
                myExams,
                `mcu-teacher-exams-${currentUser.name.replace(/\s+/g, '_')}`,
                `วิชาสอบของ ${currentUser.name}`
              );
            }}
            title="ส่งออกตารางของอาจารย์เป็นไฟล์ Microsoft Excel (.xlsx)"
            className="flex items-center gap-1 text-xs text-white bg-emerald-600 hover:bg-emerald-700 px-3 py-1.5 rounded-xl font-semibold transition shadow-2xs cursor-pointer"
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span>ส่งออก Excel ({myExams.length} วิชา)</span>
          </button>

          <button
            onClick={() => {
              const headers = [
                'ชั้นปี', 'คณะ', 'สาขาวิชา', 'วันสอบ', 'เวลาสอบ', 
                'รหัสวิชา', 'รายวิชา', 'อาจารย์ผู้บรรยาย', 'หมายเหตุ', 'สถานะ', 'ห้องสอบ', 'สถานะส่งข้อสอบ', 'ลิงก์ Google Drive'
              ];
              const rows = myExams.map(e => [
                e.yearLevel,
                `"${e.faculty}"`,
                `"${e.major}"`,
                `"${e.examDateThai}"`,
                `"${e.examTimeThai}"`,
                `"${e.courseCode}"`,
                `"${e.courseName.replace(/"/g, '""')}"`,
                `"${e.lecturer.replace(/"/g, '""')}"`,
                `"${e.notes.replace(/"/g, '""')}"`,
                `"${e.status}"`,
                `"${(e.room || 'ห้องประชุมชั้น 1').replace(/"/g, '""')}"`,
                `"${e.examSubmissionStatus === 'submitted' ? 'ส่งแล้ว' : 'รอส่ง'}"`,
                `"${e.driveFolderUrl || effectiveCentralDriveUrl}"`
              ]);
              const csvContent = '\uFEFF' + [headers.join(','), ...rows.map(r => r.join(','))].join('\r\n');
              const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
              const url = URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = `mcu-exams-${currentUser.name.replace(/\s+/g, '_')}.csv`;
              a.click();
              URL.revokeObjectURL(url);
            }}
            title="ดาวน์โหลดเป็นไฟล์ CSV สำรอง"
            className="flex items-center gap-1 text-xs text-slate-700 bg-white hover:bg-[#FFF0F5] px-3 py-1.5 rounded-xl border border-[#F8D7E3] transition shadow-2xs cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-[#9D174D]" />
            <span>ส่งออก CSV</span>
          </button>

          <label 
            title="นำเข้าข้อมูล JSON ตารางสอบ"
            className="flex items-center gap-1 text-xs text-slate-700 bg-white hover:bg-[#FFF0F5] px-3 py-1.5 rounded-xl border border-[#F8D7E3] cursor-pointer transition shadow-2xs"
          >
            <Upload className="w-3.5 h-3.5 text-[#9D174D]" />
            <span>นำเข้า JSON</span>
            <input type="file" accept=".json" onChange={onImportJSON} className="hidden" />
          </label>

          <button
            onClick={() => {
              if (window.confirm('คุณต้องการรีเซ็ตข้อมูลตารางสอบกลับเป็นข้อมูลตั้งต้น 91 วิชาใช่หรือไม่?')) {
                onResetToDefault();
              }
            }}
            title="รีเซ็ตกลับเป็นข้อมูลตั้งต้น 91 วิชา"
            className="flex items-center gap-1 text-xs text-[#9D174D] bg-[#FFF0F5] hover:bg-[#FCE7F3] px-3 py-1.5 rounded-xl border border-[#F8D7E3] transition"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>รีเซ็ต 91 วิชา</span>
          </button>
        </div>
      </div>

      {/* Teacher Courses Content */}
      {myExams.length === 0 ? (
        <div className="bg-white rounded-2xl p-10 sm:p-12 text-center border border-[#F8D7E3] space-y-3">
          <FileSpreadsheet className="w-12 h-12 text-[#F8D7E3] mx-auto" />
          <h3 className="text-sm font-bold text-slate-800">ไม่พบรายวิชาที่ตรงกับอาจารย์ผู้สอน</h3>
          <p className="text-xs text-[#854D67] max-w-md mx-auto">
            ท่านสามารถกดปุ่ม "เพิ่มรายวิชาใหม่" หรือปลดเครื่องหมาย "แสดงเฉพาะวิชาที่ฉันสอน" เพื่อดูและแก้ไขทุกรายวิชาในระบบ
          </p>
        </div>
      ) : (
        <>
          {/* Mobile Adaptive List */}
          <div className={`md:hidden space-y-3 ${mobileLayoutMode === 'wide' ? 'hidden' : 'block'}`}>
            {myExams.map((exam) => (
              <div
                key={exam.id}
                className="bg-white rounded-2xl p-3.5 border border-[#F8D7E3] shadow-2xs space-y-2.5"
              >
                <div className="flex items-center justify-between gap-1.5">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="font-mono font-bold text-xs px-2 py-0.5 rounded bg-white text-[#701A4B] border border-[#F8D7E3]">
                      {exam.courseCode}
                    </span>
                    <span className="text-xs font-semibold px-2 py-0.5 rounded bg-[#FFF0F5] text-[#9D174D] border border-[#F8D7E3]">
                      ปี {exam.yearLevel}
                    </span>
                    <span className="text-[11px] px-2 py-0.5 rounded bg-white text-slate-700 border border-slate-200">
                      {exam.status}
                    </span>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => onEditExam(exam)}
                      className="p-1.5 text-[#701A4B] hover:bg-[#FFF0F5] rounded-lg"
                      title="แก้ไขวิชา"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleBroadcastCourse(exam)}
                      className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-lg"
                      title="ส่งแจ้งเตือน LINE"
                    >
                      <Send className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => {
                        if (window.confirm(`ต้องการลบรายวิชา ${exam.courseCode} ${exam.courseName} หรือไม่?`)) {
                          onDeleteExam(exam.id);
                        }
                      }}
                      className="p-1.5 text-rose-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg"
                      title="ลบวิชา"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div 
                  onClick={() => onViewExamDetails?.(exam)}
                  className="flex items-center justify-between gap-1 group cursor-pointer"
                >
                  <h4 className="font-bold text-sm text-slate-900 leading-snug group-hover:text-[#9D174D] transition-colors">
                    {exam.courseName}
                  </h4>
                  <span className="shrink-0 inline-flex items-center gap-1 text-[11px] text-[#9D174D] bg-[#FFF0F5] px-2 py-0.5 rounded-lg border border-[#F8D7E3]">
                    <Eye className="w-3 h-3" />
                    <span>รายละเอียด</span>
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-x-2 gap-y-1 text-xs text-slate-600">
                  <div className="flex items-center gap-1 text-[#701A4B] font-semibold truncate">
                    <Calendar className="w-3.5 h-3.5 text-[#E11D48] shrink-0" />
                    <span className="truncate">{exam.examDateThai}</span>
                  </div>
                  <div className="flex items-center gap-1 font-mono text-slate-800 truncate">
                    <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="truncate">{exam.examTimeThai}</span>
                  </div>
                  <div className="col-span-2 flex items-center gap-1 text-[11px] text-[#701A4B] font-semibold">
                    <MapPin className="w-3.5 h-3.5 text-[#E11D48] shrink-0" />
                    <span>สถานที่: ห้องประชุมชั้น 1</span>
                  </div>
                  {exam.notes && (
                    <div className="col-span-2 text-[11px] text-[#9D174D] bg-[#FFF0F5] px-2 py-0.5 rounded">
                      หมายเหตุ: {exam.notes}
                    </div>
                  )}
                </div>

                {/* Google Drive Upload & Status Action Row for Mobile */}
                <div className="pt-2 border-t border-[#F8D7E3] flex items-center justify-between gap-2 flex-wrap">
                  {exam.examSubmissionStatus === 'submitted' ? (
                    <span
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 text-slate-500 rounded-xl text-xs font-semibold border border-slate-200 cursor-not-allowed select-none"
                      title="ส่งข้อสอบแล้ว (ระบบล็อกห้ามอัปโหลดซ้ำ เพื่อป้องกันความซ้ำซ้อน)"
                    >
                      <Lock className="w-3.5 h-3.5 text-slate-400" />
                      <span>ส่งแล้ว (ห้ามส่งซ้ำ)</span>
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setUploadModalExam(exam)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold shadow-2xs transition cursor-pointer"
                    >
                      <FolderUp className="w-3.5 h-3.5" />
                      <span>ส่งข้อสอบ (Drive)</span>
                    </button>
                  )}

                  {exam.examSubmissionStatus === 'submitted' ? (
                    <span
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border bg-emerald-50 text-emerald-900 border-emerald-300"
                      title={exam.examSubmissionDate ? `พร้อมสอบ (ส่งข้อสอบเมื่อ: ${exam.examSubmissionDate})` : 'พร้อมสอบ'}
                    >
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <span>พร้อมสอบ ✔ {exam.examSubmissionDate ? `(${exam.examSubmissionDate})` : ''}</span>
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={() => onToggleSubmissionStatus && onToggleSubmissionStatus(exam.id)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border transition bg-amber-50 text-amber-900 border-amber-300 hover:bg-amber-100 cursor-pointer"
                    >
                      <Clock className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                      <span>รอข้อสอบ (แตะเพื่อเปลี่ยน)</span>
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* MODE 1: AUTO-FIT TABLE (NO SCROLLBAR) */}
          {tableLayoutMode === 'autofit' && (
            <div className={`bg-white rounded-2xl border border-[#F8D7E3] shadow-xs overflow-hidden ${
              mobileLayoutMode === 'adaptive' ? 'hidden md:block' : 'block'
            }`}>
              <div className="px-3.5 py-2 bg-[#FFF8FA] border-b border-[#FCE7F3] text-xs text-[#854D67] flex items-center justify-between no-print">
                <span className="flex items-center gap-1.5 font-medium">
                  <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                  <span>ตารางอาจารย์ ขยายพอดีหน้าจออัตโนมัติ (Auto-Fit) พร้อมปุ่มส่งข้อสอบ Google Drive</span>
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
                    <th className="py-3 px-3 w-[15%] border-r border-[#F8D7E3]/70">ชั้นปี & คณะ / สาขา</th>
                    <th className="py-3 px-3 w-[16%] border-r border-[#F8D7E3]/70">วัน & เวลาสอบ</th>
                    <th className="py-3 px-3 w-[25%] border-r border-[#F8D7E3]/70">รหัส & รายวิชา</th>
                    <th className="py-3 px-3 w-[15%] border-r border-[#F8D7E3]/70">อาจารย์ผู้บรรยาย</th>
                    <th className="py-3 px-3 w-[19%] border-r border-[#F8D7E3]/70">ส่งข้อสอบ (Google Drive)</th>
                    <th className="py-3 px-2 text-center w-[10%] no-print">การจัดการ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#FCE7F3]/70">
                  {myExams.map((exam, index) => {
                    const isEven = index % 2 === 0;

                    return (
                      <tr
                        key={exam.id}
                        className={`hover:bg-[#FFF0F5] transition-colors ${isEven ? 'bg-white' : 'bg-[#FFF8FA]/50'}`}
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
                          <div className="mt-1">
                            <span className={`inline-block px-1.5 py-0.2 rounded text-[10px] font-medium border ${
                              exam.status === 'บรรพชิต'
                                ? 'bg-amber-50 text-amber-900 border-amber-200'
                                : 'bg-[#FFF0F5] text-[#9D174D] border-[#F8D7E3]'
                            }`}>
                              {exam.status}
                            </span>
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
                          <div className="text-[#701A4B] font-semibold text-[10.5px] flex items-center gap-1 mt-1">
                            <MapPin className="w-3 h-3 text-[#E11D48] shrink-0" />
                            <span>ห้องประชุมชั้น 1</span>
                          </div>
                        </td>

                        <td className="py-2.5 px-3 border-r border-[#FCE7F3]/70 align-top">
                          <span className="font-mono font-bold text-xs text-[#701A4B] bg-[#FFF0F5] px-1.5 py-0.5 rounded border border-[#F8D7E3]">
                            {exam.courseCode}
                          </span>
                          <div 
                            onClick={() => onViewExamDetails?.(exam)}
                            className="font-bold text-slate-900 text-xs mt-1 hover:text-[#9D174D] cursor-pointer flex items-center justify-between group"
                            title="คลิกดูรายละเอียดวิชา"
                          >
                            <span>{exam.courseName}</span>
                            <Eye className="w-3 h-3 text-[#9D174D] opacity-0 group-hover:opacity-100 transition-opacity shrink-0 ml-1" />
                          </div>
                          {exam.notes && (
                            <div className="text-[10px] text-[#9D174D] mt-0.5">
                              หมายเหตุ: {exam.notes}
                            </div>
                          )}
                        </td>

                        <td className="py-2.5 px-3 text-slate-700 border-r border-[#FCE7F3]/70 align-top">
                          <div className="font-medium text-slate-800 text-xs">
                            {exam.lecturer}
                          </div>
                        </td>

                        {/* Google Drive Upload & Submission Column */}
                        <td className="py-2.5 px-3 border-r border-[#FCE7F3]/70 align-top">
                          <div className="space-y-1.5">
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
                                className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold shadow-2xs transition cursor-pointer"
                                title="เปิดหน้าต่างส่งไฟล์ข้อสอบเข้า Google Drive"
                              >
                                <FolderUp className="w-3.5 h-3.5" />
                                <span>ส่งข้อสอบ (Drive)</span>
                              </button>
                            )}

                            <div>
                              {exam.examSubmissionStatus === 'submitted' ? (
                                <span
                                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border bg-emerald-50 text-emerald-900 border-emerald-300"
                                  title={exam.examSubmissionDate ? `พร้อมสอบ (ส่งข้อสอบเมื่อ: ${exam.examSubmissionDate})` : 'พร้อมสอบ'}
                                >
                                  <CheckCircle2 className="w-3 h-3 text-emerald-600 shrink-0" />
                                  <span>พร้อมสอบ ✔ {exam.examSubmissionDate ? `(${exam.examSubmissionDate})` : ''}</span>
                                </span>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => onToggleSubmissionStatus && onToggleSubmissionStatus(exam.id)}
                                  title="คลิกเพื่อบันทึกสถานะเป็นพร้อมสอบ"
                                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border transition cursor-pointer bg-amber-50 text-amber-900 border-amber-300 hover:bg-amber-100"
                                >
                                  <Clock className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                                  <span>รอข้อสอบ (คลิกเพื่อบันทึก)</span>
                                </button>
                              )}
                            </div>
                          </div>
                        </td>

                        <td className="py-2.5 px-2 text-center no-print align-top">
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

                            <button
                              onClick={() => onEditExam(exam)}
                              title="แก้ไขข้อมูลตารางสอบวิชานี้"
                              className="p-1.5 text-[#701A4B] hover:bg-[#FCE7F3] rounded-lg transition cursor-pointer"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>

                            <button
                              onClick={() => handleBroadcastCourse(exam)}
                              title="ส่งแจ้งเตือน LINE สำหรับวิชานี้"
                              className="p-1.5 text-emerald-600 hover:text-emerald-800 hover:bg-emerald-50 rounded-lg transition"
                            >
                              <Send className="w-3.5 h-3.5" />
                            </button>

                            <button
                              onClick={() => {
                                if (window.confirm(`ต้องการลบรายวิชา ${exam.courseCode} ${exam.courseName} หรือไม่?`)) {
                                  onDeleteExam(exam.id);
                                }
                              }}
                              title="ลบวิชานี้"
                              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
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
                      <th className="py-3 px-3 min-w-[115px] border-r border-[#F8D7E3]/70">วันสอบ</th>
                      <th className="py-3 px-3 min-w-[115px] border-r border-[#F8D7E3]/70">เวลาสอบ</th>
                      <th className="py-3 px-3 min-w-[90px] border-r border-[#F8D7E3]/70">รหัสวิชา</th>
                      <th className="py-3 px-3.5 min-w-[180px] border-r border-[#F8D7E3]/70">รายวิชา</th>
                      <th className="py-3 px-3 min-w-[140px] border-r border-[#F8D7E3]/70">อาจารย์ผู้บรรยาย</th>
                      <th className="py-3 px-3 min-w-[160px] border-r border-[#F8D7E3]/70">ส่งข้อสอบ (Google Drive)</th>
                      <th className="py-3 px-3 min-w-[125px] border-r border-[#F8D7E3]/70">สถานที่ / ห้องสอบ</th>
                      <th className="py-3 px-2 text-center border-r border-[#F8D7E3]/70">สถานะ</th>
                      <th className="py-3 px-2 text-center w-28 no-print">การจัดการ</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#FCE7F3]/70">
                    {myExams.map((exam, index) => {
                      const isEven = index % 2 === 0;

                      return (
                        <tr
                          key={exam.id}
                          className={`hover:bg-[#FFF0F5] transition-colors ${isEven ? 'bg-white' : 'bg-[#FFF8FA]/50'}`}
                        >
                          <td className="py-2.5 px-3 text-center border-r border-[#FCE7F3]/70">
                            <span className="inline-block px-2 py-0.5 rounded bg-[#FFF0F5] text-[#9D174D] font-bold text-[11px] border border-[#F8D7E3]">
                              ปี {exam.yearLevel}
                            </span>
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
                            {exam.notes && (
                              <div className="text-[10px] text-[#9D174D] font-normal">
                                {exam.notes}
                              </div>
                            )}
                          </td>
                          <td className="py-2.5 px-3 text-slate-700 border-r border-[#FCE7F3]/70">
                            {exam.lecturer}
                          </td>

                          {/* Google Drive Upload & Submission Column */}
                          <td className="py-2.5 px-3 border-r border-[#FCE7F3]/70">
                            <div className="space-y-1">
                              {exam.examSubmissionStatus === 'submitted' ? (
                                <span
                                  className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-slate-100 text-slate-500 rounded-lg text-xs font-semibold border border-slate-200 cursor-not-allowed select-none"
                                  title="ส่งข้อสอบแล้ว (ล็อกห้ามอัปโหลดซ้ำ เพื่อป้องกันความซ้ำซ้อน)"
                                >
                                  <Lock className="w-3.5 h-3.5 text-slate-400" />
                                  <span>ส่งแล้ว (ล็อก)</span>
                                </span>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => setUploadModalExam(exam)}
                                  className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold shadow-2xs transition cursor-pointer"
                                >
                                  <FolderUp className="w-3.5 h-3.5" />
                                  <span>ส่งข้อสอบ</span>
                                </button>
                              )}
                              <div>
                                {exam.examSubmissionStatus === 'submitted' ? (
                                  <span
                                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border bg-emerald-50 text-emerald-900 border-emerald-300"
                                    title={exam.examSubmissionDate ? `พร้อมสอบ (ส่งข้อสอบเมื่อ: ${exam.examSubmissionDate})` : 'พร้อมสอบ'}
                                  >
                                    <CheckCircle2 className="w-3 h-3 text-emerald-600 shrink-0" />
                                    <span>พร้อมสอบ ✔</span>
                                  </span>
                                ) : (
                                  <button
                                    type="button"
                                    onClick={() => onToggleSubmissionStatus && onToggleSubmissionStatus(exam.id)}
                                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border transition bg-amber-50 text-amber-900 border-amber-300 hover:bg-amber-100 cursor-pointer"
                                  >
                                    <Clock className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                                    <span>รอข้อสอบ</span>
                                  </button>
                                )}
                              </div>
                            </div>
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
                          <td className="py-2.5 px-2 text-center no-print">
                            <div className="flex items-center justify-center gap-1">
                              <button
                                onClick={() => onEditExam(exam)}
                                title="แก้ไขข้อมูลตารางสอบวิชานี้"
                                className="p-1.5 text-[#701A4B] hover:bg-[#FCE7F3] rounded-lg transition"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                              </button>

                              <button
                                onClick={() => handleBroadcastCourse(exam)}
                                title="ส่งแจ้งเตือน LINE สำหรับวิชานี้"
                                className="p-1.5 text-emerald-600 hover:text-emerald-800 hover:bg-emerald-50 rounded-lg transition"
                              >
                                <Send className="w-3.5 h-3.5" />
                              </button>

                              <button
                                onClick={() => {
                                  if (window.confirm(`ต้องการลบรายวิชา ${exam.courseCode} ${exam.courseName} หรือไม่?`)) {
                                    onDeleteExam(exam.id);
                                  }
                                }}
                                title="ลบวิชานี้"
                                className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
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

      {/* Modal for Setting Central Google Drive Folder URL (Admin only) */}
      {isAdmin && isEditDriveModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full border border-emerald-200 overflow-hidden">
            <div className="bg-gradient-to-r from-emerald-50 via-emerald-100/70 to-emerald-50 text-emerald-950 p-4 flex items-center justify-between border-b border-emerald-200">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-white border border-emerald-300 text-emerald-700 flex items-center justify-center shadow-2xs">
                  <FolderUp className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-sm">ตั้งค่าโฟลเดอร์ Google Drive กลาง</h3>
                  <p className="text-[11px] text-emerald-800/80">วิทยาลัยสงฆ์พ่อขุนผาเมือง เพชรบูรณ์</p>
                </div>
              </div>
              <button 
                onClick={() => setIsEditDriveModalOpen(false)}
                className="p-1 text-emerald-800 hover:bg-emerald-200/60 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveDriveUrl} className="p-4 sm:p-5 space-y-4">
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700">
                  URL โฟลเดอร์ Google Drive หรือ Google Form รับข้อสอบ:
                </label>
                <input
                  type="url"
                  required
                  value={tempDriveUrl}
                  onChange={(e) => setTempDriveUrl(e.target.value)}
                  placeholder="https://drive.google.com/drive/folders/..."
                  className="w-full px-3 py-2 text-xs bg-[#FFF8FA] border border-[#F8D7E3] rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-800"
                />
                <p className="text-[11px] text-slate-500">
                  อาจารย์ผู้สอนทุกท่านสามารถกดปุ่ม "ส่งข้อสอบ" เพื่อเปิดโฟลเดอร์นี้และลากไฟล์ข้อสอบ PDF/Word วางได้โดยตรง
                </p>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsEditDriveModalOpen(false)}
                  className="px-3.5 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-xs transition flex items-center gap-1.5"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>บันทึกลิงก์ Drive</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal for Uploading Exam Paper to Google Drive */}
      <ExamUploadDriveModal
        isOpen={!!uploadModalExam}
        onClose={() => setUploadModalExam(null)}
        exam={uploadModalExam}
        currentUser={currentUser}
        centralDriveFolderUrl={effectiveCentralDriveUrl}
        webhookUrl={webhookUrl}
        onUploadSuccess={(examId, fileUrl, dateStr) => {
          if (onUploadExamSuccess) {
            onUploadExamSuccess(examId, fileUrl, dateStr);
          }
        }}
      />

      {/* Modal for Admin Batch Exam Upload & Smart Matching */}
      <AdminBatchExamUploadModal
        isOpen={isBatchUploadModalOpen}
        onClose={() => setIsBatchUploadModalOpen(false)}
        exams={exams}
        currentUser={currentUser}
        centralDriveFolderUrl={effectiveCentralDriveUrl}
        webhookUrl={webhookUrl}
        onBatchUploadSuccess={(updates) => {
          if (onBatchUploadSuccess) {
            onBatchUploadSuccess(updates);
          }
        }}
      />
    </div>
  );
};
