import { ExamItem } from '../types/exam';

export interface PrintOptions {
  title?: string;
  college?: string;
  subtitle?: string;
  facultyFilter?: string;
  yearFilter?: number | 'all';
  orientation?: 'landscape' | 'portrait';
  signatoryTeacher?: string;
  signatoryTitle?: string;
}

/**
 * Generates an official, beautifully styled HTML document for A4 printing.
 * Works seamlessly in all browsers and can be printed or saved as PDF.
 */
export const generatePrintableHtml = (
  exams: ExamItem[],
  options: PrintOptions = {}
): string => {
  const {
    title = 'มหาวิทยาลัยมหาจุฬาลงกรณราชวิทยาลัย (MCU)',
    college = 'วิทยาลัยสงฆ์พ่อขุนผาเมือง เพชรบูรณ์',
    subtitle = 'ตารางสอบไล่ ประจำภาคการศึกษาที่ 1 ปีการศึกษา 2569',
    orientation = 'landscape',
    signatoryTeacher,
    signatoryTitle = 'อาจารย์ผู้บรรยาย'
  } = options;

  const thaiDateFormatted = new Date().toLocaleDateString('th-TH', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  const rowsHtml = exams.map((item, idx) => `
    <tr>
      <td style="text-align: center;">${idx + 1}</td>
      <td style="text-align: center; white-space: nowrap;">ปี ${item.yearLevel}</td>
      <td>
        <div style="font-weight: 600;">${item.faculty}</div>
        <div style="font-size: 8pt; color: #374151;">${item.major}</div>
      </td>
      <td style="white-space: nowrap;">${item.examDateThai}</td>
      <td style="white-space: nowrap; font-family: monospace;">${item.examTimeThai}</td>
      <td style="text-align: center; font-family: monospace; font-weight: bold; white-space: nowrap;">${item.courseCode}</td>
      <td style="font-weight: 600;">${item.courseName}</td>
      <td>${item.lecturer}</td>
      <td style="text-align: center; white-space: nowrap;">${item.room || 'ห้องประชุมชั้น 1'}</td>
      <td style="text-align: center; white-space: nowrap;">${item.status}</td>
      <td style="text-align: center; font-size: 8pt;">${item.notes || '-'}</td>
    </tr>
  `).join('');

  const signLeft = signatoryTeacher 
    ? `<p style="margin: 0; font-weight: 600;">ลงชื่อ......................................................................... ${signatoryTitle}</p>
       <p style="margin: 4px 0 0 0;">(${signatoryTeacher})</p>`
    : `<p style="margin: 0; font-weight: 600;">ลงชื่อ......................................................................... กรรมการกำกับห้องสอบ</p>
       <p style="margin: 4px 0 0 0;">(.........................................................................)</p>`;

  return `<!DOCTYPE html>
<html lang="th">
<head>
  <meta charset="utf-8" />
  <title>${subtitle} - ${college} ${title}</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Sarabun:wght@300;400;500;600;700&display=swap" rel="stylesheet">
  <style>
    @page {
      size: A4 ${orientation};
      margin: 8mm 8mm 10mm 8mm;
    }
    * {
      box-sizing: border-box;
      font-family: 'Sarabun', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    }
    body {
      margin: 0;
      padding: 12px;
      color: #111827;
      background: #ffffff;
      font-size: 9.5pt;
      line-height: 1.35;
    }
    .action-bar {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 12px;
      padding: 12px;
      background: #FFF0F5;
      border: 1px solid #F8D7E3;
      border-radius: 8px;
      margin-bottom: 16px;
    }
    .btn-print {
      background: #9D174D;
      color: #ffffff;
      font-weight: 600;
      font-size: 13px;
      padding: 8px 20px;
      border: none;
      border-radius: 6px;
      cursor: pointer;
    }
    .btn-close {
      background: #ffffff;
      color: #701A4B;
      font-weight: 600;
      font-size: 13px;
      padding: 8px 16px;
      border: 1px solid #F8D7E3;
      border-radius: 6px;
      cursor: pointer;
    }
    .header {
      text-align: center;
      padding-bottom: 8px;
      margin-bottom: 12px;
      border-bottom: 2px solid #000000;
    }
    .header h1 {
      margin: 0;
      font-size: 16pt;
      font-weight: 700;
      color: #000000;
      letter-spacing: 0.5px;
    }
    .header h2 {
      margin: 4px 0 0 0;
      font-size: 13pt;
      font-weight: 700;
      color: #000000;
    }
    .header h3 {
      margin: 4px 0 0 0;
      font-size: 11pt;
      font-weight: 600;
      color: #1f2937;
    }
    .meta-bar {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-top: 8px;
      font-size: 9pt;
      font-weight: 600;
      color: #374151;
      flex-wrap: wrap;
      gap: 4px;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 8px;
    }
    thead {
      display: table-header-group;
    }
    tr {
      page-break-inside: avoid;
      break-inside: avoid;
    }
    th, td {
      border: 1px solid #1f2937;
      padding: 4px 6px;
      font-size: 8.5pt;
      vertical-align: middle;
    }
    th {
      background-color: #f3f4f6;
      color: #000000;
      font-weight: 700;
      text-align: left;
    }
    .signatures {
      margin-top: 28px;
      display: flex;
      justify-content: space-between;
      font-size: 9pt;
      page-break-inside: avoid;
      break-inside: avoid;
      border-top: 1px dashed #9ca3af;
      padding-top: 14px;
    }
    .sig-block {
      width: 46%;
      text-align: center;
      display: flex;
      flex-direction: column;
      gap: 18px;
    }
    @media print {
      body {
        padding: 0;
      }
      .no-print {
        display: none !important;
      }
    }
  </style>
  <script>
    window.addEventListener('DOMContentLoaded', () => {
      // Auto trigger print when opened directly
      setTimeout(() => {
        try {
          window.print();
        } catch (e) {
          console.warn('Auto print was deferred:', e);
        }
      }, 350);
    });
  </script>
</head>
<body>
  <div class="no-print action-bar">
    <button class="btn-print" onclick="window.print()">🖨️ สั่งพิมพ์เอกสาร (Print / Save as PDF)</button>
    <button class="btn-close" onclick="window.close()">ปิดหน้านี้</button>
  </div>

  <div class="header">
    <h1>${title}</h1>
    <h2>${college}</h2>
    <h3>${subtitle}</h3>
    <div class="meta-bar">
      <span>สถานที่จัดสอบ: <strong>ห้องประชุมชั้น 1 ทุกชั้นเรียน</strong></span>
      <span>วันที่จัดพิมพ์: ${thaiDateFormatted}</span>
      <span>จำนวนรายวิชาที่จัดสอบ: <strong>${exams.length}</strong> รายวิชา</span>
    </div>
  </div>

  <table>
    <thead>
      <tr>
        <th style="width: 28px; text-align: center;">ลำดับ</th>
        <th style="width: 44px; text-align: center;">ชั้นปี</th>
        <th style="width: 130px;">คณะ / สาขาวิชา</th>
        <th style="width: 85px;">วันสอบ</th>
        <th style="width: 85px;">เวลาสอบ</th>
        <th style="width: 65px; text-align: center;">รหัสวิชา</th>
        <th>ชื่อรายวิชา</th>
        <th style="width: 125px;">อาจารย์ผู้บรรยาย</th>
        <th style="width: 80px; text-align: center;">สถานที่สอบ</th>
        <th style="width: 55px; text-align: center;">กลุ่มผู้สอบ</th>
        <th style="width: 60px; text-align: center;">หมายเหตุ</th>
      </tr>
    </thead>
    <tbody>
      ${rowsHtml}
    </tbody>
  </table>

  <div class="signatures">
    <div class="sig-block">
      ${signLeft}
      <p style="margin: 0; color: #6b7280; font-size: 8pt;">วันที่ .......... เดือน .......................... พ.ศ. ...............</p>
    </div>
    <div class="sig-block">
      <p style="margin: 0; font-weight: 600;">ลงชื่อ......................................................................... หัวหน้าฝ่ายทะเบียนและประมวลผล</p>
      <p style="margin: 4px 0 0 0;">(.........................................................................)</p>
      <p style="margin: 0; color: #6b7280; font-size: 8pt;">วันที่ .......... เดือน .......................... พ.ศ. ...............</p>
    </div>
  </div>
</body>
</html>`;
};

/**
 * Creates a standalone Blob URL for the printable HTML document.
 */
export const createPrintBlobUrl = (html: string): string => {
  const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
  return URL.createObjectURL(blob);
};

/**
 * Downloads the printable HTML document directly to the user's computer.
 */
export const downloadPrintableHtml = (html: string, filename: string): void => {
  const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename.endsWith('.html') ? filename : `${filename}.html`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
};

/**
 * Direct print trigger helper.
 */
export const triggerBrowserPrint = (): boolean => {
  try {
    window.print();
    return true;
  } catch (err) {
    console.warn('Browser print failed:', err);
    return false;
  }
};

