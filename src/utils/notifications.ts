import { ExamItem } from '../types/exam';

/**
 * Play a gentle Web Audio notification chime
 */
export function playNotificationChime() {
  try {
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();
    
    // First tone (E5 ~ 659Hz)
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(659.25, ctx.currentTime);
    gain1.gain.setValueAtTime(0.15, ctx.currentTime);
    gain1.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);
    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.start(ctx.currentTime);
    osc1.stop(ctx.currentTime + 0.4);

    // Second tone (G#5 ~ 830Hz) slightly delayed
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(830.61, ctx.currentTime + 0.12);
    gain2.gain.setValueAtTime(0.15, ctx.currentTime + 0.12);
    gain2.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.7);
    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.start(ctx.currentTime + 0.12);
    osc2.stop(ctx.currentTime + 0.7);
  } catch {
    // Ignore audio context errors in restricted environments
  }
}

/**
 * Request browser desktop/mobile push notification permission
 */
export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (!('Notification' in window)) {
    return 'denied';
  }
  return await Notification.requestPermission();
}

/**
 * Send in-browser push notification
 */
export function sendBrowserNotification(title: string, body: string, icon?: string) {
  if (!('Notification' in window)) return;
  if (Notification.permission === 'granted') {
    try {
      new Notification(title, {
        body,
        icon: icon || 'https://api.iconify.design/lucide:bell-ring.svg',
        badge: 'https://api.iconify.design/lucide:book-open.svg'
      });
      playNotificationChime();
    } catch {
      // fallback
    }
  }
}

/**
 * Parse exam target start Date object
 */
export function getExamStartDate(exam: ExamItem): Date | null {
  if (!exam.examDateISO || !exam.startTime) return null;
  const [year, month, day] = exam.examDateISO.split('-').map(Number);
  const [hours, minutes] = exam.startTime.split(':').map(Number);
  return new Date(year, month - 1, day, hours, minutes, 0);
}

/**
 * Parse exam target end Date object
 */
export function getExamEndDate(exam: ExamItem): Date | null {
  if (!exam.examDateISO || !exam.endTime) return null;
  const [year, month, day] = exam.examDateISO.split('-').map(Number);
  const [hours, minutes] = exam.endTime.split(':').map(Number);
  return new Date(year, month - 1, day, hours, minutes, 0);
}

export interface CountdownInfo {
  status: 'passed' | 'ongoing' | 'upcoming';
  totalSeconds: number;
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  label: string;
}

export function calculateCountdown(exam: ExamItem, referenceDate: Date = new Date()): CountdownInfo {
  const start = getExamStartDate(exam);
  const end = getExamEndDate(exam);

  if (!start) {
    return { status: 'upcoming', totalSeconds: 0, days: 0, hours: 0, minutes: 0, seconds: 0, label: 'ยังไม่กำหนด' };
  }

  const now = referenceDate.getTime();
  const startTime = start.getTime();
  const endTime = end ? end.getTime() : startTime + 2.5 * 3600 * 1000;

  if (now > endTime) {
    return {
      status: 'passed',
      totalSeconds: 0,
      days: 0,
      hours: 0,
      minutes: 0,
      seconds: 0,
      label: 'สอบเสร็จสิ้นแล้ว'
    };
  }

  if (now >= startTime && now <= endTime) {
    const diff = Math.floor((endTime - now) / 1000);
    const minutes = Math.floor((diff % 3600) / 60);
    const hours = Math.floor(diff / 3600);
    return {
      status: 'ongoing',
      totalSeconds: diff,
      days: 0,
      hours,
      minutes,
      seconds: diff % 60,
      label: `กำลังสอบอยู่ (เหลืออีก ${hours > 0 ? hours + ' ชม. ' : ''}${minutes} นาที)`
    };
  }

  const diff = Math.floor((startTime - now) / 1000);
  const days = Math.floor(diff / (24 * 3600));
  const hours = Math.floor((diff % (24 * 3600)) / 3600);
  const minutes = Math.floor((diff % 3600) / 60);
  const seconds = diff % 60;

  let label = '';
  if (days > 0) {
    label = `อีก ${days} วัน ${hours} ชม.`;
  } else if (hours > 0) {
    label = `อีก ${hours} ชม. ${minutes} นาที`;
  } else if (minutes > 0) {
    label = `อีก ${minutes} นาที`;
  } else {
    label = `อีก ${seconds} วินาที`;
  }

  return {
    status: 'upcoming',
    totalSeconds: diff,
    days,
    hours,
    minutes,
    seconds,
    label
  };
}

/**
 * Format message for LINE Notify
 */
export function formatLineNotifyMessage(exam: ExamItem, customHeader: string = 'แจ้งเตือนตารางสอบ'): string {
  return `
📢 【${customHeader}】
━━━━━━━━━━━━━━━━━━━━
📚 รหัสวิชา: ${exam.courseCode}
📖 รายวิชา: ${exam.courseName}
👨‍🏫 อาจารย์ผู้สอน: ${exam.lecturer}
📅 วันสอบ: ${exam.examDateThai}
⏰ เวลาสอบ: ${exam.examTimeThai}
🏛️ คณะ/สาขา: ${exam.faculty} (${exam.major})
🎓 ชั้นปีที่: ${exam.yearLevel} [${exam.status}]
📍 สถานที่/ห้องสอบ: ${exam.room || 'มหาวิทยาลัย'}
${exam.notes ? `📝 หมายเหตุ: ${exam.notes}\n` : ''}${exam.examLink ? `🔗 ลิงก์ห้องสอบ: ${exam.examLink}\n` : ''}━━━━━━━━━━━━━━━━━━━━
⏰ กรุณาเข้าห้องสอบก่อนเวลา 15 นาที พร้อมบัตรประจำตัวนิสิต
  `.trim();
}

/**
 * Send message to LINE Notify via Apps Script Webhook or direct CORS Proxy / mock
 */
export async function sendLineNotifyNotification(
  message: string,
  token?: string,
  webhookUrl?: string
): Promise<{ success: boolean; message: string }> {
  // If webhook provided (Apps Script or Cloud Function endpoint)
  if (webhookUrl && webhookUrl.startsWith('http')) {
    try {
      const res = await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({ message, token, timestamp: new Date().toISOString() })
      });
      if (res.ok) {
        return { success: true, message: 'ส่งการแจ้งเตือนผ่าน Webhook สำเร็จแล้ว' };
      }
      return { success: false, message: `Webhook ตอบกลับสถานะ: ${res.status}` };
    } catch (e) {
      return { success: false, message: `ไม่สามารถเชื่อมต่อ Webhook ได้: ${(e as Error).message}` };
    }
  }

  // If token provided directly
  if (token) {
    // Note: Direct browser-to-LINE Notify is blocked by LINE's CORS policy without a proxy/Apps Script.
    // We provide friendly guidance and test verification.
    try {
      // Simulate/Trigger with friendly feedback
      await new Promise(r => setTimeout(r, 600));
      return {
        success: true,
        message: 'ส่งข้อมูลจำลองผ่าน LINE Token เรียบร้อยแล้ว (สำหรับใช้งานจริง แนะนำนำไปใส่ใน Apps Script ด้านล่างเพื่อส่งตรงแบบ 100%)'
      };
    } catch {
      return { success: false, message: 'เกิดข้อผิดพลาดในการส่ง LINE' };
    }
  }

  return { success: false, message: 'กรุณาระบุ LINE Notify Token หรือ Apps Script Webhook URL' };
}
