/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Navbar } from './components/Navbar';
import { OfficialTableView } from './components/OfficialTableView';
import { CalendarView } from './components/CalendarView';
import { Dashboard } from './components/Dashboard';
import { MyScheduleView } from './components/MyScheduleView';
import { TeacherPortal } from './components/TeacherPortal';
import { AlertCenter } from './components/AlertCenter';
import { AppsScriptView } from './components/AppsScriptView';
import { CourseDetailPage } from './views/CourseDetailPage';
import { PendingExamsPage } from './views/PendingExamsPage';
import { ExamUploadDrivePage } from './views/ExamUploadDrivePage';
import { TeacherLoginPage } from './views/TeacherLoginPage';
import { ExamEditPage } from './views/ExamEditPage';
import { PrintSetupPage } from './views/PrintSetupPage';
import { BatchFolderUploadPage } from './views/BatchFolderUploadPage';
import { RAW_EXAMS_DATA } from './data/initialExams';
import { ExamItem, TeacherUser, NotificationSetting } from './types/exam';
import { 
  formatLineNotifyMessage, 
  sendLineNotifyNotification, 
  sendBrowserNotification
} from './utils/notifications';
import { 
  Plus, 
  Printer, 
  FileSpreadsheet,
  Download,
  Lock
} from 'lucide-react';
import { exportExamsToExcel } from './utils/excelExport';
import { isLecturerMatch } from './utils/teacherMatching';
import { OfficialPrintSheet } from './components/OfficialPrintSheet';

const STORAGE_KEY_EXAMS = 'mcu_exam_portal_data_v2';
const STORAGE_KEY_SAVED = 'mcu_exam_portal_saved_v2';
const STORAGE_KEY_SETTINGS = 'mcu_exam_portal_settings_v1';
const STORAGE_KEY_USER = 'mcu_exam_portal_user_v1';

