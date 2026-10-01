import React, { useState, useMemo, useEffect } from 'react';
import { 
  ArrowLeft,
  ChevronRight,
  Printer, 
  ExternalLink, 
  Download, 
  FileSpreadsheet, 
  AlertCircle, 
  Sparkles, 
  Layers
} from 'lucide-react';
import { ExamItem, TeacherUser } from '../types/exam';
import { exportExamsToExcel } from '../utils/excelExport';
import { 
  generatePrintableHtml, 
  createPrintBlobUrl, 
  downloadPrintableHtml,
  triggerBrowserPrint
} from '../utils/printHelper';
import { isLecturerMatch } from '../utils/teacherMatching';

export interface PrintSetupPageProps {
  exams: ExamItem[];
  currentUser: TeacherUser | null;
  savedExamIds: string[];
  initialScope?: 'all' | 'teacher' | 'saved';
  onBack: () => void;
  onSyncPrintExams?: (exams: ExamItem[], subtitle: string, signatoryTeacher?: string) => void;
}

export const PrintSetupPage: React.FC<PrintSetupPageProps> = ({
  exams,
  currentUser,
  savedExamIds,
  initialScope = 'all',
  onBack,
  onSyncPrintExams
}) => {
  const isTeacher = Boolean(currentUser && currentUser.role !== 'admin');
  
  const [scope, setScope] = useState<'all' | 'teacher' | 'saved' | 'year1' | 'year2' | 'year3' | 'year4'>(() => {
    if (initialScope === 'teacher' && isTeacher) return 'teacher';
    if (initialScope === 'saved') return 'saved';
    return isTeacher ? 'teacher' : 'all';
  });

  const [orientation, setOrientation] = useState<'landscape' | 'portrait'>('landscape');
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const filteredExams = useMemo(() => {
    switch (scope) {
      case 'teacher':
        if (!currentUser) return [];
        return exams.filter(e => isLecturerMatch(e.lecturer, currentUser));
      case 'saved':
        return exams.filter(e => savedExamIds.includes(e.id));
      case 'year1':
        return exams.filter(e => e.yearLevel === 1);
      case 'year2':
        return exams.filter(e => e.yearLevel === 2);
      case 'year3':
        return exams.filter(e => e.yearLevel === 3);
      case 'year4':
        return exams.filter(e => e.yearLevel === 4);
      case 'all':
      default:
        return exams;
    }
  }, [exams, scope, currentUser, savedExamIds]);

  const printSubtitle = useMemo(() => {
    let sub = 'ตารางสอบไล่ ประจำภาคการศึกษาที่ 1 ปีการศึกษา 2569';
    if (scope === 'teacher' && currentUser) {
      sub += ` (เฉพาะรายวิชาของ: ${currentUser.name})`;
    } else if (scope === 'saved') {
      sub += ' (เฉพาะรายวิชาที่บันทึกไว้)';
    } else if (scope.startsWith('year')) {
      const yr = scope.replace('year', '');
      sub += ` (เฉพาะนิสิตชั้นปีที่ ${yr})`;
    }
    return sub;
  }, [scope, currentUser]);

  const signatoryTeacher = useMemo(() => {
    return (scope === 'teacher' && currentUser) ? currentUser.name : undefined;
  }, [scope, currentUser]);

  useEffect(() => {
    if (onSyncPrintExams) {
      onSyncPrintExams(filteredExams, printSubtitle, signatoryTeacher);
    }
  }, [filteredExams, printSubtitle, signatoryTeacher, onSyncPrintExams]);

  const handlePrintStandard = () => {
    if (filteredExams.length === 0) {
      setStatusMessage('⚠️ ไม่มีรายวิชาสำหรับพิมพ์ในเงื่อนไขที่เลือก');
      return;
    }
    window.print();
  };

  const handleOpenIsolatedPrintTab = () => {
    if (filteredExams.length === 0) {
      setStatusMessage('⚠️ ไม่มีรายวิชาสำหรับพิมพ์');
      return;
    }
    const html = generatePrintableHtml(filteredExams, {
      title: 'มหาวิทยาลัยมหาจุฬาลงกรณราชวิทยาลัย (MCU)',
      college: 'วิทยาลัยสงฆ์พ่อขุนผาเมือง เพชรบูรณ์',
      subtitle: printSubtitle,
      signatoryTeacher: signatoryTeacher,
      orientation: orientation
    });
    const url = createPrintBlobUrl(html);
    window.open(url, '_blank');
  };

  const handleDownloadHtml = () => {
    if (filteredExams.length === 0) {
      setStatusMessage('⚠️ ไม่มีรายวิชาสำหรับดาวน์โหลด');
      return;
    }
    const html = generatePrintableHtml(filteredExams, {
      title: 'มหาวิทยาลัยมหาจุฬาลงกรณราชวิทยาลัย (MCU)',
      college: 'วิทยาลัยสงฆ์พ่อขุนผาเมือง เพชรบูรณ์',
      subtitle: printSubtitle,
      signatoryTeacher: signatoryTeacher,
      orientation: orientation
    });
    downloadPrintableHtml(html, `MCU_Exam_Schedule_${scope}.html`);
  };

  const handleExportExcel = () => {
    if (filteredExams.length === 0) {
      setStatusMessage('⚠️ ไม่มีรายวิชาสำหรับส่งออก Excel');
      return;
    }
    exportExamsToExcel(filteredExams, `MCU_Exam_Schedule_${scope}`);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200 max-w-4xl mx-auto">
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
            <span className="font-semibold text-[#9D174D]">ตั้งค่าและพิมพ์ตารางสอบทางการ (A4)</span>
          </div>
        </div>
      </div>

      {/* 2. Main Card */}
      <div className="bg-white rounded-3xl border border-[#F8D7E3] shadow-sm overflow-hidden">
        {/* Banner Header */}
        <div className="bg-gradient-to-r from-[#FFF0F5] via-[#FFF5F8] to-[#FFF0F5] border-b border-[#F8D7E3] p-6 sm:p-8">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-[#9D174D] text-white flex items-center justify-center shrink-0 shadow-md">
              <Printer className="w-8 h-8 text-rose-100" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-slate-900">
                ตั้งค่าและพิมพ์ตารางสอบไล่ทางการ (A4)
              </h1>
              <p className="text-xs sm:text-sm text-slate-600 mt-1">
                วิทยาลัยสงฆ์พ่อขุนผาเมือง มหาวิทยาลัยมหาจุฬาลงกรณราชวิทยาลัย
              </p>
            </div>
          </div>
        </div>

        {/* 3. Settings Form */}
        <div className="p-6 sm:p-8 space-y-6">
          {statusMessage && (
            <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs sm:text-sm flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
              <span>{statusMessage}</span>
            </div>
          )}

          {/* Scope Selection */}
          <div className="space-y-3">
            <label className="block text-xs sm:text-sm font-bold text-slate-800">
              1. เลือกขอบเขตรายวิชาที่จะพิมพ์:
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              <button
                type="button"
                onClick={() => setScope('all')}
                className={`p-3.5 rounded-2xl border text-left transition cursor-pointer ${
                  scope === 'all'
                    ? 'border-[#9D174D] bg-[#FFF0F5] text-[#9D174D] shadow-xs'
                    : 'border-slate-200 hover:border-slate-300 text-slate-700 bg-white'
                }`}
              >
                <div className="font-bold text-xs sm:text-sm">ทุกรายวิชา (ตารางรวม)</div>
                <div className="text-[11px] text-slate-500 mt-0.5">รวม 91 รายวิชาทั้งภาคการศึกษา</div>
              </button>

              {isTeacher && (
                <button
                  type="button"
                  onClick={() => setScope('teacher')}
                  className={`p-3.5 rounded-2xl border text-left transition cursor-pointer ${
                    scope === 'teacher'
                      ? 'border-[#9D174D] bg-[#FFF0F5] text-[#9D174D] shadow-xs'
                      : 'border-slate-200 hover:border-slate-300 text-slate-700 bg-white'
                  }`}
                >
                  <div className="font-bold text-xs sm:text-sm">เฉพาะวิชาที่ท่านสอน</div>
                  <div className="text-[11px] text-slate-500 mt-0.5">วิชาของ {currentUser?.name}</div>
                </button>
              )}

              <button
                type="button"
                onClick={() => setScope('saved')}
                className={`p-3.5 rounded-2xl border text-left transition cursor-pointer ${
                  scope === 'saved'
                    ? 'border-[#9D174D] bg-[#FFF0F5] text-[#9D174D] shadow-xs'
                    : 'border-slate-200 hover:border-slate-300 text-slate-700 bg-white'
                }`}
              >
                <div className="font-bold text-xs sm:text-sm">วิชาที่บันทึกไว้ (Bookmark)</div>
                <div className="text-[11px] text-slate-500 mt-0.5">{savedExamIds.length} วิชาที่เลือกไว้</div>
              </button>

              <button
                type="button"
                onClick={() => setScope('year1')}
                className={`p-3.5 rounded-2xl border text-left transition cursor-pointer ${
                  scope === 'year1'
                    ? 'border-[#9D174D] bg-[#FFF0F5] text-[#9D174D] shadow-xs'
                    : 'border-slate-200 hover:border-slate-300 text-slate-700 bg-white'
                }`}
              >
                <div className="font-bold text-xs sm:text-sm">เฉพาะนิสิตชั้นปีที่ 1</div>
                <div className="text-[11px] text-slate-500 mt-0.5">ทั้งบรรพชิตและคฤหัสถ์</div>
              </button>

              <button
                type="button"
                onClick={() => setScope('year2')}
                className={`p-3.5 rounded-2xl border text-left transition cursor-pointer ${
                  scope === 'year2'
                    ? 'border-[#9D174D] bg-[#FFF0F5] text-[#9D174D] shadow-xs'
                    : 'border-slate-200 hover:border-slate-300 text-slate-700 bg-white'
                }`}
              >
                <div className="font-bold text-xs sm:text-sm">เฉพาะนิสิตชั้นปีที่ 2</div>
                <div className="text-[11px] text-slate-500 mt-0.5">ทั้งบรรพชิตและคฤหัสถ์</div>
              </button>

              <button
                type="button"
                onClick={() => setScope('year3')}
                className={`p-3.5 rounded-2xl border text-left transition cursor-pointer ${
                  scope === 'year3'
                    ? 'border-[#9D174D] bg-[#FFF0F5] text-[#9D174D] shadow-xs'
                    : 'border-slate-200 hover:border-slate-300 text-slate-700 bg-white'
                }`}
              >
                <div className="font-bold text-xs sm:text-sm">เฉพาะนิสิตชั้นปีที่ 3-4</div>
                <div className="text-[11px] text-slate-500 mt-0.5">ทั้งบรรพชิตและคฤหัสถ์</div>
              </button>
            </div>
          </div>

          {/* Orientation selection */}
          <div className="space-y-3">
            <label className="block text-xs sm:text-sm font-bold text-slate-800">
              2. ทิศทางการวางหน้ากระดาษ:
            </label>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setOrientation('landscape')}
                className={`flex-1 p-3.5 rounded-2xl border text-center transition cursor-pointer ${
                  orientation === 'landscape'
                    ? 'border-[#9D174D] bg-[#FFF0F5] text-[#9D174D] font-bold shadow-xs'
                    : 'border-slate-200 hover:border-slate-300 text-slate-700 bg-white'
                }`}
              >
                แนวนอน (Landscape) - แนะนำสำหรับตาราง 13 คอลัมน์
              </button>
              <button
                type="button"
                onClick={() => setOrientation('portrait')}
                className={`flex-1 p-3.5 rounded-2xl border text-center transition cursor-pointer ${
                  orientation === 'portrait'
                    ? 'border-[#9D174D] bg-[#FFF0F5] text-[#9D174D] font-bold shadow-xs'
                    : 'border-slate-200 hover:border-slate-300 text-slate-700 bg-white'
                }`}
              >
                แนวตั้ง (Portrait)
              </button>
            </div>
          </div>

          {/* Print Preview Summary */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between text-xs sm:text-sm">
            <div className="text-slate-700">
              <span>จำนวนรายวิชาที่จะพิมพ์: </span>
              <strong className="text-[#9D174D] font-bold text-base">{filteredExams.length}</strong>
              <span> วิชา</span>
            </div>
            <div className="text-slate-500 text-xs truncate max-w-xs">
              {printSubtitle}
            </div>
          </div>

          {/* Action buttons */}
          <div className="pt-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
            <button
              type="button"
              onClick={onBack}
              className="px-5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs sm:text-sm transition cursor-pointer"
            >
              ย้อนกลับ
            </button>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={handleExportExcel}
                className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-white border border-emerald-600 text-emerald-700 hover:bg-emerald-50 text-xs sm:text-sm font-bold shadow-xs transition cursor-pointer"
              >
                <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                <span>ส่งออกไฟล์ Excel (.xlsx)</span>
              </button>

              <button
                type="button"
                onClick={handleOpenIsolatedPrintTab}
                className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs sm:text-sm font-semibold shadow-xs transition cursor-pointer"
              >
                <ExternalLink className="w-4 h-4 text-slate-500" />
                <span>เปิดหน้าต่างพิมพ์แยก</span>
              </button>

              <button
                type="button"
                onClick={handlePrintStandard}
                className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-[#9D174D] to-[#701A4B] hover:opacity-95 text-white font-bold text-xs sm:text-sm shadow-md transition cursor-pointer"
              >
                <Printer className="w-4 h-4" />
                <span>สั่งพิมพ์ทันที (Ctrl+P)</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
