import React, { useState } from 'react';
import { 
  BookOpen, 
  LogOut, 
  ShieldCheck, 
  Search, 
  GraduationCap,
  Maximize2,
  Minimize2,
  FileSpreadsheet,
  Printer, 
  FolderUp, 
  Users, 
  Menu, 
  X, 
  Lock,
  FileCheck
} from 'lucide-react';
import { ApiUser } from '../utils/apiClient';

export type AppTab = 'teacher' | 'folder-upload' | 'staff' | 'admin' | 'schedule';

interface NavbarProps {
  currentTab: AppTab;
  setCurrentTab: (tab: AppTab) => void;
  currentUser: ApiUser;
  onLogout: () => void;
  totalExamsCount: number;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  onPrint?: () => void;
  onExportExcel?: () => void;
  isWidescreen?: boolean;
  onToggleWidescreen?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentTab,
  setCurrentTab,
  currentUser,
  onLogout,
  totalExamsCount,
  searchQuery,
  setSearchQuery,
  onPrint,
  onExportExcel,
  isWidescreen,
  onToggleWidescreen
}) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isMobileSearchOpen, setIsMobileSearchOpen] = useState(false);

  const handleTabSelect = (tab: AppTab) => {
    setCurrentTab(tab);
    setIsMobileMenuOpen(false);
  };

  const getRoleBadge = () => {
    switch (currentUser.role) {
      case 'admin':
        return {
          label: 'ผู้ดูแลระบบ (Admin)',
          bg: 'bg-purple-100 text-purple-800 border-purple-300',
          dot: 'bg-purple-500'
        };
      case 'staff':
        return {
          label: 'เจ้าหน้าที่สอบ (Staff)',
          bg: 'bg-blue-100 text-blue-800 border-blue-300',
          dot: 'bg-blue-500'
        };
      case 'teacher':
      default:
        return {
          label: 'อาจารย์ผู้สอน',
          bg: 'bg-emerald-100 text-emerald-800 border-emerald-300',
          dot: 'bg-emerald-500'
        };
    }
  };

  const roleBadge = getRoleBadge();

  return (
    <>
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-[#F8D7E3] shadow-xs no-print">
        {/* Top University Announcement Bar */}
        <div className="bg-gradient-to-r from-[#FFF0F5] via-[#FCE7F3]/70 to-[#FFF0F5] text-[#701A4B] border-b border-[#F8D7E3]/70 px-3 sm:px-4 py-1 text-xs font-medium">
          <div className={`${isWidescreen ? 'max-w-[98%] 2xl:max-w-[1720px]' : 'max-w-7xl'} mx-auto flex items-center justify-between gap-2`}>
            <div className="flex items-center gap-1.5 sm:gap-2 truncate">
              <span className="shrink-0 w-2 h-2 rounded-full bg-[#E11D48]/80 animate-pulse"></span>
              <span className="font-semibold truncate sm:hidden">
                วส.พ่อขุนผาเมือง · ระบบรับและพิมพ์ข้อสอบ
              </span>
              <span className="font-semibold truncate hidden sm:inline">
                มหาวิทยาลัยมหาจุฬาลงกรณราชวิทยาลัย · วิทยาลัยสงฆ์พ่อขุนผาเมือง เพชรบูรณ์
              </span>
              <span className="hidden sm:inline-block text-[#854D67]">·</span>
              <span className="hidden md:inline-block text-[#854D67]">
                ระบบสารสนเทศภายในสำหรับรับและพิมพ์ข้อสอบ (รวม {totalExamsCount} รายวิชา)
              </span>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white text-emerald-800 text-[10px] font-semibold border border-[#F8D7E3]">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                <span>ระบบปิดปลอดภัย (University Internal Only)</span>
              </span>
            </div>
          </div>
        </div>

        {/* Main Header Row */}
        <div className={`${isWidescreen ? 'max-w-[98%] 2xl:max-w-[1720px]' : 'max-w-7xl'} mx-auto px-3 sm:px-4 py-2 sm:py-3 flex items-center justify-between gap-2 sm:gap-4`}>
          {/* University Brand */}
          <div 
            onClick={() => {
              if (currentUser.role === 'teacher') handleTabSelect('teacher');
              else if (currentUser.role === 'staff') handleTabSelect('staff');
              else handleTabSelect('admin');
            }} 
            className="flex items-center gap-2 sm:gap-3 cursor-pointer group shrink-0"
          >
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-br from-[#FCE7F3] to-[#F8D7E3] text-[#701A4B] flex items-center justify-center shadow-2xs border border-[#F8D7E3] group-hover:scale-105 transition-transform">
              <GraduationCap className="w-5 h-5 text-[#9D174D]" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h1 className="font-bold text-sm sm:text-lg text-slate-900 tracking-tight leading-none group-hover:text-[#9D174D] transition-colors">
                  MCU Exam Portal
                </h1>
                <span className="text-[9px] sm:text-[10px] font-bold px-1.5 py-0.2 sm:px-2 sm:py-0.5 rounded-full bg-[#FFF0F5] text-[#9D174D] border border-[#F8D7E3]">
                  2569
                </span>
              </div>
              <p className="text-[10px] sm:text-[11px] text-[#854D67] mt-0.5 hidden xs:block truncate max-w-[200px] sm:max-w-none">
                วิทยาลัยสงฆ์พ่อขุนผาเมือง เพชรบูรณ์ · มจร.
              </p>
            </div>
          </div>

          {/* Global Search Bar */}
          <div className="flex-1 max-w-md hidden md:block">
            <div className="relative">
              <Search className="w-4 h-4 text-[#9D174D]/60 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="ค้นหารหัสวิชา, รายวิชา, อาจารย์ผู้สอน, วันสอบ..."
                className="w-full pl-9 pr-7 py-1.5 text-xs bg-[#FFF8FA] hover:bg-white focus:bg-white border border-[#F8D7E3] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#F8D7E3] focus:border-[#9D174D] transition-all placeholder:text-[#854D67]/70 text-slate-800"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-[#854D67] hover:text-[#701A4B]"
                >
                  ล้าง
                </button>
              )}
            </div>
          </div>

          {/* Desktop User Profile & Actions */}
          <div className="hidden md:flex items-center gap-2 shrink-0">
            {onExportExcel && (
              <button
                onClick={onExportExcel}
                title="ส่งออกตารางสอบเป็นไฟล์ Microsoft Excel (.xlsx / .csv)"
                className="flex items-center gap-1.5 text-xs font-semibold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 px-3 py-1.5 rounded-xl border border-emerald-200 transition shadow-2xs cursor-pointer"
              >
                <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
                <span>ส่งออกตาราง</span>
              </button>
            )}

            {onPrint && (
              <button
                onClick={onPrint}
                title="พิมพ์ตารางสอบทางการ (A4)"
                className="flex items-center gap-1.5 text-xs font-medium text-slate-700 hover:text-[#701A4B] bg-white hover:bg-[#FFF0F5] px-3 py-1.5 rounded-xl border border-[#F8D7E3] transition shadow-2xs cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5 text-[#9D174D]" />
                <span>พิมพ์</span>
              </button>
            )}

            {onToggleWidescreen && (
              <button
                onClick={onToggleWidescreen}
                title={isWidescreen ? 'ปรับขนาดมาตรฐาน' : 'ขยายเต็มจออัตโนมัติ'}
                className="hidden lg:flex items-center gap-1.5 text-xs font-medium text-slate-700 hover:text-[#701A4B] bg-white hover:bg-[#FFF0F5] px-2.5 py-1.5 rounded-xl border border-[#F8D7E3] transition shadow-2xs"
              >
                {isWidescreen ? <Minimize2 className="w-3.5 h-3.5 text-[#9D174D]" /> : <Maximize2 className="w-3.5 h-3.5 text-[#9D174D]" />}
              </button>
            )}

            {/* User Session Info Badge */}
            <div className="flex items-center gap-2 bg-[#FFF0F5] border border-[#F8D7E3] px-3 py-1.5 rounded-xl text-xs">
              <span className={`w-2 h-2 rounded-full ${roleBadge.dot}`}></span>
              <div className="text-left max-w-[150px] truncate">
                <p className="font-bold text-[#701A4B] truncate leading-tight">
                  {currentUser.fullName}
                </p>
                <p className="text-[10px] text-[#854D67] truncate">
                  {currentUser.googleEmail}
                </p>
              </div>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${roleBadge.bg}`}>
                {roleBadge.label}
              </span>
              <button
                onClick={onLogout}
                title="ออกจากระบบ"
                className="ml-1 p-1.5 text-[#854D67] hover:text-[#E11D48] hover:bg-white rounded-lg transition cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Mobile Right Controls */}
          <div className="flex md:hidden items-center gap-1">
            <button
              onClick={() => setIsMobileSearchOpen(!isMobileSearchOpen)}
              className={`p-2 rounded-xl transition ${
                isMobileSearchOpen || searchQuery
                  ? 'bg-[#FCE7F3] text-[#9D174D] border border-[#F8D7E3]'
                  : 'text-slate-700 hover:bg-[#FFF0F5]'
              }`}
              title="ค้นหา"
            >
              <Search className="w-4 h-4" />
            </button>

            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className={`p-2 rounded-xl transition ${
                isMobileMenuOpen 
                  ? 'bg-[#9D174D] text-white shadow-2xs' 
                  : 'bg-[#FFF0F5] text-[#701A4B] border border-[#F8D7E3]'
              }`}
              title="เมนู"
            >
              {isMobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Collapsible Mobile Search Bar */}
        {isMobileSearchOpen && (
          <div className="p-2.5 border-t border-[#F8D7E3]/70 bg-[#FFF8FA] md:hidden animate-in fade-in slide-in-from-top-1 duration-200">
            <div className="relative">
              <Search className="w-4 h-4 text-[#9D174D]/70 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                autoFocus
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="ค้นหารหัสวิชา, รายวิชา, อาจารย์..."
                className="w-full pl-9 pr-8 py-2 text-xs bg-white border border-[#F8D7E3] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#9D174D]/30 text-slate-800 shadow-2xs"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-[#854D67] font-semibold px-1 py-0.5"
                >
                  ล้าง
                </button>
              )}
            </div>
          </div>
        )}

        {/* Desktop Navigation Tabs (Role-Based Access Control) */}
        <div className={`hidden md:block ${isWidescreen ? 'max-w-[98%] 2xl:max-w-[1720px]' : 'max-w-7xl'} mx-auto px-2 sm:px-4 border-t border-[#F8D7E3]/60`}>
          <nav className="flex items-center space-x-1.5 py-1 text-xs sm:text-sm font-medium whitespace-nowrap overflow-x-auto scrollbar-none">
            {/* TEACHER TABS */}
            {currentUser.role === 'teacher' && (
              <>
                <button
                  onClick={() => handleTabSelect('teacher')}
                  className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl transition-all cursor-pointer ${
                    currentTab === 'teacher'
                      ? 'bg-[#FCE7F3] text-[#701A4B] font-bold shadow-2xs border border-[#F8D7E3]'
                      : 'text-slate-600 hover:text-[#701A4B] hover:bg-[#FFF5F8]'
                  }`}
                >
                  <ShieldCheck className="w-3.5 h-3.5 text-[#9D174D]" />
                  <span>รายวิชาของฉัน (My Assigned Courses)</span>
                </button>

                <button
                  onClick={() => handleTabSelect('folder-upload')}
                  className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl transition-all cursor-pointer ${
                    currentTab === 'folder-upload'
                      ? 'bg-[#FCE7F3] text-[#701A4B] font-bold shadow-2xs border border-[#F8D7E3]'
                      : 'text-slate-600 hover:text-[#701A4B] hover:bg-[#FFF5F8]'
                  }`}
                >
                  <FolderUp className="w-3.5 h-3.5 text-[#9D174D]" />
                  <span>อัปโหลดข้อสอบโฟลเดอร์ (Batch Folder Upload)</span>
                </button>
              </>
            )}

            {/* STAFF TABS */}
            {currentUser.role === 'staff' && (
              <>
                <button
                  onClick={() => handleTabSelect('staff')}
                  className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl transition-all cursor-pointer ${
                    currentTab === 'staff'
                      ? 'bg-[#FCE7F3] text-[#701A4B] font-bold shadow-2xs border border-[#F8D7E3]'
                      : 'text-slate-600 hover:text-[#701A4B] hover:bg-[#FFF5F8]'
                  }`}
                >
                  <FileCheck className="w-3.5 h-3.5 text-[#9D174D]" />
                  <span>ตรวจรับและพิมพ์ข้อสอบ (Staff Verification & Printing)</span>
                </button>

                <button
                  onClick={() => handleTabSelect('schedule')}
                  className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl transition-all cursor-pointer ${
                    currentTab === 'schedule'
                      ? 'bg-[#FCE7F3] text-[#701A4B] font-bold shadow-2xs border border-[#F8D7E3]'
                      : 'text-slate-600 hover:text-[#701A4B] hover:bg-[#FFF5F8]'
                  }`}
                >
                  <BookOpen className="w-3.5 h-3.5 text-[#9D174D]" />
                  <span>ตารางสอบทั้งหมด ({totalExamsCount} วิชา)</span>
                </button>
              </>
            )}

            {/* ADMIN TABS */}
            {currentUser.role === 'admin' && (
              <>
                <button
                  onClick={() => handleTabSelect('admin')}
                  className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl transition-all cursor-pointer ${
                    currentTab === 'admin'
                      ? 'bg-[#FCE7F3] text-[#701A4B] font-bold shadow-2xs border border-[#F8D7E3]'
                      : 'text-slate-600 hover:text-[#701A4B] hover:bg-[#FFF5F8]'
                  }`}
                >
                  <Users className="w-3.5 h-3.5 text-[#9D174D]" />
                  <span>จัดการบัญชีและสิทธิ์ (Accounts & RBAC)</span>
                </button>

                <button
                  onClick={() => handleTabSelect('staff')}
                  className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl transition-all cursor-pointer ${
                    currentTab === 'staff'
                      ? 'bg-[#FCE7F3] text-[#701A4B] font-bold shadow-2xs border border-[#F8D7E3]'
                      : 'text-slate-600 hover:text-[#701A4B] hover:bg-[#FFF5F8]'
                  }`}
                >
                  <FileCheck className="w-3.5 h-3.5 text-[#9D174D]" />
                  <span>ตรวจรับและพิมพ์ข้อสอบ</span>
                  {!currentUser.canReadExamContent && (
                    <span title="ผู้ดูแลระบบไม่มีสิทธิ์เปิดอ่านข้อสอบจนกว่าจะได้รับ canReadExamContent">
                      <Lock className="w-3 h-3 text-amber-600 ml-0.5" />
                    </span>
                  )}
                </button>

                <button
                  onClick={() => handleTabSelect('folder-upload')}
                  className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl transition-all cursor-pointer ${
                    currentTab === 'folder-upload'
                      ? 'bg-[#FCE7F3] text-[#701A4B] font-bold shadow-2xs border border-[#F8D7E3]'
                      : 'text-slate-600 hover:text-[#701A4B] hover:bg-[#FFF5F8]'
                  }`}
                >
                  <FolderUp className="w-3.5 h-3.5 text-[#9D174D]" />
                  <span>อัปโหลดโฟลเดอร์</span>
                </button>

                <button
                  onClick={() => handleTabSelect('schedule')}
                  className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl transition-all cursor-pointer ${
                    currentTab === 'schedule'
                      ? 'bg-[#FCE7F3] text-[#701A4B] font-bold shadow-2xs border border-[#F8D7E3]'
                      : 'text-slate-600 hover:text-[#701A4B] hover:bg-[#FFF5F8]'
                  }`}
                >
                  <BookOpen className="w-3.5 h-3.5 text-[#9D174D]" />
                  <span>ตารางสอบทั้งหมด ({totalExamsCount} วิชา)</span>
                </button>
              </>
            )}
          </nav>
        </div>
      </header>

      {/* Mobile Drawer Menu */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs md:hidden animate-in fade-in">
          <div className="absolute right-0 top-0 bottom-0 w-[82%] max-w-[320px] bg-white shadow-2xl p-5 flex flex-col justify-between overflow-y-auto">
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <GraduationCap className="w-5 h-5 text-[#9D174D]" />
                  <span className="font-bold text-slate-800 text-sm">MCU Exam</span>
                </div>
                <button
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* User Information */}
              <div className="p-3 bg-[#FFF0F5] rounded-2xl border border-[#F8D7E3]">
                <p className="font-bold text-xs text-[#701A4B]">{currentUser.fullName}</p>
                <p className="text-[11px] text-[#854D67] truncate">{currentUser.googleEmail}</p>
                <span className={`inline-block mt-1 px-2 py-0.5 rounded-full text-[10px] font-bold border ${roleBadge.bg}`}>
                  {roleBadge.label}
                </span>
              </div>

              {/* Navigation Links */}
              <div className="space-y-1 text-xs">
                {currentUser.role === 'teacher' && (
                  <>
                    <button
                      onClick={() => handleTabSelect('teacher')}
                      className={`w-full flex items-center gap-2.5 p-2.5 rounded-xl font-medium ${
                        currentTab === 'teacher' ? 'bg-[#FCE7F3] text-[#701A4B] font-bold' : 'text-slate-700'
                      }`}
                    >
                      <ShieldCheck className="w-4 h-4 text-[#9D174D]" />
                      <span>รายวิชาของฉัน</span>
                    </button>
                    <button
                      onClick={() => handleTabSelect('folder-upload')}
                      className={`w-full flex items-center gap-2.5 p-2.5 rounded-xl font-medium ${
                        currentTab === 'folder-upload' ? 'bg-[#FCE7F3] text-[#701A4B] font-bold' : 'text-slate-700'
                      }`}
                    >
                      <FolderUp className="w-4 h-4 text-[#9D174D]" />
                      <span>อัปโหลดโฟลเดอร์</span>
                    </button>
                  </>
                )}

                {currentUser.role === 'staff' && (
                  <>
                    <button
                      onClick={() => handleTabSelect('staff')}
                      className={`w-full flex items-center gap-2.5 p-2.5 rounded-xl font-medium ${
                        currentTab === 'staff' ? 'bg-[#FCE7F3] text-[#701A4B] font-bold' : 'text-slate-700'
                      }`}
                    >
                      <FileCheck className="w-4 h-4 text-[#9D174D]" />
                      <span>ตรวจรับและพิมพ์ข้อสอบ</span>
                    </button>
                    <button
                      onClick={() => handleTabSelect('schedule')}
                      className={`w-full flex items-center gap-2.5 p-2.5 rounded-xl font-medium ${
                        currentTab === 'schedule' ? 'bg-[#FCE7F3] text-[#701A4B] font-bold' : 'text-slate-700'
                      }`}
                    >
                      <BookOpen className="w-4 h-4 text-[#9D174D]" />
                      <span>ตารางสอบทั้งหมด</span>
                    </button>
                  </>
                )}

                {currentUser.role === 'admin' && (
                  <>
                    <button
                      onClick={() => handleTabSelect('admin')}
                      className={`w-full flex items-center gap-2.5 p-2.5 rounded-xl font-medium ${
                        currentTab === 'admin' ? 'bg-[#FCE7F3] text-[#701A4B] font-bold' : 'text-slate-700'
                      }`}
                    >
                      <Users className="w-4 h-4 text-[#9D174D]" />
                      <span>จัดการบัญชีและสิทธิ์</span>
                    </button>
                    <button
                      onClick={() => handleTabSelect('staff')}
                      className={`w-full flex items-center gap-2.5 p-2.5 rounded-xl font-medium ${
                        currentTab === 'staff' ? 'bg-[#FCE7F3] text-[#701A4B] font-bold' : 'text-slate-700'
                      }`}
                    >
                      <FileCheck className="w-4 h-4 text-[#9D174D]" />
                      <span>ตรวจรับและพิมพ์ข้อสอบ</span>
                    </button>
                    <button
                      onClick={() => handleTabSelect('schedule')}
                      className={`w-full flex items-center gap-2.5 p-2.5 rounded-xl font-medium ${
                        currentTab === 'schedule' ? 'bg-[#FCE7F3] text-[#701A4B] font-bold' : 'text-slate-700'
                      }`}
                    >
                      <BookOpen className="w-4 h-4 text-[#9D174D]" />
                      <span>ตารางสอบทั้งหมด</span>
                    </button>
                  </>
                )}
              </div>
            </div>

            <button
              onClick={() => {
                setIsMobileMenuOpen(false);
                onLogout();
              }}
              className="w-full flex items-center justify-center gap-2 p-3 rounded-xl bg-rose-50 text-rose-700 font-bold text-xs border border-rose-200 mt-4 cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
              <span>ออกจากระบบ</span>
            </button>
          </div>
        </div>
      )}
    </>
  );
};
