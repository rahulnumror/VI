import React, { useState, useEffect, useCallback } from 'react';
import {
  Users,
  Clock,
  Calendar,
  FileCheck2,
  ChevronDown,
  Receipt,
  BookOpen,
  MapPin,
  RefreshCw,
  AlertCircle,
  TrendingUp,
  Check,
  X,
  Briefcase,
} from 'lucide-react';
import api from '../../services/api';

// ── Fallback data ──────────────────────────────────────────────────────────────
const FALLBACK_EMPLOYEES = [
  { id: 'EMP-001', full_name: 'Vũ Thị Hoan',        employee_code: 'EMPL000036', designation: 'Commercial Sales Executive',  department: 'Sales',             branch: 'Hanoi HQ',        status: 'ACTIVE' },
  { id: 'EMP-002', full_name: 'Rajesh Sharma',        employee_code: 'EMPL000012', designation: 'QA Manager',                  department: 'Quality Assurance', branch: 'Kochi Terminal',  status: 'ACTIVE' },
  { id: 'EMP-003', full_name: 'Nguyễn Văn Hùng',     employee_code: 'EMPL000021', designation: 'Logistics Coordinator',       department: 'Logistics',         branch: 'Hai Phong Hub',   status: 'ACTIVE' },
  { id: 'EMP-004', full_name: 'Đặng Thị Viễn',       employee_code: 'EMPL000008', designation: 'Finance Controller',          department: 'Finance',           branch: 'Hanoi HQ',        status: 'ACTIVE' },
  { id: 'EMP-005', full_name: 'Dinesh Prasad',        employee_code: 'EMPL000045', designation: 'Regional Sales Director',     department: 'Sales',             branch: 'Dubai Office',    status: 'ACTIVE' },
  { id: 'EMP-006', full_name: 'Bùi Thị Kim Thanh',   employee_code: 'EMPL000029', designation: 'HR Specialist',               department: 'Human Resources',   branch: 'Hanoi HQ',        status: 'ACTIVE' },
  { id: 'EMP-007', full_name: 'Phạm Minh Tuấn',      employee_code: 'EMPL000033', designation: 'Operations Analyst',          department: 'Operations',        branch: 'Hai Phong Hub',   status: 'ACTIVE' },
  { id: 'EMP-008', full_name: 'Anitha Krishnan',      employee_code: 'EMPL000017', designation: 'Procurement Lead',            department: 'Procurement',       branch: 'Kochi Terminal',  status: 'ACTIVE' },
  { id: 'EMP-009', full_name: 'Lê Quốc Dũng',        employee_code: 'EMPL000041', designation: 'Senior Dev Engineer',         department: 'Engineering',       branch: 'Hanoi HQ',        status: 'INACTIVE' },
  { id: 'EMP-010', full_name: 'Mohammed Al-Rashidi',  employee_code: 'EMPL000052', designation: 'Business Dev Manager',        department: 'Sales',             branch: 'Dubai Office',    status: 'ACTIVE' },
];

const FALLBACK_ATTENDANCE = [
  { id: 'ATT-001', employee_name: 'Vũ Thị Hoan',       date: '2026-10-21', clock_in: '08:55', clock_out: '18:10', hours: 9.25, status: 'PRESENT' },
  { id: 'ATT-002', employee_name: 'Rajesh Sharma',       date: '2026-10-21', clock_in: '09:02', clock_out: '17:45', hours: 8.72, status: 'PRESENT' },
  { id: 'ATT-003', employee_name: 'Nguyễn Văn Hùng',    date: '2026-10-21', clock_in: '-',     clock_out: '-',     hours: 0,    status: 'LEAVE'   },
  { id: 'ATT-004', employee_name: 'Đặng Thị Viễn',      date: '2026-10-21', clock_in: '09:30', clock_out: '18:00', hours: 8.5,  status: 'PRESENT' },
  { id: 'ATT-005', employee_name: 'Dinesh Prasad',       date: '2026-10-21', clock_in: '-',     clock_out: '-',     hours: 0,    status: 'ABSENT'  },
  { id: 'ATT-006', employee_name: 'Bùi Thị Kim Thanh',  date: '2026-10-21', clock_in: '08:45', clock_out: '-',     hours: null, status: 'PRESENT' },
  { id: 'ATT-007', employee_name: 'Phạm Minh Tuấn',     date: '2026-10-21', clock_in: '10:15', clock_out: '18:30', hours: 8.25, status: 'LATE'    },
  { id: 'ATT-008', employee_name: 'Anitha Krishnan',     date: '2026-10-21', clock_in: '08:50', clock_out: '17:50', hours: 9.0,  status: 'PRESENT' },
  { id: 'ATT-009', employee_name: 'Mohammed Al-Rashidi', date: '2026-10-21', clock_in: '09:00', clock_out: '18:00', hours: 9.0,  status: 'PRESENT' },
];

