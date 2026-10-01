import React, { useState } from 'react';
import { 
  ArrowLeft,
  ChevronRight,
  ShieldCheck, 
  Key, 
  User, 
  AlertCircle, 
  CheckCircle, 
  Info, 
  Sparkles,
  Lock
} from 'lucide-react';
import { TeacherUser, ExamItem } from '../types/exam';
import { TEACHER_PROFILES, getTeacherCourseCount } from '../utils/teacherMatching';
import { RAW_EXAMS_DATA } from '../data/initialExams';

export interface TeacherLoginPageProps {
  exams?: ExamItem[];
  onBack: () => void;
  onLoginSuccess: (user: TeacherUser) => void;
}

export const TeacherLoginPage: React.FC<TeacherLoginPageProps> = ({
  exams,
  onBack,
  onLoginSuccess
}) => {
  const effectiveExams = (exams && exams.length > 0) ? exams : RAW_EXAMS_DATA;
  const [passcode, setPasscode] = useState('');
  const [selectedTeacherId, setSelectedTeacherId] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    // 1. If teacher is selected from dropdown
    if (selectedTeacherId) {
      const selected = TEACHER_PROFILES.find(t => t.id === selectedTeacherId);
      if (selected) {
        if (selected.role === 'admin') {
          if (passcode.trim().toUpperCase() !== selected.code.toUpperCase()) {
            setErrorMsg('เฉพาะผู้ดูแลระบบ (Admin): กรุณากรอกรหัสผ่านผู้ดูแลระบบให้ถูกต้อง');
            return;
          }
        }
        setSuccessMsg(`เข้าสู่ระบบสำเร็จ: ${selected.name}`);
        setTimeout(() => {
          onLoginSuccess(selected as TeacherUser);
          onBack();
        }, 400);
        return;
      }
    }

    const inputCode = passcode.trim().toUpperCase();
    if (!inputCode) {
      setErrorMsg('กรุณาเลือกรายชื่ออาจารย์ หรือกรอกรหัสผ่าน');
      return;
    }

    const found = TEACHER_PROFILES.find(t => t.code.toUpperCase() === inputCode);
    if (found) {
      setSuccessMsg(`ยินดีต้อนรับ: ${found.name}`);
      setTimeout(() => {
        onLoginSuccess(found as TeacherUser);
        onBack();
      }, 400);
    } else {
      setErrorMsg('รหัสผ่านไม่ถูกต้อง หรือไม่พบข้อมูลในระบบ');
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200 max-w-3xl mx-auto">
      {/* 1. Navigation Breadcrumb Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white/90 backdrop-blur-sm p-4 rounded-2xl border border-[#F8D7E3] shadow-xs">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-[#FFF0F5] text-slate-700 hover:text-[#9D174D] border border-slate-200 hover:border-[#F8D7E3] font-medium text-sm transition cursor-pointer shadow-xs"
          >
            <ArrowLeft className="w-4 h-4 text-[#9D174D]" />
            <span>ย้อนกลับหน้าหลัก</span>
          </button>
          <div className="flex items-center gap-2 text-xs sm:text-sm text-slate-500">
            <button onClick={onBack} className="hover:text-[#9D174D] transition cursor-pointer">หน้าหลัก</button>
            <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
            <span className="font-semibold text-[#9D174D]">เข้าสู่ระบบอาจารย์ผู้สอน</span>
          </div>
        </div>
      </div>

      {/* 2. Login Card */}
      <div className="bg-white rounded-3xl border border-[#F8D7E3] shadow-sm overflow-hidden">
        {/* Banner Header */}
        <div className="bg-gradient-to-r from-[#FFF0F5] via-[#FFF5F8] to-[#FFF0F5] border-b border-[#F8D7E3] p-6 sm:p-8 text-center sm:text-left">
          <div className="flex flex-col sm:flex-row items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-[#9D174D] text-white flex items-center justify-center shrink-0 shadow-md">
              <ShieldCheck className="w-8 h-8 text-rose-100" />
            </div>
            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-[#9D174D]/10 text-[#9D174D] mb-1.5">
                <Sparkles className="w-3.5 h-3.5" />
                <span>อาจารย์ผู้สอน & ผู้ดูแลระบบ</span>
              </div>
              <h1 className="text-xl sm:text-2xl font-bold text-slate-900">
                เข้าสู่ระบบอาจารย์ผู้สอน (Teacher Portal)
              </h1>
              <p className="text-xs sm:text-sm text-slate-600 mt-1">
                วิทยาลัยสงฆ์พ่อขุนผาเมือง มหาวิทยาลัยมหาจุฬาลงกรณราชวิทยาลัย
              </p>
            </div>
          </div>
        </div>

        {/* 3. Form */}
        <form onSubmit={handleLogin} className="p-6 sm:p-8 space-y-6">
          {errorMsg && (
            <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs sm:text-sm flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs sm:text-sm flex items-center gap-3">
              <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Quick Teacher Select */}
          <div className="space-y-2">
            <label className="block text-xs sm:text-sm font-bold text-slate-800">
              วิธีที่ 1: เลือกชื่ออาจารย์ผู้สอนจากรายชื่อ (Quick Login)
            </label>
            <div className="relative">
              <select
                value={selectedTeacherId}
                onChange={(e) => {
                  setSelectedTeacherId(e.target.value);
                  setErrorMsg('');
                }}
                className="w-full px-4 py-3 rounded-2xl border border-slate-200 bg-slate-50/70 focus:bg-white text-xs sm:text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#9D174D]/20 focus:border-[#9D174D] transition cursor-pointer"
              >
                <option value="">-- กรุณาเลือกชื่ออาจารย์ผู้สอน --</option>
                {TEACHER_PROFILES.map((t) => {
                  const count = getTeacherCourseCount(effectiveExams, t);
                  return (
                    <option key={t.id} value={t.id}>
                      {t.name} {t.role === 'admin' ? '⭐ (ผู้ดูแลระบบ - ต้องใส่รหัสผ่าน)' : `(${count} วิชา)`}
                    </option>
                  );
                })}
              </select>
            </div>
            <p className="text-[11px] text-slate-500">
              * เลือกชื่อท่านเพื่อเข้าจัดการเฉพาะรายวิชาที่ท่านเป็นผู้สอน
            </p>
          </div>

          <div className="relative flex py-2 items-center">
            <div className="flex-grow border-t border-slate-200"></div>
            <span className="flex-shrink mx-4 text-xs text-slate-400 font-medium">หรือ</span>
            <div className="flex-grow border-t border-slate-200"></div>
          </div>

          {/* Passcode input */}
          <div className="space-y-2">
            <label className="block text-xs sm:text-sm font-bold text-slate-800">
              วิธีที่ 2: กรอกรหัสผ่านประจำตัวอาจารย์ หรือ Admin Passcode
            </label>
            <div className="relative">
              <Key className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="password"
                value={passcode}
                onChange={(e) => {
                  setPasscode(e.target.value);
                  setErrorMsg('');
                }}
                placeholder="กรอกรหัสผ่าน เช่น MCUADMIN2026 หรือรหัสอาจารย์..."
                className="w-full pl-10 pr-4 py-3 rounded-2xl border border-slate-200 bg-slate-50/70 focus:bg-white text-xs sm:text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#9D174D]/20 focus:border-[#9D174D] transition"
              />
            </div>
            <p className="text-[11px] text-slate-500">
              สำหรับผู้ดูแลระบบ Admin: กรอกรหัส <code className="bg-slate-100 px-1.5 py-0.5 rounded font-mono text-[#9D174D]">MCUADMIN2026</code>
            </p>
          </div>

          {/* Submit button */}
          <div className="pt-4 flex flex-col sm:flex-row items-center justify-between gap-3">
            <button
              type="button"
              onClick={onBack}
              className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs sm:text-sm transition cursor-pointer"
            >
              ยกเลิก
            </button>
            <button
              type="submit"
              className="w-full sm:w-auto px-8 py-3 rounded-xl bg-gradient-to-r from-[#9D174D] to-[#701A4B] hover:opacity-95 text-white font-bold text-xs sm:text-sm shadow-md transition cursor-pointer"
            >
              เข้าสู่ระบบทันที
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
