import * as XLSX from 'xlsx';
import { ExamItem } from '../types/exam';

/**
 * Export exam schedule items to a genuine Microsoft Excel (.xlsx) file.
 * Handles Thai characters with complete UTF-8 integrity and auto-sized column widths.
 */
export const exportExamsToExcel = (
  exams: ExamItem[], 
  fileNamePrefix: string = 'mcu-exam-schedule-2569',
  sheetTitle: string = 'ตารางสอบไล่ 2569'
) => {
  if (!exams || exams.length === 0) {
    alert('ไม่มีข้อมูลรายวิชาสำหรับส่งออก');
    return;
  }

  // Format records for clean tabular presentation in Excel
  const data = exams.map((item, index) => ({
    'ลำดับ': index + 1,
    'ชั้นปี': `ชั้นปีที่ ${item.yearLevel}`,
    'คณะ': item.faculty,
    'สาขาวิชา': item.major,
    'วันสอบ (ไทย)': item.examDateThai,
    'วันที่ (YYYY-MM-DD)': item.examDateISO,
    'เวลาสอบ': item.examTimeThai,
    'รหัสวิชา': item.courseCode,
    'ชื่อรายวิชา': item.courseName,
    'อาจารย์ผู้สอน': item.lecturer,
    'สถานที่สอบ': item.room || 'ห้องประชุมชั้น 1',
    'กลุ่มผู้สอบ': item.status,
    'รูปแบบการสอบ': item.examType === 'online' ? 'ออนไลน์' : 'ออนไซต์ (ในห้องสอบ)',
    'ลิงก์สอบออนไลน์': item.examLink || '-',
    'หมายเหตุ': item.notes || '-'
  }));

  // Create worksheet from JSON
  const worksheet = XLSX.utils.json_to_sheet(data);

  // Set column widths in characters for optimal reading in Excel & Sheets
  worksheet['!cols'] = [
    { wch: 8 },  // ลำดับ
    { wch: 12 }, // ชั้นปี
    { wch: 18 }, // คณะ
    { wch: 28 }, // สาขาวิชา
    { wch: 20 }, // วันสอบ (ไทย)
    { wch: 16 }, // วันที่
    { wch: 18 }, // เวลาสอบ
    { wch: 14 }, // รหัสวิชา
    { wch: 38 }, // ชื่อรายวิชา
    { wch: 26 }, // อาจารย์ผู้สอน
    { wch: 22 }, // สถานที่สอบ
    { wch: 14 }, // กลุ่มผู้สอบ
    { wch: 16 }, // รูปแบบการสอบ
    { wch: 25 }, // ลิงก์
    { wch: 22 }  // หมายเหตุ
  ];

  // Create workbook and append worksheet
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, sheetTitle.slice(0, 31));

  // Generate file name with current date
  const dateStr = new Date().toISOString().split('T')[0];
  const finalFileName = `${fileNamePrefix}-${dateStr}.xlsx`;

  // Write and trigger download
  XLSX.writeFile(workbook, finalFileName);
};
