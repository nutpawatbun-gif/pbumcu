import React, { useState } from 'react';
import { 
  Calendar, 
  BookOpen, 
  Bell, 
  UserCheck, 
  LogOut, 
  Printer, 
  Star, 
  Code,
  ShieldCheck, 
  Search, 
  GraduationCap,
  Maximize2,
  Minimize2,
  FileSpreadsheet,
  Lock,
  Menu,
  X,
  ChevronRight,
  SlidersHorizontal,
  LayoutDashboard,
  FolderUp
} from 'lucide-react';
import { TeacherUser } from '../types/exam';

interface NavbarProps {
  currentTab: 'dashboard' | 'schedule' | 'my-schedule' | 'calendar' | 'teacher' | 'alerts' | 'cloud';
  setCurrentTab: (tab: 'dashboard' | 'schedule' | 'my-schedule' | 'calendar' | 'teacher' | 'alerts' | 'cloud') => void;
  currentUser: TeacherUser | null;
  onOpenLogin: () => void;
  onLogout: () => void;
  savedCount: number;
  totalExamsCount: number;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  onPrint: () => void;
  onExportExcel?: () => void;
  isWidescreen?: boolean;
  onToggleWidescreen?: () => void;
  onNavigateToFolderUpload?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentTab,
  setCurrentTab,
  currentUser,
  onOpenLogin,
  onLogout,
  savedCount,
  totalExamsCount,
  searchQuery,
  setSearchQuery,
  onPrint,
  onExportExcel,
  isWidescreen,
  onToggleWidescreen,
  onNavigateToFolderUpload
}) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isMobileSearchOpen, setIsMobileSearchOpen] = useState(false);

  const handleTabSelect = (tab: NavbarProps['currentTab']) => {
    setCurrentTab(tab);
    setIsMobileMenuOpen(false);
  };

  return (
    <>
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-[#F8D7E3] shadow-xs no-print">
        {/* Top University Announcement Bar (Ultra-clean, condensed on mobile) */}
        <div className="bg-gradient-to-r from-[#FFF0F5] via-[#FCE7F3]/70 to-[#FFF0F5] text-[#701A4B] border-b border-[#F8D7E3]/70 px-3 sm:px-4 py-1 text-xs font-medium">
          <div className={`${isWidescreen ? 'max-w-[98%] 2xl:max-w-[1720px]' : 'max-w-7xl'} mx-auto flex items-center justify-between gap-2`}>
            <div className="flex items-center gap-1.5 sm:gap-2 truncate">
              <span className="shrink-0 w-2 h-2 rounded-full bg-[#E11D48]/80 animate-pulse"></span>
              {/* Short title for mobile, full title for desktop */}
              <span className="font-semibold truncate sm:hidden">
                วส.พ่อขุนผาเมือง · สอบไล่ 1/2569 ({totalExamsCount} วิชา)
              </span>
              <span className="font-semibold truncate hidden sm:inline">
                มหาวิทยาลัยมหาจุฬาลงกรณราชวิทยาลัย (MCU) · วิทยาลัยสงฆ์พ่อขุนผาเมือง เพชรบูรณ์
              </span>
              <span className="hidden sm:inline-block text-[#854D67]">·</span>
              <span className="hidden md:inline-block text-[#854D67]">
                ตารางสอบไล่ภาคการศึกษาที่ 1 ปีการศึกษา 2569 (รวม {totalExamsCount} วิชา)
              </span>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <span className="text-[11px] text-[#701A4B] font-semibold hidden md:inline bg-white/80 px-2.5 py-0.5 rounded-full border border-[#F8D7E3]">
                ห้องประชุมชั้น 1 ทุกชั้นเรียน
              </span>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-white text-emerald-800 text-[10px] font-semibold border border-[#F8D7E3]">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                <span>ออนไลน์</span>
              </span>
            </div>
          </div>
        </div>

        {/* Main Header Row */}
        <div className={`${isWidescreen ? 'max-w-[98%] 2xl:max-w-[1720px]' : 'max-w-7xl'} mx-auto px-3 sm:px-4 py-2 sm:py-3 flex items-center justify-between gap-2 sm:gap-4`}>
          {/* University Brand / Wordmark */}
          <div 
            onClick={() => handleTabSelect('dashboard')} 
            className="flex items-center gap-2 sm:gap-3 cursor-pointer group shrink-0"
          >
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-br from-[#FCE7F3] to-[#F8D7E3] text-[#701A4B] flex items-center justify-center shadow-2xs border border-[#F8D7E3] group-hover:scale-105 transition-transform">
              <GraduationCap className="w-4 h-4 sm:w-5 sm:h-5 text-[#9D174D]" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h1 className="font-bold text-sm sm:text-lg text-slate-900 tracking-tight leading-none group-hover:text-[#9D174D] transition-colors">
                  MCU Exam
                </h1>
                <span className="text-[9px] sm:text-[10px] font-bold px-1.5 py-0.2 sm:px-2 sm:py-0.5 rounded-full bg-[#FFF0F5] text-[#9D174D] border border-[#F8D7E3]">
                  2569
                </span>
              </div>
              <p className="text-[10px] sm:text-[11px] text-[#854D67] mt-0.5 hidden xs:block truncate max-w-[200px] sm:max-w-none">
                วส.พ่อขุนผาเมือง เพชรบูรณ์ · มจร.
              </p>
            </div>
          </div>

          {/* Global Search Bar (Desktop / Tablet) */}
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

          {/* Desktop Action Controls */}
          <div className="hidden md:flex items-center gap-1.5 sm:gap-2 shrink-0">
            {onExportExcel && (
              <button
                onClick={onExportExcel}
                title="ส่งออกตารางสอบเป็นไฟล์ Microsoft Excel (.xlsx)"
                className="flex items-center gap-1.5 text-xs font-semibold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 px-3 py-1.5 rounded-xl border border-emerald-200 transition shadow-2xs cursor-pointer"
              >
                <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
                <span>ส่งออก Excel</span>
              </button>
            )}

            {onNavigateToFolderUpload && (
              <button
                onClick={onNavigateToFolderUpload}
                title="อัปโหลดข้อสอบแบบเลือกโฟลเดอร์และจับคู่อัตโนมัติ"
                className="flex items-center gap-1.5 text-xs font-bold text-white bg-gradient-to-r from-[#9D174D] to-[#701A4B] hover:opacity-95 px-3 py-1.5 rounded-xl shadow-xs transition cursor-pointer"
              >
                <FolderUp className="w-3.5 h-3.5 text-rose-200" />
                <span className="hidden sm:inline">อัปโหลดโฟลเดอร์</span>
              </button>
            )}

            {currentUser ? (
              <div className="flex items-center gap-1.5 bg-[#FFF0F5] border border-[#F8D7E3] px-2.5 py-1.5 rounded-xl text-xs">
                <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                <div className="text-left max-w-[120px] truncate">
                  <p className="font-bold text-[#701A4B] truncate leading-tight">
                    {currentUser.name}
                  </p>
                  <p className="text-[10px] text-[#854D67]">
                    {currentUser.role === 'admin' ? 'ผู้ดูแลระบบกลาง' : 'อาจารย์'}
                  </p>
                </div>
                <button
                  onClick={onLogout}
                  title="ออกจากระบบอาจารย์"
                  className="ml-1 p-1 text-[#854D67] hover:text-[#701A4B] hover:bg-white rounded-lg transition"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <button
                onClick={onOpenLogin}
                className="flex items-center gap-1.5 text-xs font-semibold bg-[#FFF0F5] hover:bg-[#FCE7F3] text-[#701A4B] border border-[#F8D7E3] px-3 py-1.5 rounded-xl transition shadow-2xs cursor-pointer"
              >
                <UserCheck className="w-3.5 h-3.5 text-[#9D174D]" />
                <span>เข้าสู่ระบบอาจารย์</span>
              </button>
            )}

            {onToggleWidescreen && (
              <button
                onClick={onToggleWidescreen}
                title={isWidescreen ? 'ปรับขนาดมาตรฐาน (Centered)' : 'ขยายเต็มจออัตโนมัติ (100% Widescreen)'}
                className="hidden lg:flex items-center gap-1.5 text-xs font-medium text-slate-700 hover:text-[#701A4B] bg-white hover:bg-[#FFF0F5] px-3 py-1.5 rounded-xl border border-[#F8D7E3] transition shadow-2xs"
              >
                {isWidescreen ? (
                  <>
                    <Minimize2 className="w-3.5 h-3.5 text-[#9D174D]" />
                    <span>ปกติ</span>
                  </>
                ) : (
                  <>
                    <Maximize2 className="w-3.5 h-3.5 text-[#9D174D]" />
                    <span>เต็มจอ</span>
                  </>
                )}
              </button>
            )}

            <button
              onClick={onPrint}
              title="พิมพ์ตารางสอบทางการ (A4)"
              className="flex items-center gap-1.5 text-xs font-medium text-slate-700 hover:text-[#701A4B] bg-white hover:bg-[#FFF0F5] px-3 py-1.5 rounded-xl border border-[#F8D7E3] transition shadow-2xs cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5 text-[#9D174D]" />
              <span>พิมพ์ตาราง</span>
            </button>
          </div>

          {/* Mobile Right Controls: Minimal & Touch-Friendly */}
          <div className="flex md:hidden items-center gap-1">
            {/* Mobile Search Toggle */}
            <button
              onClick={() => setIsMobileSearchOpen(!isMobileSearchOpen)}
              className={`p-2 rounded-xl transition ${
                isMobileSearchOpen || searchQuery
                  ? 'bg-[#FCE7F3] text-[#9D174D] border border-[#F8D7E3]'
                  : 'text-slate-700 hover:bg-[#FFF0F5]'
              }`}
              title="ค้นหาตารางสอบ"
              aria-label="ค้นหาตารางสอบ"
            >
              <Search className="w-4 h-4" />
            </button>

            {/* Quick Print Button */}
            <button
              onClick={onPrint}
              className="p-2 text-slate-700 hover:text-[#701A4B] hover:bg-[#FFF0F5] rounded-xl transition"
              title="พิมพ์ตารางสอบทางการ (A4)"
              aria-label="พิมพ์ตารางสอบ"
            >
              <Printer className="w-4 h-4 text-[#9D174D]" />
            </button>

            {/* Mobile Menu Hamburger */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className={`p-2 rounded-xl transition ${
                isMobileMenuOpen 
                  ? 'bg-[#9D174D] text-white shadow-2xs' 
                  : 'bg-[#FFF0F5] text-[#701A4B] border border-[#F8D7E3]'
              }`}
              title="เมนูเพิ่มเติม"
              aria-label="เปิดเมนู"
            >
              {isMobileMenuOpen ? (
                <X className="w-4 h-4" />
              ) : (
                <Menu className="w-4 h-4" />
              )}
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
                placeholder="ค้นหารหัสวิชา, รายวิชา, อาจารย์, วันสอบ..."
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

        {/* Desktop Navigation Tabs (Hidden on mobile for clean clutter-free UI) */}
        <div className={`hidden md:block ${isWidescreen ? 'max-w-[98%] 2xl:max-w-[1720px]' : 'max-w-7xl'} mx-auto px-2 sm:px-4 border-t border-[#F8D7E3]/60`}>
          <nav className="flex items-center space-x-1.5 py-1 text-xs sm:text-sm font-medium whitespace-nowrap overflow-x-auto scrollbar-none">
            {/* TAB 0: แดชบอร์ด */}
            <button
              onClick={() => setCurrentTab('dashboard')}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl transition-all ${
                currentTab === 'dashboard'
                  ? 'bg-[#FCE7F3] text-[#701A4B] font-bold shadow-2xs border border-[#F8D7E3]'
                  : 'text-slate-600 hover:text-[#701A4B] hover:bg-[#FFF5F8]'
              }`}
            >
              <LayoutDashboard className="w-3.5 h-3.5 text-[#9D174D]" />
              <span>แดชบอร์ด</span>
            </button>

            {/* TAB 1: ตารางสอบทั้งหมด */}
            <button
              onClick={() => setCurrentTab('schedule')}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl transition-all ${
                currentTab === 'schedule'
                  ? 'bg-[#FCE7F3] text-[#701A4B] font-bold shadow-2xs border border-[#F8D7E3]'
                  : 'text-slate-600 hover:text-[#701A4B] hover:bg-[#FFF5F8]'
              }`}
            >
              <BookOpen className="w-3.5 h-3.5 text-[#9D174D]" />
              <span>ตารางสอบทั้งหมด</span>
              <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                currentTab === 'schedule' ? 'bg-white text-[#701A4B]' : 'bg-[#FFF0F5] text-[#854D67]'
              }`}>
                {totalExamsCount}
              </span>
            </button>

            {/* TAB 2: ปฏิทินสอบตามวัน */}
            <button
              onClick={() => setCurrentTab('calendar')}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl transition-all ${
                currentTab === 'calendar'
                  ? 'bg-[#FCE7F3] text-[#701A4B] font-bold shadow-2xs border border-[#F8D7E3]'
                  : 'text-slate-600 hover:text-[#701A4B] hover:bg-[#FFF5F8]'
              }`}
            >
              <Calendar className="w-3.5 h-3.5 text-[#9D174D]" />
              <span>ปฏิทินสอบตามวัน</span>
            </button>

            {/* TAB 3: วิชาข้อสอบของฉัน */}
            {currentUser && (
              <button
                onClick={() => setCurrentTab('my-schedule')}
                className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl transition-all ${
                  currentTab === 'my-schedule'
                    ? 'bg-[#FCE7F3] text-[#701A4B] font-bold shadow-2xs border border-[#F8D7E3]'
                    : 'text-slate-600 hover:text-[#701A4B] hover:bg-[#FFF5F8]'
                }`}
              >
                <Star className={`w-3.5 h-3.5 ${savedCount > 0 ? 'text-[#E11D48] fill-[#E11D48]' : 'text-[#9D174D]'}`} />
                <span>วิชาข้อสอบของฉัน</span>
                {savedCount > 0 && (
                  <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-[#E11D48] text-white">
                    {savedCount}
                  </span>
                )}
              </button>
            )}

            {/* TEACHER-ONLY TABS */}
            {currentUser && (
              <>
                <div className="h-4 w-[1px] bg-[#F8D7E3] mx-1"></div>

                <button
                  onClick={() => setCurrentTab('teacher')}
                  className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl transition-all ${
                    currentTab === 'teacher'
                      ? 'bg-[#FCE7F3] text-[#701A4B] font-bold shadow-2xs border border-[#F8D7E3]'
                      : 'text-slate-600 hover:text-[#701A4B] hover:bg-[#FFF5F8]'
                  }`}
                >
                  <ShieldCheck className="w-3.5 h-3.5 text-[#9D174D]" />
                  <span>จัดการสอบ (อาจารย์)</span>
                  <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                </button>

                <button
                  onClick={() => setCurrentTab('alerts')}
                  className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl transition-all ${
                    currentTab === 'alerts'
                      ? 'bg-[#FCE7F3] text-[#701A4B] font-bold shadow-2xs border border-[#F8D7E3]'
                      : 'text-slate-600 hover:text-[#701A4B] hover:bg-[#FFF5F8]'
                  }`}
                >
                  <Bell className="w-3.5 h-3.5 text-[#9D174D]" />
                  <span>แจ้งเตือน & LINE</span>
                </button>

                <button
                  onClick={() => setCurrentTab('cloud')}
                  className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl transition-all ${
                    currentTab === 'cloud'
                      ? 'bg-[#FCE7F3] text-[#701A4B] font-bold shadow-2xs border border-[#F8D7E3]'
                      : 'text-slate-600 hover:text-[#701A4B] hover:bg-[#FFF5F8]'
                  }`}
                >
                  <Code className="w-3.5 h-3.5 text-[#9D174D]" />
                  <span>Apps Script & Firebase</span>
                </button>
              </>
            )}
          </nav>
        </div>
      </header>

      {/* Mobile Drawer / Slide-down Menu Modal */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-50 md:hidden bg-slate-900/40 backdrop-blur-xs flex flex-col justify-end animate-in fade-in duration-200">
          <div 
            className="absolute inset-0" 
            onClick={() => setIsMobileMenuOpen(false)}
          ></div>
          
          <div className="relative bg-white rounded-t-3xl max-h-[85vh] overflow-y-auto p-4 space-y-4 shadow-2xl border-t border-[#F8D7E3] animate-in slide-in-from-bottom duration-200">
            {/* Drawer Handle & Header */}
            <div className="flex items-center justify-between pb-3 border-b border-[#F8D7E3]">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-[#FFF0F5] text-[#9D174D] flex items-center justify-center border border-[#F8D7E3]">
                  <GraduationCap className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-[#701A4B]">เมนูระบบตารางสอบ</h3>
                  <p className="text-[10px] text-[#854D67]">วิทยาลัยสงฆ์พ่อขุนผาเมือง มจร.</p>
                </div>
              </div>
              <button 
                onClick={() => setIsMobileMenuOpen(false)}
                className="p-1.5 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Teacher Account Status Card */}
            <div className="p-3 rounded-2xl bg-[#FFF8FA] border border-[#F8D7E3]">
              {currentUser ? (
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-[#9D174D] text-white flex items-center justify-center font-bold text-xs shadow-2xs">
                      {currentUser.name.substring(0, 2)}
                    </div>
                    <div>
                      <p className="font-bold text-xs text-[#701A4B] leading-tight">
                        {currentUser.name}
                      </p>
                      <p className="text-[10px] text-emerald-700 flex items-center gap-1 font-medium mt-0.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                        {currentUser.role === 'admin' ? 'ผู้ดูแลระบบกลาง' : 'อาจารย์ผู้บรรยาย'}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      onLogout();
                      setIsMobileMenuOpen(false);
                    }}
                    className="p-2 text-rose-700 bg-white border border-rose-200 rounded-xl text-xs font-semibold hover:bg-rose-50 flex items-center gap-1"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>ออก</span>
                  </button>
                </div>
              ) : (
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-bold text-xs text-slate-800">สำหรับอาจารย์ผู้บรรยาย</p>
                    <p className="text-[10px] text-[#854D67]">เข้าสู่ระบบเพื่อจัดการข้อสอบ และดูวิชาของท่าน</p>
                  </div>
                  <button
                    onClick={() => {
                      setIsMobileMenuOpen(false);
                      onOpenLogin();
                    }}
                    className="px-3 py-1.5 bg-[#9D174D] text-white text-xs font-semibold rounded-xl shadow-2xs hover:bg-[#831843] flex items-center gap-1.5"
                  >
                    <UserCheck className="w-3.5 h-3.5" />
                    <span>เข้าสู่ระบบ</span>
                  </button>
                </div>
              )}
            </div>

            {onNavigateToFolderUpload && (
              <button
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  onNavigateToFolderUpload();
                }}
                className="w-full flex items-center justify-between p-3 rounded-2xl text-xs font-bold bg-gradient-to-r from-[#FFF0F5] to-[#FCE7F3] hover:opacity-95 text-[#701A4B] border border-[#F8D7E3] shadow-2xs transition"
              >
                <div className="flex items-center gap-2.5">
                  <FolderUp className="w-4 h-4 text-[#9D174D]" />
                  <span>📁 อัปโหลดข้อสอบแบบเลือกโฟลเดอร์</span>
                </div>
                <ChevronRight className="w-4 h-4 text-[#854D67]/50" />
              </button>
            )}

            {/* Category 1: ตารางและการสอบ */}
            <div className="space-y-1">
              <p className="text-[10px] font-bold text-[#854D67] uppercase tracking-wider px-1">
                การดูตารางสอบ
              </p>
              
              <button
                onClick={() => handleTabSelect('dashboard')}
                className={`w-full flex items-center justify-between p-2.5 rounded-xl text-xs font-medium transition ${
                  currentTab === 'dashboard'
                    ? 'bg-[#FCE7F3] text-[#701A4B] font-bold border border-[#F8D7E3]'
                    : 'text-slate-700 hover:bg-[#FFF5F8]'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <LayoutDashboard className="w-4 h-4 text-[#9D174D]" />
                  <span>แดชบอร์ดภาพรวมสถิติ</span>
                </div>
                <ChevronRight className="w-4 h-4 text-[#854D67]/50" />
              </button>

              <button
                onClick={() => handleTabSelect('schedule')}
                className={`w-full flex items-center justify-between p-2.5 rounded-xl text-xs font-medium transition ${
                  currentTab === 'schedule'
                    ? 'bg-[#FCE7F3] text-[#701A4B] font-bold border border-[#F8D7E3]'
                    : 'text-slate-700 hover:bg-[#FFF5F8]'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <BookOpen className="w-4 h-4 text-[#9D174D]" />
                  <span>ตารางสอบทั้งหมด (91 รายวิชา)</span>
                </div>
                <ChevronRight className="w-4 h-4 text-[#854D67]/50" />
              </button>

              <button
                onClick={() => handleTabSelect('calendar')}
                className={`w-full flex items-center justify-between p-2.5 rounded-xl text-xs font-medium transition ${
                  currentTab === 'calendar'
                    ? 'bg-[#FCE7F3] text-[#701A4B] font-bold border border-[#F8D7E3]'
                    : 'text-slate-700 hover:bg-[#FFF5F8]'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Calendar className="w-4 h-4 text-[#9D174D]" />
                  <span>ปฏิทินสอบตามวัน (รายวัน)</span>
                </div>
                <ChevronRight className="w-4 h-4 text-[#854D67]/50" />
              </button>

              {currentUser && (
                <button
                  onClick={() => handleTabSelect('my-schedule')}
                  className={`w-full flex items-center justify-between p-2.5 rounded-xl text-xs font-medium transition ${
                    currentTab === 'my-schedule'
                      ? 'bg-[#FCE7F3] text-[#701A4B] font-bold border border-[#F8D7E3]'
                      : 'text-slate-700 hover:bg-[#FFF5F8]'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Star className="w-4 h-4 text-[#E11D48] fill-[#E11D48]" />
                    <span>วิชาข้อสอบของฉัน</span>
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#E11D48] text-white">
                    {savedCount}
                  </span>
                </button>
              )}
            </div>

            {/* Category 2: เมนูอาจารย์ (เมื่อล็อกอิน) */}
            {currentUser && (
              <div className="space-y-1 pt-1 border-t border-[#F8D7E3]">
                <p className="text-[10px] font-bold text-[#854D67] uppercase tracking-wider px-1">
                  เมนูสำหรับอาจารย์
                </p>

                <button
                  onClick={() => handleTabSelect('teacher')}
                  className={`w-full flex items-center justify-between p-2.5 rounded-xl text-xs font-medium transition ${
                    currentTab === 'teacher'
                      ? 'bg-[#FCE7F3] text-[#701A4B] font-bold border border-[#F8D7E3]'
                      : 'text-slate-700 hover:bg-[#FFF5F8]'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <ShieldCheck className="w-4 h-4 text-[#9D174D]" />
                    <span>จัดการข้อมูลสอบ (เพิ่ม/แก้ไขวิชา)</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-[#854D67]/50" />
                </button>

                <button
                  onClick={() => handleTabSelect('alerts')}
                  className={`w-full flex items-center justify-between p-2.5 rounded-xl text-xs font-medium transition ${
                    currentTab === 'alerts'
                      ? 'bg-[#FCE7F3] text-[#701A4B] font-bold border border-[#F8D7E3]'
                      : 'text-slate-700 hover:bg-[#FFF5F8]'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Bell className="w-4 h-4 text-[#9D174D]" />
                    <span>ตั้งค่าแจ้งเตือน & LINE Notify</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-[#854D67]/50" />
                </button>

                <button
                  onClick={() => handleTabSelect('cloud')}
                  className={`w-full flex items-center justify-between p-2.5 rounded-xl text-xs font-medium transition ${
                    currentTab === 'cloud'
                      ? 'bg-[#FCE7F3] text-[#701A4B] font-bold border border-[#F8D7E3]'
                      : 'text-slate-700 hover:bg-[#FFF5F8]'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Code className="w-4 h-4 text-[#9D174D]" />
                    <span>Google Apps Script & ซิงค์ข้อมูล</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-[#854D67]/50" />
                </button>
              </div>
            )}

            {/* Category 3: การส่งออก & พิมพ์ */}
            <div className="space-y-1 pt-1 border-t border-[#F8D7E3]">
              <p className="text-[10px] font-bold text-[#854D67] uppercase tracking-wider px-1">
                การพิมพ์และส่งออกเอกสาร
              </p>

              <button
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  onPrint();
                }}
                className="w-full flex items-center justify-between p-2.5 rounded-xl text-xs font-medium text-slate-700 hover:bg-[#FFF5F8] transition"
              >
                <div className="flex items-center gap-2.5">
                  <Printer className="w-4 h-4 text-[#9D174D]" />
                  <span>พิมพ์ตารางสอบทางการ (A4 / บันทึก PDF)</span>
                </div>
                <ChevronRight className="w-4 h-4 text-[#854D67]/50" />
              </button>

              {onExportExcel && (
                <button
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    onExportExcel();
                  }}
                  className="w-full flex items-center justify-between p-2.5 rounded-xl text-xs font-medium text-emerald-800 hover:bg-emerald-50 transition"
                >
                  <div className="flex items-center gap-2.5">
                    <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                    <span>ดาวน์โหลดไฟล์ Microsoft Excel (.xlsx)</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-emerald-600/50" />
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modern, Streamlined Mobile Bottom Navigation Bar (Visible only on mobile < md) */}
      <nav 
        aria-label="แถบเมนูนำทางหลักบนมือถือ"
        className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-[#F8D7E3] md:hidden shadow-lg px-2 py-1 flex items-center justify-around no-print"
      >
        {/* Tab 0: แดชบอร์ด */}
        <button
          onClick={() => handleTabSelect('dashboard')}
          className={`flex flex-col items-center justify-center flex-1 py-1.5 px-1 rounded-xl transition cursor-pointer min-h-[44px] ${
            currentTab === 'dashboard'
              ? 'text-[#9D174D] font-bold'
              : 'text-slate-500 hover:text-[#701A4B]'
          }`}
        >
          <LayoutDashboard className={`w-5 h-5 mb-0.5 ${currentTab === 'dashboard' ? 'text-[#9D174D]' : 'text-slate-500'}`} />
          <span className="text-[11px] leading-tight">แดชบอร์ด</span>
        </button>

        {/* Tab 1: ตารางสอบ */}
        <button
          onClick={() => handleTabSelect('schedule')}
          className={`flex flex-col items-center justify-center flex-1 py-1.5 px-1 rounded-xl transition cursor-pointer min-h-[44px] ${
            currentTab === 'schedule'
              ? 'text-[#9D174D] font-bold'
              : 'text-slate-500 hover:text-[#701A4B]'
          }`}
        >
          <BookOpen className={`w-5 h-5 mb-0.5 ${currentTab === 'schedule' ? 'text-[#9D174D]' : 'text-slate-500'}`} />
          <span className="text-[11px] leading-tight">ตารางสอบ</span>
        </button>

        {/* Tab 2: ปฏิทิน */}
        <button
          onClick={() => handleTabSelect('calendar')}
          className={`flex flex-col items-center justify-center flex-1 py-1.5 px-1 rounded-xl transition cursor-pointer min-h-[44px] ${
            currentTab === 'calendar'
              ? 'text-[#9D174D] font-bold'
              : 'text-slate-500 hover:text-[#701A4B]'
          }`}
        >
          <Calendar className={`w-5 h-5 mb-0.5 ${currentTab === 'calendar' ? 'text-[#9D174D]' : 'text-slate-500'}`} />
          <span className="text-[11px] leading-tight">ปฏิทิน</span>
        </button>

        {/* Tab 3: วิชาของฉัน (หรือเปิดค้นหาเร็วหากยังไม่ล็อกอิน) */}
        {currentUser ? (
          <button
            onClick={() => handleTabSelect('my-schedule')}
            className={`flex flex-col items-center justify-center flex-1 py-1.5 px-1 rounded-xl transition cursor-pointer relative min-h-[44px] ${
              currentTab === 'my-schedule'
                ? 'text-[#9D174D] font-bold'
                : 'text-slate-500 hover:text-[#701A4B]'
            }`}
          >
            <div className="relative">
              <Star className={`w-5 h-5 mb-0.5 ${currentTab === 'my-schedule' ? 'text-[#E11D48] fill-[#E11D48]' : 'text-slate-500'}`} />
              {savedCount > 0 && (
                <span className="absolute -top-1 -right-2 w-4 h-4 bg-[#E11D48] text-white text-[9px] font-bold rounded-full flex items-center justify-center">
                  {savedCount > 9 ? '9+' : savedCount}
                </span>
              )}
            </div>
            <span className="text-[11px] leading-tight">วิชาของฉัน</span>
          </button>
        ) : (
          <button
            onClick={() => setIsMobileSearchOpen(prev => !prev)}
            className={`flex flex-col items-center justify-center flex-1 py-1.5 px-1 rounded-xl transition cursor-pointer min-h-[44px] ${
              isMobileSearchOpen || searchQuery
                ? 'text-[#9D174D] font-bold'
                : 'text-slate-500 hover:text-[#701A4B]'
            }`}
          >
            <Search className="w-5 h-5 mb-0.5" />
            <span className="text-[11px] leading-tight">ค้นหา</span>
          </button>
        )}

        {/* Tab 4: เมนู / อาจารย์ */}
        <button
          onClick={() => {
            if (currentUser) {
              handleTabSelect('teacher');
            } else {
              setIsMobileMenuOpen(true);
            }
          }}
          className={`flex flex-col items-center justify-center flex-1 py-1.5 px-1 rounded-xl transition cursor-pointer min-h-[44px] ${
            currentTab === 'teacher' || currentTab === 'alerts' || currentTab === 'cloud'
              ? 'text-[#9D174D] font-bold'
              : 'text-slate-500 hover:text-[#701A4B]'
          }`}
        >
          {currentUser ? (
            <ShieldCheck className={`w-5 h-5 mb-0.5 ${currentTab === 'teacher' ? 'text-[#9D174D]' : 'text-slate-500'}`} />
          ) : (
            <SlidersHorizontal className="w-5 h-5 mb-0.5 text-slate-500" />
          )}
          <span className="text-[11px] leading-tight">
            {currentUser ? 'อาจารย์' : 'เมนู'}
          </span>
        </button>
      </nav>
    </>
  );
};