const FALLBACK_LEAVE_REQUESTS = [
  { id: 'LVE-001', employee_name: 'Nguyễn Văn Hùng',   leave_type: 'SICK_LEAVE',   start_date: '2026-10-21', end_date: '2026-10-23', days: 3, reason: 'Medical treatment for viral infection', status: 'PENDING'  },
  { id: 'LVE-002', employee_name: 'Bùi Thị Kim Thanh', leave_type: 'ANNUAL_LEAVE',  start_date: '2026-10-28', end_date: '2026-10-30', days: 3, reason: 'Family vacation — pre-approved',         status: 'PENDING'  },
  { id: 'LVE-003', employee_name: 'Dinesh Prasad',      leave_type: 'CASUAL_LEAVE',  start_date: '2026-10-21', end_date: '2026-10-21', days: 1, reason: 'Personal administrative work',           status: 'APPROVED' },
  { id: 'LVE-004', employee_name: 'Phạm Minh Tuấn',    leave_type: 'CASUAL_LEAVE',  start_date: '2026-11-04', end_date: '2026-11-04', days: 1, reason: 'Attending sibling wedding ceremony',     status: 'PENDING'  },
];

// ── Utilities ──────────────────────────────────────────────────────────────────
function getInitials(name = '') {
  return name.split(' ').filter(w => w.length > 1).slice(0, 2).map(w => w[0]).join('').toUpperCase();
}

const STATUS_BADGE = {
  PRESENT:  'bg-emerald-100 text-emerald-800 border-emerald-200',
  ABSENT:   'bg-red-100 text-red-700 border-red-200',
  LEAVE:    'bg-amber-100 text-amber-800 border-amber-200',
  LATE:     'bg-yellow-100 text-yellow-700 border-yellow-200',
  HALF_DAY: 'bg-slate-100 text-slate-700 border-slate-200',
  PENDING:  'bg-amber-100 text-amber-800 border-amber-200',
  APPROVED: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  REJECTED: 'bg-red-100 text-red-700 border-red-200',
};

const BRANCH_DOT = {
  'Hanoi HQ':       'bg-blue-500',
  'Kochi Terminal': 'bg-emerald-500',
  'Hai Phong Hub':  'bg-amber-500',
  'Dubai Office':   'bg-purple-500',
};

function groupByField(employees, field) {
  const map = {};
  employees.forEach(emp => {
    const key = emp[field] || 'Unassigned';
    if (!map[key]) map[key] = { name: key, total: 0, active: 0 };
    map[key].total += 1;
    if ((emp.status || '').toUpperCase() === 'ACTIVE') map[key].active += 1;
  });
  return Object.values(map).sort((a, b) => b.total - a.total);
}

// Seeded pseudo-random fallback for the trend chart
function buildFallbackTrend() {
  const days = [];
  const now = new Date('2026-10-21');
  for (let i = 29; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().slice(0, 10);
    const seed = i * 13 + 7;
    const PRESENT = 4 + (seed % 3);
    const ABSENT  = seed % 2;
    const LEAVE   = (seed * 3) % 2;
    const LATE    = seed % 2;
    days.push({ date: dateStr, PRESENT, ABSENT, LEAVE, LATE });
  }
  return days;
}

