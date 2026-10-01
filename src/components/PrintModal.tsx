import React, { useState, useMemo, useEffect } from 'react';
import { 
  X, 
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

interface PrintModalProps {
  isOpen: boolean;
  onClose: () => void;
  exams: ExamItem[];
  currentUser: TeacherUser | null;
  savedExamIds: string[];
  initialScope?: 'all' | 'teacher' | 'saved';
  onSyncPrintExams?: (exams: ExamItem[], subtitle: string, signatoryTeacher?: string) => void;
}

export const PrintModal: React.FC<PrintModalProps> = ({
  isOpen,
  onClose,
  exams,
  currentUser,
  savedExamIds,
  initialScope = 'all',
  onSyncPrintExams
}) => {
  const isTeacher = Boolean(currentUser && currentUser.role !== 'admin');
  
  // Scope of exams to print
  const [scope, setScope] = useState<'all' | 'teacher' | 'saved' | 'year1' | 'year2' | 'year3' | 'year4'>(() => {
    if (initialScope === 'teacher' && isTeacher) return 'teacher';
    if (initialScope === 'saved') return 'saved';
    return isTeacher ? 'teacher' : 'all';
  });

  const [orientation, setOrientation] = useState<'landscape' | 'portrait'>('landscape');
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      if (initialScope === 'teacher' && isTeacher) {
        setScope('teacher');
      } else if (initialScope === 'saved') {
        setScope('saved');
      }
    }
  }, [isOpen, initialScope, isTeacher]);

  // Compute exams to be printed
  const targetExams = useMemo(() => {
    let list: ExamItem[] = [];
    if (scope === 'teacher' && currentUser) {
      list = exams.filter(e => isLecturerMatch(e.lecturer, currentUser));
    } else if (scope === 'saved') {
      list = exams.filter(e => savedExamIds.includes(e.id));
    } else if (scope === 'year1') {
      list = exams.filter(e => e.yearLevel === 1);
    } else if (scope === 'year2') {
      list = exams.filter(e => e.yearLevel === 2);
    } else if (scope === 'year3') {
      list = exams.filter(e => e.yearLevel === 3);
    } else if (scope === 'year4') {
      list = exams.filter(e => e.yearLevel === 4);
    } else {
      list = exams;
    }

    return [...list].sort((a, b) => {
      const dateA = (a.examDateISO || '') + (a.startTime || '');
      const dateB = (b.examDateISO || '') + (b.startTime || '');
      return dateA.localeCompare(dateB) || a.orderNo - b.orderNo;
    });
  }, [exams, scope, currentUser, savedExamIds]);

  // Subtitle based on scope
  const subtitle = useMemo(() => {
    if (scope === 'teacher' && currentUser) {
      return `ใบแจ้งกำหนดการสอบไล่รายวิชา (อาจารย์ผู้บรรยาย: ${currentUser.name}) ประจำปีการศึกษา 2569`;
    }
    if (scope === 'saved') {
      return 'ใบแจ้งกำหนดการสอบไล่รายบุคคล (วิชาที่บันทึกไว้) ประจำปีการศึกษา 2569';
    }
    if (scope.startsWith('year')) {
      const y = scope.replace('year', '');
      return `ตารางสอบไล่ ชั้นปีที่ ${y} ประจำภาคการศึกษาที่ 1 ปีการศึกษา 2569`;
    }
    return 'ตารางสอบไล่ ประจำภาคการศึกษาที่ 1 ปีการศึกษา 2569';
  }, [scope, currentUser]);

  const signatoryTeacher = scope === 'teacher' && currentUser ? currentUser.name : undefined;

  // Sync to root print sheet whenever selection changes
  useEffect(() => {
    if (isOpen && onSyncPrintExams) {
      onSyncPrintExams(targetExams, subtitle, signatoryTeacher);
    }
  }, [isOpen, targetExams, subtitle, signatoryTeacher, onSyncPrintExams]);

  // Generate printable HTML
  const printableHtml = useMemo(() => {
    return generatePrintableHtml(targetExams, {
      title: 'มหาวิทยาลัยมหาจุฬาลงกรณราชวิทยาลัย (MCU)',
      college: 'วิทยาลัยสงฆ์พ่อขุนผาเมือง เพชรบูรณ์',
      subtitle,
      orientation,
      signatoryTeacher,
      signatoryTitle: scope === 'teacher' ? 'อาจารย์ผู้บรรยาย' : 'กรรมการกำกับห้องสอบ'
    });
  }, [targetExams, subtitle, orientation, scope, signatoryTeacher]);

  // Blob URL for direct opening in new tab
  const blobUrl = useMemo(() => {
    return createPrintBlobUrl(printableHtml);
  }, [printableHtml]);

  if (!isOpen) return null;

  const handleBrowserPrint = () => {
    setStatusMessage('กำลังสั่งพิมพ์เอกสาร...');
    // Ensure root print sheet is synchronized
    if (onSyncPrintExams) {
      onSyncPrintExams(targetExams, subtitle, signatoryTeacher);
    }
    const ok = triggerBrowserPrint();
    if (!ok) {
      setStatusMessage('หากเบราว์เซอร์ไม่แสดงหน้าต่างพิมพ์ ให้คลิก "เปิดพิมพ์ในแท็บใหม่" หรือ "ดาวน์โหลด HTML"');
    } else {
      setTimeout(() => setStatusMessage(null), 3000);
    }
  };

  const handleDownloadHtml = () => {
    const filename = `mcu-exam-schedule-${scope}-${new Date().toISOString().split('T')[0]}`;
    downloadPrintableHtml(printableHtml, filename);
    setStatusMessage('ดาวน์โหลดไฟล์เอกสารสำหรับพิมพ์ (.html) เรียบร้อยแล้ว (สามารถดับเบิลคลิกเปิดพิมพ์ได้ทุกเวลา)');
    setTimeout(() => setStatusMessage(null), 4000);
  };

  const handleExcelExport = () => {
    const sheetName = scope === 'teacher' && currentUser ? `วิชาสอบ_${currentUser.name}` : 'ตารางสอบพิมพ์';
    exportExamsToExcel(targetExams, `mcu-exam-${scope}-print`, sheetName);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-200 overflow-y-auto no-print">
      <div className="bg-white rounded-2xl shadow-2xl max-w-5xl w-full border border-[#F8D7E3] my-4 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-[#FFF0F5] via-[#FCE7F3] to-[#FFF0F5] text-[#701A4B] p-4 sm:p-5 flex items-center justify-between border-b border-[#F8D7E3] shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white border border-[#F8D7E3] flex items-center justify-center shadow-2xs">
              <Printer className="w-5 h-5 text-[#9D174D]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold text-[#701A4B]">
                  ระบบพิมพ์ตารางสอบทางการ (A4 Official Printout)
                </h2>
                <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-white text-[#9D174D] border border-[#F8D7E3]">
                  A4 / PDF
                </span>
              </div>
              <p className="text-xs text-[#854D67]">
                วิทยาลัยสงฆ์พ่อขุนผาเมือง เพชรบูรณ์ · มหาวิทยาลัยมหาจุฬาลงกรณราชวิทยาลัย (MCU)
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-white/60 text-[#854D67] hover:text-[#701A4B] transition cursor-pointer"
            aria-label="ปิดหน้าต่าง"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Toolbar & Filter Bar */}
        <div className="p-3 sm:p-4 bg-[#FFF8FA] border-b border-[#F8D7E3] flex flex-wrap items-center justify-between gap-3 shrink-0 text-xs">
          {/* Scope Selector */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-semibold text-[#701A4B] flex items-center gap-1">
              <Layers className="w-3.5 h-3.5 text-[#9D174D]" />
              <span>เลือกข้อมูลที่ต้องการพิมพ์:</span>
            </span>

            <select
              value={scope}
              onChange={(e) => setScope(e.target.value as any)}
              className="px-3 py-1.5 bg-white border border-[#F8D7E3] rounded-xl font-medium text-slate-800 focus:outline-none focus:ring-1 focus:ring-[#9D174D]"
            >
              <option value="all">👑 ตารางสอบทั้งหมด ({exams.length} รายวิชา)</option>
              {isTeacher && (
                <option value="teacher">
                  👨‍🏫 วิชาที่ฉันสอน ({currentUser?.name} - {exams.filter(e => isLecturerMatch(e.lecturer, currentUser)).length} วิชา)
                </option>
              )}
              <option value="saved">⭐ วิชาที่บันทึกไว้สำหรับฉัน ({savedExamIds.length} วิชา)</option>
              <option value="year1">ชั้นปีที่ 1 ({exams.filter(e => e.yearLevel === 1).length} วิชา)</option>
              <option value="year2">ชั้นปีที่ 2 ({exams.filter(e => e.yearLevel === 2).length} วิชา)</option>
              <option value="year3">ชั้นปีที่ 3 ({exams.filter(e => e.yearLevel === 3).length} วิชา)</option>
              <option value="year4">ชั้นปีที่ 4 ({exams.filter(e => e.yearLevel === 4).length} วิชา)</option>
            </select>

            {/* Orientation */}
            <select
              value={orientation}
              onChange={(e) => setOrientation(e.target.value as any)}
              className="px-2.5 py-1.5 bg-white border border-[#F8D7E3] rounded-xl font-medium text-slate-800 focus:outline-none focus:ring-1 focus:ring-[#9D174D]"
            >
              <option value="landscape">แนวนอน (Landscape - มาตรฐาน)</option>
              <option value="portrait">แนวตั้ง (Portrait)</option>
            </select>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* Primary Action: Direct print */}
            <button
              onClick={handleBrowserPrint}
              className="px-4 py-2 bg-[#9D174D] hover:bg-[#831843] text-white font-bold rounded-xl shadow-xs transition inline-flex items-center gap-1.5 cursor-pointer"
              title="พิมพ์ตารางสอบออกกระดาษหรือบันทึกเป็น PDF ทันที"
            >
              <Printer className="w-4 h-4" />
              <span>พิมพ์ทันที (A4 / PDF)</span>
            </button>

            {/* Open in new tab with print controls */}
            <a
              href={blobUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="px-3.5 py-2 bg-white hover:bg-[#FFF0F5] text-[#701A4B] border border-[#F8D7E3] font-semibold rounded-xl shadow-2xs transition inline-flex items-center gap-1.5 cursor-pointer"
              title="เปิดหน้าเอกสารเต็มจอในแท็บใหม่"
            >
              <ExternalLink className="w-3.5 h-3.5 text-[#9D174D]" />
              <span>เปิดพิมพ์ในแท็บใหม่</span>
            </a>

            {/* Download standalone HTML */}
            <button
              onClick={handleDownloadHtml}
              className="px-3 py-2 bg-white hover:bg-[#FFF0F5] text-slate-700 border border-[#F8D7E3] font-semibold rounded-xl shadow-2xs transition inline-flex items-center gap-1 cursor-pointer"
              title="ดาวน์โหลดไฟล์สำหรับเปิดพิมพ์ได้ทุกเวลา (ไม่ต้องต่อเน็ต)"
            >
              <Download className="w-3.5 h-3.5 text-slate-600" />
              <span>ดาวน์โหลด HTML</span>
            </button>

            {/* Export Excel */}
            <button
              onClick={handleExcelExport}
              className="px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl shadow-2xs transition inline-flex items-center gap-1 cursor-pointer"
              title="ส่งออกรายการนี้เป็น Excel (.xlsx)"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>Excel ({targetExams.length})</span>
            </button>
          </div>
        </div>

        {/* Helpful notification bar */}
        {statusMessage && (
          <div className="px-4 py-2 bg-amber-50 border-b border-amber-200 text-amber-900 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
            <span>{statusMessage}</span>
          </div>
        )}

        {/* Live A4 Sheet Preview Area */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-slate-100 flex justify-center">
          <div className="w-full max-w-4xl bg-white shadow-lg rounded-sm p-6 sm:p-8 border border-slate-300 min-h-[600px] text-slate-900 font-sans">
            {/* Academic Paper Header */}
            <div className="text-center pb-3 mb-4 border-b-2 border-black">
              <h1 className="text-lg sm:text-xl font-bold text-black tracking-wide leading-tight">
                มหาวิทยาลัยมหาจุฬาลงกรณราชวิทยาลัย (MCU)
              </h1>
              <h2 className="text-base sm:text-lg font-bold text-black mt-0.5 leading-tight">
                วิทยาลัยสงฆ์พ่อขุนผาเมือง เพชรบูรณ์
              </h2>
              <h3 className="text-sm sm:text-base font-semibold text-slate-800 mt-1 leading-snug">
                {subtitle}
              </h3>
              <div className="flex justify-between items-center text-[11px] text-slate-700 mt-2.5 font-semibold flex-wrap gap-2">
                <span>สถานที่จัดสอบ: <strong className="text-black">ห้องประชุมชั้น 1 ทุกชั้นเรียน</strong></span>
                <span>วันที่จัดพิมพ์: {new Date().toLocaleDateString('th-TH', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
                <span>จำนวนรายวิชา: <strong className="text-black">{targetExams.length}</strong> รายวิชา</span>
              </div>
            </div>

            {/* Official Table Preview */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-[11px] border border-black border-collapse">
                <thead>
                  <tr className="bg-slate-100 text-black font-bold">
                    <th className="p-1.5 text-center border border-black w-8">ลำดับ</th>
                    <th className="p-1.5 text-center border border-black w-14">ชั้นปี</th>
                    <th className="p-1.5 border border-black w-32">คณะ / สาขาวิชา</th>
                    <th className="p-1.5 border border-black w-24">วันสอบ</th>
                    <th className="p-1.5 border border-black w-24">เวลาสอบ</th>
                    <th className="p-1.5 text-center border border-black w-20">รหัสวิชา</th>
                    <th className="p-1.5 border border-black">ชื่อรายวิชา</th>
                    <th className="p-1.5 border border-black w-32">อาจารย์ผู้บรรยาย</th>
                    <th className="p-1.5 text-center border border-black w-24">สถานที่สอบ</th>
                    <th className="p-1.5 text-center border border-black w-16">กลุ่มผู้สอบ</th>
                    <th className="p-1.5 text-center border border-black w-16">หมายเหตุ</th>
                  </tr>
                </thead>
                <tbody>
                  {targetExams.map((item, idx) => (
                    <tr key={`modal-row-${item.id}`} className="border-b border-black hover:bg-slate-50">
                      <td className="p-1.5 text-center border border-black">{idx + 1}</td>
                      <td className="p-1.5 text-center border border-black whitespace-nowrap">ปี {item.yearLevel}</td>
                      <td className="p-1.5 border border-black text-[10px] leading-tight">
                        <div className="font-semibold text-black">{item.faculty}</div>
                        <div className="text-slate-600">{item.major}</div>
                      </td>
                      <td className="p-1.5 border border-black whitespace-nowrap">{item.examDateThai}</td>
                      <td className="p-1.5 border border-black whitespace-nowrap font-mono">{item.examTimeThai}</td>
                      <td className="p-1.5 text-center font-mono border border-black font-bold whitespace-nowrap">{item.courseCode}</td>
                      <td className="p-1.5 border border-black font-semibold text-[10.5px] leading-tight text-black">{item.courseName}</td>
                      <td className="p-1.5 border border-black text-[10px]">{item.lecturer}</td>
                      <td className="p-1.5 text-center border border-black whitespace-nowrap font-medium">{item.room || 'ห้องประชุมชั้น 1'}</td>
                      <td className="p-1.5 text-center border border-black whitespace-nowrap">{item.status}</td>
                      <td className="p-1.5 text-center border border-black text-[9px]">{item.notes || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Official Signature Lines */}
            <div className="mt-8 pt-4 grid grid-cols-2 gap-8 text-xs text-black border-t border-dashed border-gray-400">
              <div className="text-center space-y-7">
                <p className="font-semibold">
                  ลงชื่อ......................................................................... {signatoryTeacher ? `อาจารย์ผู้บรรยาย (${signatoryTeacher})` : 'กรรมการกำกับห้องสอบ'}
                </p>
                <p>({signatoryTeacher || '.........................................................................'})</p>
                <p className="text-[10px] text-slate-500">วันที่ .......... เดือน .......................... พ.ศ. ...............</p>
              </div>
              <div className="text-center space-y-7">
                <p className="font-semibold">ลงชื่อ......................................................................... หัวหน้าฝ่ายทะเบียนและประมวลผล</p>
                <p>(.........................................................................)</p>
                <p className="text-[10px] text-slate-500">วันที่ .......... เดือน .......................... พ.ศ. ...............</p>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-3 bg-white border-t border-[#F8D7E3] flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-[#854D67] shrink-0">
          <div className="flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-[#E11D48]" />
            <span>คำแนะนำ: กดปุ่ม <strong>"พิมพ์ทันที (A4 / PDF)"</strong> หรือคีย์ลัด Ctrl + P เพื่อพิมพ์ออกกระดาษหรือบันทึก PDF</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleBrowserPrint}
              className="px-4 py-2 bg-[#9D174D] hover:bg-[#831843] text-white font-semibold rounded-xl transition inline-flex items-center gap-1 cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>พิมพ์ทันที</span>
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl transition cursor-pointer"
            >
              ปิดหน้าต่าง
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

