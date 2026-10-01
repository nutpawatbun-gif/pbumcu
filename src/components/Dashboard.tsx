import React, { useMemo, useState, useRef, useEffect } from 'react';
import Chart, { ChartConfiguration } from 'chart.js/auto';
import {
  BookOpen,
  Calendar,
  CheckCircle2,
  Clock,
  GraduationCap,
  Users,
  Building2,
  ArrowRight,
  Printer,
  Sparkles,
  Layers,
  FileCheck2,
  Info
} from 'lucide-react';
import { ExamItem } from '../types/exam';
import { PendingExamsModal } from './PendingExamsModal';

// Reusable Chart canvas that destroys and recreates cleanly without React 19 hook mismatches
interface ChartCanvasProps {
  config: ChartConfiguration;
}

const ChartCanvas: React.FC<ChartCanvasProps> = ({ config }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const chartInstanceRef = useRef<Chart | null>(null);

  useEffect(() => {
    if (!canvasRef.current) return;

    if (chartInstanceRef.current) {
      chartInstanceRef.current.destroy();
      chartInstanceRef.current = null;
    }

    const ctx = canvasRef.current.getContext('2d');
    if (ctx) {
      chartInstanceRef.current = new Chart(ctx, config);
    }

    return () => {
      if (chartInstanceRef.current) {
        chartInstanceRef.current.destroy();
        chartInstanceRef.current = null;
      }
    };
  }, [config]);

  return <canvas ref={canvasRef} className="w-full h-full" />;
};

interface DashboardProps {
  exams: ExamItem[];
  onNavigateToSchedule: (facultyFilter?: string, yearFilter?: number | 'all', dateFilter?: string, searchFilter?: string) => void;
  onNavigateToCalendar: () => void;
  onOpenPrintModal: () => void;
  onViewExamDetails?: (exam: ExamItem) => void;
  isWidescreen?: boolean;
}