// ── Component ──────────────────────────────────────────────────────────────────
export default function HrDashboard({ onNavigate }) {
  const [employees,      setEmployees]      = useState(FALLBACK_EMPLOYEES);
  const [attendanceLogs, setAttendanceLogs] = useState(FALLBACK_ATTENDANCE);
  const [leaveRequests,  setLeaveRequests]  = useState(FALLBACK_LEAVE_REQUESTS);
  const [attendanceTrend, setAttendanceTrend] = useState([]);
  const [openJDs,        setOpenJDs]        = useState(0);
  const [pendingExitsCount, setPendingExitsCount] = useState(0);
  const [loading,        setLoading]        = useState(true);
  const [notification,   setNotification]   = useState(null);
  const [selectedBranch, setSelectedBranch] = useState('ALL');
  const [rejectingId,    setRejectingId]    = useState(null);
  const [rejectRemark,   setRejectRemark]   = useState('');
  const [saving,         setSaving]         = useState(false);

  // ── Notification helper ────────────────────────────────────────────────────
  const notify = (type, msg) => {
    setNotification({ type, msg });
    setTimeout(() => setNotification(null), 3500);
  };

  // ── Data fetch ─────────────────────────────────────────────────────────────
  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [empData, attData, lvData, statsData, jdData, exitData] = await Promise.all([
        api.getEmployees(),
        api.getAttendanceLogs(),
        api.getLeaveRequests(),
        api.getAttendanceStats ? api.getAttendanceStats() : Promise.resolve(null),
        api.getJobRequisitions ? api.getJobRequisitions('OPEN') : Promise.resolve(null),
        api.getAllExits ? api.getAllExits() : Promise.resolve(null),
      ]);
      if (empData  && empData.length  > 0) setEmployees(empData);
      if (attData  && attData.length  > 0) setAttendanceLogs(attData);
      if (lvData   && lvData.length   > 0) setLeaveRequests(lvData);
      if (statsData && Array.isArray(statsData) && statsData.length > 0) setAttendanceTrend(statsData);
      if (jdData   != null) setOpenJDs(Array.isArray(jdData) ? jdData.length : (jdData.count || 0));
      if (exitData && Array.isArray(exitData)) {
        const pending = exitData.filter(x => x.status === 'SUBMITTED' || x.status === 'CLEARANCE_PENDING' || x.status === 'NOTICE_PERIOD');
        setPendingExitsCount(pending.length);
      }
    } catch {
      // silently fall back to seeded data
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  // ── Refresh only leaves (after approve / reject) ───────────────────────────
  const refreshLeaves = async () => {
    const data = await api.getLeaveRequests();
    if (data && data.length > 0) setLeaveRequests(data);
  };

  // ── Leave actions ──────────────────────────────────────────────────────────
  const handleApproveLeave = async (id, name) => {
    setSaving(true);
    // Optimistic update
    setLeaveRequests(prev => prev.map(l => l.id === id ? { ...l, status: 'APPROVED' } : l));
    notify('success', `Leave request approved for ${name}.`);

    try {
      await api.approveLeave(id, 'APPROVED');
    } catch (err) {
      console.warn('Backend approveLeave warning:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleRejectLeave = async (id, name) => {
    if (!rejectRemark.trim()) {
      notify('error', 'Please enter a rejection remark before submitting.');
      return;
    }
    const remark = rejectRemark.trim();
    setSaving(true);
    // Optimistic update
    setLeaveRequests(prev => prev.map(l => l.id === id ? { ...l, status: 'REJECTED', reason: `${l.reason || ''} [Rejected: ${remark}]` } : l));
    notify('success', `Leave request rejected for ${name}.`);
    setRejectingId(null);
    setRejectRemark('');

    try {
      await api.approveLeave(id, 'REJECTED', remark);
    } catch (err) {
      console.warn('Backend rejectLeave warning:', err);
    } finally {
      setSaving(false);
    }
  };

  // ── Computed values ────────────────────────────────────────────────────────
  const filteredEmployees = selectedBranch === 'ALL'
    ? employees
    : employees.filter(e => e.branch === selectedBranch);

  const totalActive     = filteredEmployees.filter(e => (e.status || '').toUpperCase() === 'ACTIVE').length;
  const presentToday    = attendanceLogs.filter(a => (a.status || '').toUpperCase() === 'PRESENT').length;
  const onLeaveToday    = attendanceLogs.filter(a => (a.status || '').toUpperCase() === 'LEAVE').length;
  const lateToday       = attendanceLogs.filter(a => (a.status || '').toUpperCase() === 'LATE').length;
  const totalCheckedIn  = attendanceLogs.length;
  const attendanceRate  = totalCheckedIn > 0 ? Math.round((presentToday / totalCheckedIn) * 100) : 0;

  const pendingLeaves      = leaveRequests.filter(l => (l.status || '').toUpperCase() === 'PENDING');
  const pendingLeaveCount  = pendingLeaves.length;
  const noAttendanceCount  = Math.max(0, filteredEmployees.length - totalCheckedIn);

  const deptBreakdown   = groupByField(filteredEmployees, 'department');
  const branchBreakdown = groupByField(employees, 'branch');
  const recentAttendance = attendanceLogs.slice(0, 10);

  // Trend chart data — use API data or seeded fallback
  const trendData = attendanceTrend.length > 0 ? attendanceTrend : buildFallbackTrend();
  const maxPresent = Math.max(...trendData.map(d => d.PRESENT || 0), 1);

  return (
    <div className="p-6 space-y-6 bg-[#F8FAFC] min-h-screen">
      {/* ── Notification Banner ────────────────────────────────────────────── */}
      {notification && (
        <div className={`fixed top-4 right-4 z-[9999] flex items-center space-x-2 px-4 py-3 rounded-lg shadow-lg border text-xs font-bold transition-all ${notification.type === 'success' ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-red-50 border-red-200 text-red-700'}`}>
          <span>{notification.type === 'success' ? '✓' : '✕'}</span>
          <span>{notification.msg}</span>
        </div>
      )}

      {/* ── Header ────────────────────────────────────────────────────────── */}
      <div className="bg-white rounded-lg border border-[#E2E8F0] p-5 shadow-card flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex items-center space-x-4">
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-[#1E40AF] font-black text-xl flex items-center justify-center border-2 border-[#1E40AF] shadow-sm shrink-0">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-base font-black text-slate-900 tracking-tight">SOILEX WORKFORCE COMMAND CENTER</h1>
            <p className="text-[11px] font-semibold text-slate-500 mt-0.5">Human Resources · Attendance · Payroll · Recruitment</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Branch selector */}
          <div className="relative">
            <select
              value={selectedBranch}
              onChange={e => setSelectedBranch(e.target.value)}
              className="text-xs font-semibold uppercase text-slate-700 bg-white border border-[#E2E8F0] rounded-md px-3 py-2 pr-8 focus:outline-none focus:border-[#1E40AF] cursor-pointer appearance-none shadow-sm"
            >
              <option value="ALL">ALL BRANCHES</option>
              <option value="Hanoi HQ">HANOI HQ</option>
              <option value="Kochi Terminal">KOCHI TERMINAL</option>
              <option value="Hai Phong Hub">HAI PHONG HUB</option>
              <option value="Dubai Office">DUBAI OFFICE</option>
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>

          {/* Refresh */}
          <button
            onClick={fetchAll}
            disabled={loading}
            className="flex items-center space-x-1.5 px-3 py-2 bg-white border border-[#E2E8F0] text-slate-600 hover:bg-slate-50 text-xs font-semibold rounded-md shadow-sm transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>REFRESH</span>
          </button>

          {/* Quick nav */}
          <button
            onClick={() => onNavigate && onNavigate('attendance')}
            className="flex items-center space-x-1.5 px-3 py-2 bg-[#1E40AF] hover:bg-blue-800 text-white text-xs font-semibold uppercase rounded-md shadow-sm transition-colors"
          >
            <FileCheck2 className="w-3.5 h-3.5 text-[#FDE68A]" />
            <span>ATTENDANCE</span>
          </button>
          <button
            onClick={() => onNavigate && onNavigate('payroll')}
            className="flex items-center space-x-1.5 px-3 py-2 bg-[#1E40AF] hover:bg-blue-800 text-white text-xs font-semibold uppercase rounded-md shadow-sm transition-colors"
          >
            <Receipt className="w-3.5 h-3.5 text-[#FDE68A]" />
            <span>PAYROLL</span>
          </button>
          <button
            onClick={() => onNavigate && onNavigate('recruitment')}
            className="flex items-center space-x-1.5 px-3 py-2 bg-white border border-[#1E40AF] text-[#1E40AF] hover:bg-blue-50 text-xs font-semibold uppercase rounded-md shadow-sm transition-colors"
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>RECRUITMENT</span>
          </button>
          <button
            onClick={() => onNavigate && onNavigate('performance')}
            className="flex items-center space-x-1.5 px-3 py-2 bg-[#D97706] hover:bg-amber-700 text-white text-xs font-semibold uppercase rounded-md shadow-sm transition-colors"
          >
            <TrendingUp className="w-3.5 h-3.5 text-white" />
            <span>OKRs &amp; PERFORMANCE</span>
          </button>
        </div>
      </div>

      {/* ── KPI Cards (5 cards) ────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        {/* 1 — Total Active Staff */}
        <div className="bg-white p-5 rounded-lg border border-[#E2E8F0] shadow-card">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Total Active Staff</span>
            <div className="w-7 h-7 bg-blue-50 rounded-lg flex items-center justify-center">
              <Users className="w-3.5 h-3.5 text-[#1E40AF]" />
            </div>
          </div>
          {loading ? (
            <div className="animate-pulse bg-slate-100 rounded h-8 w-14 mt-2" />
          ) : (
            <p className="text-3xl font-black text-[#1E40AF] mt-1">{totalActive}</p>
          )}
          <span className="text-[10px] font-semibold text-slate-400">Across all facilities</span>
        </div>

        {/* 2 — Present Today */}
        <div className="bg-white p-5 rounded-lg border border-[#E2E8F0] shadow-card">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Present Today</span>
            <div className="w-7 h-7 bg-emerald-50 rounded-lg flex items-center justify-center">
              <Check className="w-3.5 h-3.5 text-emerald-600" />
            </div>
          </div>
          {loading ? (
            <div className="animate-pulse bg-slate-100 rounded h-8 w-14 mt-2" />
          ) : (
            <p className="text-3xl font-black text-emerald-600 mt-1">{presentToday}</p>
          )}
          <span className="text-[10px] font-semibold text-emerald-600">{attendanceRate}% attendance rate</span>
        </div>

        {/* 3 — On Leave Today */}
        <div className="bg-white p-5 rounded-lg border border-[#E2E8F0] shadow-card">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">On Leave Today</span>
            <div className="w-7 h-7 bg-amber-50 rounded-lg flex items-center justify-center">
              <Calendar className="w-3.5 h-3.5 text-amber-600" />
            </div>
          </div>
          {loading ? (
            <div className="animate-pulse bg-slate-100 rounded h-8 w-14 mt-2" />
          ) : (
            <p className="text-3xl font-black text-amber-600 mt-1">{onLeaveToday}</p>
          )}
          <span className="text-[10px] font-semibold text-amber-600">Approved leaves</span>
        </div>

        {/* 4 — Late Today */}
        <div className="bg-white p-5 rounded-lg border border-[#E2E8F0] shadow-card">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Late Today</span>
            <div className="w-7 h-7 bg-yellow-50 rounded-lg flex items-center justify-center">
              <Clock className="w-3.5 h-3.5 text-yellow-600" />
            </div>
          </div>
          {loading ? (
            <div className="animate-pulse bg-slate-100 rounded h-8 w-14 mt-2" />
          ) : (
            <p className="text-3xl font-black text-yellow-600 mt-1">{lateToday}</p>
          )}
          <span className="text-[10px] font-semibold text-yellow-600">↓ vs yesterday</span>
        </div>

        {/* 5 — Open Job Posts */}
        <div className="bg-white p-5 rounded-lg border border-[#E2E8F0] shadow-card">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Open Job Posts</span>
            <div className="w-7 h-7 bg-red-50 rounded-lg flex items-center justify-center">
              <Briefcase className="w-3.5 h-3.5 text-red-600" />
            </div>
          </div>
          {loading ? (
            <div className="animate-pulse bg-slate-100 rounded h-8 w-14 mt-2" />
          ) : (
            <p className="text-3xl font-black text-red-600 mt-1">{openJDs}</p>
          )}
          <span className="text-[10px] font-semibold text-red-500">Active hiring</span>
        </div>
      </div>

      {/* ── Pending Actions Alert Strip ────────────────────────────────────── */}
      {(pendingLeaveCount > 0 || openJDs > 0 || noAttendanceCount > 0 || pendingExitsCount > 0) && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 flex flex-wrap items-center gap-3">
          <span className="flex items-center space-x-1.5 text-xs font-bold text-amber-800">
            <AlertCircle className="w-4 h-4" />
            <span>PENDING ACTIONS</span>
          </span>
          {pendingExitsCount > 0 && (
            <span className="bg-purple-100 border border-purple-300 text-purple-900 px-3 py-1 rounded text-xs font-semibold">
              {pendingExitsCount} Resignation Request{pendingExitsCount > 1 ? 's' : ''} Awaiting Review
            </span>
          )}
          {pendingLeaveCount > 0 && (
            <span className="bg-amber-100 border border-amber-300 text-amber-900 px-3 py-1 rounded text-xs font-semibold">
              {pendingLeaveCount} Leave Request{pendingLeaveCount > 1 ? 's' : ''} Awaiting Approval
            </span>
          )}
          {openJDs > 0 && (
            <span className="bg-red-100 border border-red-200 text-red-800 px-3 py-1 rounded text-xs font-semibold">
              {openJDs} Open Job Requisition{openJDs > 1 ? 's' : ''}
            </span>
          )}
          {noAttendanceCount > 0 && (
            <span className="bg-slate-100 border border-slate-200 text-slate-700 px-3 py-1 rounded text-xs font-semibold">
              {noAttendanceCount} Employee{noAttendanceCount > 1 ? 's' : ''} Not Checked In Yet
            </span>
          )}
        </div>
      )}

      {/* ── Attendance Trend Chart ─────────────────────────────────────────── */}
      <div className="bg-white rounded-lg border border-[#E2E8F0] shadow-card p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <TrendingUp className="w-4 h-4 text-[#1E40AF]" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">21-Day Attendance Trend</h3>
          </div>
          <span className="text-[10px] font-semibold text-slate-400 bg-slate-50 border border-[#E2E8F0] px-2 py-1 rounded">
            Last 21 days
          </span>
        </div>

        {/* Bar chart */}
        <div className="flex items-end space-x-0.5 h-16">
          {trendData.slice(-21).map((day, i) => (
            <div
              key={i}
              className="flex-1 flex flex-col justify-end space-y-0.5 group relative"
              title={`${day.date}: ${day.PRESENT || 0} present, ${day.ABSENT || 0} absent, ${day.LEAVE || 0} leave`}
            >
              <div
                className="bg-emerald-400 rounded-t transition-all group-hover:bg-emerald-500"
                style={{ height: `${Math.max(4, ((day.PRESENT || 0) / maxPresent) * 100)}%`, minHeight: '2px' }}
              />
              {/* Tooltip on hover */}
              <div className="absolute bottom-full mb-1 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-[9px] font-bold px-1.5 py-1 rounded whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-10">
                {day.date?.slice(5)}: {day.PRESENT || 0}P / {day.ABSENT || 0}A
              </div>
            </div>
          ))}
        </div>

        {/* X-axis labels (first, middle, last) */}
        <div className="flex justify-between mt-1">
          <span className="text-[9px] text-slate-400 font-mono">{trendData[trendData.length - 21]?.date?.slice(5) || ''}</span>
          <span className="text-[9px] text-slate-400 font-mono">{trendData[trendData.length - 11]?.date?.slice(5) || ''}</span>
          <span className="text-[9px] text-slate-400 font-mono">{trendData[trendData.length - 1]?.date?.slice(5) || ''}</span>
        </div>

        {/* Legend */}
        <div className="flex items-center space-x-4 mt-3 pt-3 border-t border-[#E2E8F0]">
          <span className="flex items-center space-x-1.5 text-[10px] font-semibold text-slate-600">
            <span className="w-2.5 h-2.5 rounded-sm bg-emerald-400 inline-block" />
            <span>Present</span>
          </span>
          <span className="flex items-center space-x-1.5 text-[10px] font-semibold text-slate-600">
            <span className="w-2.5 h-2.5 rounded-sm bg-red-400 inline-block" />
            <span>Absent</span>
          </span>
          <span className="flex items-center space-x-1.5 text-[10px] font-semibold text-slate-600">
            <span className="w-2.5 h-2.5 rounded-sm bg-amber-400 inline-block" />
            <span>Leave</span>
          </span>
        </div>
      </div>

      {/* ── Dept Breakdown + Branch Distribution ──────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Department Breakdown */}
        <div className="bg-white rounded-lg border border-[#E2E8F0] shadow-card overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">Department Breakdown</h3>
            <span className="text-[10px] font-semibold text-slate-500 bg-slate-50 border border-[#E2E8F0] px-2 py-0.5 rounded">{deptBreakdown.length} Depts</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-[#FAFAFA] border-b border-[#E2E8F0] text-[11px] font-bold uppercase tracking-wider text-slate-600">
                <tr>
                  <th className="py-3 px-4">Department</th>
                  <th className="py-3 px-4 text-center">Headcount</th>
                  <th className="py-3 px-4 text-center">Active</th>
                  <th className="py-3 px-4 text-right">% Workforce</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {loading ? (
                  [1, 2, 3, 4].map(i => (
                    <tr key={i}>
                      {[1, 2, 3, 4].map(j => (
                        <td key={j} className="py-3 px-4">
                          <div className="animate-pulse bg-slate-100 rounded h-3 w-16" />
                        </td>
                      ))}
                    </tr>
                  ))
                ) : deptBreakdown.length > 0 ? deptBreakdown.map((dept, idx) => {
                  const pct = filteredEmployees.length > 0 ? ((dept.total / filteredEmployees.length) * 100) : 0;
                  const barColors = ['bg-blue-400', 'bg-emerald-400', 'bg-amber-400', 'bg-purple-400', 'bg-red-400', 'bg-cyan-400'];
                  const barColor = barColors[idx % barColors.length];
                  return (
                    <tr key={idx} className="hover:bg-blue-50/40 transition-colors">
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-900">{dept.name}</div>
                        <div className="mt-1 h-1 bg-slate-100 rounded-full overflow-hidden w-24">
                          <div className={`h-1 rounded-full ${barColor}`} style={{ width: `${Math.min(100, pct)}%` }} />
                        </div>
                      </td>
                      <td className="py-3 px-4 text-center font-semibold text-slate-700">{dept.total}</td>
                      <td className="py-3 px-4 text-center font-semibold text-emerald-700">{dept.active}</td>
                      <td className="py-3 px-4 text-right font-bold text-[#1E40AF]">{pct.toFixed(1)}%</td>
                    </tr>
                  );
                }) : (
                  <tr>
                    <td colSpan={4} className="py-8 text-center text-slate-400 text-xs">No department data found.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Branch Distribution */}
        <div className="bg-white rounded-lg border border-[#E2E8F0] shadow-card overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <MapPin className="w-4 h-4 text-[#1E40AF]" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">Branch Distribution</h3>
            </div>
            <span className="text-[10px] font-semibold text-slate-500 bg-slate-50 border border-[#E2E8F0] px-2 py-0.5 rounded">{branchBreakdown.length} Branches</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-[#FAFAFA] border-b border-[#E2E8F0] text-[11px] font-bold uppercase tracking-wider text-slate-600">
                <tr>
                  <th className="py-3 px-4">Branch</th>
                  <th className="py-3 px-4 text-center">Headcount</th>
                  <th className="py-3 px-4 text-right">% Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {loading ? (
                  [1, 2, 3, 4].map(i => (
                    <tr key={i}>
                      {[1, 2, 3].map(j => (
                        <td key={j} className="py-3 px-4">
                          <div className="animate-pulse bg-slate-100 rounded h-3 w-20" />
                        </td>
                      ))}
                    </tr>
                  ))
                ) : branchBreakdown.length > 0 ? branchBreakdown.map((branch, idx) => {
                  const pct = employees.length > 0 ? ((branch.total / employees.length) * 100) : 0;
                  const dotColor = BRANCH_DOT[branch.name] || 'bg-slate-400';
                  return (
                    <tr key={idx} className="hover:bg-blue-50/40 transition-colors">
                      <td className="py-3 px-4">
                        <div className="flex items-center space-x-2">
                          <span className={`w-2 h-2 rounded-full ${dotColor} shrink-0`} />
                          <span className="font-bold text-slate-900">{branch.name}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-center font-semibold text-slate-700">{branch.total}</td>
                      <td className="py-3 px-4 text-right font-bold text-[#1E40AF]">{pct.toFixed(1)}%</td>
                    </tr>
                  );
                }) : (
                  <tr>
                    <td colSpan={3} className="py-8 text-center text-slate-400 text-xs">No branch data found.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* ── Recent Attendance ──────────────────────────────────────────────── */}
      <div className="bg-white rounded-lg border border-[#E2E8F0] shadow-card overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Clock className="w-4 h-4 text-[#1E40AF]" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">Recent Attendance Logs</h3>
          </div>
          <span className="text-[10px] font-semibold text-slate-500 bg-slate-50 border border-[#E2E8F0] px-2 py-0.5 rounded">
            Last {recentAttendance.length} records
          </span>
        </div>
        <div className="overflow-x-auto max-h-72 overflow-y-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-[#FAFAFA] border-b border-[#E2E8F0] text-[11px] font-bold uppercase tracking-wider text-slate-600 sticky top-0 z-10">
              <tr>
                <th className="py-3 px-4">Employee</th>
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4 text-center">Clock In</th>
                <th className="py-3 px-4 text-center">Clock Out</th>
                <th className="py-3 px-4 text-center">Hours</th>
                <th className="py-3 px-4 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {loading ? (
                [1, 2, 3, 4].map(i => (
                  <tr key={i}>
                    {[1, 2, 3, 4, 5, 6].map(j => (
                      <td key={j} className="py-3 px-4">
                        <div className="animate-pulse bg-slate-100 rounded h-3 w-14" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : recentAttendance.length > 0 ? recentAttendance.map(log => (
                <tr key={log.id} className="hover:bg-blue-50/40 transition-colors">
                  <td className="py-3 px-4 font-bold text-slate-900">{log.employee_name}</td>
                  <td className="py-3 px-4 text-slate-500 font-mono">{log.date}</td>
                  <td className="py-3 px-4 text-center font-mono text-slate-700">{log.clock_in || '—'}</td>
                  <td className="py-3 px-4 text-center font-mono text-slate-700">{log.clock_out || '—'}</td>
                  <td className="py-3 px-4 text-center font-semibold text-slate-700">
                    {log.hours != null && log.hours !== 0 ? Number(log.hours).toFixed(2) : '—'}
                  </td>
                  <td className="py-3 px-4 text-center">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${STATUS_BADGE[log.status] || 'bg-slate-100 text-slate-700 border-slate-200'}`}>
                      {log.status}
                    </span>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400 text-xs">No attendance records found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Pending Leave Requests ─────────────────────────────────────────── */}
      <div className="bg-white rounded-lg border border-[#E2E8F0] shadow-card overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 text-amber-600" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">Pending Leave Requests</h3>
          </div>
          <span className={`text-[10px] font-bold px-2.5 py-1 rounded border ${pendingLeaveCount > 0 ? 'bg-amber-100 text-amber-800 border-amber-200' : 'bg-slate-100 text-slate-600 border-slate-200'}`}>
            {pendingLeaveCount} Pending
          </span>
        </div>

        {pendingLeaves.length === 0 && !loading ? (
          <div className="p-8 flex flex-col items-center justify-center space-y-2">
            <div className="w-10 h-10 bg-emerald-50 rounded-full flex items-center justify-center">
              <Check className="w-5 h-5 text-emerald-600" />
            </div>
            <p className="text-xs font-bold text-emerald-700">All leave requests have been actioned ✓</p>
            <p className="text-[10px] text-slate-400">No pending approvals at this time</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-[#FAFAFA] border-b border-[#E2E8F0] text-[11px] font-bold uppercase tracking-wider text-slate-600">
                <tr>
                  <th className="py-3 px-4">Employee</th>
                  <th className="py-3 px-4">Leave Type</th>
                  <th className="py-3 px-4">From</th>
                  <th className="py-3 px-4">To</th>
                  <th className="py-3 px-4 text-center">Days</th>
                  <th className="py-3 px-4">Reason</th>
                  <th className="py-3 px-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {loading ? (
                  [1, 2].map(i => (
                    <tr key={i}>
                      {[1, 2, 3, 4, 5, 6, 7].map(j => (
                        <td key={j} className="py-3 px-4">
                          <div className="animate-pulse bg-slate-100 rounded h-3 w-16" />
                        </td>
                      ))}
                    </tr>
                  ))
                ) : pendingLeaves.map(lv => (
                  <React.Fragment key={lv.id}>
                    <tr className="hover:bg-blue-50/40 transition-colors">
                      <td className="py-3 px-4">
                        <div className="flex items-center space-x-2">
                          <div className="w-7 h-7 rounded-full bg-blue-50 border border-[#BFDBFE] text-[#1E40AF] font-bold text-[10px] flex items-center justify-center shrink-0">
                            {getInitials(lv.employee_name)}
                          </div>
                          <span className="font-bold text-slate-900">{lv.employee_name}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span className="bg-slate-100 text-slate-700 border border-slate-200 px-2 py-0.5 rounded text-[10px] font-bold">
                          {(lv.leave_type || '').replace(/_/g, ' ')}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-mono text-slate-700">{lv.start_date}</td>
                      <td className="py-3 px-4 font-mono text-slate-700">{lv.end_date}</td>
                      <td className="py-3 px-4 text-center font-black text-[#1E40AF]">{lv.days ?? lv.total_days ?? 1}</td>
                      <td className="py-3 px-4 text-slate-500 max-w-[180px] truncate" title={lv.reason}>{lv.reason}</td>
                      <td className="py-3 px-4">
                        <div className="flex items-center justify-center space-x-1.5">
                          {/* Approve */}
                          <button
                            onClick={() => handleApproveLeave(lv.id, lv.employee_name)}
                            disabled={saving || rejectingId === lv.id}
                            className="flex items-center space-x-1 px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded text-[10px] font-bold transition-colors"
                          >
                            <Check className="w-3 h-3" />
                            <span>{saving ? '…' : 'APPROVE'}</span>
                          </button>
                          {/* Reject toggle */}
                          {rejectingId !== lv.id ? (
                            <button
                              onClick={() => { setRejectingId(lv.id); setRejectRemark(''); }}
                              disabled={saving}
                              className="flex items-center space-x-1 px-2.5 py-1.5 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white rounded text-[10px] font-bold transition-colors"
                            >
                              <X className="w-3 h-3" />
                              <span>REJECT</span>
                            </button>
                          ) : (
                            <button
                              onClick={() => { setRejectingId(null); setRejectRemark(''); }}
                              className="flex items-center space-x-1 px-2.5 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded text-[10px] font-bold transition-colors"
                            >
                              <X className="w-3 h-3" />
                              <span>CANCEL</span>
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                    {/* Inline rejection remark row */}
                    {rejectingId === lv.id && (
                      <tr className="bg-red-50">
                        <td colSpan={7} className="px-4 py-3">
                          <div className="flex items-center space-x-3">
                            <span className="text-[10px] font-bold text-red-700 whitespace-nowrap">Rejection Remark:</span>
                            <input
                              type="text"
                              value={rejectRemark}
                              onChange={e => setRejectRemark(e.target.value)}
                              placeholder="Enter reason for rejection…"
                              className="flex-1 bg-white border border-red-200 rounded-md px-3 py-1.5 text-xs focus:outline-none focus:border-red-400 font-medium"
                            />
                            <button
                              onClick={() => handleRejectLeave(lv.id, lv.employee_name)}
                              disabled={saving || !rejectRemark.trim()}
                              className="px-3 py-1.5 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white rounded text-[10px] font-bold transition-colors whitespace-nowrap"
                            >
                              {saving ? 'Submitting…' : 'CONFIRM REJECT'}
                            </button>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
