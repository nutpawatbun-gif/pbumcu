import React, { useState } from 'react';
import {
  ArrowLeft,
  ChevronRight,
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

export interface CourseDetailPageProps {
  exam: ExamItem;
  currentUser: TeacherUser | null;
  onBack: () => void;
  onNavigateToUpload?: (exam: ExamItem) => void;
  onNavigateToEdit?: (exam: ExamItem) => void;
  onNavigateToLogin?: () => void;
  onPrintSlip?: (exam: ExamItem) => void;
  centralDriveFolderUrl?: string;
}

export const CourseDetailPage: React.FC<CourseDetailPageProps> = ({
  exam,
  currentUser,
  onBack,
  onNavigateToUpload,
  onNavigateToEdit,
  onNavigateToLogin,
  onPrintSlip,
  centralDriveFolderUrl = 'https://drive.google.com/drive/folders/'
}) => {
  const [copied, setCopied] = useState(false);

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
            <button onClick={onBack} className="hover:text-[#9D174D] transition cursor-pointer">ตารางสอบ</button>
            <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
            <span className="font-semibold text-[#9D174D]">รายละเอียดรายวิชา {exam.courseCode}</span>
          </div>
        </div>

        {/* Quick action buttons on breadcrumb */}
        <div className="flex items-center gap-2">
          {onPrintSlip && (
            <button
              onClick={() => onPrintSlip(exam)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 hover:text-[#9D174D] transition cursor-pointer shadow-xs"
              title="พิมพ์ใบนำส่งข้อสอบ"
            >
              <Printer className="w-3.5 h-3.5 text-[#9D174D]" />
              <span className="hidden sm:inline">พิมพ์ใบนำส่ง</span>
            </button>
          )}
          <button
            onClick={handleCopyInfo}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 hover:text-[#9D174D] transition cursor-pointer shadow-xs"
            title="คัดลอกข้อมูลวิชา"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-600" />
                <span className="text-emerald-700 font-semibold">คัดลอกแล้ว</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5 text-slate-500" />
                <span className="hidden sm:inline">คัดลอกข้อมูล</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* 2. Main Course Detail Card */}
      <div className="bg-white rounded-3xl border border-[#F8D7E3] shadow-sm overflow-hidden">
        {/* Course Banner Header */}
        <div className={`p-6 sm:p-8 border-b transition-colors ${
          isOwner 
            ? 'bg-gradient-to-r from-[#FFF0F5] via-[#FFF5F8] to-[#FFF0F5] border-[#F8D7E3]'
            : 'bg-slate-50 border-slate-200'
        }`}>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-start gap-4">
              <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 shadow-xs ${
                isOwner 
                  ? 'bg-[#9D174D] text-white' 
                  : 'bg-slate-200 text-slate-700'
              }`}>
                {isOwner ? (
                  <ShieldCheck className="w-8 h-8 text-rose-100" />
                ) : (
                  <Lock className="w-7 h-7 text-slate-600" />
                )}
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-2 mb-2">
                  <span className="px-3 py-1 rounded-lg text-xs font-bold bg-[#9D174D] text-white shadow-xs">
                    {exam.courseCode}
                  </span>
                  <span className={`px-2.5 py-0.5 rounded-md text-xs font-semibold ${
                    isMonk 
                      ? 'bg-amber-100 text-amber-900 border border-amber-300' 
                      : 'bg-blue-100 text-blue-900 border border-blue-300'
                  }`}>
                    {exam.status} (ปี {exam.yearLevel})
                  </span>
                  {isOwner && (
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300 flex items-center gap-1">
                      <Star className="w-3 h-3 fill-emerald-600 text-emerald-600" />
                      วิชาของท่าน
                    </span>
                  )}
                  {isAdmin && (
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-purple-100 text-purple-800 border border-purple-300">
                      สิทธิ์ผู้ดูแลระบบ (Admin)
                    </span>
                  )}
                </div>
                <h1 className="text-xl sm:text-2xl font-bold text-slate-900 leading-snug">
                  {exam.courseName}
                </h1>
                <p className="text-xs sm:text-sm text-slate-600 mt-1 flex items-center gap-2">
                  <span>{exam.faculty}</span>
                  {exam.major && (
                    <>
                      <span>·</span>
                      <span className="text-slate-500">{exam.major}</span>
                    </>
                  )}
                </p>
              </div>
            </div>

            {/* Status Badge */}
            <div className="shrink-0 self-start sm:self-center">
              {isSubmitted ? (
                <div className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                  <div>
                    <div className="text-xs font-bold">พร้อมสอบแล้ว (ส่งข้อสอบแล้ว)</div>
                    {exam.examSubmissionDate && (
                      <div className="text-[11px] text-emerald-700">{exam.examSubmissionDate}</div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-amber-50 border border-amber-200 text-amber-800">
                  <Clock className="w-5 h-5 text-amber-600" />
                  <div>
                    <div className="text-xs font-bold">รอส่งข้อสอบ</div>
                    <div className="text-[11px] text-amber-700">ยังไม่พบไฟล์ข้อสอบในระบบ</div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* 3. Content Body */}
        <div className="p-6 sm:p-8 space-y-6">
          {/* Schedule & Room Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Exam Date & Time */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-start gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-[#FFF0F5] text-[#9D174D] flex items-center justify-center shrink-0 border border-[#F8D7E3]">
                <Calendar className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <div className="text-xs font-medium text-slate-500">วันและเวลาสอบ</div>
                <div className="text-sm font-bold text-slate-800 mt-0.5">{exam.examDateThai}</div>
                <div className="text-xs font-semibold text-[#9D174D] mt-0.5 flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" />
                  <span>เวลา {exam.examTimeThai} น. (คาบที่ {exam.orderNo})</span>
                </div>
              </div>
            </div>

            {/* Location & Room */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-start gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center shrink-0 border border-purple-200">
                <MapPin className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <div className="text-xs font-medium text-slate-500">ห้องสอบ / สถานที่สอบ</div>
                <div className="text-sm font-bold text-slate-800 mt-0.5">{exam.room || 'ห้องประชุมชั้น 1'}</div>
                <div className="text-xs text-slate-600 mt-0.5">
                  วิทยาลัยสงฆ์พ่อขุนผาเมือง เพชรบูรณ์
                </div>
              </div>
            </div>

            {/* Lecturer */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-start gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center shrink-0 border border-blue-200">
                <BookOpen className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <div className="text-xs font-medium text-slate-500">อาจารย์ผู้สอนประจำวิชา</div>
                <div className="text-sm font-bold text-slate-800 mt-0.5">{exam.lecturer}</div>
                <div className="text-xs text-slate-500 mt-0.5">
                  {isOwner ? '✓ บัญชีตรงกับข้อมูลของท่าน' : 'อาจารย์ประจำรายวิชา'}
                </div>
              </div>
            </div>

            {/* Proctors / Invigilators */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-start gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center shrink-0 border border-amber-200">
                <Users className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <div className="text-xs font-medium text-slate-500">กรรมการกำกับการสอบ</div>
                <div className="text-sm font-bold text-slate-800 mt-0.5">
                  {exam.proctors && exam.proctors.length > 0 
                    ? exam.proctors.join(', ') 
                    : 'ตามคำสั่งแต่งตั้งของวิทยาลัย'}
                </div>
                <div className="text-xs text-slate-500 mt-0.5">กำกับดูแลความเรียบร้อยในห้องสอบ</div>
              </div>
            </div>
          </div>

          {/* Student & Class Info Bar */}
          <div className="p-4 rounded-2xl bg-[#FFF0F5]/50 border border-[#F8D7E3] flex flex-wrap items-center justify-between gap-3 text-xs sm:text-sm">
            <div className="flex items-center gap-2 text-slate-700">
              <GraduationCap className="w-4 h-4 text-[#9D174D]" />
              <span>ชั้นปีที่: <strong className="text-slate-900">{exam.yearLevel}</strong></span>
              <span>·</span>
              <span>สถานะ: <strong className="text-slate-900">{exam.status}</strong></span>
              <span>·</span>
              <span>จำนวนนิสิตผู้เข้าสอบ: <strong className="text-slate-900">{exam.studentCount || 25} รูป/คน</strong></span>
            </div>
            {exam.notes && (
              <div className="text-xs text-amber-800 bg-amber-100/70 px-2.5 py-1 rounded-lg">
                ⚠️ หมายเหตุ: {exam.notes}
              </div>
            )}
          </div>

          {/* 4. Owner Access Section (Exclusive to the Teacher) */}
          {isOwner ? (
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50/40 p-5 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center">
                    <Folder className="w-4 h-4 text-emerald-700" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-800">
                      การจัดการข้อสอบ Google Drive (สิทธิ์เฉพาะอาจารย์ผู้สอน)
                    </h3>
                    <p className="text-xs text-slate-600">
                      โฟลเดอร์: [ภาค{exam.status}] &gt; [ชั้นปีที่ {exam.yearLevel}] &gt; [{exam.faculty}]
                    </p>
                  </div>
                </div>
                <span className="text-xs px-2.5 py-1 rounded-full bg-emerald-200 text-emerald-900 font-bold">
                  อนุมัติสิทธิ์แล้ว
                </span>
              </div>

              {/* Status details & Drive links */}
              <div className="bg-white rounded-xl p-4 border border-emerald-200/80 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                  <div>
                    <span className="text-slate-500">สถานะเอกสารข้อสอบ: </span>
                    {isSubmitted ? (
                      <span className="font-bold text-emerald-700">ส่งไฟล์ข้อสอบแล้ว ✔</span>
                    ) : (
                      <span className="font-bold text-amber-700">ยังไม่ได้ส่งไฟล์ข้อสอบ ⏳</span>
                    )}
                  </div>
                  {exam.examFileName && (
                    <div className="text-slate-600 truncate max-w-xs font-mono text-[11px]" title={exam.examFileName}>
                      📄 {exam.examFileName}
                    </div>
                  )}
                </div>

                <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100">
                  {/* Open Drive Link */}
                  <a
                    href={effectiveDriveUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#FFF0F5] hover:bg-[#F8D7E3] text-[#9D174D] font-bold text-xs transition shadow-xs cursor-pointer"
                  >
                    <Folder className="w-4 h-4" />
                    <span>เปิดโฟลเดอร์ Google Drive</span>
                    <ExternalLink className="w-3.5 h-3.5 ml-0.5 opacity-70" />
                  </a>

                  {/* Upload Button */}
                  {onNavigateToUpload && (
                    <button
                      onClick={() => onNavigateToUpload(exam)}
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-[#9D174D] to-[#701A4B] hover:opacity-95 text-white font-bold text-xs transition shadow-xs cursor-pointer"
                    >
                      <Upload className="w-4 h-4" />
                      <span>{isSubmitted ? 'ส่งไฟล์ข้อสอบฉบับปรับปรุง' : 'อัปโหลดส่งข้อสอบ'}</span>
                    </button>
                  )}

                  {/* Add to Google Calendar */}
                  <a
                    href={getGoogleCalendarUrl(exam)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 font-semibold text-xs transition shadow-xs cursor-pointer"
                  >
                    <Calendar className="w-4 h-4 text-blue-600" />
                    <span>เพิ่มลง Google Calendar</span>
                    <ExternalLink className="w-3 h-3 text-slate-400" />
                  </a>

                  {/* Edit Exam (Admin or Teacher) */}
                  {onNavigateToEdit && (
                    <button
                      onClick={() => onNavigateToEdit(exam)}
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 font-semibold text-xs transition shadow-xs cursor-pointer"
                    >
                      <Edit3 className="w-4 h-4 text-amber-600" />
                      <span>แก้ไขข้อมูลวัน-เวลา/ห้องสอบ</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          ) : (
            /* 5. Non-Owner Restricted Access Box */
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5 space-y-3">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center shrink-0 mt-0.5">
                  <Lock className="w-4 h-4 text-amber-700" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-sm font-bold text-slate-800">
                    ข้อมูลนี้เปิดให้อาจารย์ผู้สอนประจำวิชาเท่านั้น
                  </h3>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    ท่านกำลังดูข้อมูลในฐานะผู้ใช้งานทั่วไป รายวิชานี้เป็นของอาจารย์ <strong className="text-slate-800">{exam.lecturer}</strong> เพื่อความปลอดภัยและการรักษาความลับของข้อสอบ การอัปโหลดส่งข้อสอบและลิงก์ Google Drive จึงเปิดให้เฉพาะอาจารย์ผู้สอนประจำวิชาเท่านั้น
                  </p>
                </div>
              </div>

              {!currentUser && onNavigateToLogin && (
                <div className="pt-2">
                  <button
                    onClick={onNavigateToLogin}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#9D174D] hover:bg-[#701A4B] text-white text-xs font-bold transition shadow-xs cursor-pointer"
                  >
                    <LogIn className="w-4 h-4" />
                    <span>เข้าสู่ระบบในฐานะอาจารย์ผู้สอน</span>
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
