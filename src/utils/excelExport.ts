import { ExamItem } from '../types/exam';

/**
 * Clean and escape values for CSV / Spreadsheet export
 * Prevents CSV Formula Injection (Formula injection mitigation for leading =, +, -, @)
 */
function sanitizeCell(val: unknown): string {
  if (val === null || val === undefined) return '';
  let str = String(val).trim();
  // Mitigate CSV Formula Injection: prefix dangerous formula triggers with a single quote
  if (/^[=+\-@\t\r]/.test(str)) {
    str = `'${str}`;
  }
  // Escape quotes
  if (str.includes('"') || str.includes(',') || str.includes('\n') || str.includes(';')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

/**
 * Export exam schedule items to a genuine Excel-compatible CSV file with UTF-8 BOM.
 * Handles Thai characters with 100% UTF-8 integrity and auto-opens seamlessly in Microsoft Excel and Google Sheets.
 * Free of third-party dependencies and Prototype Pollution / ReDoS vulnerabilities.
 */
export const exportExamsToExcel = (
  exams: ExamItem[], 
  fileNamePrefix: string = 'mcu-exam-schedule-2569',
  _sheetTitle: string = 'ตารางสอบไล่ 2569'
) => {
  if (!exams || exams.length === 0) {
    alert('ไม่มีข้อมูลรายวิชาสำหรับส่งออก');
    return;
  }

  const headers = [
    'ลำดับ',
    'ชั้นปี',
    'คณะ',
    'สาขาวิชา',
    'วันสอบ (ไทย)',
    'วันที่ (YYYY-MM-DD)',
    'เวลาสอบ',
    'รหัสวิชา',
    'ชื่อรายวิชา',
    'อาจารย์ผู้สอน',
    'สถานที่สอบ',
    'กลุ่มผู้สอบ',
    'รูปแบบการสอบ',
    'ลิงก์สอบออนไลน์',
    'หมายเหตุ'
  ];

  const rows = exams.map((item, index) => [
    sanitizeCell(index + 1),
    sanitizeCell(`ชั้นปีที่ ${item.yearLevel}`),
    sanitizeCell(item.faculty),
    sanitizeCell(item.major),
    sanitizeCell(item.examDateThai),
    sanitizeCell(item.examDateISO),
    sanitizeCell(item.examTimeThai),
    sanitizeCell(item.courseCode),
    sanitizeCell(item.courseName),
    sanitizeCell(item.lecturer),
    sanitizeCell(item.room || 'ห้องประชุมชั้น 1'),
    sanitizeCell(item.status),
    sanitizeCell(item.examType === 'online' ? 'ออนไลน์' : 'ออนไซต์ (ในห้องสอบ)'),
    sanitizeCell(item.examLink || '-'),
    sanitizeCell(item.notes || '-')
  ]);

  const csvContent = [
    headers.map(sanitizeCell).join(','),
    ...rows.map(r => r.join(','))
  ].join('\r\n');

  // UTF-8 BOM (\uFEFF) ensures Excel opens Thai characters flawlessly
  const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
  const dateStr = new Date().toISOString().split('T')[0];
  const finalFileName = `${fileNamePrefix}-${dateStr}.csv`;

  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', finalFileName);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};
