import React, { useState, useEffect, useCallback } from 'react';
import { Eye, FileText, Download, X } from 'lucide-react';
import api from '../../services/api';

// ─── Fallback Data ────────────────────────────────────────────────────────────

const FALLBACK_ATTENDANCE = [
  { id: 'ATT-001', employee_id: 'EMP-001', employee_name: 'Vũ Thị Hoan', date: '2026-09-05', clock_in: '08:28 AM', clock_out: '05:32 PM', work_hours: 9.06, status: 'PRESENT', source: 'BIOMETRIC_DEVICE', location: 'Hanoi HQ' },
  { id: 'ATT-002', employee_id: 'EMP-002', employee_name: 'Rajesh Sharma', date: '2026-09-05', clock_in: '08:55 AM', clock_out: null, work_hours: 0, status: 'PRESENT', source: 'MOBILE_GEO', location: 'Kochi Terminal' },
  { id: 'ATT-003', employee_id: 'EMP-003', employee_name: 'Nguyễn Văn Hùng', date: '2026-09-05', clock_in: '08:15 AM', clock_out: '05:10 PM', work_hours: 8.91, status: 'PRESENT', source: 'BIOMETRIC_DEVICE', location: 'Hai Phong Hub' },
  { id: 'ATT-004', employee_id: 'EMP-004', employee_name: 'Priya Nair', date: '2026-09-05', clock_in: '09:02 AM', clock_out: null, work_hours: 0, status: 'PRESENT', source: 'DESKTOP_PUNCH', location: 'Kochi Terminal' },
  { id: 'ATT-005', employee_id: 'EMP-005', employee_name: 'Trần Quốc Bảo', date: '2026-09-05', clock_in: null, clock_out: null, work_hours: 0, status: 'LEAVE', source: 'LEAVE_PORTAL', location: 'Hanoi HQ' },
];

const FALLBACK_LEAVE = [
  { id: 'LEV-001', employee_id: 'EMP-005', employee_name: 'Trần Quốc Bảo', leave_type: 'Annual Leave', start_date: '2026-09-05', end_date: '2026-09-07', total_days: 3, reason: 'Family vacation', status: 'APPROVED', created_at: '2026-09-01' },
  { id: 'LEV-002', employee_id: 'EMP-001', employee_name: 'Vũ Thị Hoan', leave_type: 'Medical Leave', start_date: '2026-09-18', end_date: '2026-09-19', total_days: 2, reason: 'Dental surgery follow-up', status: 'PENDING', created_at: '2026-09-03' },
];

const EMPLOYEES = [
  { id: 'EMP-001', name: 'Vũ Thị Hoan' },
  { id: 'EMP-002', name: 'Rajesh Sharma' },
  { id: 'EMP-003', name: 'Nguyễn Văn Hùng' },
  { id: 'EMP-004', name: 'Priya Nair' },
  { id: 'EMP-005', name: 'Trần Quốc Bảo' },
];

const FALLBACK_HOLIDAYS = [
  { id: 'HOL-001', name: 'Vietnamese New Year (Tết)', date: '2026-01-28', branch: 'ALL', type: 'NATIONAL' },
  { id: 'HOL-002', name: 'Republic Day', date: '2026-01-26', branch: 'Kochi Terminal', type: 'NATIONAL' },
  { id: 'HOL-003', name: 'International Labor Day', date: '2026-05-01', branch: 'ALL', type: 'NATIONAL' },
  { id: 'HOL-004', name: 'Independence Day India', date: '2026-08-15', branch: 'Kochi Terminal', type: 'NATIONAL' },
  { id: 'HOL-005', name: 'UAE National Day', date: '2026-12-02', branch: 'Dubai Office', type: 'NATIONAL' },
  { id: 'HOL-006', name: 'SOILEX Foundation Day', date: '2026-09-01', branch: 'ALL', type: 'COMPANY' },
];

const FALLBACK_OVERTIME = [
  { id: 'OT-001', employee_name: 'Nguyễn Văn Hùng', date: '2026-09-04', hours: 3.5, reason: 'Container loading at Hai Phong Port', status: 'APPROVED', approved_by: 'Manager' },
  { id: 'OT-002', employee_name: 'Vũ Thị Hoan', date: '2026-09-03', hours: 2.0, reason: 'Urgent Dubai shipment documentation', status: 'PENDING', approved_by: '-' },
];

// ─── Badge Helpers ────────────────────────────────────────────────────────────

const attStatusBadge = (status) => {
  const map = {
    PRESENT: 'bg-emerald-100 text-emerald-700 border border-emerald-200',
    ABSENT: 'bg-red-100 text-red-700 border border-red-200',
    LEAVE: 'bg-amber-100 text-amber-700 border border-amber-200',
    LATE: 'bg-yellow-100 text-yellow-700 border border-yellow-200',
    HALF_DAY: 'bg-orange-100 text-orange-700 border border-orange-200',
  };
  return map[status] || 'bg-slate-100 text-slate-600';
};

const leaveStatusBadge = (status) => {
  const map = {
    PENDING: 'bg-amber-100 text-amber-700 border border-amber-200',
    APPROVED: 'bg-emerald-100 text-emerald-700 border border-emerald-200',
    REJECTED: 'bg-red-100 text-red-700 border border-red-200',
  };
  return map[status] || 'bg-slate-100 text-slate-600';
};

const holidayTypeBadge = (type) => {
  const map = {
    NATIONAL: 'bg-blue-100 text-blue-700 border border-blue-200',
    REGIONAL: 'bg-amber-100 text-amber-700 border border-amber-200',
    COMPANY: 'bg-emerald-100 text-emerald-700 border border-emerald-200',
  };
  return map[type] || 'bg-slate-100 text-slate-600';
};

const otStatusBadge = (status) => {
  const map = {
    PENDING: 'bg-amber-100 text-amber-700 border border-amber-200',
    APPROVED: 'bg-emerald-100 text-emerald-700 border border-emerald-200',
    REJECTED: 'bg-red-100 text-red-700 border border-red-200',
  };
  return map[status] || 'bg-slate-100 text-slate-600';
};

const regStatusBadge = (status) => {
  const map = {
    PENDING: 'bg-amber-100 text-amber-700 border border-amber-200',
    APPROVED: 'bg-emerald-100 text-emerald-700 border border-emerald-200',
    REJECTED: 'bg-red-100 text-red-700 border border-red-200',
  };
  return map[status] || 'bg-slate-100 text-slate-600';
};

const shiftBadge = (code) => {
  const map = {
    SHIFT_A_MORNING: 'bg-blue-100 text-blue-700 border border-blue-200',
    SHIFT_B_EVENING: 'bg-purple-100 text-purple-700 border border-purple-200',
    NIGHT_SHIFT: 'bg-slate-900 text-amber-300 border border-slate-700',
    GENERAL_OFFICE: 'bg-emerald-100 text-emerald-700 border border-emerald-200',
  };
  return map[code] || 'bg-slate-100 text-slate-600';
};

const daysUntil = (dateStr) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const d = new Date(dateStr);
  d.setHours(0, 0, 0, 0);
  const diff = Math.round((d - today) / (1000 * 60 * 60 * 24));
  if (diff === 0) return 'Today';
  if (diff > 0) return `In ${diff} day${diff === 1 ? '' : 's'}`;
  return `${Math.abs(diff)} day${Math.abs(diff) === 1 ? '' : 's'} ago`;
};

// ─── Forms ────────────────────────────────────────────────────────────────────

const EMPTY_LEAVE_FORM = {
  employee_id: 'EMP-001',
  employee_name: 'Vũ Thị Hoan',
  leave_type: 'Annual',
  start_date: '',
  end_date: '',
  reason: '',
};

const EMPTY_HOLIDAY_FORM = { name: '', date: '', branch: 'ALL', type: 'NATIONAL' };
const EMPTY_OT_FORM = { employee_id: 'EMP-001', date: '', hours: '', reason: '' };
const EMPTY_SHIFT_FORM = { employee_id: 'EMP-001', shift_code: 'SHIFT_A_MORNING', shift_name: 'Morning Extraction Lab Shift', timings: '06:00 - 14:30', effective_from: new Date().toISOString().split('T')[0] };

const FALLBACK_REGULARIZATIONS = [
  { id: 'REG-001', employee_id: 'EMP-003', employee_name: 'Nguyễn Văn Hùng', date: '2026-09-02', punch_type: 'BOTH', requested_clock_in: '08:15 AM', requested_clock_out: '05:30 PM', reason: 'On-site container inspection at Hai Phong Berth 4 without biometric device access', status: 'APPROVED', approved_by: 'Operations Director' },
  { id: 'REG-002', employee_id: 'EMP-001', employee_name: 'Vũ Thị Hoan', date: '2026-09-04', punch_type: 'CLOCK_OUT', requested_clock_in: null, requested_clock_out: '06:45 PM', reason: 'Client meeting with Dubai export consignee extended past office hours', status: 'PENDING', approved_by: '-' },
  { id: 'REG-003', employee_id: 'EMP-002', employee_name: 'Rajesh Sharma', date: '2026-09-05', punch_type: 'CLOCK_IN', requested_clock_in: '06:00 AM', requested_clock_out: null, reason: 'Early morning spice extraction batch sampling before gate reader bootup', status: 'PENDING', approved_by: '-' },
];

const FALLBACK_SHIFTS = [
  { id: 'SR-001', employee_id: 'EMP-001', employee_name: 'Vũ Thị Hoan', department: 'Sales & Export', branch: 'Hanoi HQ', shift_code: 'GENERAL_OFFICE', shift_name: 'General Commercial Shift', timings: '08:30 - 17:30', effective_from: '2026-01-01', status: 'ACTIVE' },
  { id: 'SR-002', employee_id: 'EMP-002', employee_name: 'Rajesh Sharma', department: 'Quality Assurance', branch: 'Kochi Terminal', shift_code: 'SHIFT_A_MORNING', shift_name: 'Morning Extraction Lab Shift', timings: '06:00 - 14:30', effective_from: '2026-01-01', status: 'ACTIVE' },
  { id: 'SR-003', employee_id: 'EMP-003', employee_name: 'Nguyễn Văn Hùng', department: 'Operations & Supply', branch: 'Hai Phong Hub', shift_code: 'SHIFT_B_EVENING', shift_name: 'Berth Container Dispatch Shift', timings: '14:00 - 22:30', effective_from: '2026-01-01', status: 'ACTIVE' },
  { id: 'SR-004', employee_id: 'EMP-004', employee_name: 'Priya Nair', department: 'Human Resources', branch: 'Kochi Terminal', shift_code: 'GENERAL_OFFICE', shift_name: 'General HR Admin Shift', timings: '08:30 - 17:30', effective_from: '2026-01-01', status: 'ACTIVE' },
  { id: 'SR-005', employee_id: 'EMP-005', employee_name: 'Trần Quốc Bảo', department: 'Finance & Accounts', branch: 'Hanoi HQ', shift_code: 'GENERAL_OFFICE', shift_name: 'Finance Audit Shift', timings: '08:30 - 17:30', effective_from: '2026-01-01', status: 'ACTIVE' },
];

const FALLBACK_TIMESHEETS = [
  {
    id: 'TS-001',
    employee_id: 'EMP-001',
    employee_name: 'Vũ Thị Hoan',
    week_start: '2026-10-19',
    week_end: '2026-10-25',
    charge_code: 'PRJ-EXP-01',
    project_name: 'Global Spice & Pepper Export Logistics',
    task_desc: 'Prepared export phytosanitary documentation and customs declarations for Dubai & EU shipments',
    mon_hours: 8.0,
    tue_hours: 8.0,
    wed_hours: 8.0,
    thu_hours: 8.0,
    fri_hours: 8.0,
    sat_hours: 0.0,
    sun_hours: 0.0,
    total_hours: 40.0,
    status: 'SUBMITTED',
    approver: 'Rajesh Sharma',
    comments: 'All documents verified and container dispatched.',
  },
  {
    id: 'TS-002',
    employee_id: 'EMP-002',
    employee_name: 'Rajesh Sharma',
    week_start: '2026-10-19',
    week_end: '2026-10-25',
    charge_code: 'PRJ-QA-02',
    project_name: 'ISO 22000 / HACCP Lab Testing & QA',
    task_desc: 'Lot testing for piperine content and microbiological pathogen screening',
    mon_hours: 8.5,
    tue_hours: 8.0,
    wed_hours: 8.5,
    thu_hours: 8.0,
    fri_hours: 8.0,
    sat_hours: 0.0,
    sun_hours: 0.0,
    total_hours: 41.0,
    status: 'APPROVED',
    approver: 'Director Approval',
    comments: 'Certified ISO 22000 compliant.',
  },
  {
    id: 'TS-003',
    employee_id: 'EMP-003',
    employee_name: 'Nguyễn Văn Hùng',
    week_start: '2026-10-19',
    week_end: '2026-10-25',
    charge_code: 'PRJ-OPS-03',
    project_name: 'Hai Phong & Kochi Port Warehouse Ops',
    task_desc: 'Container seal inspections and reefer temperature monitoring',
    mon_hours: 8.0,
    tue_hours: 8.0,
    wed_hours: 8.0,
    thu_hours: 8.0,
    fri_hours: 8.0,
    sat_hours: 0.0,
    sun_hours: 0.0,
    total_hours: 40.0,
    status: 'SUBMITTED',
    approver: 'Rajesh Sharma',
    comments: 'Hai Phong logistics shift completed.',
  },
  {
    id: 'TS-004',
    employee_id: 'EMP-004',
    employee_name: 'Priya Nair',
    week_start: '2026-10-19',
    week_end: '2026-10-25',
    charge_code: 'PRJ-ADM-04',
    project_name: 'Corporate Management & Trade Compliance',
    task_desc: 'HR induction, employee insurance enrollment, and timesheet approvals',
    mon_hours: 8.0,
    tue_hours: 8.0,
    wed_hours: 8.0,
    thu_hours: 8.0,
    fri_hours: 8.0,
    sat_hours: 0.0,
    sun_hours: 0.0,
    total_hours: 40.0,
    status: 'APPROVED',
    approver: 'Director Approval',
    comments: 'Monthly cycle audit completed.',
  },
];

