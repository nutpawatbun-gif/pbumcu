import { ExamItem } from '../types/exam';

/**
 * Generate iCalendar (.ics) file string for one or multiple exams
 */
export function generateICS(exams: ExamItem[], title: string = 'ตารางสอบ'): string {
  const pad = (n: number) => (n < 10 ? '0' + n : n.toString());
  const now = new Date();
  const dtStamp = `${now.getUTCFullYear()}${pad(now.getUTCMonth() + 1)}${pad(now.getUTCDate())}T${pad(now.getUTCHours())}${pad(now.getUTCMinutes())}${pad(now.getUTCSeconds())}Z`;

  let icsContent = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Exam Schedule System//TH',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    `X-WR-CALNAME:${title}`
  ];

  for (const exam of exams) {
    if (!exam.examDateISO) continue;
    const dateClean = exam.examDateISO.replace(/-/g, '');
    const startHourMin = (exam.startTime || '09:00').replace(':', '') + '00';
    const endHourMin = (exam.endTime || '11:30').replace(':', '') + '00';

    const dtStart = `${dateClean}T${startHourMin}`;
    const dtEnd = `${dateClean}T${endHourMin}`;

    const summary = `สอบวิชา: ${exam.courseCode} ${exam.courseName}`;
    const location = exam.room || 'มหาวิทยาลัย';
    const description = `ตารางสอบ: ${exam.courseCode} ${exam.courseName}\\nอาจารย์ผู้บรรยาย: ${exam.lecturer}\\nคณะ/สาขา: ${exam.faculty} ${exam.major}\\nชั้นปีที่: ${exam.yearLevel}\\nกลุ่ม: ${exam.status}\\nหมายเหตุ: ${exam.notes || 'ไม่มี'}`;

    icsContent.push('BEGIN:VEVENT');
    icsContent.push(`UID:exam-${exam.id}-${Date.now()}@examschedule.edu`);
    icsContent.push(`DTSTAMP:${dtStamp}`);
    icsContent.push(`DTSTART;TZID=Asia/Bangkok:${dtStart}`);
    icsContent.push(`DTEND;TZID=Asia/Bangkok:${dtEnd}`);
    icsContent.push(`SUMMARY:${summary}`);
    icsContent.push(`LOCATION:${location}`);
    icsContent.push(`DESCRIPTION:${description}`);
    icsContent.push('STATUS:CONFIRMED');
    icsContent.push('BEGIN:VALARM');
    icsContent.push('TRIGGER:-PT1H'); // Alert 1 hour before
    icsContent.push('ACTION:DISPLAY');
    icsContent.push(`DESCRIPTION:เตือนการสอบ: ${exam.courseName} กำลังจะเริ่มในอีก 1 ชั่วโมง`);
    icsContent.push('END:VALARM');
    icsContent.push('END:VEVENT');
  }

  icsContent.push('END:VCALENDAR');
  return icsContent.join('\r\n');
}

/**
 * Trigger download of .ics file
 */
export function downloadICS(exams: ExamItem[], filename: string = 'exam-schedule.ics') {
  const content = generateICS(exams);
  const blob = new Blob([content], { type: 'text/calendar;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Generate Google Calendar direct web URL for single event
 */
export function getGoogleCalendarUrl(exam: ExamItem): string {
  if (!exam.examDateISO) return '#';
  const dateClean = exam.examDateISO.replace(/-/g, '');
  const startHourMin = (exam.startTime || '09:00').replace(':', '') + '00';
  const endHourMin = (exam.endTime || '11:30').replace(':', '') + '00';
  const dates = `${dateClean}T${startHourMin}/${dateClean}T${endHourMin}`;

  const text = encodeURIComponent(`สอบ: ${exam.courseCode} ${exam.courseName}`);
  const details = encodeURIComponent(
    `รายวิชา: ${exam.courseName} (${exam.courseCode})\nอาจารย์ผู้สอน: ${exam.lecturer}\nคณะ: ${exam.faculty} (${exam.major})\nชั้นปีที่ ${exam.yearLevel} [${exam.status}]\nหมายเหตุ: ${exam.notes || '-'}`
  );
  const location = encodeURIComponent(exam.room || 'มหาวิทยาลัย');

  return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${text}&dates=${dates}&details=${details}&location=${location}&ctz=Asia/Bangkok`;
}
