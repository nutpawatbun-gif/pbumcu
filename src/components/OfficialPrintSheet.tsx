import React from 'react';
import { ExamItem } from '../types/exam';

interface OfficialPrintSheetProps {
  exams: ExamItem[];
  title?: string;
  college?: string;
  subtitle?: string;
  signatoryTeacher?: string;
  signatoryTitle?: string;
}

/**
 * Official Printable Academic Sheet for A4 paper and PDF export.
 * Rendered with print-specific typography, sharp borders, and official layout.
 */
export const OfficialPrintSheet: React.FC<OfficialPrintSheetProps> = ({
  exams,
  title = 'มหาวิทยาลัยมหาจุฬาลงกรณราชวิทยาลัย (MCU)',
  college = 'วิทยาลัยสงฆ์พ่อขุนผาเมือง เพชรบูรณ์',
  subtitle = 'ตารางสอบไล่ ประจำภาคการศึกษาที่ 1 ปีการศึกษา 2569',
  signatoryTeacher,
  signatoryTitle = 'อาจารย์ผู้บรรยาย'
}) => {
  const printDateThai = new Date().toLocaleDateString('th-TH', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  return (
    <div className="w-full bg-white text-black p-4 font-sans print-sheet">
      {/* Official Header */}
      <div className="text-center pb-2.5 mb-3 border-b-2 border-black">
        <h1 className="text-xl font-bold text-black tracking-wide leading-tight">
          {title}
        </h1>
        <h2 className="text-lg font-bold text-black mt-0.5 leading-tight">
          {college}
        </h2>
        <h3 className="text-base font-semibold text-black mt-1 leading-snug">
          {subtitle}
        </h3>
        <div className="flex justify-between items-center text-xs text-black mt-2 font-medium flex-wrap gap-2">
          <span>สถานที่จัดสอบ: <strong className="font-bold">ห้องประชุมชั้น 1 ทุกชั้นเรียน</strong></span>
          <span>วันที่จัดพิมพ์: {printDateThai}</span>
          <span>จำนวนรายวิชาที่จัดสอบ: <strong className="font-bold">{exams.length}</strong> รายวิชา</span>
        </div>
      </div>

      {/* Official Examination Timetable */}
      <table className="w-full text-left text-xs border border-black border-collapse print-table">
        <thead>
          <tr className="bg-gray-100 text-black font-bold">
            <th className="p-1.5 text-center border border-black w-8">ลำดับ</th>
            <th className="p-1.5 text-center border border-black w-14">ชั้นปี</th>
            <th className="p-1.5 border border-black w-32">คณะ / สาขาวิชา</th>
            <th className="p-1.5 border border-black w-24">วันสอบ</th>
            <th className="p-1.5 border border-black w-24">เวลาสอบ</th>
            <th className="p-1.5 text-center border border-black w-20">รหัสวิชา</th>
            <th className="p-1.5 border border-black">ชื่อรายวิชา</th>
            <th className="p-1.5 border border-black w-36">อาจารย์ผู้บรรยาย</th>
            <th className="p-1.5 text-center border border-black w-24">สถานที่สอบ</th>
            <th className="p-1.5 text-center border border-black w-16">กลุ่มผู้สอบ</th>
            <th className="p-1.5 text-center border border-black w-20">หมายเหตุ</th>
          </tr>
        </thead>
        <tbody>
          {exams.map((item, idx) => (
            <tr key={`print-row-${item.id}`} className="border-b border-black">
              <td className="p-1 text-center border border-black text-[11px]">{idx + 1}</td>
              <td className="p-1 text-center border border-black text-[11px] whitespace-nowrap">ปี {item.yearLevel}</td>
              <td className="p-1 border border-black text-[10px] leading-tight">
                <div className="font-semibold text-black">{item.faculty}</div>
                <div className="text-gray-700">{item.major}</div>
              </td>
              <td className="p-1 border border-black whitespace-nowrap text-[10.5px]">{item.examDateThai}</td>
              <td className="p-1 border border-black whitespace-nowrap font-mono text-[10.5px]">{item.examTimeThai}</td>
              <td className="p-1 text-center font-mono border border-black font-bold text-[10.5px] whitespace-nowrap">{item.courseCode}</td>
              <td className="p-1 border border-black font-semibold text-[10.5px] leading-tight text-black">{item.courseName}</td>
              <td className="p-1 border border-black text-[10px]">{item.lecturer}</td>
              <td className="p-1 text-center border border-black whitespace-nowrap text-[10px] font-medium">{item.room || 'ห้องประชุมชั้น 1'}</td>
              <td className="p-1 text-center border border-black text-[10px] whitespace-nowrap">{item.status}</td>
              <td className="p-1 text-center border border-black text-[9px]">{item.notes || '-'}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Official Signatures Footer */}
      <div className="mt-8 pt-4 grid grid-cols-2 gap-8 text-xs text-black border-t border-dashed border-gray-400 print-signatures">
        <div className="text-center space-y-7">
          <p className="font-semibold">
            ลงชื่อ......................................................................... {signatoryTeacher ? `${signatoryTitle} (${signatoryTeacher})` : 'กรรมการกำกับห้องสอบ'}
          </p>
          <p>({signatoryTeacher || '.........................................................................'})</p>
          <p className="text-gray-600">วันที่ .......... เดือน .......................... พ.ศ. ...............</p>
        </div>
        <div className="text-center space-y-7">
          <p className="font-semibold">ลงชื่อ......................................................................... หัวหน้าฝ่ายทะเบียนและประมวลผล</p>
          <p>(.........................................................................)</p>
          <p className="text-gray-600">วันที่ .......... เดือน .......................... พ.ศ. ...............</p>
        </div>
      </div>
    </div>
  );
};