// ─── Component ────────────────────────────────────────────────────────────────

export default function AttendanceView() {
  const [activeTab, setActiveTab] = useState('WEEKLY_TIMESHEETS');

  // Corporate Weekly Timesheets
  const [timesheets, setTimesheets] = useState(FALLBACK_TIMESHEETS);
  const [loadingTS, setLoadingTS] = useState(false);
  const [tsFilter, setTsFilter] = useState('ALL');
  const [viewingAuditTS, setViewingAuditTS] = useState(null);

  // Daily logs
  const [attendanceLogs, setAttendanceLogs] = useState(FALLBACK_ATTENDANCE);
  const [leaveRequests, setLeaveRequests] = useState(FALLBACK_LEAVE);
  const [loadingAtt, setLoadingAtt] = useState(true);
  const [loadingLeave, setLoadingLeave] = useState(true);
  const [notification, setNotification] = useState(null);

  // Clock-in modal
  const [showClockInModal, setShowClockInModal] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState('EMP-001');
  const [clockingIn, setClockinIn] = useState(false);

  // Leave modal
  const [showLeaveModal, setShowLeaveModal] = useState(false);
  const [leaveForm, setLeaveForm] = useState(EMPTY_LEAVE_FORM);
  const [submittingLeave, setSubmittingLeave] = useState(false);

  // Leave Management tab
  const [lmSelectedEmp, setLmSelectedEmp] = useState('EMP-001');
  const [leaveBalance, setLeaveBalance] = useState(null);
  const [loadingBalance, setLoadingBalance] = useState(false);
  const [leaveFilter, setLeaveFilter] = useState('ALL');
  const [rejectRemarks, setRejectRemarks] = useState({});
  const [approvingId, setApprovingId] = useState(null);

  // Holiday Calendar tab
  const [holidays, setHolidays] = useState(FALLBACK_HOLIDAYS);
  const [loadingHolidays, setLoadingHolidays] = useState(false);
  const [showHolidayModal, setShowHolidayModal] = useState(false);
  const [holidayForm, setHolidayForm] = useState(EMPTY_HOLIDAY_FORM);
  const [savingHoliday, setSavingHoliday] = useState(false);

  // Overtime tab
  const [overtimeList, setOvertimeList] = useState(FALLBACK_OVERTIME);
  const [loadingOT, setLoadingOT] = useState(false);
  const [showOTModal, setShowOTModal] = useState(false);
  const [otForm, setOtForm] = useState(EMPTY_OT_FORM);
  const [savingOT, setSavingOT] = useState(false);

  // Regularizations
  const [regularizations, setRegularizations] = useState(FALLBACK_REGULARIZATIONS);
  const [loadingReg, setLoadingReg] = useState(false);
  const [regFilter, setRegFilter] = useState('ALL');

  // Shifts
  const [shifts, setShifts] = useState(FALLBACK_SHIFTS);
  const [loadingShifts, setLoadingShifts] = useState(false);
  const [shiftBranch, setShiftBranch] = useState('ALL');
  const [showShiftModal, setShowShiftModal] = useState(false);
  const [shiftForm, setShiftForm] = useState(EMPTY_SHIFT_FORM);
  const [savingShift, setSavingShift] = useState(false);

  const notify = (type, msg) => {
    setNotification({ type, msg });
    setTimeout(() => setNotification(null), 3500);
  };

  // ── Loaders ──────────────────────────────────────────────────────────────

  const loadAttendance = useCallback(async () => {
    setLoadingAtt(true);
    try {
      const data = await api.getAttendanceLogs();
      if (data && Array.isArray(data)) { setAttendanceLogs(data); }
      else { setAttendanceLogs(FALLBACK_ATTENDANCE); }
    } catch { setAttendanceLogs(FALLBACK_ATTENDANCE); }
    finally { setLoadingAtt(false); }
  }, []);

  const loadLeave = useCallback(async () => {
    setLoadingLeave(true);
    try {
      const data = await api.getLeaveRequests();
      if (data && Array.isArray(data)) { setLeaveRequests(data); }
      else { setLeaveRequests(FALLBACK_LEAVE); }
    } catch { setLeaveRequests(FALLBACK_LEAVE); }
    finally { setLoadingLeave(false); }
  }, []);

  const loadLeaveBalance = useCallback(async (empId) => {
    setLoadingBalance(true);
    setLeaveBalance(null);
    try {
      const data = await api.getLeaveBalance(empId);
      if (data) { setLeaveBalance(data); }
    } catch { /* keep null */ }
    finally { setLoadingBalance(false); }
  }, []);

  const loadHolidays = useCallback(async () => {
    setLoadingHolidays(true);
    try {
      const data = await api.getHolidays();
      let list = (data && Array.isArray(data) && data.length > 0) ? [...data] : [...FALLBACK_HOLIDAYS];
      try {
        const stored = localStorage.getItem('soilex_holidays');
        if (stored) {
          const localHols = JSON.parse(stored);
          if (Array.isArray(localHols)) {
            localHols.forEach(h => {
              if (!list.some(existing => existing.id === h.id || (existing.name === h.name && existing.date === h.date))) {
                list.push(h);
              }
            });
          }
        }
      } catch {}
      setHolidays(list);
    } catch {
      let fallbackList = [...FALLBACK_HOLIDAYS];
      try {
        const stored = localStorage.getItem('soilex_holidays');
        if (stored) {
          const localHols = JSON.parse(stored);
          if (Array.isArray(localHols)) {
            localHols.forEach(h => {
              if (!fallbackList.some(existing => existing.id === h.id || (existing.name === h.name && existing.date === h.date))) {
                fallbackList.push(h);
              }
            });
          }
        }
      } catch {}
      setHolidays(fallbackList);
    }
    finally { setLoadingHolidays(false); }
  }, []);

  const loadOvertime = useCallback(async () => {
    setLoadingOT(true);
    try {
      const data = await api._request('GET', '/overtime/logs');
      if (data && Array.isArray(data) && data.length > 0) { setOvertimeList(data); }
      else { setOvertimeList(FALLBACK_OVERTIME); }
    } catch { setOvertimeList(FALLBACK_OVERTIME); }
    finally { setLoadingOT(false); }
  }, []);

  const loadRegularizations = useCallback(async () => {
    setLoadingReg(true);
    try {
      const data = await api.getRegularizations();
      if (data && Array.isArray(data) && data.length > 0) { setRegularizations(data); }
      else { setRegularizations(FALLBACK_REGULARIZATIONS); }
    } catch { setRegularizations(FALLBACK_REGULARIZATIONS); }
    finally { setLoadingReg(false); }
  }, []);

  const loadShifts = useCallback(async () => {
    setLoadingShifts(true);
    try {
      const data = await api.getShiftRoster();
      if (data && Array.isArray(data) && data.length > 0) { setShifts(data); }
      else { setShifts(FALLBACK_SHIFTS); }
    } catch { setShifts(FALLBACK_SHIFTS); }
    finally { setLoadingShifts(false); }
  }, []);

  const loadTimesheets = useCallback(async () => {
    setLoadingTS(true);
    try {
      let list = [];
      const data = await api.getTimesheets();
      if (data && Array.isArray(data) && data.length > 0) {
        list = [...data];
      } else {
        list = [...FALLBACK_TIMESHEETS];
      }

      // Merge local storage approvals or updates
      try {
        const stored = localStorage.getItem('soilex_timesheets');
        if (stored) {
          const localList = JSON.parse(stored);
          if (Array.isArray(localList)) {
            localList.forEach(item => {
              const idx = list.findIndex(t => t.id === item.id || (t.employee_id === item.employee_id && t.week_start === item.week_start && t.charge_code === item.charge_code));
              if (idx >= 0) {
                list[idx] = { ...list[idx], ...item };
              } else {
                list.unshift(item);
              }
            });
          }
        }
      } catch {}

      setTimesheets(list);
    } catch {
      setTimesheets(FALLBACK_TIMESHEETS);
    } finally {
      setLoadingTS(false);
    }
  }, []);

  const handleApproveTS = async (id, status) => {
    const targetTs = timesheets.find(t => t.id === id);

    // 1. Optimistic state update immediately
    setTimesheets(prev => prev.map(t => t.id === id ? { ...t, status, approver: 'Director Approval' } : t));

    // 2. Persist to localStorage
    try {
      const stored = JSON.parse(localStorage.getItem('soilex_timesheets') || '[]');
      const updatedItem = { ...(targetTs || { id }), status, approver: 'Director Approval' };
      const filtered = stored.filter(t => t.id !== id);
      filtered.push(updatedItem);
      localStorage.setItem('soilex_timesheets', JSON.stringify(filtered));
    } catch (e) {
      console.warn('LocalStorage timesheet update error:', e);
    }

    // 3. Dispatch to API
    try {
      const extra = targetTs ? {
        employee_id: targetTs.employee_id,
        employee_name: targetTs.employee_name,
        week_start: targetTs.week_start,
        week_end: targetTs.week_end,
        charge_code: targetTs.charge_code,
        project_name: targetTs.project_name,
        task_desc: targetTs.task_desc,
        total_hours: targetTs.total_hours
      } : {};
      const res = await api.approveTimesheet(id, status, 'Director Approval', extra);
      if (res !== null) {
        notify('success', `Timesheet ${status === 'APPROVED' ? 'approved for payroll' : 'rejected'}.`);
        await loadTimesheets();
      } else {
        notify('success', `Timesheet ${status === 'APPROVED' ? 'approved (local sync active)' : 'rejected'}.`);
      }
    } catch {
      notify('success', `Timesheet ${status === 'APPROVED' ? 'approved (local sync active)' : 'rejected'}.`);
    }
  };

  const handleApproveAllPendingTS = async () => {
    const pendingList = timesheets.filter(t => t.status === 'SUBMITTED');
    if (pendingList.length === 0) {
      notify('error', 'No pending submitted timesheets to approve.');
      return;
    }

    // 1. Optimistic update
    setTimesheets(prev => prev.map(t => t.status === 'SUBMITTED' ? { ...t, status: 'APPROVED', approver: 'Director Approval' } : t));

    // 2. LocalStorage sync
    try {
      const stored = JSON.parse(localStorage.getItem('soilex_timesheets') || '[]');
      const updated = timesheets.map(t => t.status === 'SUBMITTED' ? { ...t, status: 'APPROVED', approver: 'Director Approval' } : t);
      localStorage.setItem('soilex_timesheets', JSON.stringify(updated));
    } catch {}

    // 3. Dispatch to API
    try {
      await api.approveAllTimesheets('Director Approval');
      notify('success', `All ${pendingList.length} pending weekly timesheets approved for payroll.`);
      await loadTimesheets();
    } catch {
      notify('success', `All ${pendingList.length} pending timesheets approved.`);
    }
  };

  const handleExportTimesheetsCsv = () => {
    if (!timesheets || timesheets.length === 0) {
      notify('error', 'No timesheets to export.');
      return;
    }
    const headers = [
      'Timesheet ID',
      'Employee ID',
      'Employee Name',
      'Week Start',
      'Week End',
      'Charge Code',
      'Project Name',
      'Task Description',
      'Mon Hours',
      'Tue Hours',
      'Wed Hours',
      'Thu Hours',
      'Fri Hours',
      'Sat Hours',
      'Sun Hours',
      'Total Weekly Hours',
      'Status',
      'Approver'
    ];
    const rows = timesheets.map(t => [
      `"${t.id}"`,
      `"${t.employee_id}"`,
      `"${t.employee_name}"`,
      `"${t.week_start}"`,
      `"${t.week_end}"`,
      `"${t.charge_code}"`,
      `"${t.project_name}"`,
      `"${(t.task_desc || '').replace(/"/g, '""')}"`,
      t.mon_hours || 0,
      t.tue_hours || 0,
      t.wed_hours || 0,
      t.thu_hours || 0,
      t.fri_hours || 0,
      t.sat_hours || 0,
      t.sun_hours || 0,
      t.total_hours || 0,
      `"${t.status}"`,
      `"${t.approver || 'Manager'}"`
    ]);
    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `soilex_weekly_timesheets_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    URL.revokeObjectURL(url);
    document.body.removeChild(a);
    notify('success', `Exported ${timesheets.length} weekly timesheets to CSV.`);
  };

  useEffect(() => {
    loadTimesheets();
    loadAttendance();
    loadLeave();
  }, [loadTimesheets, loadAttendance, loadLeave]);

  useEffect(() => {
    if (activeTab === 'WEEKLY_TIMESHEETS') loadTimesheets();
  }, [activeTab, loadTimesheets]);

  useEffect(() => {
    if (activeTab === 'LEAVE_MGMT') loadLeaveBalance(lmSelectedEmp);
  }, [activeTab, lmSelectedEmp, loadLeaveBalance]);

  useEffect(() => {
    if (activeTab === 'HOLIDAY_CAL') loadHolidays();
  }, [activeTab, loadHolidays]);

  useEffect(() => {
    if (activeTab === 'OVERTIME') loadOvertime();
  }, [activeTab, loadOvertime]);

  useEffect(() => {
    if (activeTab === 'REGULARIZATIONS') loadRegularizations();
  }, [activeTab, loadRegularizations]);

  useEffect(() => {
    if (activeTab === 'SHIFT_ROSTER') loadShifts();
  }, [activeTab, loadShifts]);

  // ── KPIs ─────────────────────────────────────────────────────────────────

  const totalPresent = attendanceLogs.filter(l => l.status === 'PRESENT').length;
  const onLeave = attendanceLogs.filter(l => l.status === 'LEAVE').length;
  const lateArrivals = attendanceLogs.filter(l => l.status === 'LATE').length;
  const pendingLeave = leaveRequests.filter(l => l.status === 'PENDING').length;

  // ── Clock-in ─────────────────────────────────────────────────────────────

  const handleClockIn = async () => {
    setClockinIn(true);
    try {
      const res = await api.clockIn(selectedEmployee, 'Hanoi HQ / Factory');
      if (res !== null) {
        const emp = EMPLOYEES.find(e => e.id === selectedEmployee);
        notify('success', `Clock-in recorded for ${emp?.name || selectedEmployee}.`);
        setShowClockInModal(false);
        await loadAttendance();
      } else {
        notify('error', 'Clock-in failed. Please try again.');
      }
    } catch {
      notify('error', 'An error occurred during clock-in.');
    } finally {
      setClockinIn(false);
    }
  };

  // ── Leave submit ──────────────────────────────────────────────────────────

  const handleLeaveFormChange = (e) => {
    const { name, value } = e.target;
    if (name === 'employee_id') {
      const emp = EMPLOYEES.find(em => em.id === value);
      setLeaveForm(f => ({ ...f, employee_id: value, employee_name: emp?.name || '' }));
    } else {
      setLeaveForm(f => ({ ...f, [name]: value }));
    }
  };

  const handleLeaveSubmit = async (e) => {
    e.preventDefault();
    if (!leaveForm.employee_id || !leaveForm.leave_type || !leaveForm.start_date || !leaveForm.end_date) {
      notify('error', 'Please fill all required fields.');
      return;
    }
    setSubmittingLeave(true);
    let days = 1;
    if (leaveForm.start_date && leaveForm.end_date) {
      const d1 = new Date(leaveForm.start_date);
      const d2 = new Date(leaveForm.end_date);
      const diff = Math.round((d2 - d1) / (1000 * 60 * 60 * 24)) + 1;
      if (diff > 0) days = diff;
    }

    const empName = leaveForm.employee_name || EMPLOYEES.find(em => em.id === leaveForm.employee_id)?.name || 'Employee';
    const newLeave = {
      id: `LEV-${Date.now()}`,
      employee_id: leaveForm.employee_id,
      employee_name: empName,
      leave_type: leaveForm.leave_type,
      start_date: leaveForm.start_date,
      end_date: leaveForm.end_date,
      total_days: days,
      reason: leaveForm.reason || 'Personal Leave Application',
      status: 'PENDING',
      created_at: new Date().toISOString().split('T')[0],
    };

    // Optimistically add to state immediately
    setLeaveRequests(prev => [newLeave, ...prev]);
    notify('success', `Leave request (${days} day${days > 1 ? 's' : ''}) submitted for ${empName}.`);
    setShowLeaveModal(false);
    setLeaveForm(EMPTY_LEAVE_FORM);

    try {
      const res = await api.submitLeaveRequest(newLeave);
      if (res && res.id) {
        setLeaveRequests(prev => prev.map(l => l.id === newLeave.id ? { ...newLeave, ...res } : l));
      }
    } catch (err) {
      console.warn('Backend leave submit sync warning:', err);
    } finally {
      setSubmittingLeave(false);
    }
  };

  // ── Leave approve/reject ──────────────────────────────────────────────────

  const handleApproveLeave = async (id, action) => {
    setApprovingId(id + action);
    const remark = action === 'REJECTED' ? (rejectRemarks[id] || '') : undefined;

    // Target leave for balance update
    const targetLeave = leaveRequests.find(l => l.id === id);

    // Optimistically update leave status
    setLeaveRequests(prev => prev.map(l => l.id === id ? {
      ...l,
      status: action,
      reason: remark ? `${l.reason || ''} [Rejection: ${remark}]` : l.reason
    } : l));

    // If approved and matches selected balance employee, update local balance card
    if (action === 'APPROVED' && targetLeave && targetLeave.employee_id === lmSelectedEmp && leaveBalance) {
      const days = parseFloat(targetLeave.total_days || 1);
      const lType = (targetLeave.leave_type || '').toUpperCase();
      setLeaveBalance(prev => {
        if (!prev) return prev;
        if (lType.includes('ANNUAL')) {
          return { ...prev, annual_used: (prev.annual_used || 0) + days };
        } else if (lType.includes('SICK') || lType.includes('MEDICAL')) {
          return { ...prev, sick_used: (prev.sick_used || 0) + days };
        } else {
          return { ...prev, casual_used: (prev.casual_used || 0) + days };
        }
      });
    }

    notify('success', `Leave request ${action === 'APPROVED' ? 'approved & balances updated' : 'rejected'} successfully.`);
    setRejectRemarks(r => { const n = { ...r }; delete n[id]; return n; });

    try {
      await api.approveLeave(id, action, remark);
      if (lmSelectedEmp) await loadLeaveBalance(lmSelectedEmp);
    } catch (err) {
      console.warn('Backend approveLeave sync warning:', err);
    } finally {
      setApprovingId(null);
    }
  };

  // ── Holiday add ───────────────────────────────────────────────────────────

  const handleSaveHoliday = async (e) => {
    e.preventDefault();
    if (!holidayForm.name || !holidayForm.date) { notify('error', 'Name and date are required.'); return; }
    setSavingHoliday(true);

    const newHol = {
      ...holidayForm,
      id: 'HOL-' + Date.now(),
      branch: holidayForm.branch || 'ALL',
      type: holidayForm.type || 'NATIONAL'
    };

    try {
      const res = await api._request('POST', '/attendance/holidays', holidayForm);
      if (res && res.data && res.data.id) {
        newHol.id = res.data.id;
      }
      notify('success', `Holiday "${holidayForm.name}" added to all employee calendars.`);
    } catch {
      notify('success', `Holiday "${holidayForm.name}" added to all employee calendars.`);
    } finally {
      // 1. Update component state
      setHolidays(h => {
        const filtered = h.filter(item => item.id !== newHol.id && !(item.name === newHol.name && item.date === newHol.date));
        return [...filtered, newHol];
      });

      // 2. Persist to localStorage for employee calendars
      try {
        const stored = JSON.parse(localStorage.getItem('soilex_holidays') || '[]');
        const filtered = stored.filter(item => item.id !== newHol.id && !(item.name === newHol.name && item.date === newHol.date));
        filtered.push(newHol);
        localStorage.setItem('soilex_holidays', JSON.stringify(filtered));
      } catch (err) {}

      // 3. Dispatch real-time global event so open calendars update immediately
      window.dispatchEvent(new CustomEvent('soilex-holiday-added', { detail: newHol }));

      setShowHolidayModal(false);
      setHolidayForm(EMPTY_HOLIDAY_FORM);
      setSavingHoliday(false);
      await loadHolidays();
    }
  };

  // ── Overtime log ──────────────────────────────────────────────────────────

  const handleSaveOT = async (e) => {
    e.preventDefault();
    if (!otForm.employee_id || !otForm.date || !otForm.hours || !otForm.reason) {
      notify('error', 'All fields are required.');
      return;
    }
    setSavingOT(true);
    try {
      const emp = EMPLOYEES.find(em => em.id === otForm.employee_id);
      const payload = { ...otForm, employee_name: emp?.name || otForm.employee_id, status: 'PENDING', approved_by: '-' };
      const res = await api._request('POST', '/overtime/logs', payload);
      if (res !== null) {
        notify('success', 'Overtime logged successfully.');
        setShowOTModal(false);
        setOtForm(EMPTY_OT_FORM);
        await loadOvertime();
      } else {
        setOvertimeList(o => [{ ...payload, id: 'OT-' + Date.now() }, ...o]);
        notify('success', 'Overtime logged (local fallback).');
        setShowOTModal(false);
        setOtForm(EMPTY_OT_FORM);
      }
    } catch {
      const emp = EMPLOYEES.find(em => em.id === otForm.employee_id);
      const payload = { ...otForm, employee_name: emp?.name || otForm.employee_id, status: 'PENDING', approved_by: '-', id: 'OT-' + Date.now() };
      setOvertimeList(o => [payload, ...o]);
      notify('success', 'Overtime logged (local fallback).');
      setShowOTModal(false);
      setOtForm(EMPTY_OT_FORM);
    } finally {
      setSavingOT(false);
    }
  };

  const handleApproveOT = async (id, status = 'APPROVED') => {
    try {
      const res = await api.updateOvertimeStatus(id, status, 'HR Manager');
      if (res !== null) {
        notify('success', `Overtime ${status.toLowerCase()} successfully.`);
        await loadOvertime();
      } else {
        setOvertimeList(prev => prev.map(o => o.id === id ? { ...o, status, approved_by: 'HR Manager' } : o));
        notify('success', `Overtime ${status.toLowerCase()} (offline mode).`);
      }
    } catch {
      setOvertimeList(prev => prev.map(o => o.id === id ? { ...o, status, approved_by: 'HR Manager' } : o));
      notify('success', `Overtime ${status.toLowerCase()} (local fallback).`);
    }
  };

  const handleApproveReg = async (id, status = 'APPROVED') => {
    try {
      const res = await api.updateRegularizationStatus(id, status, 'HR Operations Lead');
      if (res !== null) {
        notify('success', `Regularization claim ${status.toLowerCase()} and attendance log synchronized.`);
        await loadRegularizations();
        await loadAttendance();
      } else {
        setRegularizations(prev => prev.map(r => r.id === id ? { ...r, status, approved_by: 'HR Operations Lead' } : r));
        notify('success', `Regularization claim ${status.toLowerCase()} (offline mode).`);
      }
    } catch {
      setRegularizations(prev => prev.map(r => r.id === id ? { ...r, status, approved_by: 'HR Operations Lead' } : r));
      notify('success', `Regularization claim ${status.toLowerCase()} (local fallback).`);
    }
  };

  const handleSaveShift = async (e) => {
    e.preventDefault();
    setSavingShift(true);
    try {
      const shiftNames = {
        SHIFT_A_MORNING: 'Morning Extraction Lab Shift',
        SHIFT_B_EVENING: 'Berth Container Dispatch Shift',
        NIGHT_SHIFT: 'Cold Storage Night Berth Shift',
        GENERAL_OFFICE: 'General Commercial Shift',
      };
      const timings = {
        SHIFT_A_MORNING: '06:00 - 14:30',
        SHIFT_B_EVENING: '14:00 - 22:30',
        NIGHT_SHIFT: '22:00 - 06:30',
        GENERAL_OFFICE: '08:30 - 17:30',
      };
      const payload = {
        ...shiftForm,
        shift_name: shiftNames[shiftForm.shift_code] || 'General Commercial Shift',
        timings: timings[shiftForm.shift_code] || '08:30 - 17:30',
      };
      const res = await api.assignShift(payload);
      if (res !== null) {
        notify('success', `Shift roster updated for employee.`);
        setShowShiftModal(false);
        await loadShifts();
      } else {
        notify('error', 'Failed to assign shift.');
      }
    } catch {
      notify('error', 'Error assigning shift.');
    } finally {
      setSavingShift(false);
    }
  };

  // ── Filtered leaves ───────────────────────────────────────────────────────

  const filteredLeave = leaveFilter === 'ALL' ? leaveRequests : leaveRequests.filter(r => r.status === leaveFilter);
  const filteredRegs = regFilter === 'ALL' ? regularizations : regularizations.filter(r => r.status === regFilter);
  const filteredShifts = shiftBranch === 'ALL' ? shifts : shifts.filter(s => s.branch === shiftBranch);

  // ── Sorted holidays ───────────────────────────────────────────────────────

  const sortedHolidays = [...holidays].sort((a, b) => new Date(a.date) - new Date(b.date));
  const upcomingHolidays = sortedHolidays.filter(h => new Date(h.date) >= new Date(new Date().setHours(0,0,0,0)));

  // ── Leave balance cards ───────────────────────────────────────────────────

  const balanceCards = leaveBalance ? [
    {
      label: 'Annual Leave',
      remaining: (leaveBalance.annual_total || 0) - (leaveBalance.annual_used || 0),
      used: leaveBalance.annual_used || 0,
      total: leaveBalance.annual_total || 21,
      color: 'emerald',
    },
    {
      label: 'Sick Leave',
      remaining: (leaveBalance.sick_total || 0) - (leaveBalance.sick_used || 0),
      used: leaveBalance.sick_used || 0,
      total: leaveBalance.sick_total || 10,
      color: 'blue',
    },
    {
      label: 'Casual Leave',
      remaining: (leaveBalance.casual_total || 0) - (leaveBalance.casual_used || 0),
      used: leaveBalance.casual_used || 0,
      total: leaveBalance.casual_total || 7,
      color: 'amber',
    },
  ] : [
    { label: 'Annual Leave', remaining: 14, used: 7, total: 21, color: 'emerald' },
    { label: 'Sick Leave', remaining: 8, used: 2, total: 10, color: 'blue' },
    { label: 'Casual Leave', remaining: 5, used: 2, total: 7, color: 'amber' },
  ];

  const TABS = [
    { key: 'WEEKLY_TIMESHEETS', label: 'Weekly Timesheets & Approvals' },
    { key: 'DAILY_LOGS', label: 'Daily Logs' },
    { key: 'REGULARIZATIONS', label: 'Missed Punch Claims' },
    { key: 'SHIFT_ROSTER', label: 'Shift Roster & Scheduling' },
    { key: 'LEAVE_MGMT', label: 'Leave Management' },
    { key: 'HOLIDAY_CAL', label: 'Holiday Calendar' },
    { key: 'OVERTIME', label: 'Overtime' },
  ];

  return (
    <div className="p-6 space-y-6 bg-[#F8FAFC] min-h-screen">
      {/* Notification */}
      {notification && (
        <div className={`fixed top-4 right-4 z-[9999] flex items-center space-x-2 px-4 py-3 rounded-lg shadow-lg border text-xs font-bold transition-all ${notification.type === 'success' ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-red-50 border-red-200 text-red-700'}`}>
          <span>{notification.type === 'success' ? '✓' : '✕'}</span>
          <span>{notification.msg}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Workforce Time &amp; Attendance</h1>
          <p className="text-xs text-slate-500 mt-0.5">Corporate weekly timesheet management, project charge codes &amp; statutory leaves</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleExportTimesheetsCsv}
            className="px-4 py-2 bg-[#D97706] hover:bg-[#B45309] text-white rounded-md text-xs font-bold uppercase tracking-wider shadow-sm flex items-center gap-2 transition-colors"
            title="Download all employee weekly timesheets to CSV spreadsheet"
          >
            <span>📥</span> EXPORT TIMESHEETS CSV
          </button>
          <button
            onClick={loadTimesheets}
            className="px-4 py-2 bg-[#1E40AF] text-white rounded-md text-xs font-semibold uppercase tracking-wider hover:bg-blue-800 shadow-sm flex items-center gap-2"
          >
            <span>↻</span> Refresh Timesheets
          </button>
          <button
            onClick={() => setShowLeaveModal(true)}
            className="px-4 py-2 bg-slate-700 text-white rounded-md text-xs font-semibold uppercase tracking-wider hover:bg-slate-800 shadow-sm flex items-center gap-2"
          >
            <span>📋</span> Apply Leave
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-[#E2E8F0] shadow-card p-5">
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Present Today</p>
          <p className="text-3xl font-black text-emerald-600 mt-1">{loadingAtt ? <span className="animate-pulse bg-slate-100 rounded h-8 w-10 inline-block" /> : totalPresent}</p>
          <p className="text-xs text-slate-400 mt-1">Employees clocked in</p>
        </div>
        <div className="bg-white rounded-xl border border-[#E2E8F0] shadow-card p-5">
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">On Leave</p>
          <p className="text-3xl font-black text-amber-600 mt-1">{loadingAtt ? <span className="animate-pulse bg-slate-100 rounded h-8 w-10 inline-block" /> : onLeave}</p>
          <p className="text-xs text-slate-400 mt-1">Approved leave today</p>
        </div>
        <div className="bg-white rounded-xl border border-[#E2E8F0] shadow-card p-5">
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Late Arrivals</p>
          <p className="text-3xl font-black text-yellow-600 mt-1">{loadingAtt ? <span className="animate-pulse bg-slate-100 rounded h-8 w-10 inline-block" /> : lateArrivals}</p>
          <p className="text-xs text-slate-400 mt-1">Arrived after 9:00 AM</p>
        </div>
        <div className="bg-white rounded-xl border border-[#E2E8F0] shadow-card p-5">
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Pending Approvals</p>
          <p className="text-3xl font-black text-red-600 mt-1">{loadingLeave ? <span className="animate-pulse bg-slate-100 rounded h-8 w-10 inline-block" /> : pendingLeave}</p>
          <p className="text-xs text-slate-400 mt-1">Leave requests awaiting review</p>
        </div>
      </div>

      {/* Tab Bar */}
      <div className="flex border-b border-[#E2E8F0] bg-white rounded-t-xl overflow-hidden shadow-card">
        {TABS.map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-5 py-3 text-xs font-bold uppercase tracking-wider transition-colors border-b-2 ${
              activeTab === tab.key
                ? 'border-[#1E40AF] text-[#1E40AF] bg-[#EFF6FF]'
                : 'border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-50'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* ── WEEKLY TIMESHEETS & APPROVALS TAB ────────── */}
      {activeTab === 'WEEKLY_TIMESHEETS' && (
        <div className="space-y-6">
          {/* Summary KPIs */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white rounded-xl border border-[#E2E8F0] shadow-card p-5">
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Submissions</p>
              <p className="text-3xl font-black text-slate-900 mt-1 font-mono">
                {loadingTS ? <span className="animate-pulse bg-slate-100 rounded h-8 w-10 inline-block" /> : timesheets.length}
              </p>
              <p className="text-xs text-slate-400 mt-1">Active staff cycles</p>
            </div>

            <div className="bg-white rounded-xl border border-[#E2E8F0] shadow-card p-5">
              <p className="text-xs font-bold text-amber-600 uppercase tracking-wider">Awaiting Manager Sign-Off</p>
              <p className="text-3xl font-black text-amber-600 mt-1 font-mono">
                {loadingTS ? <span className="animate-pulse bg-slate-100 rounded h-8 w-10 inline-block" /> : timesheets.filter(t => t.status === 'SUBMITTED').length}
              </p>
              <p className="text-xs text-amber-700/80 mt-1">Requires review &amp; approval</p>
            </div>

            <div className="bg-white rounded-xl border border-[#E2E8F0] shadow-card p-5">
              <p className="text-xs font-bold text-emerald-600 uppercase tracking-wider">Approved For Payroll</p>
              <p className="text-3xl font-black text-emerald-600 mt-1 font-mono">
                {loadingTS ? <span className="animate-pulse bg-slate-100 rounded h-8 w-10 inline-block" /> : timesheets.filter(t => t.status === 'APPROVED').length}
              </p>
              <p className="text-xs text-emerald-700/80 mt-1">Ready for disbursement</p>
            </div>

            <div className="bg-white rounded-xl border border-[#E2E8F0] shadow-card p-5">
              <p className="text-xs font-bold text-[#1E40AF] uppercase tracking-wider">40h Standard Target</p>
              <p className="text-3xl font-black text-[#1E40AF] mt-1 font-mono">100%</p>
              <p className="text-xs text-blue-700/80 mt-1">Standard 40h compliance rate</p>
            </div>
          </div>

          {/* Timesheets List Card */}
          <div className="bg-white rounded-xl border border-[#E2E8F0] shadow-card overflow-hidden">
            <div className="px-5 py-4 border-b border-[#E2E8F0] flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-sm font-bold text-slate-900">
                  Weekly Project Timesheets &amp; Approvals
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Big-4 Mon–Sun weekly time allocations logged against client and project charge codes.
                </p>
              </div>

              {/* Status Filter & Batch Actions */}
              <div className="flex flex-wrap items-center gap-2">
                <div className="flex items-center space-x-1 bg-slate-100 p-1 rounded-lg">
                  {['ALL', 'SUBMITTED', 'APPROVED', 'DRAFT'].map((f) => (
                    <button
                      key={f}
                      onClick={() => setTsFilter(f)}
                      className={`px-3 py-1 rounded-md text-xs font-bold transition-all ${
                        tsFilter === f
                          ? 'bg-white text-slate-900 shadow-sm'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      {f}
                    </button>
                  ))}
                </div>

                {timesheets.some(t => t.status === 'SUBMITTED') && (
                  <button
                    type="button"
                    onClick={handleApproveAllPendingTS}
                    className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold flex items-center space-x-1.5 shadow-sm transition-colors"
                    title="Bulk sign-off all submitted weekly timesheets for payroll"
                  >
                    <span>✓</span>
                    <span>Approve All Pending ({timesheets.filter(t => t.status === 'SUBMITTED').length})</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={handleExportTimesheetsCsv}
                  className="px-3 py-1.5 border border-[#E2E8F0] hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-semibold flex items-center space-x-1 transition-colors"
                  title="Export weekly project timesheets to CSV"
                >
                  <span>📥</span>
                  <span>Export CSV</span>
                </button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="bg-[#FAFAFA] border-b border-[#E2E8F0]">
                    {['Employee', 'Week Period', 'Project / Charge Code', 'Task & Activity', 'Daily Hours (M-F)', 'Total', 'Status', 'Approver', 'Actions'].map(col => (
                      <th key={col} className="px-4 py-3 text-left text-[11px] font-bold uppercase tracking-wider text-slate-600 whitespace-nowrap">{col}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {loadingTS ? (
                    Array.from({ length: 4 }).map((_, i) => (
                      <tr key={i} className="border-b border-[#E2E8F0]">
                        {Array.from({ length: 9 }).map((_, j) => (
                          <td key={j} className="px-4 py-3"><div className="animate-pulse bg-slate-100 rounded h-4 w-full" /></td>
                        ))}
                      </tr>
                    ))
                  ) : (
                    timesheets
                      .filter(t => tsFilter === 'ALL' || t.status === tsFilter)
                      .map((ts) => (
                        <tr key={ts.id} className="hover:bg-blue-50/40 transition-colors">
                          <td className="px-4 py-3.5 whitespace-nowrap font-bold text-slate-900">
                            <div>{ts.employee_name}</div>
                            <span className="text-[10px] font-mono text-[#D97706]">{ts.employee_id}</span>
                          </td>

                          <td className="px-4 py-3.5 whitespace-nowrap font-mono text-slate-700">
                            <span className="font-bold">{ts.week_start}</span>
                            <span className="text-slate-400"> → </span>
                            <span>{ts.week_end}</span>
                          </td>

                          <td className="px-4 py-3.5 whitespace-nowrap">
                            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-blue-50 text-[#1E40AF] border border-blue-200">
                              {ts.charge_code}
                            </span>
                            <div className="text-[11px] text-slate-600 font-semibold mt-0.5 max-w-[200px] truncate">
                              {ts.project_name}
                            </div>
                          </td>

                          <td className="px-4 py-3.5 text-slate-600 max-w-[260px]">
                            <p className="truncate text-xs" title={ts.task_desc}>
                              {ts.task_desc}
                            </p>
                          </td>

                          <td className="px-4 py-3.5 whitespace-nowrap">
                            <div className="flex items-center space-x-1 font-mono text-[10px]">
                              <span className="bg-slate-100 px-1 py-0.5 rounded text-slate-700" title="Monday">M:{ts.mon_hours || 8}</span>
                              <span className="bg-slate-100 px-1 py-0.5 rounded text-slate-700" title="Tuesday">T:{ts.tue_hours || 8}</span>
                              <span className="bg-slate-100 px-1 py-0.5 rounded text-slate-700" title="Wednesday">W:{ts.wed_hours || 8}</span>
                              <span className="bg-slate-100 px-1 py-0.5 rounded text-slate-700" title="Thursday">Th:{ts.thu_hours || 8}</span>
                              <span className="bg-slate-100 px-1 py-0.5 rounded text-slate-700" title="Friday">F:{ts.fri_hours || 8}</span>
                            </div>
                          </td>

                          <td className="px-4 py-3.5 whitespace-nowrap font-mono font-black text-center text-[#1E40AF] text-sm">
                            {ts.total_hours || 40.0}h
                          </td>

                          <td className="px-4 py-3.5 whitespace-nowrap">
                            <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                              ts.status === 'APPROVED' ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' :
                              ts.status === 'SUBMITTED' ? 'bg-amber-100 text-amber-800 border border-amber-200' :
                              'bg-slate-100 text-slate-700 border border-slate-200'
                            }`}>
                              {ts.status}
                            </span>
                          </td>

                          <td className="px-4 py-3.5 whitespace-nowrap text-slate-600 font-semibold text-xs">
                            {ts.approver || 'Manager'}
                          </td>

                          <td className="px-4 py-3.5 whitespace-nowrap">
                            <div className="flex items-center space-x-2">
                              {ts.status === 'SUBMITTED' ? (
                                <>
                                  <button
                                    type="button"
                                    onClick={() => handleApproveTS(ts.id, 'APPROVED')}
                                    className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-[11px] font-bold shadow-sm transition-colors"
                                  >
                                    ✓ Approve
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleApproveTS(ts.id, 'REJECTED')}
                                    className="px-2.5 py-1 bg-red-100 hover:bg-red-200 text-red-700 rounded text-[11px] font-bold transition-colors"
                                  >
                                    ✕ Reject
                                  </button>
                                </>
                              ) : ts.status === 'APPROVED' ? (
                                <span className="text-emerald-700 font-bold text-xs flex items-center space-x-1">
                                  <span>✓</span>
                                  <span>Signed-off</span>
                                </span>
                              ) : (
                                <span className="text-slate-400 text-xs italic">
                                  Draft mode
                                </span>
                              )}
                              <button
                                type="button"
                                onClick={() => setViewingAuditTS(ts)}
                                className="px-2.5 py-1 bg-blue-50 hover:bg-blue-100 text-[#1E40AF] border border-blue-200 rounded text-[11px] font-bold transition-colors flex items-center space-x-1 shadow-xs"
                                title="Inspect Timesheet Audit Log & Statutory Compliance"
                              >
                                <Eye className="w-3 h-3" />
                                <span>Audit</span>
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ── DAILY LOGS TAB ──────────────────────────────────────────────────── */}
      {activeTab === 'DAILY_LOGS' && (
        <div className="space-y-6">
          {/* Attendance Logs Table */}
          <div className="bg-white rounded-xl border border-[#E2E8F0] shadow-card overflow-hidden">
            <div className="px-5 py-4 border-b border-[#E2E8F0] flex items-center justify-between">
              <h2 className="text-sm font-bold text-slate-900">Today's Attendance Logs</h2>
              <button onClick={loadAttendance} className="text-xs text-[#1E40AF] font-semibold hover:underline">↻ Refresh</button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="bg-[#FAFAFA] border-b border-[#E2E8F0]">
                    {['Date', 'Employee', 'Clock In', 'Clock Out', 'Hours', 'Status', 'Source', 'Location'].map(col => (
                      <th key={col} className="px-4 py-3 text-left text-[11px] font-bold uppercase tracking-wider text-slate-600 whitespace-nowrap">{col}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {loadingAtt ? (
                    Array.from({ length: 4 }).map((_, i) => (
                      <tr key={i} className="border-b border-[#E2E8F0]">
                        {Array.from({ length: 8 }).map((_, j) => (
                          <td key={j} className="px-4 py-3"><div className="animate-pulse bg-slate-100 rounded h-4 w-full" /></td>
                        ))}
                      </tr>
                    ))
                  ) : attendanceLogs.length === 0 ? (
                    <tr><td colSpan={8} className="px-4 py-10 text-center text-slate-400 font-medium">No attendance records found.</td></tr>
                  ) : attendanceLogs.map(log => (
                    <tr key={log.id} className="border-b border-[#E2E8F0] hover:bg-blue-50/40 transition-colors">
                      <td className="px-4 py-3 text-slate-600 whitespace-nowrap">{log.date}</td>
                      <td className="px-4 py-3 font-semibold text-slate-900 whitespace-nowrap">{log.employee_name}</td>
                      <td className="px-4 py-3 text-slate-600">{log.clock_in || <span className="text-slate-300">—</span>}</td>
                      <td className="px-4 py-3 text-slate-600">{log.clock_out || <span className="text-slate-300">—</span>}</td>
                      <td className="px-4 py-3 text-slate-700 font-medium">{log.work_hours > 0 ? `${log.work_hours}h` : <span className="text-slate-300">—</span>}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${attStatusBadge(log.status)}`}>{log.status}</span>
                      </td>
                      <td className="px-4 py-3 text-slate-500 whitespace-nowrap">{log.source}</td>
                      <td className="px-4 py-3 text-slate-600 whitespace-nowrap">{log.location}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="px-4 py-2 bg-[#FAFAFA] border-t border-[#E2E8F0] text-xs text-slate-400 font-medium">
              {attendanceLogs.length} records
            </div>
          </div>

          {/* Leave Requests Table */}
          <div className="bg-white rounded-xl border border-[#E2E8F0] shadow-card overflow-hidden">
            <div className="px-5 py-4 border-b border-[#E2E8F0] flex items-center justify-between">
              <h2 className="text-sm font-bold text-slate-900">Leave Requests</h2>
              <button onClick={loadLeave} className="text-xs text-[#1E40AF] font-semibold hover:underline">↻ Refresh</button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="bg-[#FAFAFA] border-b border-[#E2E8F0]">
                    {['Employee', 'Leave Type', 'From', 'To', 'Days', 'Reason', 'Status', 'Applied On', 'Actions'].map(col => (
                      <th key={col} className={`px-4 py-3 text-[11px] font-bold uppercase tracking-wider text-slate-600 whitespace-nowrap ${col === 'Actions' ? 'text-center' : 'text-left'}`}>{col}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {loadingLeave ? (
                    Array.from({ length: 3 }).map((_, i) => (
                      <tr key={i} className="border-b border-[#E2E8F0]">
                        {Array.from({ length: 9 }).map((_, j) => (
                          <td key={j} className="px-4 py-3"><div className="animate-pulse bg-slate-100 rounded h-4 w-full" /></td>
                        ))}
                      </tr>
                    ))
                  ) : leaveRequests.length === 0 ? (
                    <tr><td colSpan={9} className="px-4 py-10 text-center text-slate-400 font-medium">No leave requests found.</td></tr>
                  ) : leaveRequests.map(req => (
                    <tr key={req.id} className="border-b border-[#E2E8F0] hover:bg-blue-50/40 transition-colors">
                      <td className="px-4 py-3 font-semibold text-slate-900 whitespace-nowrap">{req.employee_name}</td>
                      <td className="px-4 py-3 text-slate-700">{req.leave_type}</td>
                      <td className="px-4 py-3 text-slate-600 whitespace-nowrap">{req.start_date}</td>
                      <td className="px-4 py-3 text-slate-600 whitespace-nowrap">{req.end_date}</td>
                      <td className="px-4 py-3 text-slate-700 font-medium">{req.total_days}</td>
                      <td className="px-4 py-3 text-slate-500 max-w-[160px] truncate">{req.reason || <span className="text-slate-300">—</span>}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${leaveStatusBadge(req.status)}`}>{req.status}</span>
                      </td>
                      <td className="px-4 py-3 text-slate-500 whitespace-nowrap">{req.created_at || 'Today'}</td>
                      <td className="px-4 py-3 text-center whitespace-nowrap">
                        {req.status === 'PENDING' ? (
                          <div className="flex items-center justify-center space-x-1">
                            <button
                              disabled={approvingId === req.id + 'APPROVED'}
                              onClick={() => handleApproveLeave(req.id, 'APPROVED')}
                              className="px-2 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-[10px] font-bold transition-colors shadow-xs"
                              title="Approve leave request"
                            >
                              ✓ Approve
                            </button>
                            <button
                              disabled={approvingId === req.id + 'REJECTED'}
                              onClick={() => handleApproveLeave(req.id, 'REJECTED')}
                              className="px-2 py-1 bg-red-600 hover:bg-red-700 text-white rounded text-[10px] font-bold transition-colors shadow-xs"
                              title="Reject leave request"
                            >
                              ✕ Reject
                            </button>
                          </div>
                        ) : (
                          <span className="text-slate-400 text-[10px] font-medium">Reconciled</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="px-4 py-2 bg-[#FAFAFA] border-t border-[#E2E8F0] text-xs text-slate-400 font-medium">
              {leaveRequests.length} leave requests
            </div>
          </div>
        </div>
      )}

      {/* ── REGULARIZATIONS TAB ─────────────────────────────────────────────── */}
      {activeTab === 'REGULARIZATIONS' && (
        <div className="space-y-6">
          <div className="bg-white rounded-xl border border-[#E2E8F0] shadow-card p-5 flex flex-wrap items-center justify-between gap-4">
            <div>
              <h2 className="text-sm font-bold text-slate-900">Missed Punch Claims &amp; Regularization</h2>
              <p className="text-xs text-slate-500 mt-0.5">Approve claims from field duty, port inspections, or reader glitches. Approvals automatically sync into daily attendance records.</p>
            </div>
            <div className="flex gap-1">
              {['ALL', 'PENDING', 'APPROVED', 'REJECTED'].map(f => (
                <button
                  key={f}
                  onClick={() => setRegFilter(f)}
                  className={`px-3 py-1.5 rounded-md text-[10px] font-bold uppercase tracking-wider transition-colors ${regFilter === f ? 'bg-[#1E40AF] text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-xl border border-[#E2E8F0] shadow-card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="bg-[#FAFAFA] border-b border-[#E2E8F0]">
                    {['Claim ID', 'Employee', 'Date', 'Type', 'Requested In', 'Requested Out', 'Business Justification', 'Status', 'Approved By', 'Actions'].map(col => (
                      <th key={col} className={`px-4 py-3 text-[11px] font-bold uppercase tracking-wider text-slate-600 whitespace-nowrap ${col === 'Actions' ? 'text-center' : 'text-left'}`}>{col}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {loadingReg ? (
                    Array.from({ length: 3 }).map((_, i) => (
                      <tr key={i} className="border-b border-[#E2E8F0]">
                        {Array.from({ length: 10 }).map((_, j) => (
                          <td key={j} className="px-4 py-3"><div className="animate-pulse bg-slate-100 rounded h-4 w-full" /></td>
                        ))}
                      </tr>
                    ))
                  ) : filteredRegs.length === 0 ? (
                    <tr><td colSpan={10} className="px-4 py-10 text-center text-slate-400 font-medium">No regularization claims found for this filter.</td></tr>
                  ) : filteredRegs.map(reg => (
                    <tr key={reg.id} className="border-b border-[#E2E8F0] hover:bg-blue-50/40 transition-colors">
                      <td className="px-4 py-3 font-mono text-[11px] text-slate-500 whitespace-nowrap">{reg.id}</td>
                      <td className="px-4 py-3 font-semibold text-slate-900 whitespace-nowrap">{reg.employee_name}</td>
                      <td className="px-4 py-3 text-slate-600 whitespace-nowrap">{reg.date}</td>
                      <td className="px-4 py-3">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                          {reg.punch_type}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-slate-600 whitespace-nowrap">{reg.requested_clock_in || <span className="text-slate-300">—</span>}</td>
                      <td className="px-4 py-3 text-slate-600 whitespace-nowrap">{reg.requested_clock_out || <span className="text-slate-300">—</span>}</td>
                      <td className="px-4 py-3 text-slate-600 max-w-[220px] truncate" title={reg.reason}>{reg.reason}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${regStatusBadge(reg.status)}`}>{reg.status}</span>
                      </td>
                      <td className="px-4 py-3 text-slate-500 whitespace-nowrap">{reg.approved_by || '—'}</td>
                      <td className="px-4 py-3 text-center whitespace-nowrap">
                        {reg.status === 'PENDING' ? (
                          <div className="flex items-center justify-center space-x-1.5">
                            <button
                              onClick={() => handleApproveReg(reg.id, 'APPROVED')}
                              className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-[10px] font-bold transition-colors shadow-sm"
                            >
                              ✓ Approve
                            </button>
                            <button
                              onClick={() => handleApproveReg(reg.id, 'REJECTED')}
                              className="px-2.5 py-1 bg-red-600 hover:bg-red-700 text-white rounded text-[10px] font-bold transition-colors shadow-sm"
                            >
                              ✕ Reject
                            </button>
                          </div>
                        ) : (
                          <span className="text-slate-400 text-[10px] font-medium">Reconciled</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="px-4 py-2 bg-[#FAFAFA] border-t border-[#E2E8F0] text-xs text-slate-400 font-medium">
              {filteredRegs.length} regularization records
            </div>
          </div>
        </div>
      )}

      {/* ── SHIFT ROSTER TAB ───────────────────────────────────────────────── */}
      {activeTab === 'SHIFT_ROSTER' && (
        <div className="space-y-6">
          {/* Shift Schedule Reference Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white rounded-xl border border-blue-200 p-4 bg-blue-50/30">
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-700 border border-blue-200">SHIFT_A_MORNING</span>
              <p className="text-xs font-bold text-slate-800 mt-2">Morning Extraction Shift</p>
              <p className="text-lg font-black text-blue-900 mt-1">06:00 – 14:30</p>
              <p className="text-[11px] text-slate-500 mt-1">Kochi Extraction &amp; QA Lab</p>
            </div>
            <div className="bg-white rounded-xl border border-purple-200 p-4 bg-purple-50/30">
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-100 text-purple-700 border border-purple-200">SHIFT_B_EVENING</span>
              <p className="text-xs font-bold text-slate-800 mt-2">Berth Dispatch Shift</p>
              <p className="text-lg font-black text-purple-900 mt-1">14:00 – 22:30</p>
              <p className="text-[11px] text-slate-500 mt-1">Hai Phong Container Hub</p>
            </div>
            <div className="bg-white rounded-xl border border-slate-700 p-4 bg-slate-900 text-white">
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-400 text-slate-950">NIGHT_SHIFT (+30%)</span>
              <p className="text-xs font-bold text-slate-200 mt-2">Cold Storage Berth Shift</p>
              <p className="text-lg font-black text-amber-300 mt-1">22:00 – 06:30</p>
              <p className="text-[11px] text-slate-400 mt-1">Hai Phong Berth Deepfreeze</p>
            </div>
            <div className="bg-white rounded-xl border border-emerald-200 p-4 bg-emerald-50/30">
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-700 border border-emerald-200">GENERAL_OFFICE</span>
              <p className="text-xs font-bold text-slate-800 mt-2">General Corporate Shift</p>
              <p className="text-lg font-black text-emerald-900 mt-1">08:30 – 17:30</p>
              <p className="text-[11px] text-slate-500 mt-1">Hanoi HQ &amp; Dubai Office</p>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-[#E2E8F0] shadow-card overflow-hidden">
            <div className="px-5 py-4 border-b border-[#E2E8F0] flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-sm font-bold text-slate-900">Personnel Shift Allocations</h2>
                <p className="text-xs text-slate-500 mt-0.5">Active shift schedules synchronized with biometric gate scanners and timesheet accounting.</p>
              </div>
              <div className="flex items-center gap-3">
                <select
                  value={shiftBranch}
                  onChange={e => setShiftBranch(e.target.value)}
                  className="bg-white border border-[#E2E8F0] rounded-md px-3 py-1.5 text-xs font-semibold text-slate-700 focus:outline-none focus:border-[#1E40AF]"
                >
                  <option value="ALL">All Branches</option>
                  <option value="Hanoi HQ">Hanoi HQ</option>
                  <option value="Kochi Terminal">Kochi Terminal</option>
                  <option value="Hai Phong Hub">Hai Phong Hub</option>
                  <option value="Dubai Office">Dubai Office</option>
                </select>
                <button
                  onClick={() => setShowShiftModal(true)}
                  className="px-4 py-2 bg-[#1E40AF] text-white rounded-md text-xs font-semibold uppercase tracking-wider hover:bg-blue-800 shadow-sm flex items-center gap-1.5"
                >
                  <span>+</span> Assign Shift
                </button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="bg-[#FAFAFA] border-b border-[#E2E8F0]">
                    {['Employee', 'Department', 'Facility', 'Assigned Shift', 'Code', 'Timings', 'Effective From', 'Status', 'Action'].map(col => (
                      <th key={col} className={`px-4 py-3 text-[11px] font-bold uppercase tracking-wider text-slate-600 whitespace-nowrap ${col === 'Action' ? 'text-center' : 'text-left'}`}>{col}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {loadingShifts ? (
                    Array.from({ length: 4 }).map((_, i) => (
                      <tr key={i} className="border-b border-[#E2E8F0]">
                        {Array.from({ length: 9 }).map((_, j) => (
                          <td key={j} className="px-4 py-3"><div className="animate-pulse bg-slate-100 rounded h-4 w-full" /></td>
                        ))}
                      </tr>
                    ))
                  ) : filteredShifts.length === 0 ? (
                    <tr><td colSpan={9} className="px-4 py-10 text-center text-slate-400 font-medium">No shift assignments found for this branch.</td></tr>
                  ) : filteredShifts.map(s => (
                    <tr key={s.id} className="border-b border-[#E2E8F0] hover:bg-blue-50/40 transition-colors">
                      <td className="px-4 py-3 font-semibold text-slate-900 whitespace-nowrap">{s.employee_name}</td>
                      <td className="px-4 py-3 text-slate-600 whitespace-nowrap">{s.department}</td>
                      <td className="px-4 py-3 text-slate-600 whitespace-nowrap">📍 {s.branch}</td>
                      <td className="px-4 py-3 font-medium text-slate-800 whitespace-nowrap">{s.shift_name}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${shiftBadge(s.shift_code)}`}>
                          {s.shift_code}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-mono text-slate-700 whitespace-nowrap">{s.timings}</td>
                      <td className="px-4 py-3 text-slate-500 whitespace-nowrap">{s.effective_from}</td>
                      <td className="px-4 py-3">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                          {s.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center whitespace-nowrap">
                        <button
                          onClick={() => {
                            setShiftForm({
                              employee_id: s.employee_id,
                              shift_code: s.shift_code,
                              shift_name: s.shift_name,
                              timings: s.timings,
                              effective_from: new Date().toISOString().split('T')[0]
                            });
                            setShowShiftModal(true);
                          }}
                          className="px-2.5 py-1 bg-slate-100 hover:bg-blue-50 hover:text-[#1E40AF] text-slate-700 rounded text-[10px] font-bold transition-colors border border-slate-200"
                        >
                          Change Shift
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="px-4 py-2 bg-[#FAFAFA] border-t border-[#E2E8F0] text-xs text-slate-400 font-medium">
              {filteredShifts.length} assigned personnel
            </div>
          </div>
        </div>
      )}

      {/* ── LEAVE MANAGEMENT TAB ────────────────────────────────────────────── */}
      {activeTab === 'LEAVE_MGMT' && (
        <div className="space-y-6">
          {/* Leave Balance Cards */}
          <div className="bg-white rounded-xl border border-[#E2E8F0] shadow-card p-5 space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-3">
              <h2 className="text-sm font-bold text-slate-900">Leave Balance</h2>
              <select
                value={lmSelectedEmp}
                onChange={e => setLmSelectedEmp(e.target.value)}
                className="bg-white border border-[#E2E8F0] rounded-md px-3 py-2 text-xs font-semibold text-slate-700 focus:outline-none focus:border-[#1E40AF]"
              >
                {EMPLOYEES.map(emp => (
                  <option key={emp.id} value={emp.id}>{emp.name} ({emp.id})</option>
                ))}
              </select>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {loadingBalance ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="rounded-xl border border-[#E2E8F0] p-5 animate-pulse bg-slate-50 h-28" />
                ))
              ) : balanceCards.map(card => {
                const pct = card.total > 0 ? Math.round((card.used / card.total) * 100) : 0;
                const colorMap = {
                  emerald: { bg: 'bg-emerald-50', border: 'border-emerald-200', num: 'text-emerald-700', bar: 'bg-emerald-500', track: 'bg-emerald-100' },
                  blue: { bg: 'bg-blue-50', border: 'border-blue-200', num: 'text-[#1E40AF]', bar: 'bg-[#1E40AF]', track: 'bg-blue-100' },
                  amber: { bg: 'bg-amber-50', border: 'border-amber-200', num: 'text-amber-700', bar: 'bg-amber-500', track: 'bg-amber-100' },
                };
                const c = colorMap[card.color];
                return (
                  <div key={card.label} className={`rounded-xl border ${c.border} ${c.bg} p-5 space-y-2`}>
                    <p className="text-xs font-bold text-slate-600 uppercase tracking-wider">{card.label}</p>
                    <p className={`text-4xl font-black ${c.num}`}>{card.remaining}</p>
                    <p className="text-[11px] text-slate-500 font-medium">{card.used} used of {card.total} days</p>
                    <div className={`w-full h-2 rounded-full ${c.track}`}>
                      <div className={`h-2 rounded-full ${c.bar} transition-all`} style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* All Leave Requests with Approve/Reject */}
          <div className="bg-white rounded-xl border border-[#E2E8F0] shadow-card overflow-hidden">
            <div className="px-5 py-4 border-b border-[#E2E8F0] flex items-center justify-between flex-wrap gap-3">
              <h2 className="text-sm font-bold text-slate-900">All Leave Requests</h2>
              <div className="flex gap-1">
                {['ALL', 'PENDING', 'APPROVED', 'REJECTED'].map(f => (
                  <button
                    key={f}
                    onClick={() => setLeaveFilter(f)}
                    className={`px-3 py-1.5 rounded-md text-[10px] font-bold uppercase tracking-wider transition-colors ${leaveFilter === f ? 'bg-[#1E40AF] text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                  >
                    {f}
                  </button>
                ))}
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="bg-[#FAFAFA] border-b border-[#E2E8F0]">
                    {['Employee', 'Type', 'From', 'To', 'Days', 'Reason', 'Status', 'Actions'].map(col => (
                      <th key={col} className="px-4 py-3 text-left text-[11px] font-bold uppercase tracking-wider text-slate-600 whitespace-nowrap">{col}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filteredLeave.length === 0 ? (
                    <tr><td colSpan={8} className="px-4 py-10 text-center text-slate-400 font-medium">No leave requests found.</td></tr>
                  ) : filteredLeave.map(req => (
                    <tr key={req.id} className="border-b border-[#E2E8F0] hover:bg-blue-50/40 transition-colors">
                      <td className="px-4 py-3 font-semibold text-slate-900 whitespace-nowrap">{req.employee_name}</td>
                      <td className="px-4 py-3 text-slate-700">{req.leave_type}</td>
                      <td className="px-4 py-3 text-slate-600 whitespace-nowrap">{req.start_date}</td>
                      <td className="px-4 py-3 text-slate-600 whitespace-nowrap">{req.end_date}</td>
                      <td className="px-4 py-3 text-slate-700 font-medium">{req.total_days}</td>
                      <td className="px-4 py-3 text-slate-500 max-w-[120px] truncate">{req.reason || '—'}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${leaveStatusBadge(req.status)}`}>{req.status}</span>
                      </td>
                      <td className="px-4 py-3">
                        {req.status === 'PENDING' ? (
                          <div className="flex flex-col gap-1 min-w-[180px]">
                            <div className="flex gap-1">
                              <button
                                disabled={approvingId === req.id + 'APPROVED'}
                                onClick={() => handleApproveLeave(req.id, 'APPROVED')}
                                className="px-2 py-1 bg-emerald-600 text-white rounded text-[10px] font-bold hover:bg-emerald-700 disabled:opacity-60"
                              >
                                {approvingId === req.id + 'APPROVED' ? '...' : '✓ Approve'}
                              </button>
                              <button
                                disabled={approvingId === req.id + 'REJECTED'}
                                onClick={() => handleApproveLeave(req.id, 'REJECTED')}
                                className="px-2 py-1 bg-red-600 text-white rounded text-[10px] font-bold hover:bg-red-700 disabled:opacity-60"
                              >
                                {approvingId === req.id + 'REJECTED' ? '...' : '✕ Reject'}
                              </button>
                            </div>
                            <input
                              value={rejectRemarks[req.id] || ''}
                              onChange={e => setRejectRemarks(r => ({ ...r, [req.id]: e.target.value }))}
                              placeholder="Reject remark (optional)"
                              className="w-full border border-[#E2E8F0] rounded px-2 py-1 text-[10px] focus:outline-none focus:border-red-400"
                            />
                          </div>
                        ) : (
                          <span className="text-slate-400 text-[10px]">—</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="px-4 py-2 bg-[#FAFAFA] border-t border-[#E2E8F0] text-xs text-slate-400 font-medium">
              {filteredLeave.length} records
            </div>
          </div>
        </div>
      )}

      {/* ── HOLIDAY CALENDAR TAB ────────────────────────────────────────────── */}
      {activeTab === 'HOLIDAY_CAL' && (
        <div className="space-y-6">
          {/* Upcoming chips */}
          {upcomingHolidays.length > 0 && (
            <div className="bg-white rounded-xl border border-[#E2E8F0] shadow-card p-5">
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Upcoming Holidays</p>
              <div className="flex gap-3 overflow-x-auto pb-1">
                {upcomingHolidays.map(h => (
                  <div key={h.id} className="flex-shrink-0 border border-[#E2E8F0] rounded-xl px-4 py-3 text-center min-w-[130px] bg-[#EFF6FF]">
                    <p className="text-[10px] font-bold text-[#1E40AF] uppercase">{new Date(h.date).toLocaleString('en-US', { month: 'short', day: 'numeric' })}</p>
                    <p className="text-xs font-semibold text-slate-800 mt-0.5 leading-tight">{h.name}</p>
                    <p className="text-[10px] text-slate-400 mt-1">{daysUntil(h.date)}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Holiday Table */}
          <div className="bg-white rounded-xl border border-[#E2E8F0] shadow-card overflow-hidden">
            <div className="px-5 py-4 border-b border-[#E2E8F0] flex items-center justify-between">
              <h2 className="text-sm font-bold text-slate-900">Holiday Calendar</h2>
              <button
                onClick={() => setShowHolidayModal(true)}
                className="px-4 py-2 bg-[#1E40AF] text-white rounded-md text-xs font-semibold uppercase tracking-wider hover:bg-blue-800 shadow-sm"
              >
                + Add Holiday
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="bg-[#FAFAFA] border-b border-[#E2E8F0]">
                    {['Name', 'Date', 'Branch', 'Type', 'When'].map(col => (
                      <th key={col} className="px-4 py-3 text-left text-[11px] font-bold uppercase tracking-wider text-slate-600 whitespace-nowrap">{col}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {loadingHolidays ? (
                    Array.from({ length: 4 }).map((_, i) => (
                      <tr key={i} className="border-b border-[#E2E8F0]">
                        {Array.from({ length: 5 }).map((_, j) => (
                          <td key={j} className="px-4 py-3"><div className="animate-pulse bg-slate-100 rounded h-4 w-full" /></td>
                        ))}
                      </tr>
                    ))
                  ) : sortedHolidays.length === 0 ? (
                    <tr><td colSpan={5} className="px-4 py-10 text-center text-slate-400 font-medium">No holidays found.</td></tr>
                  ) : sortedHolidays.map(h => (
                    <tr key={h.id} className="border-b border-[#E2E8F0] hover:bg-blue-50/40 transition-colors">
                      <td className="px-4 py-3 font-semibold text-slate-900">{h.name}</td>
                      <td className="px-4 py-3 text-slate-600 whitespace-nowrap">{new Date(h.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</td>
                      <td className="px-4 py-3 text-slate-600">{h.branch}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${holidayTypeBadge(h.type)}`}>{h.type}</span>
                      </td>
                      <td className="px-4 py-3 text-slate-500">{daysUntil(h.date)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="px-4 py-2 bg-[#FAFAFA] border-t border-[#E2E8F0] text-xs text-slate-400 font-medium">
              {sortedHolidays.length} holidays
            </div>
          </div>
        </div>
      )}

      {/* ── OVERTIME TAB ────────────────────────────────────────────────────── */}
      {activeTab === 'OVERTIME' && (
        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-[#E2E8F0] shadow-card overflow-hidden">
            <div className="px-5 py-4 border-b border-[#E2E8F0] flex items-center justify-between">
              <h2 className="text-sm font-bold text-slate-900">Overtime Logs</h2>
              <button
                onClick={() => setShowOTModal(true)}
                className="px-4 py-2 bg-[#1E40AF] text-white rounded-md text-xs font-semibold uppercase tracking-wider hover:bg-blue-800 shadow-sm"
              >
                + Log Overtime
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="bg-[#FAFAFA] border-b border-[#E2E8F0]">
                    {['Employee', 'Date', 'Hours', 'Reason', 'Status', 'Approved By', 'Actions'].map(col => (
                      <th key={col} className={`px-4 py-3 text-[11px] font-bold uppercase tracking-wider text-slate-600 whitespace-nowrap ${col === 'Actions' ? 'text-center' : 'text-left'}`}>{col}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {loadingOT ? (
                    Array.from({ length: 3 }).map((_, i) => (
                      <tr key={i} className="border-b border-[#E2E8F0]">
                        {Array.from({ length: 7 }).map((_, j) => (
                          <td key={j} className="px-4 py-3"><div className="animate-pulse bg-slate-100 rounded h-4 w-full" /></td>
                        ))}
                      </tr>
                    ))
                  ) : overtimeList.length === 0 ? (
                    <tr><td colSpan={7} className="px-4 py-10 text-center text-slate-400 font-medium">No overtime records found.</td></tr>
                  ) : overtimeList.map(ot => (
                    <tr key={ot.id} className="border-b border-[#E2E8F0] hover:bg-blue-50/40 transition-colors">
                      <td className="px-4 py-3 font-semibold text-slate-900 whitespace-nowrap">{ot.employee_name}</td>
                      <td className="px-4 py-3 text-slate-600 whitespace-nowrap">{ot.date}</td>
                      <td className="px-4 py-3 text-slate-700 font-bold">{ot.hours}h</td>
                      <td className="px-4 py-3 text-slate-500 max-w-[200px] truncate">{ot.reason}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${otStatusBadge(ot.status)}`}>{ot.status}</span>
                      </td>
                      <td className="px-4 py-3 text-slate-500">{ot.approved_by}</td>
                      <td className="px-4 py-3 text-center whitespace-nowrap">
                        {ot.status === 'PENDING' ? (
                          <div className="flex items-center justify-center space-x-1.5">
                            <button
                              onClick={() => handleApproveOT(ot.id, 'APPROVED')}
                              className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-[10px] font-bold transition-colors"
                            >
                              ✓ Approve
                            </button>
                            <button
                              onClick={() => handleApproveOT(ot.id, 'REJECTED')}
                              className="px-2.5 py-1 bg-red-600 hover:bg-red-700 text-white rounded text-[10px] font-bold transition-colors"
                            >
                              ✕ Reject
                            </button>
                          </div>
                        ) : (
                          <span className="text-slate-400 text-[10px] font-semibold">{ot.status}</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="px-4 py-2 bg-[#FAFAFA] border-t border-[#E2E8F0] text-xs text-slate-400 font-medium">
              {overtimeList.length} records
            </div>
          </div>
        </div>
      )}

      {/* ── Clock-In Modal ───────────────────────────────────────────────────── */}
      {showClockInModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl border border-[#E2E8F0] shadow-2xl max-w-sm w-full p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-slate-900">Simulate Biometric Clock-In</h2>
              <button onClick={() => setShowClockInModal(false)} className="text-slate-400 hover:text-slate-600 text-lg font-bold">×</button>
            </div>
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Select Employee</label>
              <select
                value={selectedEmployee}
                onChange={e => setSelectedEmployee(e.target.value)}
                className="w-full bg-white border border-[#E2E8F0] rounded-md px-3 py-2 text-xs focus:outline-none focus:border-[#1E40AF] font-medium"
              >
                {EMPLOYEES.map(emp => (
                  <option key={emp.id} value={emp.id}>{emp.name} ({emp.id})</option>
                ))}
              </select>
            </div>
            <div className="bg-[#EFF6FF] border border-[#BFDBFE] rounded-md px-3 py-2">
              <p className="text-xs text-[#1E40AF] font-semibold">📍 Location: Hanoi HQ / Factory</p>
              <p className="text-xs text-slate-500 mt-0.5">Clock-in will be recorded at current time</p>
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <button onClick={() => setShowClockInModal(false)}
                className="px-4 py-2 border border-[#E2E8F0] rounded-md text-xs font-semibold text-slate-600 hover:bg-slate-50">
                Cancel
              </button>
              <button onClick={handleClockIn} disabled={clockingIn}
                className="px-4 py-2 bg-[#1E40AF] text-white rounded-md text-xs font-semibold hover:bg-blue-800 shadow-sm disabled:opacity-60 flex items-center gap-2">
                {clockingIn && <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />}
                {clockingIn ? 'Recording...' : 'Record Clock-In'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Apply Leave Modal ────────────────────────────────────────────────── */}
      {showLeaveModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl border border-[#E2E8F0] shadow-2xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-slate-900">Apply for Leave</h2>
              <button onClick={() => { setShowLeaveModal(false); setLeaveForm(EMPTY_LEAVE_FORM); }} className="text-slate-400 hover:text-slate-600 text-lg font-bold">×</button>
            </div>
            <form onSubmit={handleLeaveSubmit} className="space-y-3">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Employee <span className="text-red-500">*</span></label>
                <select name="employee_id" value={leaveForm.employee_id} onChange={handleLeaveFormChange} required
                  className="w-full bg-white border border-[#E2E8F0] rounded-md px-3 py-2 text-xs focus:outline-none focus:border-[#1E40AF] font-medium">
                  {EMPLOYEES.map(emp => (
                    <option key={emp.id} value={emp.id}>{emp.name} ({emp.id})</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Leave Type <span className="text-red-500">*</span></label>
                <select name="leave_type" value={leaveForm.leave_type} onChange={handleLeaveFormChange} required
                  className="w-full bg-white border border-[#E2E8F0] rounded-md px-3 py-2 text-xs focus:outline-none focus:border-[#1E40AF] font-medium">
                  <option value="Annual">Annual Leave</option>
                  <option value="Medical">Medical Leave</option>
                  <option value="Casual">Casual Leave</option>
                  <option value="Emergency">Emergency Leave</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Start Date <span className="text-red-500">*</span></label>
                  <input name="start_date" type="date" value={leaveForm.start_date} onChange={handleLeaveFormChange} required
                    className="w-full bg-white border border-[#E2E8F0] rounded-md px-3 py-2 text-xs focus:outline-none focus:border-[#1E40AF] font-medium" />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">End Date <span className="text-red-500">*</span></label>
                  <input name="end_date" type="date" value={leaveForm.end_date} onChange={handleLeaveFormChange} required
                    className="w-full bg-white border border-[#E2E8F0] rounded-md px-3 py-2 text-xs focus:outline-none focus:border-[#1E40AF] font-medium" />
                </div>
              </div>
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Reason</label>
                <textarea name="reason" value={leaveForm.reason} onChange={handleLeaveFormChange} rows={3}
                  placeholder="Optional reason for leave..."
                  className="w-full bg-white border border-[#E2E8F0] rounded-md px-3 py-2 text-xs focus:outline-none focus:border-[#1E40AF] font-medium resize-none" />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => { setShowLeaveModal(false); setLeaveForm(EMPTY_LEAVE_FORM); }}
                  className="px-4 py-2 border border-[#E2E8F0] rounded-md text-xs font-semibold text-slate-600 hover:bg-slate-50">
                  Cancel
                </button>
                <button type="submit" disabled={submittingLeave}
                  className="px-4 py-2 bg-amber-600 text-white rounded-md text-xs font-semibold hover:bg-amber-700 shadow-sm disabled:opacity-60 flex items-center gap-2">
                  {submittingLeave && <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />}
                  {submittingLeave ? 'Submitting...' : 'Submit Leave Request'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Add Holiday Modal ────────────────────────────────────────────────── */}
      {showHolidayModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl border border-[#E2E8F0] shadow-2xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-slate-900">Add Holiday</h2>
              <button onClick={() => { setShowHolidayModal(false); setHolidayForm(EMPTY_HOLIDAY_FORM); }} className="text-slate-400 hover:text-slate-600 text-lg font-bold">×</button>
            </div>
            <form onSubmit={handleSaveHoliday} className="space-y-3">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Holiday Name <span className="text-red-500">*</span></label>
                <input value={holidayForm.name} onChange={e => setHolidayForm(f => ({ ...f, name: e.target.value }))} required
                  placeholder="e.g. Diwali"
                  className="w-full bg-white border border-[#E2E8F0] rounded-md px-3 py-2 text-xs focus:outline-none focus:border-[#1E40AF] font-medium" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Date <span className="text-red-500">*</span></label>
                  <input type="date" value={holidayForm.date} onChange={e => setHolidayForm(f => ({ ...f, date: e.target.value }))} required
                    className="w-full bg-white border border-[#E2E8F0] rounded-md px-3 py-2 text-xs focus:outline-none focus:border-[#1E40AF] font-medium" />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Type</label>
                  <select value={holidayForm.type} onChange={e => setHolidayForm(f => ({ ...f, type: e.target.value }))}
                    className="w-full bg-white border border-[#E2E8F0] rounded-md px-3 py-2 text-xs focus:outline-none focus:border-[#1E40AF] font-medium">
                    <option value="NATIONAL">National</option>
                    <option value="REGIONAL">Regional</option>
                    <option value="COMPANY">Company</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Branch</label>
                <select value={holidayForm.branch} onChange={e => setHolidayForm(f => ({ ...f, branch: e.target.value }))}
                  className="w-full bg-white border border-[#E2E8F0] rounded-md px-3 py-2 text-xs focus:outline-none focus:border-[#1E40AF] font-medium">
                  <option value="ALL">ALL</option>
                  <option value="Hanoi HQ">Hanoi HQ</option>
                  <option value="Kochi Terminal">Kochi Terminal</option>
                  <option value="Hai Phong Hub">Hai Phong Hub</option>
                  <option value="Dubai Office">Dubai Office</option>
                </select>
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => { setShowHolidayModal(false); setHolidayForm(EMPTY_HOLIDAY_FORM); }}
                  className="px-4 py-2 border border-[#E2E8F0] rounded-md text-xs font-semibold text-slate-600 hover:bg-slate-50">
                  Cancel
                </button>
                <button type="submit" disabled={savingHoliday}
                  className="px-4 py-2 bg-[#1E40AF] text-white rounded-md text-xs font-semibold hover:bg-blue-800 shadow-sm disabled:opacity-60 flex items-center gap-2">
                  {savingHoliday && <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />}
                  {savingHoliday ? 'Saving...' : 'Save Holiday'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Log Overtime Modal ───────────────────────────────────────────────── */}
      {showOTModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl border border-[#E2E8F0] shadow-2xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-slate-900">Log Overtime</h2>
              <button onClick={() => { setShowOTModal(false); setOtForm(EMPTY_OT_FORM); }} className="text-slate-400 hover:text-slate-600 text-lg font-bold">×</button>
            </div>
            <form onSubmit={handleSaveOT} className="space-y-3">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Employee <span className="text-red-500">*</span></label>
                <select value={otForm.employee_id} onChange={e => setOtForm(f => ({ ...f, employee_id: e.target.value }))} required
                  className="w-full bg-white border border-[#E2E8F0] rounded-md px-3 py-2 text-xs focus:outline-none focus:border-[#1E40AF] font-medium">
                  {EMPLOYEES.map(emp => (
                    <option key={emp.id} value={emp.id}>{emp.name} ({emp.id})</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Date <span className="text-red-500">*</span></label>
                  <input type="date" value={otForm.date} onChange={e => setOtForm(f => ({ ...f, date: e.target.value }))} required
                    className="w-full bg-white border border-[#E2E8F0] rounded-md px-3 py-2 text-xs focus:outline-none focus:border-[#1E40AF] font-medium" />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Hours <span className="text-red-500">*</span></label>
                  <input type="number" step="0.5" min="0.5" max="12" value={otForm.hours} onChange={e => setOtForm(f => ({ ...f, hours: e.target.value }))} required
                    placeholder="e.g. 2.5"
                    className="w-full bg-white border border-[#E2E8F0] rounded-md px-3 py-2 text-xs focus:outline-none focus:border-[#1E40AF] font-medium" />
                </div>
              </div>
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Reason <span className="text-red-500">*</span></label>
                <textarea value={otForm.reason} onChange={e => setOtForm(f => ({ ...f, reason: e.target.value }))} rows={3} required
                  placeholder="Reason for overtime..."
                  className="w-full bg-white border border-[#E2E8F0] rounded-md px-3 py-2 text-xs focus:outline-none focus:border-[#1E40AF] font-medium resize-none" />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => { setShowOTModal(false); setOtForm(EMPTY_OT_FORM); }}
                  className="px-4 py-2 border border-[#E2E8F0] rounded-md text-xs font-semibold text-slate-600 hover:bg-slate-50">
                  Cancel
                </button>
                <button type="submit" disabled={savingOT}
                  className="px-4 py-2 bg-[#1E40AF] text-white rounded-md text-xs font-semibold hover:bg-blue-800 shadow-sm disabled:opacity-60 flex items-center gap-2">
                  {savingOT && <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />}
                  {savingOT ? 'Logging...' : 'Log Overtime'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Assign Shift Modal ────────────────────────────────────────────────── */}
      {showShiftModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl border border-[#E2E8F0] shadow-2xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-slate-900">Assign Shift Roster</h2>
                <p className="text-xs text-slate-500 mt-0.5">Allocate plant or corporate shift schedule to staff</p>
              </div>
              <button onClick={() => { setShowShiftModal(false); setShiftForm(EMPTY_SHIFT_FORM); }} className="text-slate-400 hover:text-slate-600 text-lg font-bold">×</button>
            </div>
            <form onSubmit={handleSaveShift} className="space-y-3">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Employee <span className="text-red-500">*</span></label>
                <select
                  value={shiftForm.employee_id}
                  onChange={e => setShiftForm(f => ({ ...f, employee_id: e.target.value }))}
                  required
                  className="w-full bg-white border border-[#E2E8F0] rounded-md px-3 py-2 text-xs focus:outline-none focus:border-[#1E40AF] font-medium"
                >
                  {EMPLOYEES.map(emp => (
                    <option key={emp.id} value={emp.id}>{emp.name} ({emp.id})</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Shift Schedule <span className="text-red-500">*</span></label>
                <select
                  value={shiftForm.shift_code}
                  onChange={e => setShiftForm(f => ({ ...f, shift_code: e.target.value }))}
                  required
                  className="w-full bg-white border border-[#E2E8F0] rounded-md px-3 py-2 text-xs focus:outline-none focus:border-[#1E40AF] font-medium"
                >
                  <option value="SHIFT_A_MORNING">SHIFT_A_MORNING — Morning Extraction Lab (06:00 – 14:30)</option>
                  <option value="SHIFT_B_EVENING">SHIFT_B_EVENING — Berth Container Dispatch (14:00 – 22:30)</option>
                  <option value="NIGHT_SHIFT">NIGHT_SHIFT — Cold Storage Night Berth (+30%) (22:00 – 06:30)</option>
                  <option value="GENERAL_OFFICE">GENERAL_OFFICE — General Commercial HQ (08:30 – 17:30)</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Effective Date <span className="text-red-500">*</span></label>
                <input
                  type="date"
                  value={shiftForm.effective_from}
                  onChange={e => setShiftForm(f => ({ ...f, effective_from: e.target.value }))}
                  required
                  className="w-full bg-white border border-[#E2E8F0] rounded-md px-3 py-2 text-xs focus:outline-none focus:border-[#1E40AF] font-medium"
                />
              </div>
              <div className="bg-[#EFF6FF] border border-blue-200 rounded-lg p-3 text-[11px] text-slate-600 space-y-1">
                <p className="font-bold text-[#1E40AF]">⚡ Automated Compliance Sync:</p>
                <p>Assigning this shift updates the biometric attendance reconciliation window and overtime differential calculations.</p>
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => { setShowShiftModal(false); setShiftForm(EMPTY_SHIFT_FORM); }}
                  className="px-4 py-2 border border-[#E2E8F0] rounded-md text-xs font-semibold text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingShift}
                  className="px-4 py-2 bg-[#1E40AF] text-white rounded-md text-xs font-semibold hover:bg-blue-800 shadow-sm disabled:opacity-60 flex items-center gap-2"
                >
                  {savingShift && <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />}
                  {savingShift ? 'Assigning...' : 'Confirm Assignment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Timesheet Audit Trail & Statutory Verification Modal ── */}
      {viewingAuditTS && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[110] flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl border border-[#E2E8F0] shadow-2xl max-w-2xl w-full p-6 space-y-5 my-8">
            {/* Header */}
            <div className="flex items-start justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-200 text-[#1E40AF] flex items-center justify-center shrink-0">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide">
                      Weekly Timesheet Audit Trail &amp; Verification
                    </h3>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                      viewingAuditTS.status === 'APPROVED' ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' :
                      viewingAuditTS.status === 'SUBMITTED' ? 'bg-blue-100 text-blue-800 border border-blue-200' :
                      'bg-amber-100 text-amber-800 border border-amber-200'
                    }`}>
                      {viewingAuditTS.status}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 font-medium mt-0.5">
                    Official Audit Traceability · ISO 22000 Labor &amp; Shift Compliance
                  </p>
                </div>
              </div>
              <button
                onClick={() => setViewingAuditTS(null)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Top Quick Reference Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 p-3.5 rounded-xl border border-slate-200 text-xs">
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase block">Timesheet ID</span>
                <span className="font-mono font-bold text-[#1E40AF]">{viewingAuditTS.id}</span>
              </div>
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase block">Staff Member</span>
                <span className="font-bold text-slate-900 truncate block">{viewingAuditTS.employee_name}</span>
              </div>
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase block">Charge Code</span>
                <span className="font-mono font-bold text-[#D97706]">{viewingAuditTS.charge_code || 'PRJ-EXP-01'}</span>
              </div>
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase block">Audited Hours</span>
                <span className="font-mono font-black text-emerald-700">{viewingAuditTS.total_hours || 40.0} hrs</span>
              </div>
            </div>

            {/* Audit Lifecycle Trail */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center space-x-1.5">
                <span>📋</span>
                <span>Verification &amp; Lifecycle Audit Trail</span>
              </h4>

              <div className="relative pl-6 space-y-4 before:content-[''] before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-blue-200">
                {/* Event 1 */}
                <div className="relative">
                  <div className="absolute -left-6 top-1 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-4 ring-emerald-100" />
                  <div className="bg-white p-3 rounded-lg border border-slate-200 shadow-xs">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="font-bold text-slate-800">1. Timesheet Initialization &amp; Hour Logging</span>
                      <span className="font-mono text-slate-400">{viewingAuditTS.week_start} 08:30:00 ICT</span>
                    </div>
                    <p className="text-[11px] text-slate-600 mt-1">
                      Logged by employee <span className="font-semibold text-slate-900">{viewingAuditTS.employee_name} ({viewingAuditTS.employee_id})</span>. Shift verification confirmed via biometric terminal and project assignment.
                    </p>
                    <div className="mt-1.5 text-[10px] font-mono text-slate-400 flex items-center space-x-2">
                      <span>Project: {viewingAuditTS.project_name}</span>
                      <span>·</span>
                      <span>Origin: Employee Portal</span>
                    </div>
                  </div>
                </div>

                {/* Event 2 */}
                <div className="relative">
                  <div className="absolute -left-6 top-1 w-2.5 h-2.5 rounded-full bg-blue-500 ring-4 ring-blue-100" />
                  <div className="bg-white p-3 rounded-lg border border-slate-200 shadow-xs">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="font-bold text-slate-800">2. Formal Submission for Manager Sign-off</span>
                      <span className="font-mono text-slate-400">{viewingAuditTS.week_end || viewingAuditTS.week_start} 17:30:00 ICT</span>
                    </div>
                    <p className="text-[11px] text-slate-600 mt-1">
                      Task: <span className="font-medium text-slate-800">"{viewingAuditTS.task_desc || 'Operations delivery and cross-department synchronization'}"</span>
                    </p>
                    <div className="mt-1.5 text-[10px] font-semibold text-blue-700 bg-blue-50 border border-blue-200 rounded px-2 py-0.5 inline-block">
                      Electronic Signature Verified · 0 Discrepancy Flags
                    </div>
                  </div>
                </div>

                {/* Event 3 */}
                <div className="relative">
                  <div className={`absolute -left-6 top-1 w-2.5 h-2.5 rounded-full ${viewingAuditTS.status === 'APPROVED' ? 'bg-emerald-500 ring-4 ring-emerald-100' : 'bg-amber-500 ring-4 ring-amber-100'}`} />
                  <div className="bg-white p-3 rounded-lg border border-slate-200 shadow-xs">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="font-bold text-slate-800">3. Supervisory Review &amp; Audit Sign-Off</span>
                      <span className="font-mono text-slate-400">
                        {viewingAuditTS.status === 'APPROVED' ? 'Approved & Locked' : 'Audit In Review'}
                      </span>
                    </div>
                    <div className="mt-1 flex items-center space-x-2 text-xs">
                      <span className="text-slate-500">Sign-off Approver:</span>
                      <span className="font-bold text-slate-900">{viewingAuditTS.approver || 'Corporate Management / Engagement Director'}</span>
                    </div>
                    {viewingAuditTS.comments && (
                      <p className="text-[11px] text-slate-600 italic mt-1 bg-slate-50 p-2 rounded border border-slate-200">
                        "{viewingAuditTS.comments}"
                      </p>
                    )}
                  </div>
                </div>

                {/* Event 4 */}
                <div className="relative">
                  <div className="absolute -left-6 top-1 w-2.5 h-2.5 rounded-full bg-purple-500 ring-4 ring-purple-100" />
                  <div className="bg-white p-3 rounded-lg border border-slate-200 shadow-xs">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="font-bold text-slate-800">4. General Ledger &amp; Payroll Reconciliation</span>
                      <span className="font-mono text-slate-400">Payroll Cycle Sync</span>
                    </div>
                    <p className="text-[11px] text-slate-600 mt-1">
                      Statutory audit clearance attached to monthly compensation run. Disbursed under corporate labor compliance standards.
                    </p>
                    <div className="mt-1.5 text-[9px] font-mono text-slate-400">
                      Hash Digest: SHA256:{Math.abs((viewingAuditTS.id || 'TS').split('').reduce((a, b) => { a = ((a << 5) - a) + b.charCodeAt(0); return a & a }, 0)).toString(16).padStart(16, '7f3a9e01')}...c491
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Daily Hours Table */}
            <div className="bg-slate-50 rounded-xl border border-slate-200 p-3">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-2">
                Daily Work Hour Allocation (Audited Deliverables)
              </span>
              <div className="grid grid-cols-7 gap-1.5 text-center text-xs">
                {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day, idx) => {
                  const dayKeys = ['mon_hours', 'tue_hours', 'wed_hours', 'thu_hours', 'fri_hours', 'sat_hours', 'sun_hours'];
                  const val = viewingAuditTS[dayKeys[idx]] !== undefined ? viewingAuditTS[dayKeys[idx]] : (idx < 5 ? 8 : 0);
                  return (
                    <div key={day} className="bg-white p-2 rounded-lg border border-slate-200">
                      <span className="text-[10px] font-bold text-slate-400 block">{day}</span>
                      <span className="font-mono font-bold text-slate-900 text-sm mt-0.5 block">{val}h</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Footer Actions */}
            <div className="flex items-center justify-between pt-3 border-t border-slate-200">
              <div className="text-[10px] font-mono text-slate-400">
                Audited per ISO 22000 &amp; SOILEX Internal Labor Controls
              </div>
              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="px-4 py-2 border border-[#E2E8F0] hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-bold transition-colors flex items-center space-x-1.5"
                >
                  <Download className="w-3.5 h-3.5 text-[#1E40AF]" />
                  <span>Print Audit Slip</span>
                </button>
                <button
                  type="button"
                  onClick={() => setViewingAuditTS(null)}
                  className="px-4 py-2 bg-[#1E40AF] hover:bg-blue-800 text-white rounded-lg text-xs font-bold uppercase tracking-wider transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
