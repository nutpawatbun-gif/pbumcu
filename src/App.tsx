/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Navbar, AppTab } from './components/Navbar';
import { OfficialTableView } from './components/OfficialTableView';
import { TeacherPortal } from './components/TeacherPortal';
import { CourseDetailPage } from './views/CourseDetailPage';
import { TeacherLoginPage } from './views/TeacherLoginPage';
import { ExamEditPage } from './views/ExamEditPage';
import { PrintSetupPage } from './views/PrintSetupPage';
import { BatchFolderUploadPage } from './views/BatchFolderUploadPage';
import { StaffExamVerificationPage } from './views/StaffExamVerificationPage';
import { AdminAccountManagementPage } from './views/AdminAccountManagementPage';
import { RAW_EXAMS_DATA } from './data/initialExams';
import { ExamItem, TeacherUser } from './types/exam';
import { exportExamsToExcel } from './utils/excelExport';
import { apiClient, ApiUser, ApiCourse } from './utils/apiClient';
import { OfficialPrintSheet } from './components/OfficialPrintSheet';
import { GraduationCap, ShieldCheck, RefreshCw } from 'lucide-react';

function mapApiCourseToExam(c: ApiCourse, index: number): ExamItem {
  const parts = (c.examTimeThai || '').split('-');
  const startTime = parts[0]?.trim() || '09:00';
  const endTime = parts[1]?.replace('น.', '').trim() || '11:30';

  return {
    id: c.courseId,
    orderNo: index + 1,
    yearLevel: c.yearLevel,
    faculty: c.faculty || 'วิทยาลัยสงฆ์พ่อขุนผาเมือง',
    major: c.major || '',
    examDateThai: c.examDateThai || '',
    examDateISO: c.examDateISO || '',
    examTimeThai: c.examTimeThai || '',
    startTime,
    endTime,
    courseCode: c.courseCode,
    courseName: c.courseName,
    lecturer: (c as any).lecturer || c.assignedLecturerIds?.join(', ') || 'อาจารย์ผู้สอน',
    notes: '',
    status: c.studentStatus || 'บรรพชิต',
    room: c.room || 'ห้องประชุมชั้น 1',
    examSubmissionStatus: (c.submissionStatus === 'submitted' || c.submissionStatus === 'accepted') ? 'submitted' : 'pending',
    examSubmissionDate: c.submittedAt,
    examFileName: c.latestFileName,
    lastUpdated: c.verifiedAt || c.submittedAt
  };
}