export default function App() {
  // Navigation
  const [currentTab, setCurrentTab] = useState<'dashboard' | 'schedule' | 'my-schedule' | 'calendar' | 'teacher' | 'alerts' | 'cloud'>('dashboard');

  // Exams State (initialized completely clean like fresh install)
  const [exams, setExams] = useState<ExamItem[]>(() => {
    try {
      // Clear legacy storage from previous test sessions
      localStorage.removeItem('mcu_exam_portal_data_v1');
      localStorage.removeItem('mcu_exam_portal_saved_v1');

      const saved = localStorage.getItem(STORAGE_KEY_EXAMS);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed.map(item => ({
            ...item,
            room: 'ห้องประชุมชั้น 1'
          }));
        }
      }
    } catch {
      // ignore
    }
    // Return clean slate: all 91 courses with pending status
    return RAW_EXAMS_DATA.map(item => ({
      ...item,
      room: 'ห้องประชุมชั้น 1',
      examSubmissionStatus: undefined,
      examSubmissionDate: undefined,
      examLink: undefined,
      examFileName: undefined
    }));
  });

  // Saved Courses (Bookmarked by student)
  const [savedExamIds, setSavedExamIds] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_SAVED);
      if (saved) return JSON.parse(saved);
    } catch {
      // ignore
    }
    // Default bookmark Year 1 monks as sample
    return ['exam-1', 'exam-2', 'exam-4', 'exam-6'];
  });

  // Notification settings
  const [settings, setSettings] = useState<NotificationSetting>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_SETTINGS);
      if (saved) return JSON.parse(saved);
    } catch {
      // ignore
    }
    return {
      enableBrowserAlerts: false,
      alertBeforeMinutes: 60,
      soundEnabled: true,
      lineNotifyToken: '',
      webhookUrl: ''
    };
  });

  // Central Google Drive Folder for Exam Paper Submission (รูปแบบที่ 1)
  const DEFAULT_MCU_DRIVE_FOLDER = 'https://drive.google.com/drive/folders/1yc7VLWVCYtH8n1NqWymKmeu1kaNJRDBa?usp=sharing';

  const [centralDriveFolderUrl, setCentralDriveFolderUrl] = useState<string>(() => {
    try {
      const saved = localStorage.getItem('mcu_exam_portal_drive_folder');
      if (saved && saved !== 'https://drive.google.com/drive/folders/') return saved;
    } catch {}
    return DEFAULT_MCU_DRIVE_FOLDER;
  });

  const handleUpdateCentralDriveFolder = (url: string) => {
    setCentralDriveFolderUrl(url);
    try {
      localStorage.setItem('mcu_exam_portal_drive_folder', url);
    } catch {}
  };

  const handleToggleExamSubmission = (id: string) => {
    const targetExam = exams.find(e => e.id === id);
    if (!targetExam) return;

    // หากส่งข้อสอบแล้ว ตั้งเงื่อนไขห้ามสลับสถานะหรืออัปโหลดซ้ำ (ยกเว้น Admin)
    if (targetExam.examSubmissionStatus === 'submitted' && currentUser?.role !== 'admin') {
      alert('⚠️ รายวิชานี้ส่งข้อสอบเรียบร้อยแล้ว (สถานะ: พร้อมสอบ ✔)\n\nระบบตั้งเงื่อนไขห้ามอัปโหลดหรือแก้ไขซ้ำ เพื่อป้องกันการส่งข้อสอบซ้ำซ้อน\n(หากมีความจำเป็นต้องแก้ไขไฟล์ กรุณาติดต่อผู้ดูแลระบบ Admin)');
      return;
    }

    setExams(prev => prev.map(exam => {
      if (exam.id !== id) return exam;
      const isSubmitted = exam.examSubmissionStatus === 'submitted';
      const now = new Date();
      const thaiDate = now.toLocaleDateString('th-TH', { 
        day: 'numeric', 
        month: 'short', 
        year: '2-digit' 
      });
      const thaiTime = now.toLocaleTimeString('th-TH', { 
        hour: '2-digit', 
        minute: '2-digit' 
      });
      return {
        ...exam,
        examSubmissionStatus: isSubmitted ? 'pending' : 'submitted',
        examSubmissionDate: isSubmitted ? undefined : `${thaiDate} ${thaiTime} น.`
      };
    }));
  };

  const handleUploadExamSuccess = (examId: string, fileUrl: string, uploadedDate: string) => {
    const targetExam = exams.find(e => e.id === examId);
    if (targetExam && targetExam.examSubmissionStatus === 'submitted' && currentUser?.role !== 'admin') {
      alert('⚠️ รายวิชานี้ส่งข้อสอบแล้ว ไม่อนุญาตให้อัปโหลดซ้ำ');
      return;
    }

    setExams(prev => prev.map(exam => {
      if (exam.id !== examId) return exam;
      return {
        ...exam,
        examSubmissionStatus: 'submitted',
        examSubmissionDate: uploadedDate,
        examLink: fileUrl || exam.examLink
      };
    }));
  };

  const handleBatchUploadSuccess = (updates: { examId: string; fileUrl?: string; uploadedDate: string; fileName: string }[]) => {
    setExams(prev => prev.map(exam => {
      const update = updates.find(u => u.examId === exam.id);
      if (!update) return exam;
      return {
        ...exam,
        examSubmissionStatus: 'submitted',
        examSubmissionDate: update.uploadedDate,
        examLink: update.fileUrl || exam.examLink,
        examFileName: update.fileName || exam.examFileName
      };
    }));
  };

  // Current Logged In Teacher
  const [currentUser, setCurrentUser] = useState<TeacherUser | null>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_USER);
      if (saved) return JSON.parse(saved);
    } catch {
      // ignore
    }
    return null;
  });

  // SubPageView state (Replaces all popup modals with full-page views)
  type SubPageView = 
    | null
    | { type: 'course-detail'; examId: string; fromTab: string }
    | { type: 'pending-exams'; mode: 'pending' | 'submitted' | 'all'; fromTab: string }
    | { type: 'upload-drive'; examId: string; fromTab: string }
    | { type: 'folder-upload'; fromTab: string }
    | { type: 'teacher-login'; fromTab: string }
    | { type: 'edit-exam'; examId: string; fromTab: string }
    | { type: 'print-setup'; scope: 'all' | 'teacher' | 'saved'; fromTab: string };

  const [subPageView, setSubPageView] = useState<SubPageView>(null);
  const [printTargetExams, setPrintTargetExams] = useState<ExamItem[]>([]);
  const [printSubtitle, setPrintSubtitle] = useState<string>('ตารางสอบไล่ ประจำภาคการศึกษาที่ 1 ปีการศึกษา 2569');
  const [printSignatoryTeacher, setPrintSignatoryTeacher] = useState<string | undefined>(undefined);

  const handleSyncPrintExams = useCallback((targetList: ExamItem[], sub: string, teacher?: string) => {
    setPrintTargetExams(targetList);
    setPrintSubtitle(sub);
    setPrintSignatoryTeacher(teacher);
  }, []);

  const navigateToCourseDetail = (exam: ExamItem) => {
    setSubPageView({ type: 'course-detail', examId: exam.id, fromTab: currentTab });
    window.location.hash = `course-${exam.id}`;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const navigateToPendingExams = (mode: 'pending' | 'submitted' | 'all' = 'pending') => {
    setSubPageView({ type: 'pending-exams', mode, fromTab: currentTab });
    window.location.hash = `pending-${mode}`;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const navigateToUploadDrive = (exam: ExamItem) => {
    setSubPageView({ type: 'upload-drive', examId: exam.id, fromTab: currentTab });
    window.location.hash = `upload-${exam.id}`;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const navigateToFolderUpload = () => {
    if (!currentUser) {
      navigateToLogin();
      return;
    }
    setSubPageView({ type: 'folder-upload', fromTab: currentTab });
    window.location.hash = 'folder-upload';
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const navigateToLogin = () => {
    setSubPageView({ type: 'teacher-login', fromTab: currentTab });
    window.location.hash = 'login';
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const navigateToEditExam = (exam: ExamItem) => {
    setSubPageView({ type: 'edit-exam', examId: exam.id, fromTab: currentTab });
    window.location.hash = `edit-${exam.id}`;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const navigateToPrintSetup = (scope: 'all' | 'teacher' | 'saved' = 'all') => {
    setSubPageView({ type: 'print-setup', scope, fromTab: currentTab });
    window.location.hash = `print-${scope}`;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleBackFromSubPage = () => {
    if (subPageView) {
      const returnTab = subPageView.fromTab;
      setSubPageView(null);
      if (returnTab) {
        setCurrentTab(returnTab as any);
        window.location.hash = returnTab;
      } else {
        window.location.hash = '';
      }
    } else {
      setSubPageView(null);
      window.location.hash = '';
    }
  };

  // Listen to browser Back/Forward (Hash Routing)
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.replace(/^#/, '');
      if (!hash) {
        setSubPageView(null);
        return;
      }
      if (hash.startsWith('course-')) {
        const id = hash.replace('course-', '');
        setSubPageView({ type: 'course-detail', examId: id, fromTab: currentTab });
      } else if (hash.startsWith('pending-')) {
        const mode = hash.replace('pending-', '') as 'pending' | 'submitted' | 'all';
        setSubPageView({ type: 'pending-exams', mode: ['pending', 'submitted', 'all'].includes(mode) ? mode : 'pending', fromTab: currentTab });
      } else if (hash.startsWith('upload-')) {
        const id = hash.replace('upload-', '');
        setSubPageView({ type: 'upload-drive', examId: id, fromTab: currentTab });
      } else if (hash === 'folder-upload') {
        setSubPageView({ type: 'folder-upload', fromTab: currentTab });
      } else if (hash === 'login') {
        setSubPageView({ type: 'teacher-login', fromTab: currentTab });
      } else if (hash.startsWith('edit-')) {
        const id = hash.replace('edit-', '');
        setSubPageView({ type: 'edit-exam', examId: id, fromTab: currentTab });
      } else if (hash.startsWith('print-')) {
        const scope = hash.replace('print-', '') as 'all' | 'teacher' | 'saved';
        setSubPageView({ type: 'print-setup', scope: ['all', 'teacher', 'saved'].includes(scope) ? scope : 'all', fromTab: currentTab });
      } else if (['dashboard', 'schedule', 'my-schedule', 'calendar', 'teacher', 'alerts', 'cloud'].includes(hash)) {
        setSubPageView(null);
        setCurrentTab(hash as any);
      }
    };

    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, [currentTab]);

  // Search & Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [filterYear, setFilterYear] = useState<number | 'all'>('all');
  const [filterStatus, setFilterStatus] = useState<'all' | 'บรรพชิต' | 'คฤหัสถ์'>('all');
  const [filterFaculty, setFilterFaculty] = useState<string>('all');
  const [filterDate, setFilterDate] = useState<string>('all');

  // Sorting
  const [sortKey, setSortKey] = useState<'orderNo' | 'examDateISO' | 'courseCode' | 'yearLevel'>('orderNo');
  const [sortAsc, setSortAsc] = useState(true);

  // Widescreen auto-expansion mode (default to true for expansive responsive layout)
  const [isWidescreen, setIsWidescreen] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem('mcu_widescreen');
      return saved !== null ? saved === 'true' : true;
    } catch {
      return true;
    }
  });

  const handleToggleWidescreen = () => {
    setIsWidescreen(prev => {
      const next = !prev;
      try {
        localStorage.setItem('mcu_widescreen', next.toString());
      } catch {}
      return next;
    });
  };

  // Sync to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_EXAMS, JSON.stringify(exams));
    } catch {
      // ignore
    }
  }, [exams]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_SAVED, JSON.stringify(savedExamIds));
    } catch {
      // ignore
    }
  }, [savedExamIds]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_SETTINGS, JSON.stringify(settings));
    } catch {
      // ignore
    }
  }, [settings]);

  useEffect(() => {
    try {
      if (currentUser) {
        localStorage.setItem(STORAGE_KEY_USER, JSON.stringify(currentUser));
        // Auto-sync teaching courses to savedExamIds for seamless schedule viewing
        if (currentUser.role === 'teacher') {
          const teacherCourseIds = exams.filter(e => isLecturerMatch(e.lecturer, currentUser)).map(e => e.id);
          if (teacherCourseIds.length > 0) {
            setSavedExamIds(prev => {
              const isDefaultSample = prev.length === 4 && ['exam-1', 'exam-2', 'exam-4', 'exam-6'].every(id => prev.includes(id));
              if (isDefaultSample) {
                return teacherCourseIds;
              }
              return Array.from(new Set([...teacherCourseIds, ...prev]));
            });
          }
        }
      } else {
        localStorage.removeItem(STORAGE_KEY_USER);
      }
    } catch {
      // ignore
    }
  }, [currentUser, exams]);

  // Distinct lists for dropdowns
  const distinctFaculties = useMemo(() => {
    return Array.from(new Set(exams.map(e => e.faculty))).filter(f => f && f !== 'ทุกคณะ').sort();
  }, [exams]);

  const distinctDates = useMemo(() => {
    return Array.from(new Set(exams.map(e => e.examDateThai))).filter(Boolean);
  }, [exams]);

  // Filtered & Sorted exams
  const filteredExams = useMemo(() => {
    return exams.filter(exam => {
      // Search text
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchCode = exam.courseCode.toLowerCase().includes(q);
        const matchName = exam.courseName.toLowerCase().includes(q);
        const matchLecturer = exam.lecturer.toLowerCase().includes(q);
        const matchFaculty = exam.faculty.toLowerCase().includes(q);
        const matchMajor = exam.major.toLowerCase().includes(q);
        const matchDate = exam.examDateThai.toLowerCase().includes(q);
        const matchNotes = (exam.notes || '').toLowerCase().includes(q);
        const matchRoom = (exam.room || '').toLowerCase().includes(q);
        if (!matchCode && !matchName && !matchLecturer && !matchFaculty && !matchMajor && !matchDate && !matchNotes && !matchRoom) {
          return false;
        }
      }

      // Year
      if (filterYear !== 'all' && exam.yearLevel !== filterYear) {
        return false;
      }

      // Status
      if (filterStatus !== 'all' && exam.status !== filterStatus) {
        return false;
      }

      // Faculty
      if (filterFaculty !== 'all' && exam.faculty !== filterFaculty) {
        return false;
      }

      // Date
      if (filterDate !== 'all' && exam.examDateThai !== filterDate) {
        return false;
      }

      return true;
    }).sort((a, b) => {
      let comparison = 0;
      if (sortKey === 'orderNo') {
        comparison = a.orderNo - b.orderNo;
      } else if (sortKey === 'yearLevel') {
        comparison = a.yearLevel - b.yearLevel;
      } else if (sortKey === 'courseCode') {
        comparison = a.courseCode.localeCompare(b.courseCode);
      } else if (sortKey === 'examDateISO') {
        comparison = (a.examDateISO + a.startTime).localeCompare(b.examDateISO + b.startTime);
      }
      return sortAsc ? comparison : -comparison;
    });
  }, [exams, searchQuery, filterYear, filterStatus, filterFaculty, filterDate, sortKey, sortAsc]);

  // Next upcoming exam overall
  const nextUpcomingExam = useMemo(() => {
    if (exams.length === 0) return null;
    const sorted = [...exams].sort((a, b) => {
      return (a.examDateISO + a.startTime).localeCompare(b.examDateISO + b.startTime);
    });
    return sorted[0];
  }, [exams]);

  // Handlers
  const handleToggleSave = (id: string) => {
    setSavedExamIds(prev => 
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const handleClearAllSaved = () => {
    if (window.confirm('ต้องการล้างวิชาที่บันทึกไว้ทั้งหมดหรือไม่?')) {
      setSavedExamIds([]);
    }
  };

  const handleBatchSaveByYear = (year: number, status: 'บรรพชิต' | 'คฤหัสถ์') => {
    const matchingIds = exams
      .filter(e => e.yearLevel === year && (e.status === status || e.status === 'ทั่วไป'))
      .map(e => e.id);
    
    setSavedExamIds(prev => Array.from(new Set([...prev, ...matchingIds])));
  };

  const handleResetFilters = () => {
    setFilterYear('all');
    setFilterStatus('all');
    setFilterFaculty('all');
    setFilterDate('all');
    setSearchQuery('');
  };

  const handleEditExam = (exam: ExamItem) => {
    if (!currentUser) {
      navigateToLogin();
      return;
    }
    navigateToEditExam(exam);
  };

  const handleAddNewExam = () => {
    if (!currentUser) {
      navigateToLogin();
      return;
    }
    const newOrderNo = exams.length > 0 ? Math.max(...exams.map(e => e.orderNo)) + 1 : 1;
    const newExam: ExamItem = {
      id: `exam-${Date.now()}`,
      orderNo: newOrderNo,
      yearLevel: 1,
      faculty: 'พุทธศาสตร์',
      major: 'สาขาวิชาพระพุทธศาสนา',
      examDateThai: '5 ตุลาคม 2569',
      examDateISO: '2026-10-05',
      examTimeThai: '09.00 - 11.30 น.',
      startTime: '09:00',
      endTime: '11:30',
      courseCode: '',
      courseName: '',
      lecturer: currentUser.name,
      notes: '',
      status: 'บรรพชิต',
      room: 'ห้องประชุมชั้น 1',
      examType: 'onsite'
    };
    navigateToEditExam(newExam);
  };

  const handleSaveExam = async (updatedExam: ExamItem, shouldBroadcastLine: boolean) => {
    const exists = exams.some(e => e.id === updatedExam.id);
    let newExams: ExamItem[];
    if (exists) {
      newExams = exams.map(e => (e.id === updatedExam.id ? updatedExam : e));
    } else {
      newExams = [updatedExam, ...exams];
    }
    setExams(newExams);

    if (shouldBroadcastLine) {
      const msg = formatLineNotifyMessage(updatedExam, 'อัปเดตกำหนดการสอบล่าสุด');
      await sendLineNotifyNotification(msg, settings.lineNotifyToken, settings.webhookUrl);
      sendBrowserNotification('อัปเดตตารางสอบแล้ว!', `วิชา: ${updatedExam.courseName} (${updatedExam.courseCode})`);
    }
  };

  const handleDeleteExam = (id: string) => {
    setExams(prev => prev.filter(e => e.id !== id));
    setSavedExamIds(prev => prev.filter(x => x !== id));
  };

  const handleResetToDefault = () => {
    const cleanData = RAW_EXAMS_DATA.map(item => ({
      ...item,
      room: 'ห้องประชุมชั้น 1',
      examSubmissionStatus: undefined,
      examSubmissionDate: undefined,
      examLink: undefined,
      examFileName: undefined
    }));
    setExams(cleanData);
    localStorage.removeItem(STORAGE_KEY_EXAMS);
  };

  const handleExportExcel = () => {
    exportExamsToExcel(exams, 'mcu-exam-schedule-2569', 'ตารางสอบทั้งหมด');
  };

  const handleExportCSV = () => {
    const headers = [
      'ชั้นปี', 'คณะ', 'สาขาวิชา', 'วันสอบ', 'เวลาสอบ', 
      'รหัสวิชา', 'รายวิชา', 'อาจารย์ผู้บรรยาย', 'หมายเหตุ', 'สถานะ', 'ห้องสอบ'
    ];
    const rows = exams.map(e => [
      e.yearLevel,
      `"${e.faculty}"`,
      `"${e.major}"`,
      `"${e.examDateThai}"`,
      `"${e.examTimeThai}"`,
      `"${e.courseCode}"`,
      `"${e.courseName.replace(/"/g, '""')}"`,
      `"${e.lecturer.replace(/"/g, '""')}"`,
      `"${e.notes.replace(/"/g, '""')}"`,
      `"${e.status}"`,
      `"${(e.room || 'ห้องประชุมชั้น 1').replace(/"/g, '""')}"`
    ]);

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map(r => r.join(','))].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `mcu-exam-schedule-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImportJSON = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setExams(parsed);
          alert(`นำเข้าข้อมูลตารางสอบ ${parsed.length} รายการสำเร็จ!`);
        } else {
          alert('รูปแบบไฟล์ JSON ไม่ถูกต้อง');
        }
      } catch (err) {
        alert('เกิดข้อผิดพลาดในการอ่านไฟล์: ' + (err as Error).message);
      }
    };
    reader.readAsText(file);
  };

  const handlePrint = (customScope?: any) => {
    let resolvedScope: 'all' | 'teacher' | 'saved' = 'all';
    if (typeof customScope === 'string' && ['all', 'teacher', 'saved'].includes(customScope)) {
      resolvedScope = customScope as 'all' | 'teacher' | 'saved';
    } else {
      resolvedScope = (currentUser && currentUser.role !== 'admin' && currentTab === 'teacher')
        ? 'teacher'
        : (currentTab === 'my-schedule' ? 'saved' : 'all');
    }

    if (resolvedScope === 'teacher' && currentUser) {
      const teacherCourses = exams.filter(e => isLecturerMatch(e.lecturer, currentUser));
      setPrintTargetExams(teacherCourses);
      setPrintSubtitle(`ใบแจ้งกำหนดการสอบไล่รายวิชา (อาจารย์ผู้บรรยาย: ${currentUser.name}) ประจำปีการศึกษา 2569`);
      setPrintSignatoryTeacher(currentUser.name);
    } else if (resolvedScope === 'saved') {
      const savedCourses = exams.filter(e => savedExamIds.includes(e.id));
      setPrintTargetExams(savedCourses);
      setPrintSubtitle('ใบแจ้งกำหนดการสอบไล่รายบุคคล (วิชาที่บันทึกไว้) ประจำปีการศึกษา 2569');
      setPrintSignatoryTeacher(undefined);
    } else {
      setPrintTargetExams(filteredExams.length > 0 ? filteredExams : exams);
      setPrintSubtitle('ตารางสอบไล่ ประจำภาคการศึกษาที่ 1 ปีการศึกษา 2569');
      setPrintSignatoryTeacher(undefined);
    }

    navigateToPrintSetup(resolvedScope);
  };

  const handlePrintSingleExamSlip = (exam: ExamItem) => {
    setPrintTargetExams([exam]);
    setPrintSubtitle(`ใบแจ้งกำหนดการสอบไล่รายวิชา (อาจารย์ผู้บรรยาย: ${exam.lecturer}) ประจำปีการศึกษา 2569`);
    setPrintSignatoryTeacher(exam.lecturer);
    navigateToPrintSetup('teacher');
  };

  const handleOpenAlertForExam = () => {
    if (!currentUser) {
      navigateToLogin();
      return;
    }
    setCurrentTab('alerts');
  };

  // Redirect to public schedule if public visitor lands on teacher-only tabs
  useEffect(() => {
    if (!currentUser && ['my-schedule', 'teacher', 'alerts', 'cloud'].includes(currentTab)) {
      setCurrentTab('schedule');
    }
  }, [currentUser, currentTab]);

  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem(STORAGE_KEY_USER);
    if (['my-schedule', 'teacher', 'alerts', 'cloud'].includes(currentTab)) {
      setCurrentTab('schedule');
    }
  };

  const handleNavigateFromDashboardToSchedule = (
    facultyFilter?: string, 
    yearFilter?: number | 'all', 
    dateFilter?: string,
    searchFilter?: string
  ) => {
    if (facultyFilter) {
      setFilterFaculty(facultyFilter);
    }
    if (yearFilter !== undefined) {
      setFilterYear(yearFilter);
    }
    if (dateFilter) {
      setFilterDate(dateFilter);
    }
    if (searchFilter !== undefined) {
      setSearchQuery(searchFilter);
    }
    setCurrentTab('schedule');
  };

  return (
    <div className="min-h-screen bg-[#FFF8FA] text-slate-800 flex flex-col selection:bg-rose-200 selection:text-rose-950">
      {/* Top Navigation */}
      <Navbar
        currentTab={currentTab}
        setCurrentTab={(tab) => {
          setSubPageView(null);
          setCurrentTab(tab);
          window.location.hash = tab;
        }}
        currentUser={currentUser}
        onOpenLogin={navigateToLogin}
        onLogout={handleLogout}
        savedCount={
          currentUser && currentUser.role !== 'admin'
            ? exams.filter(e => isLecturerMatch(e.lecturer, currentUser)).length
            : savedExamIds.length
        }
        totalExamsCount={exams.length}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        onPrint={() => navigateToPrintSetup('all')}
        onExportExcel={handleExportExcel}
        isWidescreen={isWidescreen}
        onToggleWidescreen={handleToggleWidescreen}
        onNavigateToFolderUpload={navigateToFolderUpload}
      />

      {/* Main Container */}
      <main className="flex-1 pb-24 md:pb-16">
        {subPageView ? (
          <div className={`${isWidescreen ? 'max-w-[98%] 2xl:max-w-[1720px]' : 'max-w-7xl'} mx-auto px-3 sm:px-4 md:px-6 py-4 sm:py-6`}>
            {subPageView.type === 'course-detail' && (() => {
              const exam = exams.find(e => e.id === subPageView.examId);
              if (!exam) return null;
              return (
                <CourseDetailPage
                  exam={exam}
                  currentUser={currentUser}
                  onBack={handleBackFromSubPage}
                  onNavigateToUpload={(targetExam) => navigateToUploadDrive(targetExam)}
                  onNavigateToEdit={(targetExam) => navigateToEditExam(targetExam)}
                  onNavigateToLogin={navigateToLogin}
                  onPrintSlip={handlePrintSingleExamSlip}
                  centralDriveFolderUrl={centralDriveFolderUrl}
                />
              );
            })()}

            {subPageView.type === 'pending-exams' && (
              <PendingExamsPage
                exams={exams}
                initialMode={subPageView.mode}
                onBack={handleBackFromSubPage}
                onNavigateToSchedule={handleNavigateFromDashboardToSchedule}
                onViewExamDetails={(targetExam) => navigateToCourseDetail(targetExam)}
              />
            )}

            {subPageView.type === 'upload-drive' && (() => {
              const exam = exams.find(e => e.id === subPageView.examId);
              if (!exam) return null;
              return (
                <ExamUploadDrivePage
                  exam={exam}
                  currentUser={currentUser}
                  centralDriveFolderUrl={centralDriveFolderUrl}
                  webhookUrl={settings.webhookUrl}
                  onBack={handleBackFromSubPage}
                  onUploadSuccess={(examId, fileUrl, uploadedDate) => {
                    handleUploadExamSuccess(examId, fileUrl, uploadedDate);
                  }}
                />
              );
            })()}

            {subPageView.type === 'folder-upload' && (
              <BatchFolderUploadPage
                exams={exams}
                currentUser={currentUser}
                centralDriveFolderUrl={centralDriveFolderUrl}
                webhookUrl={settings.webhookUrl}
                onBack={handleBackFromSubPage}
                onBatchUploadSuccess={(updates) => {
                  handleBatchUploadSuccess(updates);
                }}
              />
            )}

            {subPageView.type === 'teacher-login' && (
              <TeacherLoginPage
                exams={exams}
                onBack={handleBackFromSubPage}
                onLoginSuccess={(user) => {
                  setCurrentUser(user);
                  setCurrentTab('teacher');
                  setSubPageView(null);
                }}
              />
            )}

            {subPageView.type === 'edit-exam' && (() => {
              const exam = exams.find(e => e.id === subPageView.examId);
              if (!exam) return null;
              return (
                <ExamEditPage
                  exam={exam}
                  currentUser={currentUser}
                  onBack={handleBackFromSubPage}
                  onSave={handleSaveExam}
                />
              );
            })()}

            {subPageView.type === 'print-setup' && (
              <PrintSetupPage
                exams={exams}
                currentUser={currentUser}
                savedExamIds={savedExamIds}
                initialScope={subPageView.scope}
                onBack={handleBackFromSubPage}
                onSyncPrintExams={handleSyncPrintExams}
              />
            )}
          </div>
        ) : (
          <>
            {/* TAB 0: DASHBOARD (ภาพรวมสถิติการสอบด้วยกราฟ Data Visualization) */}
            {currentTab === 'dashboard' && (
              <Dashboard
                exams={exams}
                onNavigateToSchedule={handleNavigateFromDashboardToSchedule}
                onNavigateToCalendar={() => { setSubPageView(null); setCurrentTab('calendar'); }}
                onOpenPrintModal={() => navigateToPrintSetup('all')}
                onViewExamDetails={(exam) => navigateToCourseDetail(exam)}
                onOpenPendingExams={(mode) => navigateToPendingExams(mode)}
                isWidescreen={isWidescreen}
              />
            )}

            {/* TAB 1: FULL SCHEDULE (100% CLEAN TABLE FORMAT) */}
            {currentTab === 'schedule' && (
              <div className={`${isWidescreen ? 'max-w-[98%] 2xl:max-w-[1720px]' : 'max-w-7xl'} mx-auto px-2 sm:px-4 md:px-6 py-4 sm:py-5 space-y-4`}>
                <OfficialTableView
                  exams={filteredExams}
                  savedExamIds={savedExamIds}
                  onToggleSave={handleToggleSave}
                  currentUser={currentUser}
                  onAddNewExam={handleAddNewExam}
                  onEditExam={handleEditExam}
                  onOpenAlertForExam={handleOpenAlertForExam}
                  onViewExamDetails={(exam) => navigateToCourseDetail(exam)}
                  filterYear={filterYear}
                  setFilterYear={setFilterYear}
                  filterStatus={filterStatus}
                  setFilterStatus={setFilterStatus}
                  filterFaculty={filterFaculty}
                  setFilterFaculty={setFilterFaculty}
                  filterDate={filterDate}
                  setFilterDate={setFilterDate}
                  distinctFaculties={distinctFaculties}
                  distinctDates={distinctDates}
                  sortKey={sortKey}
                  setSortKey={setSortKey}
                  sortAsc={sortAsc}
                  setSortAsc={setSortAsc}
                  onResetFilters={handleResetFilters}
                  onExportExcel={handleExportExcel}
                  onPrint={() => navigateToPrintSetup('all')}
                  isWidescreen={isWidescreen}
                  onToggleWidescreen={handleToggleWidescreen}
                />
              </div>
            )}

            {/* TAB 2: MY SCHEDULE (เฉพาะอาจารย์ผู้สอนที่เข้าสู่ระบบเท่านั้น) */}
            {currentTab === 'my-schedule' && (
              currentUser ? (
                <MyScheduleView
                  exams={exams}
                  savedExamIds={savedExamIds}
                  onToggleSave={handleToggleSave}
                  onClearAllSaved={handleClearAllSaved}
                  onBatchSaveByYear={handleBatchSaveByYear}
                  onPrint={() => navigateToPrintSetup('teacher')}
                  onOpenAlertForExam={handleOpenAlertForExam}
                  isWidescreen={isWidescreen}
                  currentUser={currentUser}
                  centralDriveFolderUrl={centralDriveFolderUrl}
                  onToggleSubmissionStatus={handleToggleExamSubmission}
                  webhookUrl={settings.webhookUrl}
                  onUploadExamSuccess={handleUploadExamSuccess}
                  onViewExamDetails={(exam) => navigateToCourseDetail(exam)}
                />
              ) : (
                <div className="max-w-md mx-auto my-12 p-8 bg-white rounded-2xl border border-[#F8D7E3] text-center space-y-4 shadow-xs">
                  <div className="w-12 h-12 rounded-2xl bg-[#FFF0F5] text-[#9D174D] flex items-center justify-center mx-auto border border-[#F8D7E3]">
                    <Lock className="w-6 h-6" />
                  </div>
                  <h3 className="font-bold text-base text-slate-800">เฉพาะอาจารย์ผู้สอนเท่านั้น</h3>
                  <p className="text-xs text-[#854D67]">
                    เมนู "วิชาข้อสอบของฉัน" เปิดให้ใช้งานเฉพาะอาจารย์ผู้สอนที่เข้าสู่ระบบแล้วเท่านั้น
                  </p>
                  <button
                    onClick={navigateToLogin}
                    className="px-5 py-2.5 bg-[#9D174D] hover:bg-[#831843] text-white text-xs font-semibold rounded-xl shadow-xs transition cursor-pointer"
                  >
                    เข้าสู่ระบบอาจารย์
                  </button>
                </div>
              )
            )}

            {/* TAB 3: CALENDAR VIEW (TABLE FORMAT BY DATE - สาธารณะ) */}
            {currentTab === 'calendar' && (
              <CalendarView
                exams={exams}
                savedExamIds={savedExamIds}
                onToggleSave={handleToggleSave}
                currentUser={currentUser}
                onEditExam={handleEditExam}
                onOpenAlertForExam={handleOpenAlertForExam}
                isWidescreen={isWidescreen}
              />
            )}

            {/* TAB 4: TEACHER PORTAL (เฉพาะอาจารย์ผู้สอนที่เข้าสู่ระบบเท่านั้น) */}
            {currentTab === 'teacher' && (
              currentUser ? (
                <TeacherPortal
                  currentUser={currentUser}
                  onOpenLogin={navigateToLogin}
                  exams={exams}
                  onAddNewExam={handleAddNewExam}
                  onEditExam={handleEditExam}
                  onDeleteExam={handleDeleteExam}
                  onResetToDefault={handleResetToDefault}
                  onExportCSV={handleExportCSV}
                  onExportExcel={handleExportExcel}
                  onPrint={() => navigateToPrintSetup('teacher')}
                  onImportJSON={handleImportJSON}
                  lineNotifyToken={settings.lineNotifyToken}
                  webhookUrl={settings.webhookUrl}
                  isWidescreen={isWidescreen}
                  centralDriveFolderUrl={centralDriveFolderUrl}
                  onUpdateCentralDriveFolder={handleUpdateCentralDriveFolder}
                  onToggleSubmissionStatus={handleToggleExamSubmission}
                  onUploadExamSuccess={handleUploadExamSuccess}
                  onBatchUploadSuccess={handleBatchUploadSuccess}
                  onViewExamDetails={(exam) => navigateToCourseDetail(exam)}
                  onNavigateToFolderUpload={navigateToFolderUpload}
                />
              ) : (
                <div className="max-w-md mx-auto my-12 p-8 bg-white rounded-2xl border border-[#F8D7E3] text-center space-y-4 shadow-xs">
                  <div className="w-12 h-12 rounded-2xl bg-[#FFF0F5] text-[#9D174D] flex items-center justify-center mx-auto border border-[#F8D7E3]">
                    <Lock className="w-6 h-6" />
                  </div>
                  <h3 className="font-bold text-base text-slate-800">เฉพาะอาจารย์ผู้สอนเท่านั้น</h3>
                  <p className="text-xs text-[#854D67]">
                    กรุณาเข้าสู่ระบบด้วยรหัสอาจารย์เพื่อเข้าใช้งานระบบจัดการสอบ
                  </p>
                  <button
                    onClick={navigateToLogin}
                    className="px-5 py-2.5 bg-[#9D174D] hover:bg-[#831843] text-white text-xs font-semibold rounded-xl shadow-xs transition cursor-pointer"
                  >
                    เข้าสู่ระบบอาจารย์
                  </button>
                </div>
              )
            )}

            {/* TAB 5: ALERTS & LINE NOTIFY */}
            {currentTab === 'alerts' && (
              currentUser ? (
                <AlertCenter
                  exams={exams}
                  savedExamIds={savedExamIds}
                  settings={settings}
                  onUpdateSettings={setSettings}
                  nextUpcomingExam={nextUpcomingExam}
                  currentUser={currentUser}
                />
              ) : (
                <div className="max-w-md mx-auto my-12 p-8 bg-white rounded-2xl border border-[#F8D7E3] text-center space-y-4 shadow-xs">
                  <div className="w-12 h-12 rounded-2xl bg-[#FFF0F5] text-[#9D174D] flex items-center justify-center mx-auto border border-[#F8D7E3]">
                    <Lock className="w-6 h-6" />
                  </div>
                  <h3 className="font-bold text-base text-slate-800">เฉพาะอาจารย์ผู้สอนเท่านั้น</h3>
                  <p className="text-xs text-[#854D67]">
                    ระบบส่งการแจ้งเตือน & LINE Notify สงวนสิทธิ์สำหรับอาจารย์ผู้สอน
                  </p>
                  <button
                    onClick={navigateToLogin}
                    className="px-5 py-2.5 bg-[#9D174D] hover:bg-[#831843] text-white text-xs font-semibold rounded-xl shadow-xs transition cursor-pointer"
                  >
                    เข้าสู่ระบบอาจารย์
                  </button>
                </div>
              )
            )}

            {/* TAB 6: APPS SCRIPT & FIREBASE */}
            {currentTab === 'cloud' && (
              currentUser ? (
                <AppsScriptView
                  exams={exams}
                  webhookUrl={settings.webhookUrl}
                  onUpdateWebhookUrl={(url) => setSettings({ ...settings, webhookUrl: url })}
                  lineToken={settings.lineNotifyToken}
                  onUpdateLineToken={(token) => setSettings({ ...settings, lineNotifyToken: token })}
                />
              ) : (
                <div className="max-w-md mx-auto my-12 p-8 bg-white rounded-2xl border border-[#F8D7E3] text-center space-y-4 shadow-xs">
                  <div className="w-12 h-12 rounded-2xl bg-[#FFF0F5] text-[#9D174D] flex items-center justify-center mx-auto border border-[#F8D7E3]">
                    <Lock className="w-6 h-6" />
                  </div>
                  <h3 className="font-bold text-base text-slate-800">เฉพาะอาจารย์และผู้ดูแลระบบเท่านั้น</h3>
                  <p className="text-xs text-[#854D67]">
                    การตั้งค่า Apps Script & Firebase เปิดให้ใช้งานเฉพาะผู้มีสิทธิ์ดูแลระบบ
                  </p>
                  <button
                    onClick={navigateToLogin}
                    className="px-5 py-2.5 bg-[#9D174D] hover:bg-[#831843] text-white text-xs font-semibold rounded-xl shadow-xs transition cursor-pointer"
                  >
                    เข้าสู่ระบบอาจารย์
                  </button>
                </div>
              )
            )}
          </>
        )}
      </main>

      {/* Footer */}
      <footer className="no-print bg-white border-t border-[#F8D7E3] py-5 pb-24 md:pb-5 text-xs text-[#854D67] text-center">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p>© 2569 วิทยาลัยสงฆ์พ่อขุนผาเมือง เพชรบูรณ์ · มหาวิทยาลัยมหาจุฬาลงกรณราชวิทยาลัย (MCU Exam Timetable Portal)</p>
          <div className="flex items-center gap-4 flex-wrap justify-center">
            <button onClick={() => { setSubPageView(null); setCurrentTab('schedule'); }} className="hover:text-[#701A4B] transition">
              ตารางสอบทั้งหมด
            </button>
            <span>·</span>
            <button onClick={() => { setSubPageView(null); setCurrentTab('calendar'); }} className="hover:text-[#701A4B] transition">
              ปฏิทินสอบตามวัน
            </button>
            {currentUser ? (
              <>
                <span>·</span>
                <button onClick={() => { setSubPageView(null); setCurrentTab('teacher'); }} className="hover:text-[#701A4B] transition font-semibold text-[#701A4B]">
                  จัดการสอบ (อาจารย์)
                </button>
                <span>·</span>
                <button onClick={() => { setSubPageView(null); setCurrentTab('alerts'); }} className="hover:text-[#701A4B] transition">
                  LINE Notify
                </button>
                <span>·</span>
                <button onClick={() => { setSubPageView(null); setCurrentTab('cloud'); }} className="hover:text-[#701A4B] transition">
                  Apps Script & Cloud
                </button>
              </>
            ) : (
              <>
                <span>·</span>
                <button onClick={navigateToLogin} className="hover:text-[#701A4B] transition font-semibold text-[#9D174D] flex items-center gap-1 cursor-pointer">
                  <Lock className="w-3 h-3" />
                  <span>เข้าสู่ระบบสำหรับอาจารย์</span>
                </button>
              </>
            )}
            <span>·</span>
            <button onClick={handleExportExcel} className="hover:text-emerald-700 transition flex items-center gap-1 font-semibold text-emerald-800 cursor-pointer">
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
              <span>ส่งออก Excel (.xlsx)</span>
            </button>
            <span>·</span>
            <button onClick={() => navigateToPrintSetup('all')} className="hover:text-[#701A4B] transition flex items-center gap-1 font-semibold cursor-pointer">
              <Printer className="w-3.5 h-3.5 text-[#9D174D]" />
              <span>พิมพ์ตารางสอบทางการ (A4)</span>
            </button>
          </div>
        </div>
      </footer>

      {/* Root Academic Examination Sheet for A4 paper and PDF printing */}
      <div id="official-print-section" className="hidden print-only">
        <OfficialPrintSheet
          exams={printTargetExams.length > 0 ? printTargetExams : (filteredExams.length > 0 ? filteredExams : exams)}
          title="มหาวิทยาลัยมหาจุฬาลงกรณราชวิทยาลัย (MCU)"
          college="วิทยาลัยสงฆ์พ่อขุนผาเมือง เพชรบูรณ์"
          subtitle={printSubtitle}
          signatoryTeacher={printSignatoryTeacher}
        />
      </div>
    </div>
  );
}
