import React, { useState } from 'react';
import { 
  Bell, 
  Send, 
  Volume2, 
  Check, 
  Copy, 
  Sparkles, 
  Clock, 
  Smartphone, 
  AlertTriangle
} from 'lucide-react';
import { ExamItem, NotificationSetting, TeacherUser } from '../types/exam';
import { 
  playNotificationChime, 
  requestNotificationPermission, 
  sendBrowserNotification, 
  formatLineNotifyMessage,
  sendLineNotifyNotification,
  calculateCountdown
} from '../utils/notifications';
import { isLecturerMatch } from '../utils/teacherMatching';

interface AlertCenterProps {
  exams: ExamItem[];
  savedExamIds: string[];
  settings: NotificationSetting;
  onUpdateSettings: (newSettings: NotificationSetting) => void;
  nextUpcomingExam: ExamItem | null;
  currentUser?: TeacherUser | null;
}

export const AlertCenter: React.FC<AlertCenterProps> = ({
  exams,
  savedExamIds,
  settings,
  onUpdateSettings,
  nextUpcomingExam,
  currentUser
}) => {
  const isTeacher = currentUser && currentUser.role !== 'admin';
  const myTeachingExams = isTeacher ? exams.filter(e => isLecturerMatch(e.lecturer, currentUser)) : [];
  const otherExams = isTeacher ? exams.filter(e => !isLecturerMatch(e.lecturer, currentUser)) : exams;

  const [selectedExamId, setSelectedExamId] = useState<string>(() => {
    if (isTeacher && myTeachingExams.length > 0) {
      return myTeachingExams[0].id;
    }
    return nextUpcomingExam ? nextUpcomingExam.id : (exams[0]?.id || '');
  });
  const [customMsgTitle, setCustomMsgTitle] = useState('แจ้งเตือนการสอบ มจร 2569');
  const [copied, setCopied] = useState(false);
  const [sendingLine, setSendingLine] = useState(false);
  const [lineSendStatus, setLineSendStatus] = useState<{ success: boolean; message: string } | null>(null);
  const [browserPermStatus, setBrowserPermStatus] = useState<NotificationPermission>(
    typeof Notification !== 'undefined' ? Notification.permission : 'default'
  );

  const currentExam = exams.find(e => e.id === selectedExamId) || nextUpcomingExam || exams[0];

  const handleRequestBrowserPermission = async () => {
    const perm = await requestNotificationPermission();
    setBrowserPermStatus(perm);
    if (perm === 'granted') {
      sendBrowserNotification('เปิดการแจ้งเตือนสำเร็จ!', 'ระบบจะแจ้งเตือนเมื่อใกล้ถึงเวลาสอบ');
      onUpdateSettings({ ...settings, enableBrowserAlerts: true });
    }
  };

  const handleTestChime = () => {
    playNotificationChime();
  };

  const handleTestBrowserAlert = () => {
    if (!currentExam) return;
    sendBrowserNotification(
      `🔔 ใกล้ถึงเวลาสอบ: ${currentExam.courseName}`,
      `วันสอบ: ${currentExam.examDateThai} เวลา ${currentExam.examTimeThai} ห้อง: ห้องประชุมชั้น 1`
    );
  };

  const handleCopyLineMessage = () => {
    if (!currentExam) return;
    const msg = formatLineNotifyMessage(currentExam, customMsgTitle);
    navigator.clipboard.writeText(msg);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSendLine = async () => {
    if (!currentExam) return;
    setSendingLine(true);
    setLineSendStatus(null);
    const msg = formatLineNotifyMessage(currentExam, customMsgTitle);
    const result = await sendLineNotifyNotification(msg, settings.lineNotifyToken, settings.webhookUrl);
    setLineSendStatus(result);
    setSendingLine(false);
  };

  const countdown = currentExam ? calculateCountdown(currentExam) : null;

  return (
    <div className="max-w-5xl mx-auto px-3 sm:px-4 py-4 sm:py-6 space-y-5">
      {/* Title Header (Soft Pastel Pink) */}
      <div className="bg-white/95 rounded-2xl p-4 sm:p-6 border border-[#F8D7E3] shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#FFF0F5] text-[#9D174D] border border-[#F8D7E3] text-xs font-semibold">
              <Sparkles className="w-3.5 h-3.5 text-[#E11D48]" />
              <span>Real-time Exam Notification Center</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-[#701A4B] tracking-tight">ศูนย์แจ้งเตือนการสอบ & LINE Notify</h1>
            <p className="text-xs sm:text-sm text-[#854D67]">
              ระบบแจ้งเตือนนิสิตก่อนถึงเวลาสอบผ่าน Web Push, เสียงเตือน และส่งข้อความเข้ากลุ่ม LINE แบบเรียลไทม์
            </p>
          </div>

          {/* Quick Audio Test Button */}
          <div className="flex items-center gap-2">
            <button
              onClick={handleTestChime}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#FFF0F5] hover:bg-[#FCE7F3] text-[#701A4B] text-xs font-semibold border border-[#F8D7E3] transition shadow-2xs"
            >
              <Volume2 className="w-4 h-4 text-[#9D174D]" />
              <span>ทดสอบเสียงสัญญาณเตือน</span>
            </button>
          </div>
        </div>
      </div>

      {/* Grid: 2 Columns */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left Column: Settings & Triggers */}
        <div className="lg:col-span-6 space-y-5">
          {/* Card 1: Browser Notification */}
          <div className="bg-white rounded-2xl p-4 sm:p-5 border border-[#F8D7E3] shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-[#FFF0F5] text-[#9D174D] flex items-center justify-center border border-[#F8D7E3]">
                  <Bell className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-slate-900">แจ้งเตือนบนหน้าจอเบราว์เซอร์ (Web Push)</h3>
                  <p className="text-xs text-[#854D67]">เด้งเตือนบนหน้าจอคอมพิวเตอร์ แท็บเล็ต และมือถือ</p>
                </div>
              </div>
              <span className={`text-xs px-2.5 py-0.5 rounded-full font-semibold ${
                browserPermStatus === 'granted' 
                  ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' 
                  : 'bg-slate-100 text-slate-600'
              }`}>
                {browserPermStatus === 'granted' ? 'เปิดใช้งานแล้ว' : 'ยังไม่เปิด'}
              </span>
            </div>

            <div className="p-3.5 bg-[#FFF8FA] rounded-xl text-xs space-y-3 border border-[#FCE7F3]">
              <div className="flex items-center justify-between">
                <span className="text-slate-700 font-semibold">เตือนล่วงหน้าก่อนสอบ:</span>
                <select
                  value={settings.alertBeforeMinutes}
                  onChange={(e) => onUpdateSettings({ ...settings, alertBeforeMinutes: Number(e.target.value) })}
                  className="px-2.5 py-1 bg-white border border-[#F8D7E3] rounded-lg text-xs font-medium text-slate-800 focus:outline-none focus:ring-1 focus:ring-[#9D174D]"
                >
                  <option value={15}>15 นาทีก่อนสอบ</option>
                  <option value={30}>30 นาทีก่อนสอบ</option>
                  <option value={60}>1 ชั่วโมงก่อนสอบ</option>
                  <option value={1440}>1 วันล่วงหน้า (07:00 น.)</option>
                </select>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-slate-700 font-semibold">เปิดเสียง Chime สัญญาณเตือน:</span>
                <input
                  type="checkbox"
                  checked={settings.soundEnabled}
                  onChange={(e) => onUpdateSettings({ ...settings, soundEnabled: e.target.checked })}
                  className="w-4 h-4 text-[#9D174D] rounded focus:ring-[#F8D7E3]"
                />
              </div>
            </div>

            <div className="flex items-center gap-2">
              {browserPermStatus !== 'granted' ? (
                <button
                  onClick={handleRequestBrowserPermission}
                  className="flex-1 py-2.5 px-3 bg-[#9D174D] hover:bg-[#831843] text-white rounded-xl text-xs font-semibold transition flex items-center justify-center gap-1.5 shadow-2xs"
                >
                  <Bell className="w-4 h-4" />
                  <span>กดอนุญาตการแจ้งเตือน</span>
                </button>
              ) : (
                <button
                  onClick={handleTestBrowserAlert}
                  className="flex-1 py-2.5 px-3 bg-[#FFF0F5] hover:bg-[#FCE7F3] text-[#701A4B] border border-[#F8D7E3] rounded-xl text-xs font-semibold transition flex items-center justify-center gap-1.5 shadow-2xs"
                >
                  <Smartphone className="w-4 h-4 text-[#9D174D]" />
                  <span>ทดลองยิงการแจ้งเตือนสด</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Broadcast Simulator & Live Preview */}
        <div className="lg:col-span-6 space-y-5">
          <div className="bg-white rounded-2xl p-4 sm:p-5 border border-[#F8D7E3] shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                <Send className="w-4 h-4 text-[#E11D48]" />
                <span>ยิงข้อความแจ้งเตือน (Broadcast Simulator)</span>
              </h3>
              <span className="text-xs text-[#854D67]">เลือกวิชาเพื่อดูตัวอย่าง</span>
            </div>

            {/* Select Exam to broadcast */}
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-700">
                เลือกรายวิชาที่ต้องการแจ้งเตือน:
              </label>
              <select
                value={selectedExamId}
                onChange={(e) => setSelectedExamId(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-[#FFF8FA] border border-[#F8D7E3] rounded-xl focus:outline-none focus:ring-1 focus:ring-[#9D174D] font-medium text-slate-800"
              >
                {isTeacher && myTeachingExams.length > 0 && (
                  <optgroup label={`👨‍🏫 รายวิชาที่สอนโดย ${currentUser?.name} (${myTeachingExams.length} วิชา)`}>
                    {myTeachingExams.map(e => (
                      <option key={e.id} value={e.id}>
                        ★ [{e.courseCode}] {e.courseName} - {e.examDateThai} ({e.examTimeThai})
                      </option>
                    ))}
                  </optgroup>
                )}
                <optgroup label={isTeacher ? "📚 รายวิชาอื่นๆ ทั้งหมดในระบบ" : "รายวิชาทั้งหมด"}>
                  {otherExams.map(e => (
                    <option key={e.id} value={e.id}>
                      [{e.courseCode}] {e.courseName} - {e.examDateThai} ({e.examTimeThai})
                    </option>
                  ))}
                </optgroup>
              </select>
            </div>

            {/* Countdown Badge for selected subject */}
            {countdown && (
              <div className="p-3 bg-[#FFF0F5] border border-[#F8D7E3] rounded-xl flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-[#9D174D]" />
                  <span className="text-xs font-semibold text-[#701A4B]">นับถอยหลังสู่วันสอบ:</span>
                </div>
                <span className={`text-xs px-2.5 py-0.5 rounded-full font-bold ${
                  countdown.status === 'ongoing' 
                    ? 'bg-emerald-600 text-white animate-pulse' 
                    : 'bg-[#9D174D] text-white'
                }`}>
                  {countdown.label}
                </span>
              </div>
            )}

            {/* Formatted Message Preview */}
            {currentExam && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-700">
                    ตัวอย่างข้อความที่จะส่งเข้า LINE:
                  </span>
                  <button
                    onClick={handleCopyLineMessage}
                    className="flex items-center gap-1 text-[11px] text-[#701A4B] hover:text-[#9D174D] bg-[#FFF0F5] px-2.5 py-1 rounded-lg border border-[#F8D7E3] transition font-semibold"
                  >
                    {copied ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                    <span>{copied ? 'คัดลอกแล้ว!' : 'คัดลอกข้อความ'}</span>
                  </button>
                </div>

                <pre className="p-3.5 bg-slate-900 text-emerald-400 font-mono text-[11px] rounded-xl whitespace-pre-wrap leading-relaxed shadow-inner max-h-56 overflow-y-auto">
                  {formatLineNotifyMessage(currentExam, customMsgTitle)}
                </pre>
              </div>
            )}

            {/* Result Message Status */}
            {lineSendStatus && (
              <div className={`p-3 rounded-xl text-xs flex items-center gap-2 ${
                lineSendStatus.success 
                  ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' 
                  : 'bg-rose-50 text-rose-800 border border-rose-200'
              }`}>
                {lineSendStatus.success ? (
                  <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                ) : (
                  <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                )}
                <span>{lineSendStatus.message}</span>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex items-center gap-2 pt-1">
              <button
                onClick={handleSendLine}
                disabled={sendingLine}
                className="flex-1 py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-xl shadow-xs transition flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <Send className="w-4 h-4" />
                <span>{sendingLine ? 'กำลังส่งข้อมูล...' : 'ส่งแจ้งเตือนเข้า LINE ตอนนี้'}</span>
              </button>

              <button
                onClick={handleCopyLineMessage}
                className="py-2.5 px-3 bg-white hover:bg-[#FFF0F5] text-slate-700 text-xs font-semibold rounded-xl border border-[#F8D7E3] transition flex items-center gap-1.5"
              >
                <Copy className="w-4 h-4" />
                <span>ก๊อปปี้ไปวาง</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
