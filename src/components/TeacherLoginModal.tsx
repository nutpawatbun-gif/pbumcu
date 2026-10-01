import React, { useState } from 'react';
import { ShieldCheck, Key, User, X, AlertCircle, CheckCircle, Info, Sparkles } from 'lucide-react';
import { TeacherUser, ExamItem } from '../types/exam';
import { TEACHER_PROFILES, getTeacherCourseCount } from '../utils/teacherMatching';
import { RAW_EXAMS_DATA } from '../data/initialExams';

interface TeacherLoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess: (user: TeacherUser) => void;
  exams?: ExamItem[];
}

export const TeacherLoginModal: React.FC<TeacherLoginModalProps> = ({
  isOpen,
  onClose,
  onLoginSuccess,
  exams
}) => {
  const effectiveExams = (exams && exams.length > 0) ? exams : RAW_EXAMS_DATA;
  const [passcode, setPasscode] = useState('');
  const [selectedTeacherId, setSelectedTeacherId] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  if (!isOpen) return null;

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    // 1. If teacher is selected from dropdown
    if (selectedTeacherId) {
      const selected = TEACHER_PROFILES.find(t => t.id === selectedTeacherId);
      if (selected) {
        // Specifically for admin: must enter the secret admin passcode
        if (selected.role === 'admin') {
          if (passcode.trim().toUpperCase() !== selected.code.toUpperCase()) {
            setErrorMsg('เฉพาะผู้ดูแลระบบ (Admin): กรุณากรอกรหัสผ่านผู้ดูแลระบบให้ถูกต้อง');
            return;
          }
        }
        setSuccessMsg(`เข้าสู่ระบบสำเร็จ: ${selected.name}`);
        setTimeout(() => {
          onLoginSuccess(selected as TeacherUser);
          onClose();
          setPasscode('');
          setSelectedTeacherId('');
          setSuccessMsg('');
        }, 400);
        return;
      }
    }

    const inputCode = passcode.trim().toUpperCase();
    if (!inputCode) {
      setErrorMsg('กรุณาเลือกรายชื่ออาจารย์ หรือกรอกรหัสผ่าน');
      return;
    }

    // 2. Check if matches any teacher code (or secret admin code)
    const matchedByCode = TEACHER_PROFILES.find(t => t.code.toUpperCase() === inputCode);
    if (matchedByCode) {
      setSuccessMsg(`เข้าสู่ระบบสำเร็จ: ${matchedByCode.name}`);
      setTimeout(() => {
        onLoginSuccess(matchedByCode as TeacherUser);
        onClose();
        setPasscode('');
        setSuccessMsg('');
      }, 400);
      return;
    }

    // 3. Check if input matches teacher name or search key (teacher only, never bypass admin by name)
    const rawInput = passcode.trim().toLowerCase();
    const matchedByName = TEACHER_PROFILES.find(t => 
      t.role !== 'admin' && (
        t.name.toLowerCase().includes(rawInput) ||
        t.keys.some(k => rawInput.includes(k.toLowerCase()) || k.toLowerCase().includes(rawInput))
      )
    );
    if (matchedByName) {
      setSuccessMsg(`เข้าสู่ระบบสำเร็จ: ${matchedByName.name}`);
      setTimeout(() => {
        onLoginSuccess(matchedByName as TeacherUser);
        onClose();
        setPasscode('');
        setSuccessMsg('');
      }, 400);
      return;
    }

    setErrorMsg('รหัสผ่านไม่ถูกต้อง กรุณาตรวจสอบรหัสผ่านอีกครั้ง หรือเลือกชื่ออาจารย์จากรายการ');
  };

  const handleQuickLogin = (teacher: typeof TEACHER_PROFILES[0]) => {
    // Only allow quick demo access for teachers, never for admin
    if (teacher.role === 'admin') return;
    setPasscode(teacher.code);
    setSelectedTeacherId(teacher.id);
    setSuccessMsg(`เข้าสู่ระบบสำเร็จ: ${teacher.name}`);
    setTimeout(() => {
      onLoginSuccess(teacher as TeacherUser);
      onClose();
      setPasscode('');
      setSuccessMsg('');
    }, 400);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full border border-slate-200 overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-[#FFF0F5] via-[#FCE7F3] to-[#FFF0F5] text-[#701A4B] p-5 sm:p-6 relative border-b border-[#F8D7E3]">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-[#854D67] hover:text-[#701A4B] p-1 rounded-full hover:bg-white/40 transition"
          >
            <X className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-white border border-[#F8D7E3] flex items-center justify-center shadow-xs">
              <ShieldCheck className="w-6 h-6 text-[#9D174D]" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-bold tracking-tight text-[#701A4B]">เข้าสู่ระบบอาจารย์ผู้สอน</h2>
              <p className="text-xs text-[#854D67] mt-0.5">
                เลือกชื่อของท่านเพื่อโหลดและจัดการรายวิชาที่สอนได้ทันที
              </p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-5 sm:p-6 space-y-4">
          {errorMsg && (
            <div className="flex items-center gap-2 p-3 text-xs bg-rose-50 text-rose-700 border border-rose-200 rounded-xl">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="flex items-center gap-2 p-3 text-xs bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-xl">
              <CheckCircle className="w-4 h-4 shrink-0 text-emerald-600" />
              <span className="font-semibold">{successMsg}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center justify-between">
                <span className="flex items-center gap-1.5 text-[#701A4B]">
                  <User className="w-3.5 h-3.5 text-[#9D174D]" />
                  <span>เลือกชื่ออาจารย์ผู้บรรยาย (แนะนำ)</span>
                </span>
                <span className="text-[11px] font-normal text-[#854D67]">
                  มีทั้งหมด {TEACHER_PROFILES.length - 1} ท่าน
                </span>
              </label>
              <select
                value={selectedTeacherId}
                onChange={(e) => {
                  setSelectedTeacherId(e.target.value);
                  const found = TEACHER_PROFILES.find(t => t.id === e.target.value);
                  if (found && found.role !== 'admin') {
                    setPasscode(found.code);
                  } else {
                    setPasscode('');
                  }
                }}
                className="w-full px-3 py-2.5 text-xs sm:text-sm bg-[#FFF8FA] border border-[#F8D7E3] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#F8D7E3] focus:border-[#9D174D] focus:bg-white transition text-slate-800 font-medium"
              >
                <option value="">-- กรุณาเลือกชื่ออาจารย์ผู้สอนเพื่อเข้าสู่ระบบ --</option>
                {TEACHER_PROFILES.map(t => {
                  const count = getTeacherCourseCount(effectiveExams, t);
                  return (
                    <option key={t.id} value={t.id}>
                      {t.role === 'admin' 
                        ? `👑 ${t.name}`
                        : `👨‍🏫 ${t.name} (${count} รายวิชาที่สอน)`
                      }
                    </option>
                  );
                })}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center justify-between">
                <span className="flex items-center gap-1.5 text-[#701A4B]">
                  <Key className="w-3.5 h-3.5 text-[#9D174D]" />
                  <span>รหัสผ่านความปลอดภัย (Passcode)</span>
                </span>
                <span className="text-[11px] font-normal text-[#854D67]">
                  (สำหรับอาจารย์ หรือรหัสผู้ดูแลระบบ Admin)
                </span>
              </label>
              <input
                type="password"
                value={passcode}
                onChange={(e) => setPasscode(e.target.value)}
                placeholder="กรอกรหัสผ่านอาจารย์ หรือรหัสผู้ดูแลระบบ (Admin)"
                className="w-full px-3.5 py-2 text-xs sm:text-sm bg-[#FFF8FA] border border-[#F8D7E3] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#F8D7E3] focus:border-[#9D174D] focus:bg-white font-mono tracking-wider transition text-slate-800"
              />
            </div>

            <button
              type="submit"
              className="w-full py-2.5 px-4 bg-[#9D174D] hover:bg-[#831843] text-white font-semibold text-xs sm:text-sm rounded-xl shadow-2xs transition flex items-center justify-center gap-2 cursor-pointer"
            >
              <ShieldCheck className="w-4 h-4" />
              <span>ยืนยันเข้าสู่ระบบ</span>
            </button>
          </form>

          {/* Quick Demo Access Bar for Teachers Only */}
          <div className="pt-3 border-t border-[#FCE7F3]">
            <p className="text-[11px] font-semibold text-[#854D67] mb-2 flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-[#E11D48]" />
              <span>แตะเพื่อเข้าสู่ระบบอาจารย์ตัวอย่าง (Quick Access):</span>
            </p>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => handleQuickLogin(TEACHER_PROFILES[1])}
                className="text-left p-2.5 rounded-xl border border-[#F8D7E3] bg-[#FFF8FA] hover:bg-[#FFF0F5] text-xs transition cursor-pointer"
              >
                <div className="font-bold text-[#701A4B]">👨‍🏫 {TEACHER_PROFILES[1].name}</div>
                <div className="text-[10px] text-[#854D67]">ตรงกับตารางสอน {getTeacherCourseCount(effectiveExams, TEACHER_PROFILES[1])} รายวิชา</div>
              </button>
              <button
                type="button"
                onClick={() => handleQuickLogin(TEACHER_PROFILES[2])}
                className="text-left p-2.5 rounded-xl border border-[#F8D7E3] bg-white hover:bg-[#FFF0F5] text-xs transition cursor-pointer"
              >
                <div className="font-bold text-slate-800">👨‍🏫 {TEACHER_PROFILES[2].name}</div>
                <div className="text-[10px] text-slate-500">ตรงกับตารางสอน {getTeacherCourseCount(effectiveExams, TEACHER_PROFILES[2])} รายวิชา</div>
              </button>
              <button
                type="button"
                onClick={() => handleQuickLogin(TEACHER_PROFILES[3])}
                className="text-left p-2.5 rounded-xl border border-[#F8D7E3] bg-white hover:bg-[#FFF0F5] text-xs transition cursor-pointer"
              >
                <div className="font-bold text-slate-800">👨‍🏫 {TEACHER_PROFILES[3].name}</div>
                <div className="text-[10px] text-slate-500">ตรงกับตารางสอน {getTeacherCourseCount(effectiveExams, TEACHER_PROFILES[3])} รายวิชา</div>
              </button>
              <button
                type="button"
                onClick={() => handleQuickLogin(TEACHER_PROFILES[9])}
                className="text-left p-2.5 rounded-xl border border-[#F8D7E3] bg-white hover:bg-[#FFF0F5] text-xs transition cursor-pointer"
              >
                <div className="font-bold text-slate-800">👨‍🏫 {TEACHER_PROFILES[9].name}</div>
                <div className="text-[10px] text-slate-500">ตรงกับตารางสอน {getTeacherCourseCount(effectiveExams, TEACHER_PROFILES[9])} รายวิชา</div>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
