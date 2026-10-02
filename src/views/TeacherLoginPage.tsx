import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, 
  AlertCircle, 
  CheckCircle, 
  Lock,
  ArrowRight,
  LogIn,
  KeyRound
} from 'lucide-react';
import { apiClient, ApiUser } from '../utils/apiClient';

export interface TeacherLoginPageProps {
  onLoginSuccess: (user: ApiUser) => void;
}

declare global {
  interface Window {
    google?: any;
  }
}

export const TeacherLoginPage: React.FC<TeacherLoginPageProps> = ({
  onLoginSuccess
}) => {
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [manualEmail, setManualEmail] = useState('');
  const [showDevOption, setShowDevOption] = useState(false);

  // Initialize Google Identity Services (GIS) if client ID is configured
  useEffect(() => {
    const initGoogleGis = () => {
      if (window.google?.accounts?.id) {
        try {
          window.google.accounts.id.initialize({
            client_id: (import.meta as any).env.VITE_GOOGLE_CLIENT_ID || 'MCU_EXAM_PORTAL',
            callback: handleGoogleCallback,
            auto_select: false
          });
          const btnParent = document.getElementById('google-signin-btn-container');
          if (btnParent) {
            btnParent.innerHTML = '';
            window.google.accounts.id.renderButton(btnParent, {
              theme: 'outline',
              size: 'large',
              width: 320,
              text: 'signin_with',
              shape: 'pill'
            });
          }
        } catch {
          // Ignore if GIS script is not yet loaded or client id is missing
        }
      }
    };

    if (window.google?.accounts?.id) {
      initGoogleGis();
    } else {
      const script = document.createElement('script');
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.defer = true;
      script.onload = initGoogleGis;
      document.body.appendChild(script);
    }
  }, []);

  const handleGoogleCallback = async (response: any) => {
    if (!response?.credential) {
      setErrorMsg('ไม่พบข้อมูลการยืนยันตัวตนจาก Google');
      return;
    }
    await processLogin(response.credential, undefined);
  };

  const processLogin = async (idToken?: string, devEmail?: string) => {
    setIsLoading(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const result = await apiClient.loginWithGoogle(idToken, devEmail);
      setSuccessMsg(`ยินดีต้อนรับ: ${result.user.fullName} (${result.user.role === 'admin' ? 'ผู้ดูแลระบบ' : result.user.role === 'staff' ? 'เจ้าหน้าที่ฝ่ายสอบ' : 'อาจารย์ผู้สอน'})`);
      setTimeout(() => {
        onLoginSuccess(result.user);
      }, 500);
    } catch (err: any) {
      setErrorMsg(err.message || 'การเข้าสู่ระบบไม่สำเร็จ บัญชีของท่านอาจยังไม่ได้รับการอนุมัติ');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDevSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualEmail.trim()) {
      setErrorMsg('กรุณากรอกอีเมล Google ของท่าน');
      return;
    }
    await processLogin(undefined, manualEmail.trim());
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center p-4">
      <div className="w-full max-w-lg bg-white rounded-3xl border border-[#F8D7E3] shadow-lg overflow-hidden animate-in fade-in duration-300">
        {/* Banner Header */}
        <div className="bg-gradient-to-br from-[#FFF0F5] via-[#FFF5F8] to-[#FCE7F3] border-b border-[#F8D7E3] p-8 text-center">
          <div className="w-16 h-16 rounded-2xl bg-[#9D174D] text-white flex items-center justify-center mx-auto mb-4 shadow-md">
            <Lock className="w-8 h-8 text-rose-100" />
          </div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-[#9D174D]/10 text-[#9D174D] mb-2">
            <ShieldCheck className="w-4 h-4" />
            <span>ระบบความปลอดภัยภายในมหาวิทยาลัย (Internal Only)</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            ระบบรับและพิมพ์ข้อสอบออนไลน์
          </h1>
          <p className="text-xs text-[#854D67] mt-1.5 font-medium">
            วิทยาลัยสงฆ์พ่อขุนผาเมือง มหาวิทยาลัยมหาจุฬาลงกรณราชวิทยาลัย
          </p>
        </div>

        {/* Content Body */}
        <div className="p-8 space-y-6">
          {errorMsg && (
            <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs sm:text-sm flex items-start gap-3 animate-in shake duration-200">
              <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold">เข้าสู่ระบบไม่สำเร็จ</p>
                <p className="text-xs mt-0.5">{errorMsg}</p>
              </div>
            </div>
          )}

          {successMsg && (
            <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs sm:text-sm flex items-center gap-3">
              <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0" />
              <span className="font-semibold">{successMsg}</span>
            </div>
          )}

          <div className="text-center space-y-3">
            <p className="text-xs text-slate-600 leading-relaxed">
              ระบบนี้เป็นระบบปิดสำหรับบุคลากรมหาวิทยาลัย (อาจารย์ผู้สอน, เจ้าหน้าที่ฝ่ายสอบ, และผู้ดูแลระบบ)
              <br />
              <strong className="text-slate-800">กรุณาเข้าสู่ระบบด้วยบัญชี Google ที่ได้รับอนุมัติในระบบ</strong>
            </p>

            {/* Google Sign-In Button Container */}
            <div className="pt-2 flex justify-center">
              <div id="google-signin-btn-container" className="min-h-[44px] flex items-center justify-center">
                {/* Fallback button if GIS script blocked or offline */}
                <button
                  type="button"
                  onClick={() => setShowDevOption(true)}
                  disabled={isLoading}
                  className="inline-flex items-center gap-3 px-6 py-3 rounded-full border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-sm font-semibold shadow-xs transition cursor-pointer"
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
                  </svg>
                  <span>เข้าสู่ระบบด้วยบัญชี Google</span>
                </button>
              </div>
            </div>
          </div>

          <div className="relative flex py-2 items-center">
            <div className="flex-grow border-t border-slate-200"></div>
            <span className="flex-shrink mx-4 text-[11px] text-slate-400 font-medium">เข้าสู่ระบบด้วยอีเมลมหาวิทยาลัย</span>
            <div className="flex-grow border-t border-slate-200"></div>
          </div>

          {/* Email input form for verified university accounts */}
          <form onSubmit={handleDevSubmit} className="space-y-4">
            <div>
              <label htmlFor="user-email" className="block text-xs font-bold text-slate-700 mb-1">
                อีเมล Google ของท่าน (@mcu.ac.th หรืออีเมลที่ลงทะเบียน)
              </label>
              <div className="relative">
                <input
                  id="user-email"
                  type="email"
                  value={manualEmail}
                  onChange={(e) => setManualEmail(e.target.value)}
                  placeholder="เช่น panya.kan@mcu.ac.th"
                  disabled={isLoading}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white text-xs sm:text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#9D174D]/20 focus:border-[#9D174D] transition"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-[#9D174D] to-[#701A4B] hover:opacity-95 text-white font-bold text-xs sm:text-sm shadow-md transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {isLoading ? (
                <span>กำลังตรวจสอบสิทธิ์...</span>
              ) : (
                <>
                  <LogIn className="w-4 h-4" />
                  <span>ตรวจสอบสิทธิ์และเข้าสู่ระบบ</span>
                </>
              )}
            </button>
          </form>

          {/* Security Notice */}
          <div className="pt-2 border-t border-slate-100 text-[11px] text-slate-500 space-y-1">
            <p className="flex items-center gap-1.5 font-semibold text-slate-700">
              <KeyRound className="w-3.5 h-3.5 text-[#9D174D]" />
              <span>การรักษาความปลอดภัยของระบบ:</span>
            </p>
            <p>• ระบบตรวจสอบสิทธิ์รายวิชาและบทบาทฝั่งเซิร์ฟเวอร์ทุกคำขอ (Default Deny)</p>
            <p>• หากยังไม่ได้รับการอนุมัติบัญชี กรุณาติดต่อผู้ดูแลระบบเพื่อเปิดสิทธิ์ก่อนเข้าใช้งาน</p>
          </div>
        </div>
      </div>
    </div>
  );
};
