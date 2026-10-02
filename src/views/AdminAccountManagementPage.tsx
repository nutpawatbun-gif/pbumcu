import React, { useState, useEffect } from 'react';
import { 
  ShieldAlert, 
  UserPlus, 
  Users, 
  BookOpen, 
  History, 
  Check, 
  AlertCircle, 
  RefreshCw,
  Search,
  Key,
  ShieldCheck,
  CheckCircle2,
  Lock
} from 'lucide-react';
import { apiClient, ApiUser, ApiCourse, ApiAuditLog } from '../utils/apiClient';

export interface AdminAccountManagementPageProps {
  currentUser: ApiUser;
}

export const AdminAccountManagementPage: React.FC<AdminAccountManagementPageProps> = ({
  currentUser
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'accounts' | 'assignments' | 'audit'>('accounts');
  const [accounts, setAccounts] = useState<ApiUser[]>([]);
  const [courses, setCourses] = useState<ApiCourse[]>([]);
  const [auditLogs, setAuditLogs] = useState<ApiAuditLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [msg, setMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Form states
  const [isAddingUser, setIsAddingUser] = useState(false);
  const [formEmail, setFormEmail] = useState('');
  const [formName, setFormName] = useState('');
  const [formRole, setFormRole] = useState<'teacher' | 'staff' | 'admin'>('teacher');
  const [formCanRead, setFormCanRead] = useState(false);
  const [formScope, setFormScope] = useState('');

  // Course Assignment modal
  const [selectedCourse, setSelectedCourse] = useState<ApiCourse | null>(null);
  const [selectedLecturers, setSelectedLecturers] = useState<string[]>([]);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [accs, crss, logs] = await Promise.all([
        apiClient.getAdminAccounts(),
        apiClient.getCourses(),
        apiClient.getAuditLogs()
      ]);
      setAccounts(accs);
      setCourses(crss);
      setAuditLogs(logs);
    } catch (err: any) {
      setMsg({ type: 'error', text: err.message || 'ไม่สามารถโหลดข้อมูลระบบผู้ดูแลได้' });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSaveAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formEmail.trim()) {
      alert('กรุณากรอกอีเมล Google');
      return;
    }

    try {
      const scopes = formScope ? formScope.split(',').map(s => s.trim()).filter(Boolean) : [];
      await apiClient.updateAdminAccount({
        googleEmail: formEmail.trim(),
        fullName: formName.trim() || undefined,
        role: formRole,
        status: 'active',
        canReadExamContent: formCanRead,
        assignedScope: scopes
      });

      setMsg({ type: 'success', text: `บันทึกบัญชี ${formEmail} เรียบร้อยแล้ว` });
      setIsAddingUser(false);
      setFormEmail('');
      setFormName('');
      setFormScope('');
      await loadData();
    } catch (err: any) {
      alert(`ข้อผิดพลาด: ${err.message}`);
    }
  };

  const handleSaveAssignment = async () => {
    if (!selectedCourse) return;
    try {
      await apiClient.assignCourse(selectedCourse.courseId, selectedLecturers);
      setMsg({ type: 'success', text: `มอบหมายผู้สอนในวิชา [${selectedCourse.courseCode}] สำเร็จแล้ว` });
      setSelectedCourse(null);
      await loadData();
    } catch (err: any) {
      alert(`ข้อผิดพลาด: ${err.message}`);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Banner */}
      <div className="bg-slate-900 text-white p-6 sm:p-8 rounded-3xl shadow-sm border border-slate-800">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-white/10 text-rose-300 mb-2">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>ระบบบริหารความมั่นคงปลอดภัย (Admin Control Center)</span>
            </div>
            <h1 className="text-2xl font-bold">จัดการบัญชีผู้ใช้ & สิทธิ์การเข้าถึง</h1>
            <p className="text-xs sm:text-sm text-slate-300 mt-1">
              ผู้ดูแลระบบ: <strong>{currentUser.fullName}</strong> ({currentUser.googleEmail})
            </p>
          </div>
          <button
            onClick={loadData}
            disabled={isLoading}
            className="self-start sm:self-center inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-semibold text-xs transition cursor-pointer"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            <span>รีเฟรช</span>
          </button>
        </div>
      </div>

      {msg && (
        <div className={`p-4 rounded-2xl text-xs sm:text-sm flex items-center gap-3 border animate-in fade-in ${
          msg.type === 'success' ? 'bg-emerald-50 text-emerald-800 border-emerald-200' : 'bg-rose-50 text-rose-800 border-rose-200'
        }`}>
          {msg.type === 'success' ? <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" /> : <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />}
          <span className="font-semibold">{msg.text}</span>
        </div>
      )}

      {/* Sub-tabs Navigation */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-3">
        <button
          onClick={() => setActiveSubTab('accounts')}
          className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition flex items-center gap-2 cursor-pointer ${
            activeSubTab === 'accounts' ? 'bg-[#9D174D] text-white shadow-xs' : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>บัญชีผู้ใช้ที่ได้รับอนุมัติ ({accounts.length})</span>
        </button>
        <button
          onClick={() => setActiveSubTab('assignments')}
          className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition flex items-center gap-2 cursor-pointer ${
            activeSubTab === 'assignments' ? 'bg-[#9D174D] text-white shadow-xs' : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
          }`}
        >
          <BookOpen className="w-4 h-4" />
          <span>มอบหมายรายวิชาอาจารย์ ({courses.length})</span>
        </button>
        <button
          onClick={() => setActiveSubTab('audit')}
          className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition flex items-center gap-2 cursor-pointer ${
            activeSubTab === 'audit' ? 'bg-[#9D174D] text-white shadow-xs' : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
          }`}
        >
          <History className="w-4 h-4" />
          <span>บันทึกประวัติการกระทำ (Audit Logs)</span>
        </button>
      </div>

      {/* SUBTAB 1: ACCOUNTS */}
      {activeSubTab === 'accounts' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="font-bold text-sm text-slate-800">รายชื่อบัญชี Google ที่ผ่านการอนุมัติแล้ว</h3>
            <button
              onClick={() => setIsAddingUser(!isAddingUser)}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#9D174D] hover:bg-[#831843] text-white text-xs font-bold shadow-xs transition cursor-pointer"
            >
              <UserPlus className="w-4 h-4" />
              <span>อนุมัติ / เพิ่มบัญชีใหม่</span>
            </button>
          </div>

          {/* Add / Edit User Form */}
          {isAddingUser && (
            <div className="bg-white p-6 rounded-3xl border border-[#F8D7E3] shadow-sm space-y-4 animate-in fade-in">
              <h4 className="font-bold text-sm text-[#701A4B]">อนุมัติบัญชี Google ใหม่สำหรับบุคลากร</h4>
              <form onSubmit={handleSaveAccount} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">อีเมล Google ที่ได้รับอนุมัติ *</label>
                  <input
                    type="email"
                    required
                    value={formEmail}
                    onChange={(e) => setFormEmail(e.target.value)}
                    placeholder="เช่น somchai.t@mcu.ac.th หรือ gmail"
                    className="w-full p-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">ชื่อ - สกุล และตำแหน่ง</label>
                  <input
                    type="text"
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    placeholder="เช่น ดร.สมชาย ใจดี"
                    className="w-full p-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">บทบาท (Role) *</label>
                  <select
                    value={formRole}
                    onChange={(e) => setFormRole(e.target.value as any)}
                    className="w-full p-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm bg-white"
                  >
                    <option value="teacher">อาจารย์ผู้สอน (Teacher)</option>
                    <option value="staff">เจ้าหน้าที่ฝ่ายสอบ (Staff)</option>
                    <option value="admin">ผู้ดูแลระบบ (Admin)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">ขอบเขต / รหัสวิชา (คั่นด้วยจุลภาค)</label>
                  <input
                    type="text"
                    value={formScope}
                    onChange={(e) => setFormScope(e.target.value)}
                    placeholder="เช่น 000 136, SP 101 หรือ all"
                    className="w-full p-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm"
                  />
                </div>
                <div className="sm:col-span-2 flex items-center gap-2 p-3 bg-amber-50 rounded-xl border border-amber-200">
                  <input
                    type="checkbox"
                    id="can-read-box"
                    checked={formCanRead}
                    onChange={(e) => setFormCanRead(e.target.checked)}
                    className="w-4 h-4 rounded text-[#9D174D]"
                  />
                  <label htmlFor="can-read-box" className="text-xs font-bold text-amber-900 cursor-pointer">
                    ให้สิทธิ์เปิดอ่านและดาวน์โหลดเนื้อหาข้อสอบ (canReadExamContent) - สิทธิ์ความลับระดับสูง
                  </label>
                </div>

                <div className="sm:col-span-2 flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsAddingUser(false)}
                    className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
                  >
                    ยกเลิก
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2 rounded-xl bg-[#9D174D] hover:bg-[#831843] text-white text-xs font-bold shadow-xs cursor-pointer"
                  >
                    บันทึกการอนุมัติบัญชี
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Accounts List Table */}
          <div className="bg-white rounded-3xl border border-[#F8D7E3] shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs sm:text-sm">
                <thead className="bg-[#FFF0F5] text-[#701A4B] font-bold border-b border-[#F8D7E3]">
                  <tr>
                    <th className="p-3.5 pl-5">ชื่อผู้ใช้ & อีเมล</th>
                    <th className="p-3.5">บทบาท</th>
                    <th className="p-3.5">สถานะ</th>
                    <th className="p-3.5">สิทธิ์อ่านข้อสอบ</th>
                    <th className="p-3.5">ขอบเขตที่ได้รับ</th>
                    <th className="p-3.5 pr-5 text-right">รหัสประจำตัว</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {accounts.map((acc) => (
                    <tr key={acc.accountId} className="hover:bg-slate-50">
                      <td className="p-3.5 pl-5">
                        <div className="font-bold text-slate-800">{acc.fullName}</div>
                        <div className="text-[11px] text-slate-500 font-mono">{acc.googleEmail}</div>
                      </td>
                      <td className="p-3.5">
                        <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-bold ${
                          acc.role === 'admin' ? 'bg-purple-100 text-purple-800' :
                          acc.role === 'staff' ? 'bg-blue-100 text-blue-800' : 'bg-slate-100 text-slate-800'
                        }`}>
                          {acc.role === 'admin' ? 'ผู้ดูแล (Admin)' : acc.role === 'staff' ? 'เจ้าหน้าที่ (Staff)' : 'อาจารย์ (Teacher)'}
                        </span>
                      </td>
                      <td className="p-3.5">
                        <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-semibold ${
                          acc.status === 'active' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                        }`}>
                          {acc.status === 'active' ? 'อนุมัติแล้ว' : acc.status}
                        </span>
                      </td>
                      <td className="p-3.5">
                        {acc.canReadExamContent ? (
                          <span className="inline-flex items-center gap-1 text-emerald-700 font-bold text-xs">
                            <Check className="w-3.5 h-3.5" />
                            <span>ได้รับสิทธิ์</span>
                          </span>
                        ) : (
                          <span className="text-slate-400 text-xs">ไม่อนุญาต</span>
                        )}
                      </td>
                      <td className="p-3.5 text-xs text-slate-600 font-mono">
                        {acc.assignedScope.length > 0 ? acc.assignedScope.join(', ') : '-'}
                      </td>
                      <td className="p-3.5 pr-5 text-right font-mono text-[11px] text-slate-400">
                        {acc.accountId}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* SUBTAB 2: ASSIGNMENTS */}
      {activeSubTab === 'assignments' && (
        <div className="space-y-4">
          <h3 className="font-bold text-sm text-slate-800">มอบหมายรายวิชาสอบแก่อาจารย์ผู้สอน (รองรับผู้สอนร่วมหลายท่าน)</h3>
          <div className="bg-white rounded-3xl border border-[#F8D7E3] shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs sm:text-sm">
                <thead className="bg-[#FFF0F5] text-[#701A4B] font-bold border-b border-[#F8D7E3]">
                  <tr>
                    <th className="p-3.5 pl-5">รหัสวิชา</th>
                    <th className="p-3.5">ชื่อรายวิชา</th>
                    <th className="p-3.5">คณะ / สาขา</th>
                    <th className="p-3.5">อาจารย์ผู้สอนที่มอบหมาย</th>
                    <th className="p-3.5 pr-5 text-right">จัดการ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {courses.map((course) => {
                    const assignedTeachers = accounts.filter(a => course.assignedLecturerIds?.includes(a.accountId));
                    return (
                      <tr key={course.courseId} className="hover:bg-slate-50">
                        <td className="p-3.5 pl-5 font-mono font-bold">{course.courseCode}</td>
                        <td className="p-3.5 font-semibold text-slate-800">{course.courseName}</td>
                        <td className="p-3.5 text-xs text-slate-500">{course.faculty} ({course.major})</td>
                        <td className="p-3.5">
                          {assignedTeachers.length > 0 ? (
                            <div className="flex flex-wrap gap-1">
                              {assignedTeachers.map(t => (
                                <span key={t.accountId} className="px-2 py-0.5 rounded-lg bg-rose-50 text-[#9D174D] border border-rose-200 text-xs font-semibold">
                                  {t.fullName}
                                </span>
                              ))}
                            </div>
                          ) : (
                            <span className="text-rose-500 text-xs italic">ยังไม่ได้มอบหมายอาจารย์</span>
                          )}
                        </td>
                        <td className="p-3.5 pr-5 text-right">
                          <button
                            onClick={() => {
                              setSelectedCourse(course);
                              setSelectedLecturers(course.assignedLecturerIds || []);
                            }}
                            className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold transition cursor-pointer"
                          >
                            แก้ไขผู้สอน
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Assignment Modal */}
          {selectedCourse && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
              <div className="w-full max-w-md bg-white rounded-3xl p-6 shadow-xl space-y-4 border border-[#F8D7E3]">
                <h3 className="font-bold text-base text-slate-900">
                  มอบหมายผู้สอน: [{selectedCourse.courseCode}] {selectedCourse.courseName}
                </h3>
                <p className="text-xs text-slate-500">เลือกอาจารย์ผู้สอนประจำรายวิชา (สามารถเลือกได้มากกว่า 1 ท่านสำหรับวิชาที่มีผู้สอนร่วม):</p>
                <div className="max-h-60 overflow-y-auto space-y-2 border border-slate-100 p-2 rounded-xl">
                  {accounts.filter(a => a.role === 'teacher').map(teacher => {
                    const isChecked = selectedLecturers.includes(teacher.accountId);
                    return (
                      <label key={teacher.accountId} className="flex items-center gap-2.5 p-2 rounded-lg hover:bg-slate-50 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedLecturers([...selectedLecturers, teacher.accountId]);
                            } else {
                              setSelectedLecturers(selectedLecturers.filter(id => id !== teacher.accountId));
                            }
                          }}
                          className="w-4 h-4 rounded text-[#9D174D]"
                        />
                        <div>
                          <div className="font-semibold text-xs text-slate-800">{teacher.fullName}</div>
                          <div className="text-[10px] text-slate-400 font-mono">{teacher.googleEmail}</div>
                        </div>
                      </label>
                    );
                  })}
                </div>
                <div className="flex justify-end gap-2 pt-2">
                  <button
                    onClick={() => setSelectedCourse(null)}
                    className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
                  >
                    ยกเลิก
                  </button>
                  <button
                    onClick={handleSaveAssignment}
                    className="px-5 py-2 rounded-xl bg-[#9D174D] hover:bg-[#831843] text-white text-xs font-bold shadow-xs cursor-pointer"
                  >
                    บันทึกการมอบหมาย
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* SUBTAB 3: AUDIT LOGS */}
      {activeSubTab === 'audit' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-sm text-slate-800">บันทึกประวัติการกระทำและความปลอดภัย (Audit Trail)</h3>
            <span className="text-xs text-slate-500">แสดงรายการล่าสุด 150 รายการ (ไม่บันทึกรหัสผ่านหรือเนื้อหาข้อสอบ)</span>
          </div>

          <div className="bg-white rounded-3xl border border-[#F8D7E3] shadow-sm overflow-hidden">
            <div className="overflow-x-auto max-h-[600px]">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#FFF0F5] text-[#701A4B] font-bold border-b border-[#F8D7E3] sticky top-0">
                  <tr>
                    <th className="p-3 pl-5">วันเวลา</th>
                    <th className="p-3">การกระทำ (Action)</th>
                    <th className="p-3">ผู้ปฏิบัติงาน</th>
                    <th className="p-3">รหัสวิชา</th>
                    <th className="p-3">รายละเอียด (Details)</th>
                    <th className="p-3 pr-5">IP Address</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {auditLogs.map((log) => (
                    <tr key={log.logId} className="hover:bg-slate-50 font-mono">
                      <td className="p-3 pl-5 text-slate-500 whitespace-nowrap">
                        {new Date(log.timestamp).toLocaleString('th-TH')}
                      </td>
                      <td className="p-3">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold font-sans ${
                          log.action.includes('SECURITY') || log.action.includes('FAILED') ? 'bg-rose-100 text-rose-800' :
                          log.action.includes('APPROVE') || log.action.includes('UPLOAD') ? 'bg-emerald-100 text-emerald-800' :
                          log.action.includes('PRINT') ? 'bg-purple-100 text-purple-800' : 'bg-slate-100 text-slate-800'
                        }`}>
                          {log.action}
                        </span>
                      </td>
                      <td className="p-3 text-slate-700 font-sans">
                        {log.accountEmail}
                      </td>
                      <td className="p-3 text-slate-600">
                        {log.courseId || '-'}
                      </td>
                      <td className="p-3 text-slate-700 font-sans max-w-md truncate" title={log.details}>
                        {log.details}
                      </td>
                      <td className="p-3 pr-5 text-slate-400">
                        {log.ipAddress}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