export const Dashboard: React.FC<DashboardProps> = ({
  exams,
  onNavigateToSchedule,
  onNavigateToCalendar,
  onOpenPrintModal,
  onViewExamDetails,
  isWidescreen = false
}) => {
  // Mode for exam progress calculation:
  // 'submission': by exam paper submission status
  // 'simulation': simulation to preview progress during exam days
  // 'realtime': by real clock
  const [progressMode, setProgressMode] = useState<'submission' | 'simulation' | 'realtime'>('submission');

  // Modal to inspect courses (รอข้อสอบ / พร้อมสอบ)
  const [pendingModalOpen, setPendingModalOpen] = useState(false);
  const [pendingModalMode, setPendingModalMode] = useState<'pending' | 'submitted' | 'all'>('pending');

  // Basic Metrics
  const totalExams = exams.length;

  // Distinct Lecturers
  const distinctLecturers = useMemo(() => {
    const set = new Set<string>();
    exams.forEach(e => {
      if (e.lecturer && e.lecturer.trim()) {
        const parts = e.lecturer.split(/[\/,]/);
        parts.forEach(p => {
          const trimmed = p.trim();
          if (trimmed) set.add(trimmed);
        });
      }
    });
    return Array.from(set);
  }, [exams]);

  // Distinct Faculties
  const facultyStats = useMemo(() => {
    const map = new Map<string, number>();
    exams.forEach(e => {
      const f = e.faculty || 'ไม่ระบุคณะ';
      map.set(f, (map.get(f) || 0) + 1);
    });
    return Array.from(map.entries()).sort((a, b) => b[1] - a[1]);
  }, [exams]);

  // Year Level Stats
  const yearStats = useMemo(() => {
    const counts: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0 };
    exams.forEach(e => {
      if (counts[e.yearLevel] !== undefined) {
        counts[e.yearLevel]++;
      }
    });
    return counts;
  }, [exams]);

  // Daily Stats
  const dailyStats = useMemo(() => {
    const map = new Map<string, { total: number; morning: number; afternoon: number; dateISO: string }>();
    exams.forEach(e => {
      const d = e.examDateThai || 'ไม่ระบุวัน';
      const current = map.get(d) || { total: 0, morning: 0, afternoon: 0, dateISO: e.examDateISO || '' };
      current.total += 1;
      const hour = parseInt(e.startTime.split(':')[0] || '0', 10);
      if (hour < 12) {
        current.morning += 1;
      } else {
        current.afternoon += 1;
      }
      map.set(d, current);
    });
    return Array.from(map.entries()).sort((a, b) => a[1].dateISO.localeCompare(b[1].dateISO));
  }, [exams]);

  // Exam Status Breakdown (Real-time vs Submission vs Simulation)
  const statusCounts = useMemo(() => {
    if (progressMode === 'submission') {
      const submitted = exams.filter(e => e.examSubmissionStatus === 'submitted').length;
      const pending = totalExams - submitted;
      return {
        completed: submitted,
        inProgress: 0,
        upcoming: pending,
        labelCompleted: 'พร้อมสอบ',
        labelInProgress: 'กำลังสอบ',
        labelUpcoming: 'รอข้อสอบ'
      };
    }

    if (progressMode === 'simulation') {
      const simCompleted = Math.round(totalExams * 0.46);
      const simInProgress = Math.min(6, totalExams - simCompleted);
      const simUpcoming = Math.max(0, totalExams - simCompleted - simInProgress);
      return {
        completed: simCompleted,
        inProgress: simInProgress,
        upcoming: simUpcoming,
        labelCompleted: 'จัดสอบเสร็จสิ้นแล้ว',
        labelInProgress: 'กำลังดำเนินการสอบ',
        labelUpcoming: 'รอจัดสอบ'
      };
    }

    // Real-time calculation based on system clock
    const now = new Date();
    let completed = 0;
    let inProgress = 0;
    let upcoming = 0;

    exams.forEach(e => {
      if (!e.examDateISO) {
        upcoming++;
        return;
      }
      const start = new Date(`${e.examDateISO}T${e.startTime || '08:00'}:00`);
      const end = new Date(`${e.examDateISO}T${e.endTime || '18:00'}:00`);
      if (now > end) {
        completed++;
      } else if (now >= start && now <= end) {
        inProgress++;
      } else {
        upcoming++;
      }
    });

    return {
      completed,
      inProgress,
      upcoming,
      labelCompleted: 'จัดสอบเสร็จสิ้นแล้ว',
      labelInProgress: 'กำลังดำเนินการสอบ',
      labelUpcoming: 'รอจัดสอบ'
    };
  }, [exams, totalExams, progressMode]);

  // Student Category (บรรพชิต vs คฤหัสถ์)
  const studentTypeCounts = useMemo(() => {
    let monk = 0;
    let layperson = 0;
    exams.forEach(e => {
      if (e.status === 'บรรพชิต') monk++;
      else layperson++;
    });
    return { monk, layperson };
  }, [exams]);

  // Completion Percentage
  const completionPercent = totalExams > 0 ? Math.round((statusCounts.completed / totalExams) * 100) : 0;

  // Chart 1: Faculty Bar Chart Configuration
  const facultyChartConfig = useMemo<ChartConfiguration>(() => {
    const labels = facultyStats.map(([f]) => f);
    const data = facultyStats.map(([, count]) => count);

    const backgroundColors = [
      'rgba(157, 23, 77, 0.85)',
      'rgba(225, 29, 72, 0.75)',
      'rgba(234, 88, 12, 0.8)',
      'rgba(2, 132, 199, 0.75)',
      'rgba(16, 185, 129, 0.75)',
      'rgba(139, 92, 246, 0.75)',
    ];

    const borderColors = [
      '#9D174D',
      '#E11D48',
      '#EA580C',
      '#0284C7',
      '#10B981',
      '#8B5CF6',
    ];

    return {
      type: 'bar',
      data: {
        labels,
        datasets: [
          {
            label: 'จำนวนวิชา (รายวิชา)',
            data,
            backgroundColor: backgroundColors.slice(0, labels.length),
            borderColor: borderColors.slice(0, labels.length),
            borderWidth: 1.5,
            borderRadius: 8,
            borderSkipped: false,
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              label: (context: any) => ` ${context.raw} รายวิชา (${Math.round((context.raw / (totalExams || 1)) * 100)}%)`
            }
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              precision: 0,
              font: { family: 'inherit', size: 11 }
            },
            grid: {
              color: 'rgba(248, 215, 227, 0.4)'
            }
          },
          x: {
            ticks: {
              font: { family: 'inherit', size: 11, weight: 'bold' }
            },
            grid: { display: false }
          }
        }
      }
    };
  }, [facultyStats, totalExams]);

  // Chart 2: Status Doughnut Chart Configuration
  const statusChartConfig = useMemo<ChartConfiguration>(() => {
    const labels = [statusCounts.labelCompleted, statusCounts.labelInProgress, statusCounts.labelUpcoming].filter((_, idx) => {
      if (idx === 1 && statusCounts.inProgress === 0) return false;
      return true;
    });

    const data = [statusCounts.completed, statusCounts.inProgress, statusCounts.upcoming].filter((_, idx) => {
      if (idx === 1 && statusCounts.inProgress === 0) return false;
      return true;
    });

    return {
      type: 'doughnut',
      data: {
        labels,
        datasets: [
          {
            data,
            backgroundColor: ['#10B981', '#F59E0B', '#E2E8F0'],
            borderColor: ['#059669', '#D97706', '#CBD5E1'],
            borderWidth: 2,
            hoverOffset: 6
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '72%',
        plugins: {
          legend: {
            position: 'bottom',
            labels: {
              boxWidth: 12,
              padding: 14,
              font: { family: 'inherit', size: 12 }
            }
          },
          tooltip: {
            callbacks: {
              label: (context: any) => ` ${context.label}: ${context.raw} วิชา`
            }
          }
        }
      }
    };
  }, [statusCounts]);

  // Chart 3: Daily Timeline Area Chart Configuration
  const dailyChartConfig = useMemo<ChartConfiguration>(() => {
    const labels = dailyStats.map(([date]) => date.replace('ตุลาคม', 'ต.ค.'));
    const morningData = dailyStats.map(([, data]) => data.morning);
    const afternoonData = dailyStats.map(([, data]) => data.afternoon);

    return {
      type: 'line',
      data: {
        labels,
        datasets: [
          {
            label: 'ช่วงเช้า (ก่อน 12.00 น.)',
            data: morningData,
            borderColor: '#9D174D',
            backgroundColor: 'rgba(157, 23, 77, 0.15)',
            fill: true,
            tension: 0.35,
            pointBackgroundColor: '#9D174D',
            pointBorderColor: '#ffffff',
            pointBorderWidth: 2,
            pointRadius: 4,
          },
          {
            label: 'ช่วงบ่าย (12.30 น. เป็นต้นไป)',
            data: afternoonData,
            borderColor: '#E11D48',
            backgroundColor: 'rgba(225, 29, 72, 0.1)',
            fill: true,
            tension: 0.35,
            pointBackgroundColor: '#E11D48',
            pointBorderColor: '#ffffff',
            pointBorderWidth: 2,
            pointRadius: 4,
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'top',
            labels: {
              boxWidth: 12,
              font: { family: 'inherit', size: 11 }
            }
          },
          tooltip: {
            callbacks: {
              label: (context: any) => ` ${context.dataset.label}: ${context.raw} รายวิชา`
            }
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              precision: 0,
              font: { family: 'inherit', size: 11 }
            },
            grid: {
              color: 'rgba(248, 215, 227, 0.4)'
            }
          },
          x: {
            ticks: {
              font: { family: 'inherit', size: 11, weight: 'bold' }
            },
            grid: { display: false }
          }
        }
      }
    };
  }, [dailyStats]);

  // Chart 4: Year Level Bar Chart Configuration
  const yearChartConfig = useMemo<ChartConfiguration>(() => {
    return {
      type: 'bar',
      data: {
        labels: ['ชั้นปีที่ 1', 'ชั้นปีที่ 2', 'ชั้นปีที่ 3', 'ชั้นปีที่ 4'],
        datasets: [
          {
            label: 'จำนวนวิชาสอบ',
            data: [yearStats[1] || 0, yearStats[2] || 0, yearStats[3] || 0, yearStats[4] || 0],
            backgroundColor: [
              'rgba(244, 63, 94, 0.8)',
              'rgba(234, 88, 12, 0.8)',
              'rgba(14, 165, 233, 0.8)',
              'rgba(168, 85, 247, 0.8)'
            ],
            borderColor: ['#F43F5E', '#EA580C', '#0EA5E9', '#A855F7'],
            borderWidth: 1.5,
            borderRadius: 6
          }
        ]
      },
      options: {
        indexAxis: 'y',
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              label: (ctx: any) => ` ${ctx.raw} รายวิชา (${Math.round((ctx.raw / (totalExams || 1)) * 100)}%)`
            }
          }
        },
        scales: {
          x: {
            beginAtZero: true,
            ticks: { precision: 0, font: { family: 'inherit', size: 11 } },
            grid: { color: 'rgba(248, 215, 227, 0.4)' }
          },
          y: {
            ticks: { font: { family: 'inherit', size: 11, weight: 'bold' } },
            grid: { display: false }
          }
        }
      }
    };
  }, [yearStats, totalExams]);

  return (
    <div className={`${isWidescreen ? 'max-w-[98%] 2xl:max-w-[1720px]' : 'max-w-7xl'} mx-auto px-2 sm:px-4 md:px-6 py-4 sm:py-6 space-y-6`}>
      {/* 1. Header Banner */}
      <div className="relative overflow-hidden bg-gradient-to-br from-white via-[#FFF0F5] to-[#FCE7F3] rounded-3xl p-5 sm:p-7 border border-[#F8D7E3] shadow-xs">
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-5">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/90 border border-[#F8D7E3] text-xs font-semibold text-[#9D174D] shadow-2xs">
              <Sparkles className="w-3.5 h-3.5 text-[#E11D48]" />
              <span>ระบบสรุปสถิติและภาพรวมการสอบไล่ · ภาคการศึกษาที่ 1 ปีการศึกษา 2569</span>
            </div>
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-extrabold text-[#701A4B] tracking-tight">
              Dashboard ภาพรวมสถิติการจัดสอบ
            </h1>
            <p className="text-xs sm:text-sm text-[#854D67] max-w-2xl leading-relaxed">
              วิทยาลัยสงฆ์พ่อขุนผาเมือง เพชรบูรณ์ · มหาวิทยาลัยมหาจุฬาลงกรณราชวิทยาลัย (MCU)
              สรุปภาพรวมรายวิชา สถานะความคืบหน้า และการกระจายตัวของตารางสอบ 91 รายวิชา
            </p>
          </div>

          {/* Quick Actions Header */}
          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <button
              onClick={() => onNavigateToSchedule()}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#9D174D] hover:bg-[#831843] text-white text-xs sm:text-sm font-semibold transition shadow-sm hover:shadow group cursor-pointer"
            >
              <BookOpen className="w-4 h-4" />
              <span>ดูตารางสอบทั้งหมด</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
            </button>
            <button
              onClick={onNavigateToCalendar}
              className="inline-flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-white hover:bg-[#FFF0F5] border border-[#F8D7E3] text-[#701A4B] text-xs sm:text-sm font-semibold transition shadow-2xs cursor-pointer"
            >
              <Calendar className="w-4 h-4 text-[#9D174D]" />
              <span>ปฏิทินสอบ</span>
            </button>
            <button
              onClick={onOpenPrintModal}
              className="inline-flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-white hover:bg-[#FFF0F5] border border-[#F8D7E3] text-[#701A4B] text-xs sm:text-sm font-semibold transition shadow-2xs cursor-pointer"
              title="พิมพ์ตารางสอบทางการ"
            >
              <Printer className="w-4 h-4 text-[#9D174D]" />
              <span className="hidden sm:inline">พิมพ์ตารางสอบ</span>
            </button>
          </div>
        </div>

        {/* Decorative corner background blur */}
        <div className="absolute -top-12 -right-12 w-48 h-48 bg-[#FCE7F3] rounded-full blur-3xl opacity-60 pointer-events-none" />
      </div>

      {/* 2. Key Metric Cards (KPI Cards) */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Card 1: Total Exams */}
        <div 
          onClick={() => onNavigateToSchedule()}
          className="bg-white/95 rounded-2xl p-4 sm:p-5 border border-[#F8D7E3] shadow-xs hover:border-[#9D174D]/40 transition group cursor-pointer"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-[#854D67]">จำนวนวิชาทั้งหมด</span>
            <div className="w-9 h-9 rounded-xl bg-[#FFF0F5] border border-[#F8D7E3] flex items-center justify-center text-[#9D174D] group-hover:scale-105 transition-transform">
              <BookOpen className="w-5 h-5" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-extrabold text-[#701A4B]">
              {totalExams}
            </span>
            <span className="text-xs font-semibold text-[#854D67]">รายวิชา</span>
          </div>
          <p className="text-[11px] text-[#854D67] mt-1.5 flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            <span>จัดสอบ ณ ห้องประชุมชั้น 1</span>
          </p>
        </div>

        {/* Card 2: Completed / Submitted */}
        <div 
          onClick={() => {
            setPendingModalMode('submitted');
            setPendingModalOpen(true);
          }}
          className="bg-white/95 rounded-2xl p-4 sm:p-5 border border-[#F8D7E3] shadow-xs hover:border-emerald-400 hover:shadow-md transition group cursor-pointer active:scale-[0.99]"
          title="คลิกเพื่อดูรายชื่อวิชาที่ส่งข้อสอบแล้ว (พร้อมสอบ)"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-[#854D67] truncate pr-1">
              {statusCounts.labelCompleted}
            </span>
            <div className="w-9 h-9 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600 group-hover:scale-110 transition-transform">
              <FileCheck2 className="w-5 h-5" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-extrabold text-emerald-700">
              {statusCounts.completed}
            </span>
            <span className="text-xs font-semibold text-emerald-600">วิชา</span>
            <span className="text-xs font-bold px-1.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 ml-auto">
              {completionPercent}%
            </span>
          </div>
          {/* Progress bar */}
          <div className="w-full bg-slate-100 rounded-full h-1.5 mt-2.5 overflow-hidden">
            <div
              className="bg-emerald-500 h-1.5 rounded-full transition-all duration-500"
              style={{ width: `${completionPercent}%` }}
            />
          </div>
          <div className="mt-2 pt-1 flex items-center justify-between text-[11px] text-emerald-700 font-bold group-hover:text-emerald-900">
            <span>คลิกดูรายชื่อวิชา</span>
            <span className="flex items-center gap-0.5">
              <span>{statusCounts.completed} วิชา</span>
              <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
            </span>
          </div>
        </div>

        {/* Card 3: Upcoming / Pending */}
        <div 
          onClick={() => {
            setPendingModalMode('pending');
            setPendingModalOpen(true);
          }}
          className="bg-white/95 rounded-2xl p-4 sm:p-5 border border-[#F8D7E3] shadow-xs hover:border-amber-400 hover:shadow-md transition group cursor-pointer active:scale-[0.99]"
          title="คลิกเพื่อดูรายชื่อวิชาที่ยังไม่ได้ส่งข้อสอบ (รอข้อสอบ)"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-[#854D67] truncate pr-1">
              {statusCounts.labelUpcoming}
            </span>
            <div className="w-9 h-9 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600 group-hover:scale-110 transition-transform">
              <Clock className="w-5 h-5" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-extrabold text-amber-700">
              {statusCounts.upcoming}
            </span>
            <span className="text-xs font-semibold text-amber-600">วิชา</span>
            {statusCounts.inProgress > 0 && (
              <span className="text-[11px] text-[#9D174D] font-bold">
                (กำลังสอบ {statusCounts.inProgress})
              </span>
            )}
          </div>
          <div className="mt-2 pt-2 border-t border-amber-100 flex items-center justify-between text-[11px] text-amber-700 font-bold group-hover:text-amber-900">
            <span>คลิกดูรายชื่อวิชา</span>
            <span className="flex items-center gap-0.5">
              <span>{statusCounts.upcoming} วิชา</span>
              <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
            </span>
          </div>
        </div>

        {/* Card 4: Lecturers & Faculties */}
        <div className="bg-white/95 rounded-2xl p-4 sm:p-5 border border-[#F8D7E3] shadow-xs hover:border-[#9D174D]/40 transition group">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-[#854D67]">คณะและอาจารย์</span>
            <div className="w-9 h-9 rounded-xl bg-[#FFF0F5] border border-[#F8D7E3] flex items-center justify-center text-[#9D174D] group-hover:scale-105 transition-transform">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-extrabold text-[#701A4B]">
              {distinctLecturers.length}
            </span>
            <span className="text-xs font-semibold text-[#854D67]">อาจารย์</span>
            <span className="text-xs text-[#854D67]">·</span>
            <span className="text-sm font-bold text-[#9D174D]">{facultyStats.length} คณะ</span>
          </div>
          <p className="text-[11px] text-[#854D67] mt-1.5 flex items-center gap-1">
            <Building2 className="w-3.5 h-3.5 text-[#9D174D]" />
            <span>พุทธศาสตร์ · สังคมศาสตร์ · ส่วนกลาง</span>
          </p>
        </div>
      </div>

      {/* 3. Main Chart Row: Faculty Breakdown (Bar Chart) & Exam Status (Doughnut Chart) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Left: Faculty Bar Chart (2 cols) */}
        <div className="lg:col-span-2 bg-white/95 rounded-2xl p-4 sm:p-6 border border-[#F8D7E3] shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-[#9D174D]" />
                <h2 className="text-sm sm:text-base font-bold text-[#701A4B]">
                  สถิติจำนวนรายวิชาแยกตามคณะ
                </h2>
              </div>
              <span className="text-xs text-[#854D67]">
                คลิกที่ชื่อคณะด้านล่างเพื่อเจาะลึกตารางสอบ
              </span>
            </div>

            {/* Bar Chart Canvas */}
            <div className="h-64 sm:h-72 w-full">
              <ChartCanvas config={facultyChartConfig} />
            </div>
          </div>

          {/* Quick Faculty Filter Badges */}
          <div className="pt-4 mt-2 border-t border-[#F8D7E3]/60 flex flex-wrap items-center gap-2">
            <span className="text-xs font-semibold text-[#854D67] flex items-center gap-1">
              <Layers className="w-3.5 h-3.5" />
              <span>เปิดดูรายคณะ:</span>
            </span>
            {facultyStats.map(([fac, count]) => (
              <button
                key={fac}
                onClick={() => onNavigateToSchedule(fac)}
                className="px-2.5 py-1 rounded-lg bg-[#FFF0F5] hover:bg-[#FCE7F3] border border-[#F8D7E3] text-[#701A4B] text-xs font-medium transition cursor-pointer flex items-center gap-1.5"
                title={`คลิกเพื่อดูตารางสอบคณะ ${fac}`}
              >
                <span>{fac}</span>
                <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-full bg-white text-[#9D174D] border border-[#F8D7E3]">
                  {count}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Right: Status Doughnut Chart (1 col) */}
        <div className="bg-white/95 rounded-2xl p-4 sm:p-6 border border-[#F8D7E3] shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between gap-2 mb-2">
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                <h2 className="text-sm sm:text-base font-bold text-[#701A4B]">
                  สถานะการจัดสอบ
                </h2>
              </div>

              {/* Mode Selector */}
              <div className="flex items-center text-[10px] bg-[#FFF0F5] p-0.5 rounded-lg border border-[#F8D7E3]">
                <button
                  onClick={() => setProgressMode('submission')}
                  className={`px-2 py-0.5 rounded-md font-medium transition ${
                    progressMode === 'submission'
                      ? 'bg-white text-[#701A4B] shadow-2xs font-bold'
                      : 'text-[#854D67] hover:text-[#701A4B]'
                  }`}
                  title="ดูสถานะความพร้อมข้อสอบ (พร้อมสอบ / รอข้อสอบ)"
                >
                  ความพร้อมข้อสอบ
                </button>
                <button
                  onClick={() => setProgressMode('simulation')}
                  className={`px-2 py-0.5 rounded-md font-medium transition ${
                    progressMode === 'simulation'
                      ? 'bg-white text-[#701A4B] shadow-2xs font-bold'
                      : 'text-[#854D67] hover:text-[#701A4B]'
                  }`}
                  title="จำลองสถานะระหว่างวันสอบ"
                >
                  จำลอง
                </button>
                <button
                  onClick={() => setProgressMode('realtime')}
                  className={`px-2 py-0.5 rounded-md font-medium transition ${
                    progressMode === 'realtime'
                      ? 'bg-white text-[#701A4B] shadow-2xs font-bold'
                      : 'text-[#854D67] hover:text-[#701A4B]'
                  }`}
                  title="ตามเวลาจริงของเครื่อง"
                >
                  เวลาจริง
                </button>
              </div>
            </div>

            <p className="text-xs text-[#854D67] mb-3">
              {progressMode === 'submission'
                ? 'อิงตามการอัปโหลดส่งข้อสอบของอาจารย์ผู้สอน'
                : progressMode === 'simulation'
                ? 'โหมดจำลองช่วงกลางสัปดาห์การสอบ'
                : 'อิงตามวันเวลาเริ่ม-สิ้นสุดจริง'}
            </p>

            {/* Doughnut Canvas with Center Stat */}
            <div className="relative h-56 sm:h-60 w-full flex items-center justify-center">
              <ChartCanvas config={statusChartConfig} />
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none pb-8">
                <span className="text-2xl sm:text-3xl font-extrabold text-[#701A4B]">
                  {completionPercent}%
                </span>
                <span className="text-[10px] text-[#854D67] font-semibold">
                  ความคืบหน้ารวม
                </span>
              </div>
            </div>
          </div>

          {/* Quick status summary footer */}
          <div className="pt-3 border-t border-[#F8D7E3]/60 grid grid-cols-2 gap-2 text-center text-xs">
            <div 
              onClick={() => {
                setPendingModalMode('submitted');
                setPendingModalOpen(true);
              }}
              className="p-2 rounded-xl bg-emerald-50/70 border border-emerald-100 hover:border-emerald-300 hover:bg-emerald-100/60 transition cursor-pointer group"
              title="คลิกดูรายชื่อวิชาที่พร้อมสอบ (ส่งข้อสอบแล้ว)"
            >
              <span className="text-emerald-700 font-bold block text-sm group-hover:scale-105 transition-transform">
                {statusCounts.completed}
              </span>
              <span className="text-[11px] text-emerald-800 font-medium flex items-center justify-center gap-0.5">
                <span>{statusCounts.labelCompleted}</span>
                <ArrowRight className="w-2.5 h-2.5 opacity-0 group-hover:opacity-100 transition-opacity" />
              </span>
            </div>
            <div 
              onClick={() => {
                setPendingModalMode('pending');
                setPendingModalOpen(true);
              }}
              className="p-2 rounded-xl bg-slate-50 border border-slate-200 hover:border-amber-300 hover:bg-amber-50 transition cursor-pointer group"
              title="คลิกดูรายชื่อวิชาที่รอส่งข้อสอบ"
            >
              <span className="text-slate-700 font-bold block text-sm group-hover:scale-105 group-hover:text-amber-800 transition-transform">
                {statusCounts.upcoming}
              </span>
              <span className="text-[11px] text-slate-600 font-medium group-hover:text-amber-800 flex items-center justify-center gap-0.5">
                <span>{statusCounts.labelUpcoming}</span>
                <ArrowRight className="w-2.5 h-2.5 opacity-0 group-hover:opacity-100 transition-opacity" />
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 4. Second Row: Daily Exam Volume (Line/Area Chart) & Year Levels (Bar Chart) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Left: Daily Exam Timeline (2 cols) */}
        <div className="lg:col-span-2 bg-white/95 rounded-2xl p-4 sm:p-6 border border-[#F8D7E3] shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-[#E11D48]" />
              <h2 className="text-sm sm:text-base font-bold text-[#701A4B]">
                ปริมาณการจัดสอบรายวัน (รอบเช้า vs รอบบ่าย)
              </h2>
            </div>
            <span className="text-xs text-[#854D67]">
              จัดสอบช่วง 5 – 8 ตุลาคม 2569
            </span>
          </div>

          {/* Area Chart Canvas */}
          <div className="h-64 sm:h-72 w-full">
            <ChartCanvas config={dailyChartConfig} />
          </div>

          {/* Daily Quick Filter Buttons */}
          <div className="pt-4 mt-3 border-t border-[#F8D7E3]/60 flex flex-wrap items-center gap-2">
            <span className="text-xs font-semibold text-[#854D67] flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5" />
              <span>ดูตารางรายวัน:</span>
            </span>
            {dailyStats.map(([date, data]) => (
              <button
                key={date}
                onClick={() => onNavigateToSchedule(undefined, 'all', date)}
                className="px-2.5 py-1 rounded-lg bg-[#FFF0F5] hover:bg-[#FCE7F3] border border-[#F8D7E3] text-[#701A4B] text-xs font-medium transition cursor-pointer flex items-center gap-1.5"
                title={`คลิกเพื่อดูตารางสอบวันที่ ${date}`}
              >
                <span>{date.replace(' 2569', '')}</span>
                <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-full bg-white text-[#9D174D] border border-[#F8D7E3]">
                  {data.total} วิชา
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Right: Year Level Breakdown (1 col) */}
        <div className="bg-white/95 rounded-2xl p-4 sm:p-6 border border-[#F8D7E3] shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <div className="w-2.5 h-2.5 rounded-full bg-orange-500" />
              <h2 className="text-sm sm:text-base font-bold text-[#701A4B]">
                สัดส่วนตามระดับชั้นปี (ปี 1 – 4)
              </h2>
            </div>
            <p className="text-xs text-[#854D67] mb-4">
              การกระจายจำนวนวิชาสอบตามชั้นปีของนิสิต
            </p>

            {/* Horizontal Bar Chart Canvas */}
            <div className="h-48 sm:h-52 w-full">
              <ChartCanvas config={yearChartConfig} />
            </div>
          </div>

          {/* Year Level Quick Filter Pills */}
          <div className="pt-4 border-t border-[#F8D7E3]/60 space-y-2">
            <div className="grid grid-cols-2 gap-2 text-xs">
              {[1, 2, 3, 4].map(y => (
                <button
                  key={y}
                  onClick={() => onNavigateToSchedule(undefined, y)}
                  className="p-2 rounded-xl bg-[#FFF0F5] hover:bg-[#FCE7F3] border border-[#F8D7E3] text-left transition cursor-pointer"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-[#701A4B]">ชั้นปีที่ {y}</span>
                    <span className="font-bold text-[#9D174D]">{yearStats[y] || 0} วิชา</span>
                  </div>
                </button>
              ))}
            </div>

            {/* Student Type Breakdown (บรรพชิต vs คฤหัสถ์) */}
            <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center justify-between text-xs">
              <div className="flex items-center gap-1.5 text-slate-700">
                <GraduationCap className="w-3.5 h-3.5 text-[#9D174D]" />
                <span>บรรพชิต {studentTypeCounts.monk} วิชา</span>
              </div>
              <span className="text-slate-400">·</span>
              <div className="text-slate-700">
                <span>คฤหัสถ์ {studentTypeCounts.layperson} วิชา</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 5. Information Note Bar */}
      <div className="bg-[#FFF0F5] rounded-2xl p-4 border border-[#F8D7E3] flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-[#854D67]">
        <div className="flex items-center gap-2">
          <Info className="w-4 h-4 text-[#9D174D] shrink-0" />
          <span>
            ข้อมูลตารางสอบไล่ภาคการศึกษาที่ 1 ปีการศึกษา 2569 เป็นข้อมูลทางการ จัดสอบ ณ ห้องประชุมชั้น 1 วิทยาลัยสงฆ์พ่อขุนผาเมือง
          </span>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={() => onNavigateToSchedule()}
            className="text-[#9D174D] font-bold hover:underline flex items-center gap-1 cursor-pointer"
          >
            <span>ไปที่ตารางสอบทั้งหมด ({totalExams} วิชา)</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* 6. Pending / Submitted Exams Drill-down Modal */}
      <PendingExamsModal
        isOpen={pendingModalOpen}
        onClose={() => setPendingModalOpen(false)}
        exams={exams}
        initialMode={pendingModalMode}
        onNavigateToSchedule={onNavigateToSchedule}
        onViewExamDetails={onViewExamDetails}
      />
    </div>
  );
};
export default Dashboard;