export default function App() {
  const [currentUser, setCurrentUser] = useState<ApiUser | null>(null);
  const [isAuthChecking, setIsAuthChecking] = useState(true);
  const [currentTab, setCurrentTab] = useState<AppTab>('teacher');
  const [exams, setExams] = useState<ExamItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isWidescreen, setIsWidescreen] = useState(false);

  // Subpage views: course-detail, edit-exam, print-setup
  const [subPageView, setSubPageView] = useState<
    | { type: 'course-detail'; examId: string }
    | { type: 'edit-exam'; examId: string }
    | { type: 'print-setup'; scope?: 'all' | 'teacher' | 'saved' }
    | null
  >(null);

  // Load courses from server
  const loadCourses = useCallback(async () => {
    try {
      const serverCourses = await apiClient.getCourses();
      if (serverCourses && serverCourses.length > 0) {
        setExams(serverCourses.map((c, idx) => mapApiCourseToExam(c, idx)));
        return;
      }
    } catch {
      // Fallback in dev if server has no seed yet
    }
    // Fallback to RAW_EXAMS_DATA
    setExams(RAW_EXAMS_DATA.map(item => ({
      ...item,
      room: 'ห้องประชุมชั้น 1'
    })));
  }, []);

  // Initial authentication check on application load
  useEffect(() => {
    let isMounted = true;
    async function checkAuth() {
      try {
        const user = await apiClient.getCurrentUser();
        if (!isMounted) return;
        if (user) {
          setCurrentUser(user);
          if (user.role === 'teacher') setCurrentTab('teacher');
          else if (user.role === 'staff') setCurrentTab('staff');
          else if (user.role === 'admin') setCurrentTab('admin');
          await loadCourses();
        }
      } catch {
        if (isMounted) setCurrentUser(null);
      } finally {
        if (isMounted) setIsAuthChecking(false);
      }
    }
    checkAuth();
    return () => { isMounted = false; };
  }, [loadCourses]);

  const handleLogout = async () => {
    try {
      await apiClient.logout();
    } finally {
      setCurrentUser(null);
      setExams([]);
      setSubPageView(null);
    }
  };

  const handleLoginSuccess = async (user: ApiUser) => {
    setCurrentUser(user);
    if (user.role === 'teacher') setCurrentTab('teacher');
    else if (user.role === 'staff') setCurrentTab('staff');
    else if (user.role === 'admin') setCurrentTab('admin');
    await loadCourses();
  };

  const teacherUserView: TeacherUser | null = useMemo(() => {
    if (!currentUser) return null;
    return {
      id: currentUser.accountId,
      name: currentUser.fullName,
      code: '',
      role: currentUser.role,
      googleEmail: currentUser.googleEmail,
      status: currentUser.status,
      assignedScope: currentUser.assignedScope,
      canReadExamContent: currentUser.canReadExamContent
    };
  }, [currentUser]);

  // Filter exams by search query
  const filteredExams = useMemo(() => {
    if (!searchQuery.trim()) return exams;
    const q = searchQuery.toLowerCase().trim();
    return exams.filter(e => 
      e.courseCode.toLowerCase().includes(q) ||
      e.courseName.toLowerCase().includes(q) ||
      e.lecturer.toLowerCase().includes(q) ||
      e.examDateThai.toLowerCase().includes(q) ||
      (e.faculty && e.faculty.toLowerCase().includes(q))
    );
  }, [exams, searchQuery]);

  // Actions
  const handleExportExcel = () => {
    exportExamsToExcel(exams, 'MCU_Exam_Schedule_Official');
  };

  const handlePrint = () => {
    window.print();
  };

  const handleBackFromSubPage = () => {
    setSubPageView(null);
  };

  const handleBatchUploadSuccess = async () => {
    await loadCourses();
  };

  // 1. Loading screen while checking authentication session
  if (isAuthChecking) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#FFF5F8] via-white to-[#FCE7F3] flex flex-col items-center justify-center p-4">
        <div className="flex flex-col items-center gap-4 p-8 bg-white/90 backdrop-blur-md rounded-3xl border border-[#F8D7E3] shadow-lg max-w-sm text-center">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#9D174D] to-[#701A4B] text-white flex items-center justify-center shadow-md animate-pulse">
            <GraduationCap className="w-8 h-8" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-800">มหาวิทยาลัยมหาจุฬาลงกรณราชวิทยาลัย</h2>
            <p className="text-xs text-[#854D67] mt-0.5">วิทยาลัยสงฆ์พ่อขุนผาเมือง เพชรบูรณ์</p>
          </div>
          <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
            <RefreshCw className="w-4 h-4 text-[#9D174D] animate-spin" />
            <span>กำลังตรวจสอบสิทธิ์การเข้าใช้งานระบบ...</span>
          </div>
        </div>
      </div>
    );
  }

  // 2. Enforce closed internal system: strictly require authentication
  if (!currentUser) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#FFF5F8] via-white to-[#FCE7F3] flex flex-col items-center justify-center p-4">
        <TeacherLoginPage onLoginSuccess={handleLoginSuccess} />
      </div>
    );
  }

  // 3. Authenticated university system with Role-Based Access Control
  return (
    <div className="min-h-screen bg-[#FFF8FA] text-slate-800 flex flex-col selection:bg-rose-200 selection:text-rose-950">
      <Navbar
        currentTab={currentTab}
        setCurrentTab={(tab) => {
          setSubPageView(null);
          setCurrentTab(tab);
        }}
        currentUser={currentUser}
        onLogout={handleLogout}
        totalExamsCount={exams.length}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        onPrint={handlePrint}
        onExportExcel={handleExportExcel}
        isWidescreen={isWidescreen}
        onToggleWidescreen={() => setIsWidescreen(!isWidescreen)}
      />

      <main className="flex-1 pb-24 md:pb-16">
        {subPageView ? (
          <div className={`${isWidescreen ? 'max-w-[98%] 2xl:max-w-[1720px]' : 'max-w-7xl'} mx-auto px-3 sm:px-4 md:px-6 py-4 sm:py-6`}>
            {subPageView.type === 'course-detail' && (() => {
              const exam = exams.find(e => e.id === subPageView.examId);
              if (!exam) return null;
              return (
                <CourseDetailPage
                  exam={exam}
                  currentUser={teacherUserView}
                  onBack={handleBackFromSubPage}
                  onNavigateToUpload={() => setCurrentTab('folder-upload')}
                  onNavigateToEdit={(target) => setSubPageView({ type: 'edit-exam', examId: target.id })}
                  onNavigateToLogin={() => {}}
                  onPrintSlip={() => window.print()}
                />
              );
            })()}

            {subPageView.type === 'edit-exam' && (() => {
              const exam = exams.find(e => e.id === subPageView.examId);
              if (!exam) return null;
              return (
                <ExamEditPage
                  exam={exam}
                  currentUser={teacherUserView}
                  onBack={handleBackFromSubPage}
                  onSave={() => {
                    handleBackFromSubPage();
                    loadCourses();
                  }}
                />
              );
            })()}

            {subPageView.type === 'print-setup' && (
              <PrintSetupPage
                exams={filteredExams}
                currentUser={teacherUserView}
                savedExamIds={[]}
                initialScope={subPageView.scope}
                onBack={handleBackFromSubPage}
                onSyncPrintExams={loadCourses}
              />
            )}
          </div>
        ) : (
          <div className={`${isWidescreen ? 'max-w-[98%] 2xl:max-w-[1720px]' : 'max-w-7xl'} mx-auto px-3 sm:px-4 md:px-6 py-4 sm:py-6`}>
            {/* TEACHER ROLE VIEWS */}
            {currentTab === 'teacher' && (
              <TeacherPortal
                currentUser={teacherUserView}
                onOpenLogin={() => {}}
                exams={filteredExams}
                onAddNewExam={() => {}}
                onEditExam={(exam) => setSubPageView({ type: 'edit-exam', examId: exam.id })}
                onDeleteExam={() => {}}
                onResetToDefault={() => {}}
                onExportCSV={handleExportExcel}
                onExportExcel={handleExportExcel}
                onPrint={handlePrint}
                onImportJSON={() => {}}
                onUploadExamSuccess={loadCourses}
                onBatchUploadSuccess={handleBatchUploadSuccess}
                onViewExamDetails={(exam) => setSubPageView({ type: 'course-detail', examId: exam.id })}
                onNavigateToFolderUpload={() => setCurrentTab('folder-upload')}
              />
            )}

            {currentTab === 'folder-upload' && (
              <BatchFolderUploadPage
                exams={filteredExams}
                currentUser={teacherUserView}
                onBack={() => {
                  if (currentUser.role === 'teacher') setCurrentTab('teacher');
                  else if (currentUser.role === 'staff') setCurrentTab('staff');
                  else setCurrentTab('admin');
                }}
                onBatchUploadSuccess={handleBatchUploadSuccess}
              />
            )}

            {/* STAFF ROLE VIEWS */}
            {currentTab === 'staff' && (
              <StaffExamVerificationPage
                currentUser={currentUser}
              />
            )}

            {/* ADMIN ROLE VIEWS */}
            {currentTab === 'admin' && (
              <AdminAccountManagementPage
                currentUser={currentUser}
              />
            )}

            {/* SCHEDULE TABLE VIEW */}
            {currentTab === 'schedule' && (
              <OfficialTableView
                exams={filteredExams}
                savedExamIds={[]}
                onToggleSave={() => {}}
                onViewExamDetails={(exam: ExamItem) => setSubPageView({ type: 'course-detail', examId: exam.id })}
                currentUser={teacherUserView}
              />
            )}
          </div>
        )}
      </main>

      {/* Official Print Sheet for A4 paper printout */}
      <OfficialPrintSheet
        exams={filteredExams}
      />
    </div>
  );
}
