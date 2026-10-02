import React, { useState, useEffect } from 'react';
import { 
  Printer, 
  CheckCircle2, 
  XCircle, 
  FileText, 
  Eye, 
  AlertCircle, 
  RefreshCw,
  Search,
  Filter,
  Check,
  Clock,
  Send,
  FileQuestion,
  FileCode,
  Download
} from 'lucide-react';
import { apiClient, ApiCourse, ApiUser } from '../utils/apiClient';

export interface StaffExamVerificationPageProps {
  currentUser: ApiUser;
}

export const StaffExamVerificationPage: React.FC<StaffExamVerificationPageProps> = ({
  currentUser
}) => {
  const [courses, setCourses] = useState<ApiCourse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [actionSuccessMsg, setActionSuccessMsg] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'submitted' | 'accepted' | 'rejected' | 'pending'>('all');

  // Modal / Action states
  const [rejectingCourse, setRejectingCourse] = useState<ApiCourse | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [isSubmittingAction, setIsSubmittingAction] = useState(false);

  // Printing confirmation state
  const [printingCourse, setPrintingCourse] = useState<ApiCourse | null>(null);
  const [printCopies, setPrintCopies] = useState<number>(30);

  const fetchCourses = async () => {
    setIsLoading(true);
    setErrorMsg('');
    try {
      const data = await apiClient.getCourses();
      setCourses(data);
    } catch (err: any) {
      setErrorMsg(err.message || 'ไม่สามารถโหลดข้อมูลรายวิชาได้');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCourses();
  }, []);

  const handleApprove = async (course: ApiCourse) => {
    if (!window.confirm(`ยืนยันการ "ตรวจรับข้อสอบเรียบร้อย" สำหรับรายวิชา [${course.courseCode}] ${course.courseName}?`)) {
      return;
    }
    setIsSubmittingAction(true);
    try {
      await apiClient.verifyExam(course.courseId, 'accept');
      setActionSuccessMsg(`ตรวจรับข้อสอบรายวิชา ${course.courseCode} เรียบร้อยแล้ว`);
      await fetchCourses();
      setTimeout(() => setActionSuccessMsg(''), 4000);
    } catch (err: any) {
      alert(`ข้อผิดพลาด: ${err.message}`);
    } finally {
      setIsSubmittingAction(false);
    }
  };

  const handleRejectSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rejectingCourse || !rejectReason.trim()) {
      alert('กรุณาระบุเหตุผลที่ส่งกลับให้อาจารย์ผู้สอนแก้ไข');
      return;
    }
    setIsSubmittingAction(true);
    try {
      await apiClient.verifyExam(rejectingCourse.courseId, 'reject', rejectReason.trim());
      setActionSuccessMsg(`ส่งกลับข้อสอบรายวิชา ${rejectingCourse.courseCode} ให้อาจารย์แก้ไขเรียบร้อยแล้ว`);
      setRejectingCourse(null);
      setRejectReason('');
      await fetchCourses();
      setTimeout(() => setActionSuccessMsg(''), 4000);
    } catch (err: any) {
      alert(`ข้อผิดพลาด: ${err.message}`);
    } finally {
      setIsSubmittingAction(false);
    }
  };

  const handleOpenFileForPrinting = async (course: ApiCourse) => {
    if (!course.currentVersion) {
      alert('รายวิชานี้ยังไม่มีไฟล์ข้อสอบที่ส่งเข้ามา');
      return;
    }

    const isDocx = course.latestFileName?.endsWith('.docx') || course.latestFileName?.endsWith('.doc');

    // 1. Log print view initiation
    try {
      await apiClient.logPrint(course.courseId, 'request', printCopies);
    } catch {}

    // 2. Open file
    const fileUrl = apiClient.getExamFileViewUrl(course.courseId, course.currentVersion);

    if (isDocx) {
      alert(
        `📄 ข้อสอบรายวิชา ${course.courseCode} เป็นไฟล์ Microsoft Word (.docx)\n\n` +
        `⚠️ ขั้นตอนเตรียมพิมพ์:\n` +
        `1. ระบบจะเปิดดาวน์โหลดไฟล์ข้อสอบ .docx\n` +
        `2. เจ้าหน้าที่ต้องเปิดใน Microsoft Word แล้ว Export/บันทึกเป็น PDF เพื่อตรวจสอบการจัดหน้าก่อนพิมพ์จริง\n` +
        `3. เมื่อพิมพ์กระดาษเสร็จแล้ว กรุณากดปุ่ม "ยืนยันพิมพ์สำเร็จ" เพื่อบันทึกประวัติ`
      );
      window.open(fileUrl, '_blank');
    } else {
      // PDF file: directly open in browser print viewer
      window.open(fileUrl, '_blank');
    }

    setPrintingCourse(course);
  };

  const handleConfirmPaperPrint = async () => {
    if (!printingCourse) return;
    setIsSubmittingAction(true);
    try {
      await apiClient.logPrint(printingCourse.courseId, 'confirmed', printCopies);
      setActionSuccessMsg(`บันทึกประวัติการพิมพ์ข้อสอบ ${printingCourse.courseCode} จำนวน ${printCopies} ชุด สำเร็จแล้ว`);
      setPrintingCourse(null);
      setTimeout(() => setActionSuccessMsg(''), 4000);
    } catch (err: any) {
      alert(`เกิดข้อผิดพลาด: ${err.message}`);
    } finally {
      setIsSubmittingAction(false);
    }
  };

  const filteredCourses = courses.filter(course => {
    const matchesSearch = 
      course.courseCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
      course.courseName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      course.faculty.toLowerCase().includes(searchQuery.toLowerCase());
    
    if (statusFilter === 'all') return matchesSearch;
    return matchesSearch && course.submissionStatus === statusFilter;
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-[#9D174D] to-[#701A4B] text-white p-6 sm:p-8 rounded-3xl shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-white/15 text-rose-100 mb-2">
              <Printer className="w-3.5 h-3.5" />
              <span>ศูนย์ตรวจรับและจัดพิมพ์ข้อสอบส่วนกลาง (Staff Portal)</span>
            </div>
            <h1 className="text-2xl font-bold">ตรวจรับข้อสอบ & สั่งพิมพ์ทางการ</h1>
            <p className="text-xs sm:text-sm text-rose-100 mt-1">
              เจ้าหน้าที่ผู้ปฏิบัติงาน: <strong>{currentUser.fullName}</strong> ({currentUser.googleEmail})
            </p>
          </div>
          <button
            onClick={fetchCourses}
            disabled={isLoading}
            className="self-start sm:self-center inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/20 hover:bg-white/30 text-white font-semibold text-xs transition cursor-pointer"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            <span>รีเฟรชข้อมูล</span>
          </button>
        </div>
      </div>

      {actionSuccessMsg && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm flex items-center gap-3 animate-in fade-in">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span className="font-semibold">{actionSuccessMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-sm flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Filters Bar */}
      <div className="bg-white p-4 rounded-2xl border border-[#F8D7E3] shadow-xs flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="ค้นหารหัสวิชา หรือชื่อวิชา..."
            className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-[#9D174D]/20 focus:border-[#9D174D]"
          />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto pb-1 md:pb-0">
          <span className="text-xs text-slate-500 font-medium shrink-0">สถานะ:</span>
          {(['all', 'submitted', 'accepted', 'rejected', 'pending'] as const).map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer shrink-0 ${
                statusFilter === st
                  ? 'bg-[#9D174D] text-white shadow-xs'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
              }`}
            >
              {st === 'all' && `ทั้งหมด (${courses.length})`}
              {st === 'submitted' && `รอตรวจรับ (${courses.filter(c => c.submissionStatus === 'submitted').length})`}
              {st === 'accepted' && `ตรวจรับแล้ว (${courses.filter(c => c.submissionStatus === 'accepted').length})`}
              {st === 'rejected' && `ต้องแก้ไข (${courses.filter(c => c.submissionStatus === 'rejected').length})`}
              {st === 'pending' && `ยังไม่ส่ง (${courses.filter(c => c.submissionStatus === 'pending').length})`}
            </button>
          ))}
        </div>
      </div>

      {/* Courses Table */}
      <div className="bg-white rounded-3xl border border-[#F8D7E3] shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead className="bg-[#FFF0F5] border-b border-[#F8D7E3] text-[#701A4B] font-bold">
              <tr>
                <th className="p-3.5 pl-5">รหัสวิชา</th>
                <th className="p-3.5">รายวิชา / คณะ</th>
                <th className="p-3.5">วันเวลาสอบ</th>
                <th className="p-3.5">สถานะข้อสอบ</th>
                <th className="p-3.5">ผู้ส่ง & เวอร์ชัน</th>
                <th className="p-3.5 pr-5 text-right">ดำเนินการ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredCourses.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-slate-400">
                    {isLoading ? 'กำลังโหลดข้อมูล...' : 'ไม่พบรายวิชาที่ตรงกับเงื่อนไขการค้นหา'}
                  </td>
                </tr>
              ) : (
                filteredCourses.map((course) => {
                  const isSubmitted = course.submissionStatus === 'submitted' || course.submissionStatus === 'accepted';
                  return (
                    <tr key={course.courseId} className="hover:bg-slate-50/60 transition">
                      <td className="p-3.5 pl-5 font-mono font-bold text-slate-900">
                        {course.courseCode}
                        <div className="text-[10px] text-slate-500 font-sans font-normal">
                          ชั้นปี {course.yearLevel} ({course.studentStatus})
                        </div>
                      </td>
                      <td className="p-3.5">
                        <div className="font-semibold text-slate-800">{course.courseName}</div>
                        <div className="text-[11px] text-slate-500">{course.faculty} ({course.major})</div>
                      </td>
                      <td className="p-3.5">
                        <div className="text-slate-800">{course.examDateThai}</div>
                        <div className="text-[11px] text-slate-500">{course.examTimeThai} · {course.room}</div>
                      </td>
                      <td className="p-3.5">
                        {course.submissionStatus === 'accepted' && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                            <span>ตรวจรับแล้ว ✔</span>
                          </span>
                        )}
                        {course.submissionStatus === 'submitted' && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-900">
                            <Clock className="w-3.5 h-3.5 text-amber-600" />
                            <span>รอตรวจรับ</span>
                          </span>
                        )}
                        {course.submissionStatus === 'rejected' && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-rose-100 text-rose-800">
                            <XCircle className="w-3.5 h-3.5 text-rose-600" />
                            <span>ส่งกลับแก้ไข</span>
                          </span>
                        )}
                        {course.submissionStatus === 'pending' && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-600">
                            <span>ยังไม่ส่งข้อสอบ</span>
                          </span>
                        )}
                        {course.rejectionReason && (
                          <div className="text-[11px] text-rose-600 mt-1 max-w-xs truncate" title={course.rejectionReason}>
                            เหตุผล: {course.rejectionReason}
                          </div>
                        )}
                      </td>
                      <td className="p-3.5">
                        {course.currentVersion > 0 ? (
                          <div>
                            <span className="font-semibold text-slate-700">เวอร์ชัน {course.currentVersion}</span>
                            <div className="text-[11px] text-slate-500">
                              {course.submittedByAccountName || 'อาจารย์ผู้สอน'}
                            </div>
                            {course.submittedAt && (
                              <div className="text-[10px] text-slate-400">
                                {new Date(course.submittedAt).toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: '2-digit' })}
                              </div>
                            )}
                          </div>
                        ) : (
                          <span className="text-slate-400">-</span>
                        )}
                      </td>
                      <td className="p-3.5 pr-5 text-right space-x-1.5 whitespace-nowrap">
                        {isSubmitted ? (
                          <>
                            {/* Open and Print button */}
                            <button
                              onClick={() => handleOpenFileForPrinting(course)}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-900 text-white font-semibold text-xs shadow-xs transition cursor-pointer"
                              title="เปิดดูไฟล์ข้อสอบและเตรียมพิมพ์"
                            >
                              <Printer className="w-3.5 h-3.5 text-rose-300" />
                              <span>เปิดพิมพ์</span>
                            </button>

                            {/* Approve button */}
                            {course.submissionStatus !== 'accepted' && (
                              <button
                                onClick={() => handleApprove(course)}
                                disabled={isSubmittingAction}
                                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs shadow-xs transition cursor-pointer disabled:opacity-50"
                                title="ตรวจรับข้อสอบเรียบร้อย"
                              >
                                <Check className="w-3.5 h-3.5" />
                                <span>ตรวจรับ</span>
                              </button>
                            )}

                            {/* Reject / Send back button */}
                            <button
                              onClick={() => {
                                setRejectingCourse(course);
                                setRejectReason(course.rejectionReason || '');
                              }}
                              disabled={isSubmittingAction}
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-semibold text-xs transition cursor-pointer disabled:opacity-50"
                              title="ส่งกลับให้อาจารย์ผู้สอนแก้ไข"
                            >
                              <XCircle className="w-3.5 h-3.5" />
                              <span>ส่งกลับ</span>
                            </button>
                          </>
                        ) : (
                          <span className="text-xs text-slate-400 italic">รออาจารย์ส่งข้อสอบ</span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Reject Modal */}
      {rejectingCourse && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="w-full max-w-lg bg-white rounded-3xl p-6 shadow-xl space-y-4 border border-rose-200">
            <div className="flex items-center gap-3 text-rose-800">
              <div className="w-10 h-10 rounded-xl bg-rose-100 flex items-center justify-center shrink-0">
                <XCircle className="w-6 h-6 text-rose-600" />
              </div>
              <div>
                <h3 className="font-bold text-base">ส่งกลับข้อสอบให้อาจารย์แก้ไข</h3>
                <p className="text-xs text-slate-500">
                  [{rejectingCourse.courseCode}] {rejectingCourse.courseName}
                </p>
              </div>
            </div>

            <form onSubmit={handleRejectSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  เหตุผล / จุดที่ต้องแก้ไข (จะแจ้งให้อาจารย์ผู้สอนทราบในระบบ):
                </label>
                <textarea
                  rows={4}
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  placeholder="เช่น ข้อ 4 การจัดหน้ากระดาษตกหล่น กรุณาจัดหน้าใหม่แล้วส่งเวอร์ชันถัดไป..."
                  required
                  className="w-full p-3 rounded-xl border border-slate-200 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setRejectingCourse(null)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingAction}
                  className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-semibold text-xs shadow-xs transition cursor-pointer disabled:opacity-50"
                >
                  {isSubmittingAction ? 'กำลังบันทึก...' : 'ยืนยันการส่งกลับแก้ไข'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Print Confirmation Modal */}
      {printingCourse && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="w-full max-w-md bg-white rounded-3xl p-6 shadow-xl space-y-4 border border-[#F8D7E3]">
            <div className="flex items-center gap-3 text-slate-800">
              <div className="w-10 h-10 rounded-xl bg-[#FFF0F5] flex items-center justify-center shrink-0 border border-[#F8D7E3]">
                <Printer className="w-6 h-6 text-[#9D174D]" />
              </div>
              <div>
                <h3 className="font-bold text-base text-slate-900">บันทึกประวัติการพิมพ์กระดาษ</h3>
                <p className="text-xs text-slate-500">
                  [{printingCourse.courseCode}] {printingCourse.courseName}
                </p>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              เมื่อเจ้าหน้าที่สั่งพิมพ์ข้อสอบลงกระดาษเรียบร้อยแล้ว กรุณาระบุจำนวนชุดที่พิมพ์เพื่อบันทึกเป็นหลักฐานในระบบประวัติการพิมพ์ (Audit Log)
            </p>

            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-700">
                จำนวนชุดที่พิมพ์ (Copies):
              </label>
              <input
                type="number"
                min={1}
                max={500}
                value={printCopies}
                onChange={(e) => setPrintCopies(parseInt(e.target.value, 10) || 1)}
                className="w-full p-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm font-bold text-slate-800"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setPrintingCourse(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition"
              >
                ปิดหน้าต่างนี้
              </button>
              <button
                type="button"
                onClick={handleConfirmPaperPrint}
                disabled={isSubmittingAction}
                className="px-5 py-2.5 rounded-xl bg-[#9D174D] hover:bg-[#831843] text-white font-bold text-xs shadow-md transition cursor-pointer disabled:opacity-50"
              >
                {isSubmittingAction ? 'กำลังบันทึก...' : 'ยืนยันพิมพ์สำเร็จ (ลงบันทึก Audit)'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
