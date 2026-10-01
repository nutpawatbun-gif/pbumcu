import React, { useState } from 'react';
import { 
  X, 
  Save, 
  Clock, 
  Calendar, 
  BookOpen, 
  MapPin, 
  Send, 
  FileText,
  Video,
  CheckCircle,
  HelpCircle,
  Building2,
  User,
  FolderUp,
  ExternalLink,
  CheckCircle2
} from 'lucide-react';
import { ExamItem, TeacherUser } from '../types/exam';
import { formatLineNotifyMessage } from '../utils/notifications';

interface ExamEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  exam: ExamItem | null;
  onSave: (updatedExam: ExamItem, shouldBroadcastLine: boolean) => void;
  currentUser: TeacherUser | null;
}

export const ExamEditModal: React.FC<ExamEditModalProps> = ({
  isOpen,
  onClose,
  exam,
  onSave,
  currentUser
}) => {
  if (!isOpen || !exam) return null;

  const [formData, setFormData] = useState<ExamItem>({ 
    ...exam,
    room: exam.room || 'ห้องประชุมชั้น 1'
  });
  const [notifyLine, setNotifyLine] = useState(true);

  // Thai Date formatting helper
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

  const handleTimeChange = (start: string, end: string) => {
    const formattedThai = `${start.replace(':', '.')} - ${end.replace(':', '.')} น.`;
    setFormData(prev => ({
      ...prev,
      startTime: start,
      endTime: end,
      examTimeThai: formattedThai
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const finalItem: ExamItem = {
      ...formData,
      room: formData.room || 'ห้องประชุมชั้น 1',
      lastUpdated: new Date().toISOString(),
      updatedBy: currentUser?.name || 'อาจารย์ผู้สอน'
    };
    onSave(finalItem, notifyLine);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-200 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full border border-[#F8D7E3] my-6 overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-[#FFF0F5] via-[#FCE7F3] to-[#FFF0F5] text-[#701A4B] p-4 sm:p-5 flex items-center justify-between border-b border-[#F8D7E3]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white border border-[#F8D7E3] flex items-center justify-center shadow-2xs">
              <BookOpen className="w-5 h-5 text-[#9D174D]" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold">
                {exam.courseName ? `แก้ไขวิชา: ${exam.courseCode} ${exam.courseName}` : 'เพิ่มรายวิชาสอบใหม่'}
              </h2>
              <p className="text-xs text-[#854D67]">
                ผู้แก้ไข: {currentUser?.name || 'อาจารย์'} ({currentUser?.role === 'admin' ? 'ผู้ดูแลระบบ' : 'อาจารย์ผู้บรรยาย'})
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-[#854D67] hover:text-[#701A4B] p-1 rounded-full hover:bg-white/60 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4">
          {/* Row 1: Course Code & Course Name */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                รหัสวิชา <span className="text-[#E11D48]">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.courseCode}
                onChange={(e) => setFormData({ ...formData, courseCode: e.target.value.toUpperCase() })}
                placeholder="เช่น 000 136 หรือ SP 101"
                className="w-full px-3 py-2 text-sm bg-[#FFF8FA] border border-[#F8D7E3] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#F8D7E3] focus:border-[#9D174D] font-mono font-bold text-[#701A4B]"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                ชื่อรายวิชา (Course Title) <span className="text-[#E11D48]">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.courseName}
                onChange={(e) => setFormData({ ...formData, courseName: e.target.value })}
                placeholder="เช่น ภาษาบาลี, ธรรมวิภาค"
                className="w-full px-3 py-2 text-sm bg-[#FFF8FA] border border-[#F8D7E3] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#F8D7E3] focus:border-[#9D174D] font-medium text-slate-800"
              />
            </div>
          </div>

          {/* Row 2: Lecturer & Faculty */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1">
                <User className="w-3.5 h-3.5 text-[#9D174D]" />
                <span>อาจารย์ผู้บรรยาย</span> <span className="text-[#E11D48]">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.lecturer}
                onChange={(e) => setFormData({ ...formData, lecturer: e.target.value })}
                placeholder="ชื่ออาจารย์ผู้สอน"
                className="w-full px-3 py-2 text-sm bg-[#FFF8FA] border border-[#F8D7E3] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#F8D7E3] focus:border-[#9D174D] text-slate-800"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1">
                <Building2 className="w-3.5 h-3.5 text-[#9D174D]" />
                <span>คณะ</span>
              </label>
              <select
                value={formData.faculty}
                onChange={(e) => setFormData({ ...formData, faculty: e.target.value })}
                className="w-full px-3 py-2 text-sm bg-[#FFF8FA] border border-[#F8D7E3] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#F8D7E3] focus:border-[#9D174D] text-slate-800"
              >
                <option value="ทุกคณะ">ทุกคณะ</option>
                <option value="พุทธศาสตร์">พุทธศาสตร์</option>
                <option value="ครุศาสตร์">ครุศาสตร์</option>
                <option value="มนุษยศาสตร์">มนุษยศาสตร์</option>
                <option value="สังคมศาสตร์">สังคมศาสตร์</option>
                <option value="บัณฑิตวิทยาลัย">บัณฑิตวิทยาลัย</option>
              </select>
            </div>
          </div>

          {/* Row 3: Major, Year & Status */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                สาขาวิชา
              </label>
              <input
                type="text"
                value={formData.major}
                onChange={(e) => setFormData({ ...formData, major: e.target.value })}
                placeholder="เช่น สาขาวิชาพระพุทธศาสนา"
                className="w-full px-3 py-2 text-sm bg-[#FFF8FA] border border-[#F8D7E3] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#F8D7E3] focus:border-[#9D174D] text-slate-800"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                ชั้นปี
              </label>
              <select
                value={formData.yearLevel}
                onChange={(e) => setFormData({ ...formData, yearLevel: Number(e.target.value) })}
                className="w-full px-3 py-2 text-sm bg-[#FFF8FA] border border-[#F8D7E3] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#F8D7E3] focus:border-[#9D174D] text-slate-800 font-semibold"
              >
                <option value={1}>ชั้นปีที่ 1</option>
                <option value={2}>ชั้นปีที่ 2</option>
                <option value={3}>ชั้นปีที่ 3</option>
                <option value={4}>ชั้นปีที่ 4</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                กลุ่มผู้สอบ (สถานะ)
              </label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                className="w-full px-3 py-2 text-sm bg-[#FFF8FA] border border-[#F8D7E3] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#F8D7E3] focus:border-[#9D174D] text-slate-800"
              >
                <option value="บรรพชิต">บรรพชิต (พระภิกษุ-สามเณร)</option>
                <option value="คฤหัสถ์">คฤหัสถ์ (นิสิตทั่วไป)</option>
                <option value="ทั่วไป">ทั่วไป (บรรพชิต & คฤหัสถ์)</option>
              </select>
            </div>
          </div>

          {/* Row 4: Exam Date & Preset Buttons */}
          <div className="bg-[#FFF0F5] p-3.5 sm:p-4 rounded-2xl border border-[#F8D7E3] space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[#701A4B] flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-[#9D174D]" />
                <span>กำหนดวันสอบ</span>
              </span>
              <span className="text-xs font-semibold text-[#701A4B] bg-white px-2.5 py-0.5 rounded-full border border-[#F8D7E3]">
                {formData.examDateThai || 'ยังไม่กำหนด'}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-[#854D67] mb-1">
                  เลือกจากปฏิทิน (ค.ศ.)
                </label>
                <input
                  type="date"
                  value={formData.examDateISO}
                  onChange={(e) => handleDateChange(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-white border border-[#F8D7E3] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#9D174D] text-slate-800"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-[#854D67] mb-1">
                  หรือเลือกวันสอบตามตาราง 2569:
                </label>
                <div className="flex flex-wrap gap-1">
                  {[
                    { label: '5 ต.ค.', iso: '2026-10-05', thai: '5 ตุลาคม 2569' },
                    { label: '6 ต.ค.', iso: '2026-10-06', thai: '6 ตุลาคม 2569' },
                    { label: '7 ต.ค.', iso: '2026-10-07', thai: '7 ตุลาคม 2569' },
                    { label: '10 ต.ค.', iso: '2026-10-10', thai: '10 ตุลาคม 2569' },
                    { label: '11 ต.ค.', iso: '2026-10-11', thai: '11 ตุลาคม 2569' },
                    { label: '16 ต.ค.', iso: '2026-10-16', thai: '16 ตุลาคม 2569' },
                    { label: '17 ต.ค.', iso: '2026-10-17', thai: '17 ตุลาคม 2569' }
                  ].map(preset => (
                    <button
                      key={preset.iso}
                      type="button"
                      onClick={() => handleDateChange(preset.iso)}
                      className={`text-xs px-2.5 py-1 rounded-lg transition ${
                        formData.examDateISO === preset.iso
                          ? 'bg-[#9D174D] text-white font-bold'
                          : 'bg-white border border-[#F8D7E3] text-[#701A4B] hover:bg-[#FFF8FA]'
                      }`}
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Row 5: Time Slots */}
          <div className="bg-[#FFF8FA] p-3.5 sm:p-4 rounded-2xl border border-[#F8D7E3] space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[#701A4B] flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-[#9D174D]" />
                <span>กำหนดเวลาสอบ</span>
              </span>
              <span className="text-xs font-semibold text-[#701A4B] bg-white px-2.5 py-0.5 rounded-full border border-[#F8D7E3] font-mono">
                {formData.examTimeThai || '09.00 - 11.30 น.'}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-[#854D67] mb-1">
                  เวลาเริ่มสอบ
                </label>
                <input
                  type="time"
                  value={formData.startTime}
                  onChange={(e) => handleTimeChange(e.target.value, formData.endTime)}
                  className="w-full px-3 py-2 text-sm bg-white border border-[#F8D7E3] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#9D174D] text-slate-800"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-[#854D67] mb-1">
                  เวลาสิ้นสุดการสอบ
                </label>
                <input
                  type="time"
                  value={formData.endTime}
                  onChange={(e) => handleTimeChange(formData.startTime, e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-white border border-[#F8D7E3] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#9D174D] text-slate-800"
                />
              </div>
            </div>

            <div className="flex flex-wrap gap-1.5 pt-1">
              <span className="text-[11px] text-[#854D67] self-center">ช่วงเวลายอดนิยม:</span>
              <button
                type="button"
                onClick={() => handleTimeChange('09:00', '11:30')}
                className="text-xs px-2.5 py-1 rounded-lg bg-white border border-[#F8D7E3] text-[#701A4B] hover:bg-[#FFF0F5]"
              >
                เช้า (09.00 - 11.30 น.)
              </button>
              <button
                type="button"
                onClick={() => handleTimeChange('12:30', '15:00')}
                className="text-xs px-2.5 py-1 rounded-lg bg-white border border-[#F8D7E3] text-[#701A4B] hover:bg-[#FFF0F5]"
              >
                บ่าย 1 (12.30 - 15.00 น.)
              </button>
              <button
                type="button"
                onClick={() => handleTimeChange('15:10', '17:40')}
                className="text-xs px-2.5 py-1 rounded-lg bg-white border border-[#F8D7E3] text-[#701A4B] hover:bg-[#FFF0F5]"
              >
                บ่าย 2 (15.10 - 17.40 น.)
              </button>
            </div>
          </div>

          {/* Row 6: Room (Always defaulted to "ห้องประชุมชั้น 1") & Online Link */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-[#E11D48]" />
                <span>สถานที่ / ห้องสอบ</span>
              </label>
              <input
                type="text"
                value={formData.room || 'ห้องประชุมชั้น 1'}
                onChange={(e) => setFormData({ ...formData, room: e.target.value })}
                placeholder="ห้องประชุมชั้น 1"
                className="w-full px-3 py-2 text-sm bg-[#FFF8FA] border border-[#F8D7E3] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#9D174D] text-[#701A4B] font-semibold"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1">
                <Video className="w-3.5 h-3.5 text-[#9D174D]" />
                <span>ลิงก์ห้องสอบออนไลน์ / Google Forms (ถ้ามี)</span>
              </label>
              <input
                type="url"
                value={formData.examLink || ''}
                onChange={(e) => setFormData({ ...formData, examLink: e.target.value })}
                placeholder="https://meet.google.com/... หรือ Zoom Link"
                className="w-full px-3 py-2 text-sm bg-[#FFF8FA] border border-[#F8D7E3] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#9D174D] text-slate-800"
              />
            </div>
          </div>

          {/* Row 7: Notes */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1">
              <FileText className="w-3.5 h-3.5 text-[#9D174D]" />
              <span>หมายเหตุ / คำชี้แจงสำหรับนิสิต</span>
            </label>
            <input
              type="text"
              value={formData.notes || ''}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="เช่น ข้อสอบกลาง, นำเครื่องคิดเลขเข้าได้, ห้ามนำอุปกรณ์สื่อสารเข้า ฯลฯ"
              className="w-full px-3 py-2 text-sm bg-[#FFF8FA] border border-[#F8D7E3] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#9D174D] text-slate-800"
            />
          </div>

          {/* Row 8: Google Drive Exam Paper Submission (รูปแบบที่ 1) */}
          <div className="bg-[#FFF8FA] p-3.5 sm:p-4 rounded-2xl border border-[#F8D7E3] space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[#701A4B] flex items-center gap-1.5">
                <FolderUp className="w-4 h-4 text-[#9D174D]" />
                <span>การส่งต้นฉบับข้อสอบ (Google Drive)</span>
              </span>
              <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${
                formData.examSubmissionStatus === 'submitted'
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                  : 'bg-amber-50 text-amber-800 border-amber-200'
              }`}>
                {formData.examSubmissionStatus === 'submitted' ? 'พร้อมสอบ ✔' : 'รอข้อสอบ'}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-[#854D67] mb-1">
                  สถานะการส่งข้อสอบ
                </label>
                <select
                  value={formData.examSubmissionStatus || 'pending'}
                  onChange={(e) => {
                    const status = e.target.value as 'pending' | 'submitted';
                    setFormData({
                      ...formData,
                      examSubmissionStatus: status,
                      examSubmissionDate: status === 'submitted' ? (formData.examSubmissionDate || new Date().toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: '2-digit' })) : undefined
                    });
                  }}
                  className="w-full px-3 py-2 text-xs bg-white border border-[#F8D7E3] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#9D174D] text-slate-800"
                >
                  <option value="pending">⏳ รอข้อสอบ (ยังไม่ได้ส่ง)</option>
                  <option value="submitted">✅ พร้อมสอบ (ส่งข้อสอบแล้ว)</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-[#854D67] mb-1">
                  ลิงก์ Google Drive เฉพาะวิชานี้ (ถ้ามี)
                </label>
                <div className="relative">
                  <input
                    type="url"
                    value={formData.driveFolderUrl || ''}
                    onChange={(e) => setFormData({ ...formData, driveFolderUrl: e.target.value })}
                    placeholder="https://drive.google.com/drive/folders/..."
                    className="w-full pl-3 pr-8 py-2 text-xs bg-white border border-[#F8D7E3] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#9D174D] text-slate-800"
                  />
                  {formData.driveFolderUrl && (
                    <a
                      href={formData.driveFolderUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#9D174D] hover:text-[#701A4B]"
                      title="เปิดโฟลเดอร์ Google Drive"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  )}
                </div>
              </div>
            </div>
            <p className="text-[10.5px] text-[#854D67]">
              * หากไม่ระบุลิงก์เฉพาะวิชา ระบบจะใช้โฟลเดอร์ Google Drive รับข้อสอบกลางของวิทยาลัยโดยอัตโนมัติ
            </p>
          </div>

          {/* Notification Broadcast Option */}
          <div className="p-3 bg-emerald-50/70 border border-emerald-200 rounded-xl flex items-start gap-3">
            <input
              type="checkbox"
              id="notifyLineCheckbox"
              checked={notifyLine}
              onChange={(e) => setNotifyLine(e.target.checked)}
              className="mt-1 w-4 h-4 text-emerald-600 rounded focus:ring-emerald-500"
            />
            <label htmlFor="notifyLineCheckbox" className="text-xs text-slate-700 select-none cursor-pointer flex-1">
              <span className="font-bold text-emerald-800 flex items-center gap-1">
                <Send className="w-3.5 h-3.5 text-emerald-600" />
                ส่งแจ้งเตือนการเปลี่ยนแปลงไปยังนิสิตทันที
              </span>
              <p className="text-[11px] text-emerald-700 mt-0.5">
                ยิงแจ้งเตือนผ่านบราวเซอร์ และเตรียมข้อความอัปเดตส่งเข้ากลุ่ม LINE Notify ของนิสิตอัตโนมัติ
              </p>
            </label>
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#F8D7E3]">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 hover:bg-[#FFF0F5] rounded-xl transition"
            >
              ยกเลิก
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-xs font-semibold bg-[#9D174D] hover:bg-[#831843] text-white rounded-xl shadow-xs transition flex items-center gap-2"
            >
              <Save className="w-4 h-4" />
              <span>บันทึกข้อมูลตารางสอบ</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
