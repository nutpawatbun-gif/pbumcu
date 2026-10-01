import React, { useState } from 'react';
import { 
  ArrowLeft,
  ChevronRight,
  Save, 
  Clock, 
  Calendar, 
  BookOpen, 
  MapPin, 
  Building2, 
  User, 
  FolderUp, 
  ExternalLink, 
  CheckCircle2,
  Users
} from 'lucide-react';
import { ExamItem, TeacherUser } from '../types/exam';

export interface ExamEditPageProps {
  exam: ExamItem;
  currentUser: TeacherUser | null;
  onBack: () => void;
  onSave: (updatedExam: ExamItem, shouldBroadcastLine: boolean) => void;
}

export const ExamEditPage: React.FC<ExamEditPageProps> = ({
  exam,
  currentUser,
  onBack,
  onSave
}) => {
  const [formData, setFormData] = useState<ExamItem>({ 
    ...exam,
    room: exam.room || 'ห้องประชุมชั้น 1'
  });
  const [notifyLine, setNotifyLine] = useState(true);

  const handleDateChange = (isoDate: string) => {
    const thaiMonths = [
      'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
      'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'
    ];
    if (isoDate) {
      const [year, month, day] = isoDate.split('-').map(Number);
      const thaiYear = year + 543;
      const thaiDate = `${day} ${thaiMonths[month - 1]} ${thaiYear}`;
      setFormData(prev => ({
        ...prev,
        examDateISO: isoDate,
        examDateThai: thaiDate
      }));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData, notifyLine);
    onBack();
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
            <span className="cursor-pointer hover:text-[#9D174D]" onClick={onBack}>รายละเอียดรายวิชา</span>
            <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
            <span className="font-semibold text-[#9D174D]">แก้ไขข้อมูลตารางสอบ ({formData.courseCode})</span>
          </div>
        </div>
      </div>

      {/* 2. Main Form Card */}
      <div className="bg-white rounded-3xl border border-[#F8D7E3] shadow-sm overflow-hidden">
        {/* Banner Header */}
        <div className="bg-gradient-to-r from-[#FFF0F5] via-[#FFF5F8] to-[#FFF0F5] border-b border-[#F8D7E3] p-6 sm:p-8">
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900">
            แก้ไขข้อมูลกำหนดการสอบไล่
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 mt-1">
            วิชา: [{formData.courseCode}] {formData.courseName} | ชั้นปีที่ {formData.yearLevel} ({formData.status})
          </p>
        </div>

        {/* 3. Form */}
        <form onSubmit={handleSubmit} className="p-6 sm:p-8 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Course Code */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">รหัสวิชา</label>
              <input
                type="text"
                value={formData.courseCode}
                onChange={e => setFormData({ ...formData, courseCode: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50/70 focus:bg-white text-xs sm:text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#9D174D]/20 focus:border-[#9D174D]"
                required
              />
            </div>

            {/* Course Name */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">ชื่อรายวิชา</label>
              <input
                type="text"
                value={formData.courseName}
                onChange={e => setFormData({ ...formData, courseName: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50/70 focus:bg-white text-xs sm:text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#9D174D]/20 focus:border-[#9D174D]"
                required
              />
            </div>

            {/* Exam Date ISO */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">วันที่สอบ (ค.ศ.)</label>
              <input
                type="date"
                value={formData.examDateISO}
                onChange={e => handleDateChange(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50/70 focus:bg-white text-xs sm:text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#9D174D]/20 focus:border-[#9D174D]"
                required
              />
            </div>

            {/* Exam Date Thai */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">วันที่สอบ (ภาษาไทย)</label>
              <input
                type="text"
                value={formData.examDateThai}
                onChange={e => setFormData({ ...formData, examDateThai: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50/70 focus:bg-white text-xs sm:text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#9D174D]/20 focus:border-[#9D174D]"
                required
              />
            </div>

            {/* Exam Time */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">เวลาสอบ (เช่น 09.00 - 11.00)</label>
              <input
                type="text"
                value={formData.examTimeThai}
                onChange={e => setFormData({ ...formData, examTimeThai: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50/70 focus:bg-white text-xs sm:text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#9D174D]/20 focus:border-[#9D174D]"
                required
              />
            </div>

            {/* Room */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">ห้องสอบ / สถานที่สอบ</label>
              <input
                type="text"
                value={formData.room || ''}
                onChange={e => setFormData({ ...formData, room: e.target.value })}
                placeholder="เช่น ห้องประชุมชั้น 1 หรือ ห้อง 201"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50/70 focus:bg-white text-xs sm:text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#9D174D]/20 focus:border-[#9D174D]"
              />
            </div>

            {/* Lecturer */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">อาจารย์ผู้สอน</label>
              <input
                type="text"
                value={formData.lecturer}
                onChange={e => setFormData({ ...formData, lecturer: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50/70 focus:bg-white text-xs sm:text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#9D174D]/20 focus:border-[#9D174D]"
                required
              />
            </div>

            {/* Faculty */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">คณะ</label>
              <input
                type="text"
                value={formData.faculty}
                onChange={e => setFormData({ ...formData, faculty: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50/70 focus:bg-white text-xs sm:text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#9D174D]/20 focus:border-[#9D174D]"
              />
            </div>
          </div>

          {/* Proctors */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">กรรมการคุมสอบ (คั่นด้วยเครื่องหมายจุลภาค ,)</label>
            <input
              type="text"
              value={(formData.proctors || []).join(', ')}
              onChange={e => setFormData({ ...formData, proctors: e.target.value.split(',').map(s => s.trim()).filter(Boolean) })}
              placeholder="เช่น พระครู..., อาจารย์สมหมาย..."
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50/70 focus:bg-white text-xs sm:text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#9D174D]/20 focus:border-[#9D174D]"
            />
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">หมายเหตุเพิ่มเติม</label>
            <textarea
              value={formData.notes || ''}
              onChange={e => setFormData({ ...formData, notes: e.target.value })}
              rows={2}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50/70 focus:bg-white text-xs sm:text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#9D174D]/20 focus:border-[#9D174D]"
            />
          </div>

          {/* LINE Notify Checkbox */}
          <div className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-200 flex items-center gap-3">
            <input
              type="checkbox"
              id="notify-line-checkbox"
              checked={notifyLine}
              onChange={e => setNotifyLine(e.target.checked)}
              className="w-4 h-4 rounded text-[#9D174D] focus:ring-[#9D174D] cursor-pointer"
            />
            <label htmlFor="notify-line-checkbox" className="text-xs sm:text-sm text-emerald-950 font-medium cursor-pointer">
              ส่งแจ้งเตือนการเปลี่ยนแปลงข้อมูลนี้ไปยังกลุ่ม LINE ทันที (หากตั้งค่า LINE Notify Token ไว้)
            </label>
          </div>

          {/* Submit Actions */}
          <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3">
            <button
              type="button"
              onClick={onBack}
              className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs sm:text-sm transition cursor-pointer"
            >
              ยกเลิก
            </button>
            <button
              type="submit"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-3 rounded-xl bg-gradient-to-r from-[#9D174D] to-[#701A4B] hover:opacity-95 text-white font-bold text-xs sm:text-sm shadow-md transition cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>บันทึกการเปลี่ยนแปลง</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
