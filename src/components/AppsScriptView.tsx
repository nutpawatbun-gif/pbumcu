import React, { useState } from 'react';
import { 
  Code, 
  Copy, 
  Check, 
  FileSpreadsheet, 
  Send, 
  Play, 
  Sparkles,
  RefreshCw,
  HelpCircle,
  Database
} from 'lucide-react';
import { APPS_SCRIPT_SOURCE_CODE } from '../utils/appsScriptTemplate';
import { ExamItem } from '../types/exam';

interface AppsScriptViewProps {
  exams: ExamItem[];
  webhookUrl: string;
  onUpdateWebhookUrl: (url: string) => void;
  lineToken: string;
  onUpdateLineToken: (token: string) => void;
}

export const AppsScriptView: React.FC<AppsScriptViewProps> = ({
  exams,
  webhookUrl,
  onUpdateWebhookUrl,
  lineToken,
  onUpdateLineToken
}) => {
  const [copiedCode, setCopiedCode] = useState(false);
  const [testingWebhook, setTestingWebhook] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [syncingAll, setSyncingAll] = useState(false);
  const [syncResult, setSyncResult] = useState<string | null>(null);

  const handleCopyCode = () => {
    navigator.clipboard.writeText(APPS_SCRIPT_SOURCE_CODE);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleTestWebhook = async () => {
    if (!webhookUrl) {
      setTestResult({ success: false, message: 'กรุณากรอก Apps Script Webhook URL ก่อนทดสอบ' });
      return;
    }
    setTestingWebhook(true);
    setTestResult(null);

    try {
      const res = await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({
          action: 'notify',
          message: '🔔 ทดสอบการเชื่อมต่อ Apps Script + LINE Notify สำเร็จเรียบร้อย!',
          token: lineToken
        })
      });
      if (res.ok) {
        setTestResult({ success: true, message: 'ส่งสัญญาณทดสอบสำเร็จ! Apps Script ตอบกลับสมบูรณ์' });
      } else {
        setTestResult({ success: false, message: `Apps Script ตอบกลับด้วยสถานะ: ${res.status}` });
      }
    } catch (e) {
      setTestResult({
        success: false,
        message: `ข้อผิดพลาดในการเชื่อมต่อ (อาจติด CORS แนะนำให้ Deploy เป็น Web App แบบ Anyone): ${(e as Error).message}`
      });
    } finally {
      setTestingWebhook(false);
    }
  };

  const handleSyncAllExamsToSheet = async () => {
    if (!webhookUrl) {
      alert('กรุณากรอก Apps Script Webhook URL ก่อนสั่งซิงค์');
      return;
    }
    setSyncingAll(true);
    setSyncResult(null);

    try {
      const res = await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({
          action: 'sync_exams',
          exams: exams
        })
      });
      if (res.ok) {
        setSyncResult(`ซิงค์ข้อมูลทั้ง ${exams.length} รายวิชาเข้า Google Sheet & Firebase สำเร็จเรียบร้อย!`);
      } else {
        setSyncResult(`เกิดข้อผิดพลาดในการซิงค์: สถานะ ${res.status}`);
      }
    } catch (e) {
      setSyncResult(`เกิดข้อผิดพลาดในการเชื่อมต่อ: ${(e as Error).message}`);
    } finally {
      setSyncingAll(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-3 sm:px-4 py-4 sm:py-6 space-y-5">
      {/* Header Banner (Soft Pastel Pink) */}
      <div className="bg-white/95 rounded-2xl p-4 sm:p-6 border border-[#F8D7E3] shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#FFF0F5] text-[#9D174D] border border-[#F8D7E3] text-xs font-semibold">
              <Sparkles className="w-3.5 h-3.5 text-[#E11D48]" />
              <span>Google Apps Script & Cloud Architecture</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-[#701A4B] tracking-tight flex items-center gap-2">
              <span>เชื่อมต่อ Google Sheets, Apps Script & Firebase</span>
            </h1>
            <p className="text-xs sm:text-sm text-[#854D67] max-w-2xl leading-relaxed">
              ชุดสคริปต์เชื่อมต่อสองทาง (Two-Way Sync): บริหารจัดการตารางสอบร่วมกันผ่าน Google Sheet, บันทึกลง Firebase Realtime Database และตั้งระบบยิง LINE Notify อัตโนมัติทุกเช้า 07:00 น. ก่อนสอบ
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopyCode}
              className="px-4 py-2 bg-[#9D174D] hover:bg-[#831843] text-white font-semibold text-xs rounded-xl shadow-xs transition flex items-center gap-2"
            >
              {copiedCode ? <Check className="w-4 h-4 text-emerald-200" /> : <Copy className="w-4 h-4" />}
              <span>{copiedCode ? 'คัดลอกโค้ดแล้ว!' : 'คัดลอกโค้ด Apps Script'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Integration Control Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left Side: Webhook Config & Sync Actions */}
        <div className="lg:col-span-5 space-y-5">
          <div className="bg-white rounded-2xl p-4 sm:p-5 border border-[#F8D7E3] shadow-xs space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-800 flex items-center justify-center border border-emerald-200">
                <FileSpreadsheet className="w-5 h-5 text-emerald-600" />
              </div>
              <div>
                <h3 className="font-bold text-sm text-slate-900">เชื่อมต่อ Webhook ของคุณ</h3>
                <p className="text-xs text-[#854D67]">นำ Web App URL ที่ได้จากการ Deploy มาใส่ที่นี่</p>
              </div>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Apps Script Web App URL:
                </label>
                <input
                  type="url"
                  value={webhookUrl}
                  onChange={(e) => onUpdateWebhookUrl(e.target.value)}
                  placeholder="https://script.google.com/macros/s/.../exec"
                  className="w-full px-3 py-2 text-xs bg-[#FFF8FA] border border-[#F8D7E3] rounded-xl focus:outline-none focus:ring-1 focus:ring-[#9D174D] font-mono text-slate-800"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  LINE Notify Token:
                </label>
                <input
                  type="password"
                  value={lineToken}
                  onChange={(e) => onUpdateLineToken(e.target.value)}
                  placeholder="LINE Notify Token..."
                  className="w-full px-3 py-2 text-xs bg-[#FFF8FA] border border-[#F8D7E3] rounded-xl focus:outline-none focus:ring-1 focus:ring-[#9D174D] font-mono text-slate-800"
                />
              </div>
            </div>

            {testResult && (
              <div className={`p-3 rounded-xl text-xs ${
                testResult.success 
                  ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' 
                  : 'bg-rose-50 text-rose-800 border border-rose-200'
              }`}>
                {testResult.message}
              </div>
            )}

            {syncResult && (
              <div className="p-3 bg-blue-50 text-blue-800 border border-blue-200 rounded-xl text-xs font-medium">
                {syncResult}
              </div>
            )}

            <div className="flex flex-col gap-2 pt-1">
              <button
                onClick={handleTestWebhook}
                disabled={testingWebhook}
                className="w-full py-2.5 px-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold transition flex items-center justify-center gap-2 disabled:opacity-50 shadow-2xs"
              >
                <Play className="w-3.5 h-3.5" />
                <span>{testingWebhook ? 'กำลังส่งข้อมูลทดสอบ...' : 'ทดสอบยิงสัญญาณ Webhook'}</span>
              </button>

              <button
                onClick={handleSyncAllExamsToSheet}
                disabled={syncingAll}
                className="w-full py-2 px-3 bg-[#FFF0F5] hover:bg-[#FCE7F3] text-[#701A4B] rounded-xl text-xs font-semibold border border-[#F8D7E3] transition flex items-center justify-center gap-2 disabled:opacity-50 shadow-2xs"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${syncingAll ? 'animate-spin' : ''}`} />
                <span>ซิงค์ข้อมูลทั้ง {exams.length} วิชาเข้า Google Sheet</span>
              </button>
            </div>
          </div>

          {/* Quick Setup Steps */}
          <div className="bg-white rounded-2xl p-4 sm:p-5 border border-[#F8D7E3] shadow-xs space-y-3">
            <h3 className="font-bold text-sm text-[#701A4B] flex items-center gap-1.5">
              <HelpCircle className="w-4 h-4 text-[#9D174D]" />
              <span>ขั้นตอนติดตั้งใน 4 ขั้นตอน:</span>
            </h3>

            <ol className="space-y-2.5 text-xs text-[#854D67] list-decimal list-inside leading-relaxed">
              <li className="pl-1">
                <span className="font-semibold text-slate-800">สร้าง Google Sheet หรือ Apps Script:</span> เปิด Google Drive หรือไปที่ <code className="bg-[#FFF0F5] text-[#701A4B] px-1.5 py-0.5 rounded border border-[#F8D7E3] font-mono">script.google.com</code>
              </li>
              <li className="pl-1">
                <span className="font-semibold text-slate-800">วางโค้ด .gs:</span> กดปุ่ม <b>"คัดลอกโค้ด Apps Script"</b> ด้านบน แล้วนำไปวางทับในไฟล์ <code className="bg-[#FFF0F5] text-[#701A4B] px-1.5 py-0.5 rounded border border-[#F8D7E3] font-mono">Code.gs</code> แล้วกด 💾 บันทึก
              </li>
              <li className="pl-1">
                <span className="font-semibold text-slate-800">⚠️ ให้สิทธิ์ DriveApp (แก้ Error ไม่ได้รับอนุญาต):</span> ที่แถบเครื่องมือด้านบน เลือกฟังก์ชัน <code className="bg-emerald-50 text-emerald-800 px-1.5 py-0.5 rounded border border-emerald-200 font-mono font-bold">initialSetupAndAuthorize</code> แล้วกดปุ่ม <b>"▶️ เรียกใช้ (Run)"</b> 1 ครั้ง เพื่อกดยืนยันสิทธิ์อนุญาต (Allow) การเข้าถึง Google Drive
              </li>
              <li className="pl-1">
                <span className="font-semibold text-slate-800">Deploy เป็น Web App:</span> กดปุ่ม <b>Deploy &gt; New Deployment</b> (หรือ Manage deployments &gt; ✏️ แก้ไข &gt; เวอร์ชันใหม่) &gt; เลือก Web App &gt; ตั้งค่า <b>Who has access</b> เป็น <b>"Anyone"</b> แล้วคัดลอก Web App URL มาใส่ในช่องด้านบน
              </li>
            </ol>
          </div>
        </div>

        {/* Right Side: Code Viewer */}
        <div className="lg:col-span-7 space-y-4">
          <div className="bg-white rounded-2xl border border-[#F8D7E3] shadow-xs overflow-hidden">
            <div className="bg-[#2D1822] text-slate-200 px-4 py-3 flex items-center justify-between border-b border-[#F8D7E3]/20">
              <div className="flex items-center gap-2">
                <Code className="w-4 h-4 text-[#F8D7E3]" />
                <span className="text-xs font-mono font-semibold">Code.gs (Google Apps Script Template)</span>
              </div>
              <button
                onClick={handleCopyCode}
                className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-[#701A4B] hover:bg-[#831843] text-white transition flex items-center gap-1"
              >
                {copiedCode ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedCode ? 'คัดลอกแล้ว' : 'คัดลอก'}</span>
              </button>
            </div>

            <div className="relative">
              <pre className="p-4 bg-[#1F1018] text-pink-200/90 font-mono text-[11px] leading-relaxed overflow-x-auto max-h-[580px] overflow-y-auto selection:bg-[#9D174D]">
                {APPS_SCRIPT_SOURCE_CODE}
              </pre>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
