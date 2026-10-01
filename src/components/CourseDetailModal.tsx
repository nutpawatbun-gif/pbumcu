import React, { useState } from 'react';
import {
  X,
  CheckCircle2,
  Clock,
  Lock,
  ShieldCheck,
  AlertCircle,
  Calendar,
  MapPin,
  Users,
  Building2,
  BookOpen,
  Upload,
  Folder,
  ExternalLink,
  Printer,
  Copy,
  Check,
  Edit3,
  Star,
  GraduationCap,
  Sparkles,
  LogIn
} from 'lucide-react';
import { ExamItem, TeacherUser } from '../types/exam';
import { isLecturerMatch } from '../utils/teacherMatching';
import { getGoogleCalendarUrl } from '../utils/calendar';

export interface CourseDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  exam: ExamItem | null;
  currentUser: TeacherUser | null;
  onOpenUploadModal?: (exam: ExamItem) => void;
  onEditExam?: (exam: ExamItem) => void;
  onOpenLogin?: () => void;
  onPrintSlip?: (exam: ExamItem) => void;
  centralDriveFolderUrl?: string;
}

export const CourseDetailModal: React.FC<CourseDetailModalProps> = ({
  isOpen,
  onClose,
  exam,
  currentUser,
  onOpenUploadModal,
  onEditExam,
  onOpenLogin,
  onPrintSlip,
  centralDriveFolderUrl = 'https://drive.google.com/drive/folders/'
}) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen || !exam) return null;

  const isAdmin = currentUser?.role === 'admin';
  const isOwner = isAdmin || (currentUser ? isLecturerMatch(exam.lecturer, currentUser) : false);
  const isSubmitted = exam.examSubmissionStatus === 'submitted';
  const isMonk = exam.status === 'บรรพชิต';

  const effectiveDriveUrl = exam.examLink || centralDriveFolderUrl;

  const handleCopyInfo = () => {
    const text = `📢 กำหนดการสอบไล่ ประจำภาคการศึกษาที่ 1/2569\n` +
      `วิชา: [${exam.courseCode}] ${exam.courseName}\n` +
      `ชั้นปี: ปี ${exam.yearLevel} (${exam.status}) | ${exam.faculty} (${exam.major || '-'})\n` +
      `อาจารย์ผู้สอน: ${exam.lecturer}\n` +
      `วันสอบ: ${exam.examDateThai}\n` +
      `เวลาสอบ: ${exam.examTimeThai}\n` +
      `สถานที่สอบ: ${exam.room || 'ห้องประชุมชั้น 1'}\n` +
      (exam.notes ? `หมายเหตุ: ${exam.notes}\n` : '') +
      `วิทยาลัยสงฆ์พ่อขุนผาเมือง มหาวิทยาลัยมหาจุฬาลงกรณราชวิทยาลัย`;

    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-3xl border border-[#F8D7E3] shadow-2xl max-w-2xl w-full overflow-hidden flex flex-col max-h-[92vh] animate-in fade-in zoom-in-95 duration-200">
        
        {/* 1. Modal Header */}
        <div className={`px-5 sm:px-6 py-4 border-b flex items-center justify-between transition-colors ${
          isOwner 
            ? 'bg-gradient-to-r from-[#FFF0F5] via-[#FFF5F8] to-[#FFF0F5] border-[#F8D7E3]'
            : 'bg-slate-50 border-slate-200'
        }`}>
          <div className="flex items-center gap-3">
            <div className={`w-11 h-11 rounded-2xl flex items-center justify-center shadow-xs ${
              isOwner 
                ? 'bg-[#9D174D] text-white' 
                : 'bg-slate-200 text-slate-700'
            }`}>
              {isOwner ? (
                <ShieldCheck className="w-6 h-6 text-rose-100" />
              ) : (
                <Lock className="w-5 h-5 text-slate-600" />
              )}
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-mono font-bold text-xs px-2.5 py-0.5 rounded-lg bg-white text-[#701A4B] border border-[#F8D7E3] shadow-2xs">
                  {exam.courseCode}
                </span>
                <span className="px-2 py-0.5 rounded-lg text-xs font-bold bg-[#FFF0F5] text-[#9D174D] border border-[#F8D7E3]">
                  ชั้นปีที่ {exam.yearLevel}
                </span>
                <span className={`px-2 py-0.5 rounded-lg text-xs font-bold border ${
                  isMonk
                    ? 'bg-purple-50 text-purple-800 border-purple-200'
                    : 'bg-amber-50 text-amber-800 border-amber-200'
                }`}>
                  {exam.status}
                </span>
                {isOwner && (
                  <span className="px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-[#701A4B] text-white shadow-2xs flex items-center gap-1">
                    <Sparkles className="w-3 h-3 text-amber-300" />
                    <span>{isAdmin ? 'สิทธิ์ผู้ดูแลระบบ' : '⭐ วิชาของท่าน'}</span>
                  </span>
                )}
              </div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900 mt-1 line-clamp-1">
                {exam.courseName}
              </h2>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition cursor-pointer"
            title="ปิดหน้าต่าง"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 2. Modal Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
          
          {/* ACCESS DENIED / RESTRICTED NOTICE (กรณีไม่ใช่วิชาของตนเอง) */}
          {!isOwner && (
            <div className="p-4 rounded-2xl bg-amber-50/80 border border-amber-200 space-y-2">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center shrink-0 mt-0.5">
                  <Lock className="w-4 h-4" />
                </div>
                <div className="flex-1 text-xs">
                  <h4 className="font-bold text-amber-900 text-sm">
                    จำกัดสิทธิ์การเข้าถึงข้อมูลและการจัดการข้อสอบ
                  </h4>
                  <p className="text-amber-800 mt-1 leading-relaxed">
                    {currentUser ? (
                      <>
                        รายวิชานี้เป็นของ <b>{exam.lecturer}</b> โดยท่านเข้าสู่ระบบในชื่อ <b>{currentUser.name}</b> ท่านจึงสามารถดูได้เฉพาะกำหนดการสอบสาธารณะเท่านั้น แต่ไม่สามารถเข้าถึงไฟล์ข้อสอบหรือส่งข้อสอบแทนได้
                      </>
                    ) : (
                      <>
                        ระบบสงวนสิทธิ์การเข้าดูสถานะข้อสอบ การส่งไฟล์ และการพิมพ์ใบแจ้งเฉพาะวิชา สำหรับ <b>{exam.lecturer}</b> (อาจารย์ผู้สอน) และผู้ดูแลระบบเท่านั้น
                      </>
                    )}
                  </p>
                  {!currentUser && onOpenLogin && (
                    <button
                      onClick={() => {
                        onClose();
                        onOpenLogin();
                      }}
                      className="mt-2.5 inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#9D174D] hover:bg-[#831843] text-white rounded-xl text-xs font-bold transition shadow-xs cursor-pointer"
                    >
                      <LogIn className="w-3.5 h-3.5" />
                      <span>เข้าสู่ระบบด้วยบัญชีอาจารย์ผู้สอน</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* EXAM PAPER SUBMISSION STATUS & DRIVE SECTION (เฉพาะเจ้าของวิชา หรือ Admin) */}
          {isOwner && (
            <div className={`p-4 sm:p-5 rounded-2xl border transition-all ${
              isSubmitted 
                ? 'bg-emerald-50/70 border-emerald-200' 
                : 'bg-amber-50/70 border-amber-200'
            }`}>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-start gap-3">
                  <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 shadow-xs ${
                    isSubmitted ? 'bg-emerald-600 text-white' : 'bg-amber-500 text-white'
                  }`}>
                    {isSubmitted ? (
                      <CheckCircle2 className="w-6 h-6" />
                    ) : (
                      <Clock className="w-6 h-6" />
                    )}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-500">สถานะข้อสอบ:</span>
                      {isSubmitted ? (
                        <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-900 border border-emerald-300">
                          พร้อมสอบ ✔ (ส่งข้อสอบแล้ว)
                        </span>
                      ) : (
                        <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-900 border border-amber-300">
                          รอส่งข้อสอบ ⏳
                        </span>
                      )}
                    </div>
                    <p className="text-xs mt-1 text-slate-700">
                      {isSubmitted ? (
                        <span>
                          ส่งไฟล์เข้าระบบเรียบร้อยแล้ว {exam.examSubmissionDate && `เมื่อ: ${exam.examSubmissionDate}`}
                        </span>
                      ) : (
                        <span className="text-amber-800 font-medium">
                          ยังไม่ได้รับการอัปโหลดข้อสอบ กรุณาส่งไฟล์ข้อสอบเพื่อให้ฝ่ายทะเบียนจัดเตรียมความพร้อม
                        </span>
                      )}
                    </p>
                    {exam.examFileName && (
                      <div className="mt-1 text-[11px] font-mono text-emerald-800 bg-white/80 px-2 py-0.5 rounded border border-emerald-200 inline-block">
                        📄 {exam.examFileName}
                      </div>
                    )}
                  </div>
                </div>

                {/* Upload or View Drive Button */}
                <div className="flex items-center gap-2 shrink-0">
                  {isSubmitted ? (
                    <a
                      href={effectiveDriveUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white hover:bg-emerald-100/60 border border-emerald-300 text-xs font-bold text-emerald-800 shadow-2xs transition cursor-pointer"
                    >
                      <Folder className="w-4 h-4 text-emerald-600" />
                      <span>เปิดดูโฟลเดอร์ Drive</span>
                      <ExternalLink className="w-3 h-3 text-emerald-600" />
                    </a>
                  ) : (
                    onOpenUploadModal && (
                      <button
                        onClick={() => {
                          onClose();
                          onOpenUploadModal(exam);
                        }}
                        className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#9D174D] hover:bg-[#831843] text-white text-xs font-bold shadow-xs hover:shadow-md transition cursor-pointer"
                      >
                        <Upload className="w-4 h-4" />
                        <span>ส่งข้อสอบเข้า Google Drive</span>
                      </button>
                    )
                  )}
                </div>
              </div>
            </div>
          )}

          {/* SCHEDULE & COURSE DETAILS GRID */}
          <div className="bg-white rounded-2xl border border-[#F8D7E3] p-4 sm:p-5 space-y-4">
            <h3 className="text-xs font-bold text-[#854D67] uppercase tracking-wider flex items-center gap-1.5">
              <Calendar className="w-4 h-4 text-[#9D174D]" />
              <span>ข้อมูลกำหนดการสอบไล่</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 text-xs">
              {/* Exam Date */}
              <div className="p-3 rounded-xl bg-[#FFF8FA] border border-[#F8D7E3]">
                <span className="text-[11px] text-[#854D67] block mb-0.5">วันสอบ:</span>
                <span className="font-bold text-sm text-[#701A4B] block">
                  {exam.examDateThai}
                </span>
              </div>

              {/* Exam Time */}
              <div className="p-3 rounded-xl bg-[#FFF8FA] border border-[#F8D7E3]">
                <span className="text-[11px] text-[#854D67] block mb-0.5">เวลาสอบ:</span>
                <span className="font-bold text-sm text-[#701A4B] block">
                  {exam.examTimeThai}
                </span>
              </div>

              {/* Room */}
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                <span className="text-[11px] text-slate-500 block mb-0.5">ห้องสอบ:</span>
                <span className="font-bold text-slate-900 block flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-[#E11D48]" />
                  <span>{exam.room || 'ห้องประชุมชั้น 1 (อาคารวิทยาลัยสงฆ์พ่อขุนผาเมือง)'}</span>
                </span>
              </div>

              {/* Lecturer */}
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                <span className="text-[11px] text-slate-500 block mb-0.5">อาจารย์ผู้บรรยาย:</span>
                <span className="font-bold text-slate-900 block flex items-center gap-1">
                  <Users className="w-3.5 h-3.5 text-[#9D174D]" />
                  <span>{exam.lecturer}</span>
                </span>
              </div>

              {/* Faculty & Major */}
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 sm:col-span-2">
                <span className="text-[11px] text-slate-500 block mb-0.5">สังกัดคณะ & สาขาวิชา:</span>
                <span className="font-semibold text-slate-800 block flex items-center gap-1">
                  <Building2 className="w-3.5 h-3.5 text-slate-500" />
                  <span>คณะ{exam.faculty} · {exam.major || 'ทุกสาขาวิชา'}</span>
                </span>
              </div>

              {/* Notes */}
              {exam.notes && (
                <div className="p-3 rounded-xl bg-amber-50/60 border border-amber-200 sm:col-span-2">
                  <span className="text-[11px] text-amber-800 font-bold block mb-0.5">หมายเหตุการสอบ:</span>
                  <span className="text-slate-800 block">{exam.notes}</span>
                </div>
              )}
            </div>
          </div>

        </div>

        {/* 3. Modal Footer Actions */}
        <div className="bg-[#FFF0F5] px-5 sm:px-6 py-3.5 border-t border-[#F8D7E3] flex flex-wrap items-center justify-between gap-2.5">
          <div className="flex items-center gap-2">
            {/* Copy Info Button */}
            <button
              onClick={handleCopyInfo}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white hover:bg-[#FFF5F8] border border-[#F8D7E3] text-xs font-semibold text-[#701A4B] shadow-2xs transition cursor-pointer"
              title="คัดลอกรายละเอียดเพื่อส่งแจ้งนิสิตในกลุ่มเรียน"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  <span className="text-emerald-700 font-bold">คัดลอกแล้ว!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 text-[#9D174D]" />
                  <span>คัดลอกข้อมูล</span>
                </>
              )}
            </button>

            {/* Google Calendar Link */}
            <a
              href={getGoogleCalendarUrl(exam)}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white hover:bg-[#FFF5F8] border border-[#F8D7E3] text-xs font-semibold text-[#701A4B] shadow-2xs transition cursor-pointer"
              title="บันทึกลง Google Calendar"
            >
              <Calendar className="w-3.5 h-3.5 text-[#9D174D]" />
              <span className="hidden sm:inline">Google Calendar</span>
            </a>

            {/* Print Slip (Only for Owner or Admin) */}
            {isOwner && onPrintSlip && (
              <button
                onClick={() => {
                  onClose();
                  onPrintSlip(exam);
                }}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white hover:bg-[#FFF5F8] border border-[#F8D7E3] text-xs font-semibold text-[#701A4B] shadow-2xs transition cursor-pointer"
                title="พิมพ์ใบแจ้งกำหนดการสอบเฉพาะวิชานี้"
              >
                <Printer className="w-3.5 h-3.5 text-[#9D174D]" />
                <span className="hidden sm:inline">พิมพ์ใบสอบวิชานี้</span>
              </button>
            )}

            {/* Edit (Admin only) */}
            {isAdmin && onEditExam && (
              <button
                onClick={() => {
                  onClose();
                  onEditExam(exam);
                }}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white hover:bg-slate-50 border border-slate-300 text-xs font-semibold text-slate-700 shadow-2xs transition cursor-pointer"
                title="แก้ไขข้อมูลวิชา"
              >
                <Edit3 className="w-3.5 h-3.5 text-slate-600" />
                <span>แก้ไขวิชา</span>
              </button>
            )}
          </div>

          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-white hover:bg-slate-50 border border-[#F8D7E3] text-[#701A4B] font-bold text-xs transition shadow-2xs cursor-pointer"
          >
            ปิดหน้าต่าง
          </button>
        </div>

      </div>
    </div>
  );
};
