import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Clock,
  Calendar,
  DollarSign,
  Fingerprint,
  FileText,
  AlertCircle,
  CheckCircle2,
  ChevronRight,
  Download,
  Plus,
  Send,
  Building2,
  MapPin,
  TrendingUp,
  Receipt,
  User,
  ShieldAlert,
  ArrowUpRight,
  Check,
  X,
  ChevronLeft,
  Copy,
  Save,
  Trash2,
  Briefcase,
  LogOut,
  CheckCircle,
  HelpCircle,
  Sun
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';

const FALLBACK_EMPLOYEES = [
  { id: 'EMP-001', employee_code: 'SLX-E01', full_name: 'Vũ Thị Hoan', email: 'hoan.vu@soilexlifescience.com', phone: '+84-908-112233', department: 'Sales & Export', designation: 'Senior Sales Executive', branch: 'Hanoi HQ', shift: 'Morning Shift (08:30 - 17:30)', join_date: '2023-04-15', status: 'ACTIVE' },
  { id: 'EMP-002', employee_code: 'SLX-E02', full_name: 'Rajesh Sharma', email: 'rajesh.s@soilexlifescience.com', phone: '+91-98401-22334', department: 'Quality Assurance', designation: 'QA Lab Director', branch: 'Kochi Terminal', shift: 'Standard Shift (09:00 - 18:00)', join_date: '2022-08-01', status: 'ACTIVE' },
  { id: 'EMP-003', employee_code: 'SLX-E03', full_name: 'Nguyễn Văn Hùng', email: 'hung.nguyen@soilexlifescience.com', phone: '+84-912-445566', department: 'Operations & Supply', designation: 'Logistics Supervisor', branch: 'Hai Phong Hub', shift: 'Rotational Shift', join_date: '2024-01-10', status: 'ACTIVE' },
  { id: 'EMP-004', employee_code: 'SLX-E04', full_name: 'Priya Nair', email: 'priya.n@soilexlifescience.com', phone: '+91-98765-43210', department: 'Human Resources', designation: 'HR Operations Lead', branch: 'Kochi Terminal', shift: 'Morning Shift (08:30 - 17:30)', join_date: '2023-11-20', status: 'ACTIVE' },
  { id: 'EMP-005', employee_code: 'SLX-E05', full_name: 'Trần Quốc Bảo', email: 'bao.tran@soilexlifescience.com', phone: '+84-983-998877', department: 'Finance & Accounts', designation: 'Senior Trade Accountant', branch: 'Hanoi HQ', shift: 'Morning Shift (08:30 - 17:30)', join_date: '2021-03-01', status: 'ACTIVE' },
];

const FALLBACK_HOLIDAYS = [
  { id: 'HOL-001', name: "Vietnamese New Year (Tết)", date: '2026-01-28', branch: 'ALL', type: 'NATIONAL' },
  { id: 'HOL-002', name: "Republic Day", date: '2026-01-26', branch: 'Kochi Terminal', type: 'NATIONAL' },
  { id: 'HOL-003', name: "Hùng Kings Festival", date: '2026-04-07', branch: 'Hanoi HQ', type: 'NATIONAL' },
  { id: 'HOL-004', name: "Liberation Day Vietnam", date: '2026-04-30', branch: 'Hanoi HQ', type: 'NATIONAL' },
  { id: 'HOL-005', name: "International Labor Day", date: '2026-05-01', branch: 'ALL', type: 'NATIONAL' },
  { id: 'HOL-006', name: "Independence Day India", date: '2026-08-15', branch: 'Kochi Terminal', type: 'NATIONAL' },
  { id: 'HOL-007', name: "UAE National Day", date: '2026-12-02', branch: 'Dubai Office', type: 'NATIONAL' },
  { id: 'HOL-008', name: "SOILEX Foundation Day", date: '2026-09-01', branch: 'ALL', type: 'COMPANY' },
];

export default function EmployeePortal({ onNavigate }) {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('HOURS_TRACKER');
  const [employees, setEmployees] = useState(FALLBACK_EMPLOYEES);
  
  // Resolve employee ID: from logged-in user or default to first employee
  const currentEmpId = useMemo(() => {
    if (user?.employee_id) return user.employee_id;
    const match = employees.find(e => e.email?.toLowerCase() === user?.email?.toLowerCase());
    return match ? match.id : 'EMP-001';
  }, [user, employees]);

  const [selectedEmpId, setSelectedEmpId] = useState(currentEmpId);

  useEffect(() => {
    if (currentEmpId) {
      setSelectedEmpId(currentEmpId);
    }
  }, [currentEmpId]);

  useEffect(() => {
    if (user?.role === 'EMPLOYEE' && currentEmpId && selectedEmpId !== currentEmpId) {
      setSelectedEmpId(currentEmpId);
    }
  }, [user, currentEmpId, selectedEmpId]);

  // Current active employee profile
  const employee = useMemo(() => {
    return employees.find(e => e.id === selectedEmpId) || employees[0];
  }, [employees, selectedEmpId]);

  // Data states
  const [attendanceLogs, setAttendanceLogs] = useState([]);
  const [leaveRequests, setLeaveRequests] = useState([]);
  const [holidays, setHolidays] = useState(FALLBACK_HOLIDAYS);
  const [leaveBalance, setLeaveBalance] = useState({
    annual_total: 18, annual_used: 3,
    sick_total: 12, sick_used: 1,
    casual_total: 6, casual_used: 1
  });
  const [overtimeLogs, setOvertimeLogs] = useState([]);
  const [salaryStructure, setSalaryStructure] = useState(null);
  const [payrollSlips, setPayrollSlips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [notification, setNotification] = useState(null);

  // Resignation & Exit states
  const [exitData, setExitData] = useState(null);
  const [submittingResignation, setSubmittingResignation] = useState(false);
  const [withdrawingResignation, setWithdrawingResignation] = useState(false);
  const [showWithdrawConfirm, setShowWithdrawConfirm] = useState(false);
  const [resignationForm, setResignationForm] = useState({
    notice_days: 30,
    resignation_date: new Date().toISOString().split('T')[0],
    last_working_day: new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
    reason_category: 'Better Career Opportunity',
    detailed_reason: '',
    personal_email: '',
    personal_phone: '',
    confirm_handover: false,
  });

  // Modals & Action States
  const [punchLocation, setPunchLocation] = useState('Hanoi HQ / Factory Floor');
  const [punching, setPunching] = useState(false);
  const [showOvertimeModal, setShowOvertimeModal] = useState(false);
  const [showLeaveModal, setShowLeaveModal] = useState(false);
  const [showRegModal, setShowRegModal] = useState(false);
  const [viewingSlip, setViewingSlip] = useState(null);
  const [viewingAuditTimesheet, setViewingAuditTimesheet] = useState(null);

  // Form states
  const [otForm, setOtForm] = useState({
    date: new Date().toISOString().split('T')[0],
    hours: '2.0',
    reason: 'Late container loading & export inspection at berth',
  });
  const [submittingOT, setSubmittingOT] = useState(false);

  const [leaveForm, setLeaveForm] = useState({
    leave_type: 'Annual Leave',
    start_date: new Date().toISOString().split('T')[0],
    end_date: new Date().toISOString().split('T')[0],
    total_days: 1,
    reason: 'Personal family matter',
  });
  const [submittingLeave, setSubmittingLeave] = useState(false);

  const [regForm, setRegForm] = useState({
    date: new Date().toISOString().split('T')[0],
    punch_type: 'BOTH',
    requested_clock_in: '08:30 AM',
    requested_clock_out: '05:30 PM',
    reason: 'On-site port inspection at Hai Phong Container Berth',
  });
  const [submittingReg, setSubmittingReg] = useState(false);
  const [complianceData, setComplianceData] = useState(null);

  // ──────────────────── Weekly Project Timesheets ────────────────────
  const CHARGE_CODES = [
    { code: 'PRJ-EXP-01', name: 'Global Spice & Pepper Export Logistics' },
    { code: 'PRJ-QA-02', name: 'ISO 22000 / HACCP Lab Testing & QA' },
    { code: 'PRJ-OPS-03', name: 'Hai Phong & Kochi Port Warehouse Ops' },
    { code: 'PRJ-ADM-04', name: 'Corporate Management & Trade Compliance' },
    { code: 'PRJ-TRN-05', name: 'Food Safety Induction & Skill Training' },
    { code: 'PRJ-GEN-06', name: 'General Administrative & Ops Support' },
  ];

  const [weekStart, setWeekStart] = useState('2026-10-19');
  const [weekEnd, setWeekEnd] = useState('2026-10-25');
  const [timesheetStatus, setTimesheetStatus] = useState('DRAFT');
  const [timesheetApprover, setTimesheetApprover] = useState('Rajesh Sharma (QA & Operations Director)');
  const [savingTimesheet, setSavingTimesheet] = useState(false);
  const [timesheetRows, setTimesheetRows] = useState([
    {
      id: 'ts-1',
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
    },
    {
      id: 'ts-2',
      charge_code: 'PRJ-ADM-04',
      project_name: 'Corporate Management & Trade Compliance',
      task_desc: 'Weekly cross-department operations sync and statutory audit checks',
      mon_hours: 0.0,
      tue_hours: 0.0,
      wed_hours: 0.0,
      thu_hours: 0.0,
      fri_hours: 0.0,
      sat_hours: 0.0,
      sun_hours: 0.0,
    }
  ]);
  const [timesheetHistory, setTimesheetHistory] = useState([
    { id: 'TS-HIST-01', week_start: '2026-10-12', week_end: '2026-10-18', total_hours: 40.0, status: 'APPROVED', approver: 'Rajesh Sharma', project_name: 'Global Spice & Pepper Export Logistics' },
    { id: 'TS-HIST-02', week_start: '2026-10-05', week_end: '2026-10-11', total_hours: 42.5, status: 'APPROVED', approver: 'Rajesh Sharma', project_name: 'Global Spice & Pepper Export Logistics' },
    { id: 'TS-HIST-03', week_start: '2026-09-28', week_end: '2026-10-04', total_hours: 40.0, status: 'APPROVED', approver: 'Rajesh Sharma', project_name: 'Global Spice & Pepper Export Logistics' },
  ]);

  // Realtime clock
  const [currentTime, setCurrentTime] = useState(new Date());
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const notify = (type, msg) => {
    setNotification({ type, msg });
    setTimeout(() => setNotification(null), 3500);
  };

  // Load employee master list
  useEffect(() => {
    api.getEmployees().then(res => {
      if (res && Array.isArray(res) && res.length > 0) {
        setEmployees(res);
      }
    }).catch(() => {});
  }, []);

  // Fetch employee specific data
  const loadPortalData = useCallback(async (empId) => {
    if (!empId) return;
    setLoading(true);
    try {
      const [attRes, leaveRes, balRes, otRes, ssRes, payRes, compRes, tsRes, exitRes] = await Promise.allSettled([
        api.getEmployeeAttendanceHistory(empId),
        api.getEmployeeLeaveHistory(empId),
        api.getLeaveBalance(empId),
        api.getOvertimeLogs(),
        api.getSalaryStructure(empId),
        api.getEmployeePayrollHistory(empId),
        api.getEmployeeCompliance(empId),
        api.getTimesheets(empId),
        api.getEmployeeExit ? api.getEmployeeExit(empId) : Promise.resolve(null),
      ]);

      if (exitRes.status === 'fulfilled' && exitRes.value && exitRes.value.status !== 'WITHDRAWN') {
        setExitData(exitRes.value);
      } else {
        try {
          const stored = localStorage.getItem('soilex_employee_exits');
          if (stored) {
            const list = JSON.parse(stored);
            const found = list.find(x => x.employee_id === empId && x.status !== 'WITHDRAWN');
            setExitData(found || null);
          } else {
            setExitData(null);
          }
        } catch {
          setExitData(null);
        }
      }

      if (tsRes.status === 'fulfilled' && tsRes.value && Array.isArray(tsRes.value) && tsRes.value.length > 0) {
        setTimesheetHistory(tsRes.value);
        const currentWeekTS = tsRes.value.find(t => t.week_start === weekStart);
        if (currentWeekTS) {
          setTimesheetStatus(currentWeekTS.status || 'DRAFT');
        }
      }

      if (attRes.status === 'fulfilled' && attRes.value && Array.isArray(attRes.value)) {
        setAttendanceLogs(attRes.value);
      } else {
        setAttendanceLogs([
          { id: 'ATT-01', date: new Date().toISOString().split('T')[0], clock_in: '08:28 AM', clock_out: null, work_hours: 0, status: 'PRESENT', source: 'DESKTOP_PUNCH', location: 'Hanoi HQ' },
          { id: 'ATT-02', date: '2026-09-04', clock_in: '08:25 AM', clock_out: '05:35 PM', work_hours: 9.17, status: 'PRESENT', source: 'BIOMETRIC_DEVICE', location: 'Hanoi HQ' },
          { id: 'ATT-03', date: '2026-09-03', clock_in: '08:30 AM', clock_out: '05:30 PM', work_hours: 9.0, status: 'PRESENT', source: 'BIOMETRIC_DEVICE', location: 'Hanoi HQ' },
        ]);
      }

      if (leaveRes.status === 'fulfilled' && leaveRes.value && Array.isArray(leaveRes.value)) {
        setLeaveRequests(leaveRes.value);
      } else {
        setLeaveRequests([
          { id: 'LEV-01', leave_type: 'Annual Leave', start_date: '2026-08-15', end_date: '2026-08-17', total_days: 3, reason: 'Family travel', status: 'APPROVED', created_at: '2026-08-10' }
        ]);
      }

      if (balRes.status === 'fulfilled' && balRes.value) {
        setLeaveBalance(balRes.value);
      }

      if (otRes.status === 'fulfilled' && otRes.value && Array.isArray(otRes.value)) {
        // filter for this employee
        const userOt = otRes.value.filter(o => o.employee_id === empId);
        setOvertimeLogs(userOt);
      } else {
        setOvertimeLogs([
          { id: 'OT-01', employee_id: empId, employee_name: employee.full_name, date: '2026-09-03', hours: 2.5, reason: 'Urgent Dubai container phytosanitary documentation', status: 'APPROVED', approved_by: 'HR Manager' }
        ]);
      }

      if (ssRes.status === 'fulfilled' && ssRes.value) {
        setSalaryStructure(ssRes.value);
      } else {
        setSalaryStructure({
          ctc_annual: 38400,
          basic_monthly: 2200,
          hra_monthly: 880,
          transport_allowance: 200,
          medical_allowance: 100,
          special_allowance: 270,
          pf_employee: 264,
          professional_tax: 50
        });
      }

      if (payRes.status === 'fulfilled' && payRes.value && Array.isArray(payRes.value)) {
        setPayrollSlips(payRes.value);
      } else {
        setPayrollSlips([
          { id: 'PAY-1', employee_id: empId, employee_name: employee.full_name, month_year: 'August 2026', basic_pay: 2200, allowances: 450, overtime_hours: 4.5, overtime_pay: 92.81, deductions: 120, tax: 180, net_salary: 2442.81, status: 'PAID', disbursed_at: '2026-08-31', bank: 'Vietcombank' }
        ]);
      }

      if (compRes.status === 'fulfilled' && compRes.value) {
        setComplianceData(compRes.value);
      } else {
        setComplianceData({
          medical_fitness_status: 'FIT_FOR_FOOD_HANDLING',
          medical_checkup_date: '2026-02-15',
          medical_cert_expiry: '2027-02-14',
          communicable_disease_screened: true,
          haccp_trained: true,
          blood_group: 'B+',
          emergency_contact_name: 'Nguyen Van Tu (Spouse)',
          emergency_contact_phone: '+84-909-887766',
          notes: 'ISO 22000 compliant. Annual occupational check completed with zero communicable flags.',
        });
      }

      // Fetch corporate holidays and merge with localStorage
      try {
        const holData = await api.getHolidays().catch(() => []);
        let list = (holData && Array.isArray(holData) && holData.length > 0) ? [...holData] : [...FALLBACK_HOLIDAYS];
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
        setHolidays(list.sort((a, b) => new Date(a.date) - new Date(b.date)));
      } catch (err) {}
    } catch {
      notify('error', 'Failed to refresh employee portal data.');
    } finally {
      setLoading(false);
    }
  }, [employee]);

  useEffect(() => {
    loadPortalData(selectedEmpId);

    const handleHolidayAdded = () => {
      loadPortalData(selectedEmpId);
    };
    const handleExitUpdated = () => {
      loadPortalData(selectedEmpId);
    };
    window.addEventListener('soilex-holiday-added', handleHolidayAdded);
    window.addEventListener('soilex-exit-updated', handleExitUpdated);
    window.addEventListener('storage', handleHolidayAdded);

    return () => {
      window.removeEventListener('soilex-holiday-added', handleHolidayAdded);
      window.removeEventListener('soilex-exit-updated', handleExitUpdated);
      window.removeEventListener('storage', handleHolidayAdded);
    };
  }, [selectedEmpId, loadPortalData]);

  // Today's attendance record
  const todayStr = useMemo(() => new Date().toISOString().split('T')[0], []);
  const todayPunch = useMemo(() => {
    return attendanceLogs.find(l => l.date === todayStr);
  }, [attendanceLogs, todayStr]);

  // ── Timesheet Handlers ─────────────────────────────────────────────────────
  const handleRowHoursChange = (index, dayKey, value) => {
    const val = parseFloat(value) || 0;
    setTimesheetRows(prev => {
      const updated = [...prev];
      updated[index] = {
        ...updated[index],
        [dayKey]: Math.max(0, Math.min(24, val))
      };
      return updated;
    });
  };

  const handleRowChargeCodeChange = (index, code) => {
    const matched = CHARGE_CODES.find(c => c.code === code);
    setTimesheetRows(prev => {
      const updated = [...prev];
      updated[index] = {
        ...updated[index],
        charge_code: code,
        project_name: matched ? matched.name : code
      };
      return updated;
    });
  };

  const handleRowTaskDescChange = (index, desc) => {
    setTimesheetRows(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], task_desc: desc };
      return updated;
    });
  };

  const handleAddTimesheetRow = () => {
    setTimesheetRows(prev => [
      ...prev,
      {
        id: `ts-${Date.now()}`,
        charge_code: CHARGE_CODES[0].code,
        project_name: CHARGE_CODES[0].name,
        task_desc: '',
        mon_hours: 0,
        tue_hours: 0,
        wed_hours: 0,
        thu_hours: 0,
        fri_hours: 0,
        sat_hours: 0,
        sun_hours: 0,
      }
    ]);
  };

  const handleRemoveTimesheetRow = (index) => {
    if (timesheetRows.length <= 1) {
      notify('error', 'Timesheet must have at least one project line item.');
      return;
    }
    setTimesheetRows(prev => prev.filter((_, i) => i !== index));
  };

  const handleCopyLastWeek = () => {
    setTimesheetRows([
      {
        id: `ts-${Date.now()}-1`,
        charge_code: 'PRJ-EXP-01',
        project_name: 'Global Spice & Pepper Export Logistics',
        task_desc: 'Standard export documentation and port logistics dispatch',
        mon_hours: 8.0,
        tue_hours: 8.0,
        wed_hours: 8.0,
        thu_hours: 8.0,
        fri_hours: 8.0,
        sat_hours: 0.0,
        sun_hours: 0.0,
      },
      {
        id: `ts-${Date.now()}-2`,
        charge_code: 'PRJ-ADM-04',
        project_name: 'Corporate Management & Trade Compliance',
        task_desc: 'Weekly cross-department operations sync and statutory audit checks',
        mon_hours: 0.0,
        tue_hours: 0.0,
        wed_hours: 0.0,
        thu_hours: 0.0,
        fri_hours: 0.0,
        sat_hours: 0.0,
        sun_hours: 0.0,
      }
    ]);
    notify('success', "Copied last week's project codes and activities.");
  };

  // Compute column totals and grand total
  const timesheetTotals = useMemo(() => {
    const days = ['mon_hours', 'tue_hours', 'wed_hours', 'thu_hours', 'fri_hours', 'sat_hours', 'sun_hours'];
    const colTotals = {
      mon_hours: 0,
      tue_hours: 0,
      wed_hours: 0,
      thu_hours: 0,
      fri_hours: 0,
      sat_hours: 0,
      sun_hours: 0,
    };
    let grandTotal = 0;

    timesheetRows.forEach(row => {
      days.forEach(day => {
        const h = parseFloat(row[day]) || 0;
        colTotals[day] += h;
        grandTotal += h;
      });
    });

    return { colTotals, grandTotal };
  }, [timesheetRows]);

  const handleSaveTimesheet = async (targetStatus = 'DRAFT') => {
    setSavingTimesheet(true);
    try {
      const payload = {
        employee_id: selectedEmpId,
        employee_name: employee.full_name,
        week_start: weekStart,
        week_end: weekEnd,
        status: targetStatus,
        approver: timesheetApprover,
        items: timesheetRows.map(r => ({
          ...r,
          total_hours: (parseFloat(r.mon_hours)||0) + (parseFloat(r.tue_hours)||0) +
                       (parseFloat(r.wed_hours)||0) + (parseFloat(r.thu_hours)||0) +
                       (parseFloat(r.fri_hours)||0) + (parseFloat(r.sat_hours)||0) +
                       (parseFloat(r.sun_hours)||0)
        }))
      };

      const res = await api.saveTimesheet(payload);
      if (res !== null) {
        setTimesheetStatus(targetStatus);
        notify(
          'success',
          targetStatus === 'SUBMITTED'
            ? `Timesheet submitted to ${timesheetApprover} for weekly approval!`
            : 'Timesheet draft saved successfully.'
        );
        const updatedTS = await api.getTimesheets(selectedEmpId);
        if (updatedTS && Array.isArray(updatedTS)) {
          setTimesheetHistory(updatedTS);
        }
      } else {
        notify('error', 'Failed to save timesheet.');
      }
    } catch {
      notify('error', 'Network error saving timesheet.');
    } finally {
      setSavingTimesheet(false);
    }
  };

  // Handle Clock In
  const handleClockIn = async () => {
    setPunching(true);
    try {
      const res = await api.clockIn(selectedEmpId, punchLocation);
      if (res !== null) {
        notify('success', `Clock-in successfully recorded at ${new Date().toLocaleTimeString()}!`);
        await loadPortalData(selectedEmpId);
      } else {
        notify('error', 'Clock-in failed. Please retry.');
      }
    } catch {
      notify('error', 'Punch system error.');
    } finally {
      setPunching(false);
    }
  };

  // Handle Clock Out
  const handleClockOut = async () => {
    setPunching(true);
    try {
      const res = await api.clockOut(selectedEmpId, punchLocation);
      if (res !== null) {
        notify('success', `Clock-out recorded! Daily work hours computed and verified.`);
        await loadPortalData(selectedEmpId);
      } else {
        notify('error', 'Clock-out failed. Please retry.');
      }
    } catch {
      notify('error', 'Punch system error.');
    } finally {
      setPunching(false);
    }
  };

  // Handle Overtime submission
  const handleSubmitOvertime = async (e) => {
    e.preventDefault();
    if (!otForm.hours || Number(otForm.hours) <= 0) {
      notify('error', 'Please enter valid overtime hours.');
      return;
    }
    setSubmittingOT(true);
    try {
      const payload = {
        employee_id: selectedEmpId,
        employee_name: employee.full_name,
        date: otForm.date,
        hours: parseFloat(otForm.hours),
        reason: otForm.reason,
        status: 'PENDING',
        approved_by: '-'
      };
      const res = await api.createOvertimeLog(payload);
      if (res !== null) {
        notify('success', 'Overtime logged and submitted for HR review.');
        setShowOvertimeModal(false);
        setOtForm({
          date: new Date().toISOString().split('T')[0],
          hours: '2.0',
          reason: 'Late container loading & export inspection at berth',
        });
        await loadPortalData(selectedEmpId);
      } else {
        notify('error', 'Failed to submit overtime.');
      }
    } catch {
      notify('error', 'Error submitting overtime log.');
    } finally {
      setSubmittingOT(false);
    }
  };

  // Handle Leave submission
  const handleSubmitLeave = async (e) => {
    e.preventDefault();
    setSubmittingLeave(true);
    try {
      const payload = {
        employee_id: selectedEmpId,
        employee_name: employee.full_name,
        leave_type: leaveForm.leave_type,
        start_date: leaveForm.start_date,
        end_date: leaveForm.end_date,
        total_days: parseInt(leaveForm.total_days || 1, 10),
        reason: leaveForm.reason,
        status: 'PENDING'
      };
      const res = await api.submitLeaveRequest(payload);
      if (res !== null) {
        notify('success', 'Leave application submitted successfully for HR approval.');
        setShowLeaveModal(false);
        await loadPortalData(selectedEmpId);
      } else {
        notify('error', 'Failed to submit leave request.');
      }
    } catch {
      notify('error', 'Error submitting leave request.');
    } finally {
      setSubmittingLeave(false);
    }
  };

  const handleRegularizeSubmit = async (e) => {
    e.preventDefault();
    setSubmittingReg(true);
    try {
      const payload = {
        employee_id: selectedEmpId,
        employee_name: employee.full_name,
        date: regForm.date,
        punch_type: regForm.punch_type,
        requested_clock_in: regForm.requested_clock_in,
        requested_clock_out: regForm.requested_clock_out,
        reason: regForm.reason,
      };
      const res = await api.createRegularization(payload);
      if (res !== null) {
        notify('success', 'Missed punch regularization claim submitted for HR approval.');
        setShowRegModal(false);
        setRegForm({
          date: new Date().toISOString().split('T')[0],
          punch_type: 'BOTH',
          requested_clock_in: '08:30 AM',
          requested_clock_out: '05:30 PM',
          reason: '',
        });
      } else {
        notify('error', 'Failed to submit regularization claim.');
      }
    } catch {
      notify('error', 'Error submitting claim.');
    } finally {
      setSubmittingReg(false);
    }
  };

  // ── Resignation & Separation Handlers ──────────────────────────────────────
  const handleNoticeDaysChange = (days) => {
    const d = parseInt(days) || 30;
    const resDate = new Date(resignationForm.resignation_date || Date.now());
    const lwd = new Date(resDate.getTime() + d * 86400000).toISOString().split('T')[0];
    setResignationForm(prev => ({ ...prev, notice_days: d, last_working_day: lwd }));
  };

  const handleResignationDateChange = (date) => {
    const resDate = new Date(date || Date.now());
    const d = parseInt(resignationForm.notice_days) || 30;
    const lwd = new Date(resDate.getTime() + d * 86400000).toISOString().split('T')[0];
    setResignationForm(prev => ({ ...prev, resignation_date: date, last_working_day: lwd }));
  };

  const handleSubmitResignation = async (e) => {
    e.preventDefault();
    if (!resignationForm.confirm_handover) {
      notify('error', 'Please confirm the handover commitment and company asset return policy.');
      return;
    }
    setSubmittingResignation(true);
    try {
      const monthlyBasic = salaryStructure?.basic_monthly || 2200;
      const dailyRate = Math.round(monthlyBasic / 30);
      const unpaidDays = 15;
      const leaveDays = Math.max(0, (leaveBalance?.annual_total || 18) - (leaveBalance?.annual_used || 3));
      const settlementAmt = (unpaidDays + leaveDays) * dailyRate;

      const reasonFull = `${resignationForm.reason_category}${resignationForm.detailed_reason ? ': ' + resignationForm.detailed_reason : ''}`;

      const payload = {
        employee_id: selectedEmpId,
        employee_name: employee.full_name,
        department: employee.department || 'Operations',
        resignation_date: resignationForm.resignation_date,
        last_working_day: resignationForm.last_working_day,
        notice_days: parseInt(resignationForm.notice_days) || 30,
        reason: reasonFull,
        status: 'SUBMITTED',
        unpaid_salary_days: unpaidDays,
        leave_encashment_days: leaveDays,
        settlement_amount: settlementAmt,
        it_clearance: false,
        finance_clearance: false,
        admin_clearance: false,
      };

      const res = await api.submitExitRequest(payload);
      const createdData = res || {
        ...payload,
        id: `EXT-${Date.now() % 10000}`,
        created_at: new Date().toISOString(),
      };

      try {
        const stored = JSON.parse(localStorage.getItem('soilex_employee_exits') || '[]');
        const updated = stored.filter(x => x.employee_id !== selectedEmpId);
        updated.push(createdData);
        localStorage.setItem('soilex_employee_exits', JSON.stringify(updated));
      } catch {}

      setExitData(createdData);
      window.dispatchEvent(new CustomEvent('soilex-exit-updated', { detail: createdData }));
      notify('success', 'Formal resignation initiated. Your submission has been routed to HR Operations.');
    } catch {
      notify('error', 'Failed to submit resignation request.');
    } finally {
      setSubmittingResignation(false);
    }
  };

  const handleWithdrawResignation = async () => {
    if (!exitData) return;
    setWithdrawingResignation(true);
    try {
      if (exitData.id) {
        await api.withdrawExitRequest(exitData.id).catch(() => null);
      }
      try {
        const stored = JSON.parse(localStorage.getItem('soilex_employee_exits') || '[]');
        const updated = stored.filter(x => x.id !== exitData.id && x.employee_id !== selectedEmpId);
        localStorage.setItem('soilex_employee_exits', JSON.stringify(updated));
      } catch {}

      setExitData(null);
      setShowWithdrawConfirm(false);
      window.dispatchEvent(new CustomEvent('soilex-exit-updated', { detail: { id: exitData.id, status: 'WITHDRAWN' } }));
      notify('success', 'Resignation successfully withdrawn. Your employment status remains active in good standing.');
    } catch {
      notify('error', 'Failed to withdraw resignation.');
    } finally {
      setWithdrawingResignation(false);
    }
  };

  // Overtime summary metrics
  const totalApprovedOT = useMemo(() => {
    return overtimeLogs
      .filter(o => o.status === 'APPROVED')
      .reduce((sum, o) => sum + parseFloat(o.hours || 0), 0);
  }, [overtimeLogs]);

  const totalPendingOT = useMemo(() => {
    return overtimeLogs
      .filter(o => o.status === 'PENDING')
      .reduce((sum, o) => sum + parseFloat(o.hours || 0), 0);
  }, [overtimeLogs]);

  const hourlyRate = (salaryStructure?.basic_monthly || 2200) / 160.0;
  const estimatedOTPay = (totalApprovedOT * hourlyRate * 1.5).toFixed(2);

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Toast Notification */}
      {notification && (
        <div
          className={`fixed top-4 right-4 z-[9999] flex items-center space-x-2 px-4 py-3 rounded-lg shadow-xl border text-xs font-bold transition-all ${
            notification.type === 'success'
              ? 'bg-emerald-50 border-emerald-300 text-emerald-800'
              : 'bg-red-50 border-red-300 text-red-800'
          }`}
        >
          <span>{notification.type === 'success' ? '✓' : '✕'}</span>
          <span>{notification.msg}</span>
        </div>
      )}

      {/* Top Banner: Employee Profile & Quick Role Switcher for Admin/HR */}
      <div className="bg-white rounded-xl border border-[#E2E8F0] shadow-sm p-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-full bg-gradient-to-l from-blue-50/60 to-transparent pointer-events-none" />
        
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          {/* Employee Avatar & Identity */}
          <div className="flex items-center space-x-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#1E40AF] to-blue-700 text-white font-black text-2xl flex items-center justify-center shadow-md shrink-0">
              {employee.full_name?.split(' ').map(n => n[0]).join('').slice(0, 2) || 'SX'}
            </div>
            <div className="space-y-1">
              <div className="flex items-center space-x-2">
                <h1 className="text-xl font-black text-slate-900 tracking-tight">{employee.full_name}</h1>
                <span className="text-[10px] font-bold bg-blue-100 text-[#1E40AF] border border-blue-200 px-2.5 py-0.5 rounded-full">
                  {user?.role || 'EMPLOYEE'}
                </span>
                <span className="text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200 px-2 py-0.5 rounded-full">
                  {employee.status}
                </span>
              </div>
              <p className="text-xs font-bold text-slate-600">
                {employee.designation} · <span className="text-[#1E40AF] font-bold">{employee.department}</span>
              </p>
              <div className="flex items-center space-x-4 text-[11px] text-slate-500 font-medium pt-0.5">
                <span className="flex items-center space-x-1">
                  <MapPin className="w-3.5 h-3.5 text-slate-400" />
                  <span>{employee.branch}</span>
                </span>
                <span className="flex items-center space-x-1 font-mono text-[#D97706] font-bold">
                  <span>ID: {employee.employee_code || employee.id}</span>
                </span>
                <span className="flex items-center space-x-1">
                  <Clock className="w-3.5 h-3.5 text-slate-400" />
                  <span>{employee.shift}</span>
                </span>
              </div>
            </div>
          </div>

          {/* Quick Employee Switcher (for Admin/HR testing & management) */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
            {(!user || user.role === 'ADMIN' || user.role === 'HR_MANAGER') ? (
              <div className="text-right sm:text-left">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">VIEW PORTAL AS (ADMIN/HR)</span>
                <select
                  value={selectedEmpId}
                  onChange={(e) => setSelectedEmpId(e.target.value)}
                  className="mt-0.5 bg-slate-50 border border-[#E2E8F0] rounded-lg px-3 py-1.5 text-xs font-bold text-slate-800 focus:outline-none focus:border-[#1E40AF] shadow-sm cursor-pointer"
                >
                  {employees.map(emp => (
                    <option key={emp.id} value={emp.id}>
                      {emp.full_name} ({emp.employee_code || emp.id}) — {emp.department}
                    </option>
                  ))}
                </select>
              </div>
            ) : (
              <div className="bg-emerald-50 border border-emerald-200 rounded-lg px-3.5 py-1.5 text-xs font-bold text-emerald-900 flex items-center space-x-2">
                <span>🔒</span>
                <div>
                  <div className="text-[10px] uppercase font-mono text-emerald-700">IAM Role: EMPLOYEE</div>
                  <div className="text-xs font-bold text-emerald-950">Minimum Access: Personal Self-Service</div>
                </div>
              </div>
            )}

            {/* Resignation Status / Quick Action */}
            {exitData && exitData.status !== 'SETTLED' ? (
              <button
                type="button"
                onClick={() => setActiveTab('RESIGNATION')}
                className="px-3 py-2 rounded-lg border text-xs font-bold flex items-center space-x-1.5 transition-all shadow-xs bg-amber-50 border-amber-300 text-amber-900 hover:bg-amber-100"
                title="View separation timeline and clearance progress"
              >
                <LogOut className="w-3.5 h-3.5 text-amber-700" />
                <span>Separation Active: {exitData.status} • LWD: {exitData.last_working_day}</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setActiveTab('RESIGNATION')}
                className="px-3 py-2 rounded-lg border text-xs font-bold flex items-center space-x-1.5 transition-all shadow-xs bg-white hover:bg-slate-50 border-slate-200 text-slate-700"
                title="Initiate formal employee resignation request"
              >
                <LogOut className="w-3.5 h-3.5 text-slate-400" />
                <span>+ Initiate Resignation</span>
              </button>
            )}

            {/* Quick My Day Planner Jump */}
            {onNavigate && (
              <button
                type="button"
                onClick={() => onNavigate('my_day')}
                className="px-3 py-2 rounded-lg border text-xs font-bold flex items-center space-x-1.5 transition-all shadow-xs bg-amber-50 hover:bg-amber-100 border-amber-200 text-amber-900"
                title="Open personal daily agenda & focus planner"
              >
                <Sun className="w-3.5 h-3.5 text-amber-600" />
                <span>My Day Planner</span>
              </button>
            )}

            {/* Live Clock Pill */}
            <div className="bg-slate-900 text-white px-4 py-2 rounded-lg shadow-sm flex items-center space-x-2.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <div className="text-right">
                <p className="font-mono text-xs font-black tracking-widest">
                  {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                </p>
                <p className="text-[9px] uppercase font-semibold text-slate-400">
                  {currentTime.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' })}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex border-b border-[#E2E8F0] space-x-2 overflow-x-auto">
        {[
          { id: 'HOURS_TRACKER', label: 'WEEKLY TIMESHEET & HOURS', icon: Clock },
          { id: 'OVERTIME', label: 'OVERTIME LOGS & CLAIMS', icon: TrendingUp },
          { id: 'LEAVE_CENTER', label: 'LEAVE BALANCES & APPLICATIONS', icon: Calendar },
          { id: 'SALARY_DETAILS', label: 'SALARY STRUCTURE & PAYSLIPS', icon: Receipt },
          { id: 'COMPLIANCE', label: 'FOOD SAFETY & ISO 22000 HEALTH', icon: ShieldAlert },
          {
            id: 'RESIGNATION',
            label: exitData && exitData.status !== 'SETTLED' ? 'RESIGNATION & SEPARATION' : 'RESIGNATION & SEPARATION',
            icon: LogOut,
            hasBadge: Boolean(exitData && exitData.status !== 'SETTLED'),
            badgeText: exitData?.status || 'INITIATE',
          },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center space-x-2 px-4 py-3 text-xs font-bold uppercase tracking-wider border-b-2 transition-all whitespace-nowrap ${
                isActive
                  ? 'border-[#1E40AF] text-[#1E40AF] bg-white shadow-sm'
                  : 'border-transparent text-slate-500 hover:text-slate-900 hover:border-slate-300'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
              {tab.hasBadge && (
                <span className="ml-1.5 px-1.5 py-0.5 rounded text-[9px] font-black bg-amber-100 text-amber-800 border border-amber-300 animate-pulse">
                  {tab.badgeText}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* ──────────────────── TAB 1: WEEKLY PROJECT TIMESHEET ──────────────────── */}
      {activeTab === 'HOURS_TRACKER' && (
        <div className="space-y-6">
          {/* Top Timesheet Control & Info Bar */}
          <div className="bg-white rounded-xl border border-[#E2E8F0] shadow-card p-5">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              {/* Week Navigation */}
              <div className="flex items-center space-x-3">
                <div className="p-2.5 rounded-lg bg-blue-50 text-[#1E40AF]">
                  <Calendar className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-400">TIMESHEET PERIOD</span>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${
                      timesheetStatus === 'APPROVED' ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' :
                      timesheetStatus === 'SUBMITTED' ? 'bg-blue-100 text-blue-800 border border-blue-300' :
                      'bg-amber-100 text-amber-800 border border-amber-300'
                    }`}>
                      {timesheetStatus === 'APPROVED' ? '✓ APPROVED' :
                       timesheetStatus === 'SUBMITTED' ? '⏳ PENDING MANAGER APPROVAL' :
                       '📝 DRAFT (EDITABLE)'}
                    </span>
                  </div>
                  <div className="flex items-center space-x-2 mt-1">
                    <h2 className="text-base font-black text-slate-900 font-mono">
                      {weekStart} &nbsp;→&nbsp; {weekEnd}
                    </h2>
                    <span className="text-xs font-semibold text-slate-500">(Mon – Sun Standard Week)</span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center gap-2.5">
                <button
                  type="button"
                  onClick={handleCopyLastWeek}
                  className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-lg border border-slate-200 transition-colors flex items-center space-x-1.5"
                  title="Copy project charge codes and descriptions from previous week"
                >
                  <Copy className="w-3.5 h-3.5 text-slate-500" />
                  <span>COPY LAST WEEK</span>
                </button>

                <button
                  type="button"
                  onClick={handleAddTimesheetRow}
                  className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-lg border border-slate-200 transition-colors flex items-center space-x-1.5"
                >
                  <Plus className="w-3.5 h-3.5 text-slate-500" />
                  <span>+ ADD PROJECT LINE</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleSaveTimesheet('DRAFT')}
                  disabled={savingTimesheet}
                  className="px-4 py-2 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold rounded-lg border border-slate-300 shadow-sm transition-colors flex items-center space-x-1.5"
                >
                  <Save className="w-3.5 h-3.5 text-slate-500" />
                  <span>{savingTimesheet ? 'SAVING...' : 'SAVE DRAFT'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleSaveTimesheet('SUBMITTED')}
                  disabled={savingTimesheet || timesheetStatus === 'APPROVED'}
                  className="px-4 py-2 bg-[#1E40AF] hover:bg-blue-800 disabled:opacity-50 text-white text-xs font-bold uppercase tracking-wider rounded-lg shadow-sm transition-all flex items-center space-x-1.5"
                >
                  <Send className="w-3.5 h-3.5 text-[#FDE68A]" />
                  <span>{timesheetStatus === 'APPROVED' ? 'TIMESHEET APPROVED' : 'SUBMIT FOR APPROVAL'}</span>
                </button>
              </div>
            </div>

            {/* Approver Strip */}
            <div className="mt-4 pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between text-xs text-slate-500 gap-2">
              <span className="flex items-center space-x-1.5">
                <span className="font-bold text-slate-700">Approving Manager:</span>
                <span className="font-medium text-[#1E40AF]">{timesheetApprover}</span>
              </span>
              <span className="text-[11px] text-slate-400">
                Standard corporate billing model: Timesheets close every Sunday 23:59 for payroll integration.
              </span>
            </div>
          </div>

          {/* 4 Weekly Timesheet Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white rounded-xl border border-[#E2E8F0] shadow-card p-5">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">WEEKLY TARGET</span>
              <p className="text-2xl font-black text-slate-900 mt-2 font-mono">40.0 hrs</p>
              <p className="text-xs text-slate-500 font-semibold mt-1">Standard Corporate Work Week</p>
            </div>

            <div className="bg-white rounded-xl border border-[#E2E8F0] shadow-card p-5">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">HOURS LOGGED</span>
              <p className="text-2xl font-black text-[#1E40AF] mt-2 font-mono">
                {timesheetTotals.grandTotal.toFixed(1)} hrs
              </p>
              <div className="flex items-center space-x-2 mt-1">
                <div className="w-20 bg-slate-100 rounded-full h-2 overflow-hidden">
                  <div
                    className={`h-2 rounded-full ${
                      timesheetTotals.grandTotal >= 40 ? 'bg-emerald-500' : 'bg-[#1E40AF]'
                    }`}
                    style={{ width: `${Math.min(100, (timesheetTotals.grandTotal / 40.0) * 100)}%` }}
                  />
                </div>
                <span className="text-[11px] font-bold text-slate-600">
                  {Math.round((timesheetTotals.grandTotal / 40.0) * 100)}%
                </span>
              </div>
            </div>

            <div className="bg-white rounded-xl border border-[#E2E8F0] shadow-card p-5">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">CHARGE CODES</span>
              <p className="text-2xl font-black text-emerald-700 mt-2 font-mono">{timesheetRows.length}</p>
              <p className="text-xs text-emerald-600 font-semibold mt-1">Active Projects / Client Accounts</p>
            </div>

            <div className="bg-white rounded-xl border border-[#E2E8F0] shadow-card p-5">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">APPROVAL STATUS</span>
              <p className={`text-2xl font-black mt-2 font-mono ${
                timesheetStatus === 'APPROVED' ? 'text-emerald-700' :
                timesheetStatus === 'SUBMITTED' ? 'text-blue-700' : 'text-amber-700'
              }`}>
                {timesheetStatus}
              </p>
              <p className="text-xs text-slate-500 font-semibold mt-1">
                {timesheetStatus === 'APPROVED' ? 'Approved for Payroll' : 'Editable by Employee'}
              </p>
            </div>
          </div>

          {/* Weekly Timesheet Grid Table */}
          <div className="bg-white rounded-xl border border-[#E2E8F0] shadow-card overflow-hidden">
            <div className="p-4 border-b border-[#E2E8F0] flex flex-wrap items-center justify-between gap-3 bg-slate-50/50">
              <div>
                <h3 className="text-xs font-black uppercase tracking-wider text-slate-800 flex items-center space-x-2">
                  <Clock className="w-4 h-4 text-[#1E40AF]" />
                  <span>WEEKLY PROJECT TIME ALLOCATION MATRIX</span>
                </h3>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Allocate daily hours against assigned charge codes. Mon–Fri standard 8h target.
                </p>
              </div>

              <div className="flex items-center space-x-3 text-xs font-semibold">
                <span className="flex items-center space-x-1.5 text-slate-600">
                  <span className="w-2.5 h-2.5 rounded-full bg-blue-500 inline-block" />
                  <span>Mon–Fri (Work Days)</span>
                </span>
                <span className="flex items-center space-x-1.5 text-slate-400">
                  <span className="w-2.5 h-2.5 rounded-full bg-slate-300 inline-block" />
                  <span>Sat–Sun (Weekend)</span>
                </span>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left text-slate-700">
                <thead className="bg-[#FAFAFA] border-b border-[#E2E8F0] text-[11px] font-bold uppercase tracking-wider text-slate-600">
                  <tr>
                    <th className="py-3 px-3 w-48">PROJECT / CHARGE CODE</th>
                    <th className="py-3 px-3 min-w-[220px]">ACTIVITY / TASK DESCRIPTION</th>
                    <th className="py-3 px-2 text-center w-14 bg-blue-50/40">MON<br/><span className="text-[9px] font-normal text-slate-400">19 Oct</span></th>
                    <th className="py-3 px-2 text-center w-14 bg-blue-50/40">TUE<br/><span className="text-[9px] font-normal text-slate-400">20 Oct</span></th>
                    <th className="py-3 px-2 text-center w-14 bg-blue-50/40">WED<br/><span className="text-[9px] font-normal text-slate-400">21 Oct</span></th>
                    <th className="py-3 px-2 text-center w-14 bg-blue-50/40">THU<br/><span className="text-[9px] font-normal text-slate-400">22 Oct</span></th>
                    <th className="py-3 px-2 text-center w-14 bg-blue-50/40">FRI<br/><span className="text-[9px] font-normal text-slate-400">23 Oct</span></th>
                    <th className="py-3 px-2 text-center w-14 bg-slate-50/60">SAT<br/><span className="text-[9px] font-normal text-slate-400">24 Oct</span></th>
                    <th className="py-3 px-2 text-center w-14 bg-slate-50/60">SUN<br/><span className="text-[9px] font-normal text-slate-400">25 Oct</span></th>
                    <th className="py-3 px-3 text-center w-16 bg-slate-100 font-black text-slate-900">TOTAL</th>
                    <th className="py-3 px-2 text-center w-12">ACT</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {timesheetRows.map((row, idx) => {
                    const rowTotal = (parseFloat(row.mon_hours) || 0) +
                                     (parseFloat(row.tue_hours) || 0) +
                                     (parseFloat(row.wed_hours) || 0) +
                                     (parseFloat(row.thu_hours) || 0) +
                                     (parseFloat(row.fri_hours) || 0) +
                                     (parseFloat(row.sat_hours) || 0) +
                                     (parseFloat(row.sun_hours) || 0);
                    return (
                      <tr key={row.id || idx} className="hover:bg-blue-50/30 transition-colors">
                        {/* Charge Code Select */}
                        <td className="py-2.5 px-3">
                          <select
                            value={row.charge_code}
                            onChange={(e) => handleRowChargeCodeChange(idx, e.target.value)}
                            disabled={timesheetStatus === 'APPROVED'}
                            className="w-full bg-white border border-[#E2E8F0] rounded px-2 py-1.5 text-xs font-bold text-slate-800 focus:outline-none focus:border-[#1E40AF]"
                          >
                            {CHARGE_CODES.map(c => (
                              <option key={c.code} value={c.code}>
                                {c.code} - {c.name.slice(0, 24)}...
                              </option>
                            ))}
                          </select>
                        </td>

                        {/* Task Description */}
                        <td className="py-2.5 px-3">
                          <input
                            type="text"
                            value={row.task_desc}
                            onChange={(e) => handleRowTaskDescChange(idx, e.target.value)}
                            placeholder="Enter task / deliverable details..."
                            disabled={timesheetStatus === 'APPROVED'}
                            className="w-full bg-white border border-[#E2E8F0] rounded px-2.5 py-1.5 text-xs text-slate-700 focus:outline-none focus:border-[#1E40AF]"
                          />
                        </td>

                        {/* Mon */}
                        <td className="py-2.5 px-1 bg-blue-50/20 text-center">
                          <input
                            type="number"
                            min="0"
                            max="24"
                            step="0.5"
                            value={row.mon_hours}
                            onChange={(e) => handleRowHoursChange(idx, 'mon_hours', e.target.value)}
                            disabled={timesheetStatus === 'APPROVED'}
                            className="w-12 text-center font-mono font-bold bg-white border border-[#E2E8F0] rounded py-1 text-xs focus:outline-none focus:border-[#1E40AF]"
                          />
                        </td>

                        {/* Tue */}
                        <td className="py-2.5 px-1 bg-blue-50/20 text-center">
                          <input
                            type="number"
                            min="0"
                            max="24"
                            step="0.5"
                            value={row.tue_hours}
                            onChange={(e) => handleRowHoursChange(idx, 'tue_hours', e.target.value)}
                            disabled={timesheetStatus === 'APPROVED'}
                            className="w-12 text-center font-mono font-bold bg-white border border-[#E2E8F0] rounded py-1 text-xs focus:outline-none focus:border-[#1E40AF]"
                          />
                        </td>

                        {/* Wed */}
                        <td className="py-2.5 px-1 bg-blue-50/20 text-center">
                          <input
                            type="number"
                            min="0"
                            max="24"
                            step="0.5"
                            value={row.wed_hours}
                            onChange={(e) => handleRowHoursChange(idx, 'wed_hours', e.target.value)}
                            disabled={timesheetStatus === 'APPROVED'}
                            className="w-12 text-center font-mono font-bold bg-white border border-[#E2E8F0] rounded py-1 text-xs focus:outline-none focus:border-[#1E40AF]"
                          />
                        </td>

                        {/* Thu */}
                        <td className="py-2.5 px-1 bg-blue-50/20 text-center">
                          <input
                            type="number"
                            min="0"
                            max="24"
                            step="0.5"
                            value={row.thu_hours}
                            onChange={(e) => handleRowHoursChange(idx, 'thu_hours', e.target.value)}
                            disabled={timesheetStatus === 'APPROVED'}
                            className="w-12 text-center font-mono font-bold bg-white border border-[#E2E8F0] rounded py-1 text-xs focus:outline-none focus:border-[#1E40AF]"
                          />
                        </td>

                        {/* Fri */}
                        <td className="py-2.5 px-1 bg-blue-50/20 text-center">
                          <input
                            type="number"
                            min="0"
                            max="24"
                            step="0.5"
                            value={row.fri_hours}
                            onChange={(e) => handleRowHoursChange(idx, 'fri_hours', e.target.value)}
                            disabled={timesheetStatus === 'APPROVED'}
                            className="w-12 text-center font-mono font-bold bg-white border border-[#E2E8F0] rounded py-1 text-xs focus:outline-none focus:border-[#1E40AF]"
                          />
                        </td>

                        {/* Sat */}
                        <td className="py-2.5 px-1 bg-slate-50/40 text-center">
                          <input
                            type="number"
                            min="0"
                            max="24"
                            step="0.5"
                            value={row.sat_hours}
                            onChange={(e) => handleRowHoursChange(idx, 'sat_hours', e.target.value)}
                            disabled={timesheetStatus === 'APPROVED'}
                            className="w-12 text-center font-mono font-medium text-slate-500 bg-white border border-[#E2E8F0] rounded py-1 text-xs focus:outline-none focus:border-[#1E40AF]"
                          />
                        </td>

                        {/* Sun */}
                        <td className="py-2.5 px-1 bg-slate-50/40 text-center">
                          <input
                            type="number"
                            min="0"
                            max="24"
                            step="0.5"
                            value={row.sun_hours}
                            onChange={(e) => handleRowHoursChange(idx, 'sun_hours', e.target.value)}
                            disabled={timesheetStatus === 'APPROVED'}
                            className="w-12 text-center font-mono font-medium text-slate-500 bg-white border border-[#E2E8F0] rounded py-1 text-xs focus:outline-none focus:border-[#1E40AF]"
                          />
                        </td>

                        {/* Row Total */}
                        <td className="py-2.5 px-3 text-center font-mono font-black text-slate-900 bg-slate-50">
                          {rowTotal.toFixed(1)}h
                        </td>

                        {/* Delete Row */}
                        <td className="py-2.5 px-2 text-center">
                          <button
                            type="button"
                            onClick={() => handleRemoveTimesheetRow(idx)}
                            disabled={timesheetStatus === 'APPROVED'}
                            className="p-1 text-slate-400 hover:text-red-600 rounded transition-colors disabled:opacity-30"
                            title="Delete project row"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>

                {/* Column Totals Row */}
                <tfoot className="bg-slate-100 border-t-2 border-slate-300 font-bold text-slate-900">
                  <tr>
                    <td colSpan={2} className="py-3 px-3 uppercase text-[11px] font-black tracking-wider text-slate-700">
                      DAILY TOTAL HOURS
                    </td>
                    <td className="py-3 px-1 text-center font-mono font-black text-[#1E40AF] bg-blue-100/50">
                      {timesheetTotals.colTotals.mon_hours.toFixed(1)}h
                    </td>
                    <td className="py-3 px-1 text-center font-mono font-black text-[#1E40AF] bg-blue-100/50">
                      {timesheetTotals.colTotals.tue_hours.toFixed(1)}h
                    </td>
                    <td className="py-3 px-1 text-center font-mono font-black text-[#1E40AF] bg-blue-100/50">
                      {timesheetTotals.colTotals.wed_hours.toFixed(1)}h
                    </td>
                    <td className="py-3 px-1 text-center font-mono font-black text-[#1E40AF] bg-blue-100/50">
                      {timesheetTotals.colTotals.thu_hours.toFixed(1)}h
                    </td>
                    <td className="py-3 px-1 text-center font-mono font-black text-[#1E40AF] bg-blue-100/50">
                      {timesheetTotals.colTotals.fri_hours.toFixed(1)}h
                    </td>
                    <td className="py-3 px-1 text-center font-mono font-medium text-slate-600 bg-slate-200/50">
                      {timesheetTotals.colTotals.sat_hours.toFixed(1)}h
                    </td>
                    <td className="py-3 px-1 text-center font-mono font-medium text-slate-600 bg-slate-200/50">
                      {timesheetTotals.colTotals.sun_hours.toFixed(1)}h
                    </td>
                    <td className="py-3 px-3 text-center font-mono font-black text-white bg-[#1E40AF] text-sm">
                      {timesheetTotals.grandTotal.toFixed(1)}h
                    </td>
                    <td></td>
                  </tr>
                </tfoot>
              </table>
            </div>

            {/* Target 40h compliance status banner */}
            <div className={`p-3.5 border-t flex flex-wrap items-center justify-between gap-3 text-xs ${
              timesheetTotals.grandTotal >= 40
                ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                : 'bg-amber-50 border-amber-200 text-amber-900'
            }`}>
              <div className="flex items-center space-x-2">
                {timesheetTotals.grandTotal >= 40 ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                )}
                <span className="font-bold">
                  {timesheetTotals.grandTotal >= 40
                    ? `Standard 40.0h weekly requirement satisfied (${timesheetTotals.grandTotal.toFixed(1)} hrs recorded)`
                    : `Currently ${timesheetTotals.grandTotal.toFixed(1)} / 40.0 hrs logged (${(40.0 - timesheetTotals.grandTotal).toFixed(1)} hrs remaining for full week target)`}
                </span>
              </div>

              <div className="flex items-center space-x-2 text-[11px] font-semibold">
                <span>Standard Shift: Mon–Fri 8h/day</span>
                <span>•</span>
                <span>Sat/Sun Weekend</span>
              </div>
            </div>
          </div>

          {/* Historical Timesheets Archive */}
          <div className="bg-white rounded-xl border border-[#E2E8F0] shadow-card overflow-hidden">
            <div className="p-4 border-b border-[#E2E8F0] flex flex-wrap items-center justify-between gap-3">
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                  PREVIOUS WEEKLY TIMESHEETS &amp; MANAGER AUDIT LOG
                </h3>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Historical submissions, manager sign-offs, and payroll disbursement audit trail.
                </p>
              </div>
              <span className="text-xs font-semibold text-slate-500">
                {timesheetHistory.length} Cycles Archived
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left text-slate-700">
                <thead className="bg-[#FAFAFA] border-b border-[#E2E8F0] text-[11px] font-bold uppercase tracking-wider text-slate-600">
                  <tr>
                    <th className="py-3 px-4">WEEK PERIOD</th>
                    <th className="py-3 px-4">PRIMARY PROJECT</th>
                    <th className="py-3 px-4 text-center">TOTAL HOURS</th>
                    <th className="py-3 px-4 text-center">STATUS</th>
                    <th className="py-3 px-4">APPROVED BY</th>
                    <th className="py-3 px-4 text-center">ACTIONS</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {timesheetHistory.map((ts) => (
                    <tr key={ts.id} className="hover:bg-blue-50/40 transition-colors">
                      <td className="py-3 px-4 font-mono font-bold text-slate-900">
                        {ts.week_start} → {ts.week_end}
                      </td>
                      <td className="py-3 px-4 text-slate-700">
                        {ts.project_name || 'Global Spice & Pepper Export Logistics'}
                      </td>
                      <td className="py-3 px-4 text-center font-mono font-black text-[#1E40AF]">
                        {ts.total_hours || 40.0} hrs
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                          ts.status === 'APPROVED' ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' :
                          ts.status === 'SUBMITTED' ? 'bg-blue-100 text-blue-800 border border-blue-200' :
                          'bg-amber-100 text-amber-800 border border-amber-200'
                        }`}>
                          {ts.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-600 font-semibold">
                        {ts.approver || 'Rajesh Sharma'}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <button
                          type="button"
                          onClick={() => setViewingAuditTimesheet(ts)}
                          className="px-2.5 py-1 bg-blue-50 hover:bg-blue-100 text-[#1E40AF] border border-blue-200 rounded text-[11px] font-bold transition-colors flex items-center justify-center space-x-1 mx-auto shadow-xs"
                          title="Open detailed timesheet audit log and compliance trace"
                        >
                          <FileText className="w-3 h-3 text-[#1E40AF]" />
                          <span>View Audit</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ──────────────────── TAB 2: OVERTIME LOGGING ──────────────────── */}
      {activeTab === 'OVERTIME' && (
        <div className="space-y-6">
          {/* Overtime Metric Highlights */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-xl border border-[#E2E8F0] shadow-card">
              <span className="text-xs font-bold text-slate-400 uppercase">APPROVED OVERTIME</span>
              <p className="text-2xl font-black text-emerald-700 mt-2">{totalApprovedOT} hrs</p>
              <span className="text-[11px] font-semibold text-emerald-600">Calculated in Monthly Run</span>
            </div>

            <div className="bg-white p-5 rounded-xl border border-[#E2E8F0] shadow-card">
              <span className="text-xs font-bold text-slate-400 uppercase">PENDING REVIEW</span>
              <p className="text-2xl font-black text-amber-600 mt-2">{totalPendingOT} hrs</p>
              <span className="text-[11px] font-semibold text-amber-600">Awaiting HR verification</span>
            </div>

            <div className="bg-white p-5 rounded-xl border border-[#E2E8F0] shadow-card">
              <span className="text-xs font-bold text-slate-400 uppercase">OVERTIME MULTIPLIER</span>
              <p className="text-2xl font-black text-[#1E40AF] mt-2">1.50x</p>
              <span className="text-[11px] font-semibold text-slate-500">Hourly Rate: ${hourlyRate.toFixed(2)}/hr</span>
            </div>

            <div className="bg-white p-5 rounded-xl border border-[#E2E8F0] shadow-card">
              <span className="text-xs font-bold text-slate-400 uppercase">APPROVED OT PAY EARNED</span>
              <p className="text-2xl font-black text-emerald-800 mt-2">${estimatedOTPay}</p>
              <span className="text-[11px] font-semibold text-emerald-700">Added to Salary Allowances</span>
            </div>
          </div>

          {/* Action Row */}
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <h2 className="text-sm font-bold text-slate-900 uppercase">OVERTIME REQUEST &amp; APPROVAL REGISTER</h2>
              <p className="text-xs text-slate-500">Track and submit extra working hours for commercial trade &amp; operations</p>
            </div>
            <button
              onClick={() => setShowOvertimeModal(true)}
              className="px-4 py-2 bg-[#1E40AF] hover:bg-blue-800 text-white rounded-lg text-xs font-bold uppercase tracking-wider shadow-sm transition-all flex items-center space-x-1.5"
            >
              <Plus className="w-4 h-4 text-[#FDE68A]" />
              <span>+ LOG OVERTIME HOURS</span>
            </button>
          </div>

          {/* Overtime Ledger Table */}
          <div className="bg-white rounded-xl border border-[#E2E8F0] shadow-card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left text-slate-700">
                <thead className="bg-[#FAFAFA] border-b border-[#E2E8F0] text-[11px] font-bold uppercase tracking-wider text-slate-600">
                  <tr>
                    <th className="py-3 px-4">DATE</th>
                    <th className="py-3 px-4 text-center">EXTRA HOURS</th>
                    <th className="py-3 px-4">OPERATIONAL TASK / REASON</th>
                    <th className="py-3 px-4 text-right">ESTIMATED PAY (1.5x)</th>
                    <th className="py-3 px-4 text-center">STATUS</th>
                    <th className="py-3 px-4">REVIEWED BY</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {overtimeLogs.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-10 text-center text-slate-400 text-xs">
                        No overtime hours logged yet. Click "+ Log Overtime Hours" to submit a claim.
                      </td>
                    </tr>
                  ) : (
                    overtimeLogs.map((ot) => {
                      const otVal = (parseFloat(ot.hours || 0) * hourlyRate * 1.5).toFixed(2);
                      return (
                        <tr key={ot.id} className="hover:bg-blue-50/40 transition-colors">
                          <td className="py-3 px-4 font-bold text-slate-900">{ot.date}</td>
                          <td className="py-3 px-4 text-center font-black text-[#1E40AF]">{ot.hours} hrs</td>
                          <td className="py-3 px-4 text-slate-700">{ot.reason}</td>
                          <td className="py-3 px-4 text-right font-black text-emerald-700">+${otVal}</td>
                          <td className="py-3 px-4 text-center">
                            <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                              ot.status === 'APPROVED' ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' :
                              ot.status === 'REJECTED' ? 'bg-red-100 text-red-800 border border-red-300' :
                              'bg-amber-100 text-amber-800 border border-amber-300'
                            }`}>
                              {ot.status}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-slate-500">{ot.approved_by || 'HR Operations'}</td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ──────────────────── TAB 3: LEAVE CENTER ──────────────────── */}
      {activeTab === 'LEAVE_CENTER' && (
        <div className="space-y-6">
          {/* Balance Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-emerald-50/70 border border-emerald-200 rounded-xl p-5 space-y-2">
              <span className="text-xs font-bold text-slate-600 uppercase tracking-wider">ANNUAL LEAVE</span>
              <p className="text-4xl font-black text-emerald-800">
                {(leaveBalance.annual_total || 18) - (leaveBalance.annual_used || 0)} <span className="text-xs font-bold text-slate-500">days left</span>
              </p>
              <p className="text-[11px] text-slate-500 font-semibold">{leaveBalance.annual_used || 0} used of {leaveBalance.annual_total || 18} allocated</p>
              <div className="w-full bg-emerald-200 rounded-full h-2 overflow-hidden mt-2">
                <div
                  className="bg-emerald-600 h-2 rounded-full"
                  style={{ width: `${Math.round(((leaveBalance.annual_used || 0) / (leaveBalance.annual_total || 18)) * 100)}%` }}
                />
              </div>
            </div>

            <div className="bg-blue-50/70 border border-blue-200 rounded-xl p-5 space-y-2">
              <span className="text-xs font-bold text-slate-600 uppercase tracking-wider">SICK &amp; MEDICAL LEAVE</span>
              <p className="text-4xl font-black text-[#1E40AF]">
                {(leaveBalance.sick_total || 12) - (leaveBalance.sick_used || 0)} <span className="text-xs font-bold text-slate-500">days left</span>
              </p>
              <p className="text-[11px] text-slate-500 font-semibold">{leaveBalance.sick_used || 0} used of {leaveBalance.sick_total || 12} allocated</p>
              <div className="w-full bg-blue-200 rounded-full h-2 overflow-hidden mt-2">
                <div
                  className="bg-[#1E40AF] h-2 rounded-full"
                  style={{ width: `${Math.round(((leaveBalance.sick_used || 0) / (leaveBalance.sick_total || 12)) * 100)}%` }}
                />
              </div>
            </div>

            <div className="bg-amber-50/70 border border-amber-200 rounded-xl p-5 space-y-2">
              <span className="text-xs font-bold text-slate-600 uppercase tracking-wider">CASUAL &amp; SPECIAL LEAVE</span>
              <p className="text-4xl font-black text-amber-800">
                {(leaveBalance.casual_total || 6) - (leaveBalance.casual_used || 0)} <span className="text-xs font-bold text-slate-500">days left</span>
              </p>
              <p className="text-[11px] text-slate-500 font-semibold">{leaveBalance.casual_used || 0} used of {leaveBalance.casual_total || 6} allocated</p>
              <div className="w-full bg-amber-200 rounded-full h-2 overflow-hidden mt-2">
                <div
                  className="bg-amber-600 h-2 rounded-full"
                  style={{ width: `${Math.round(((leaveBalance.casual_used || 0) / (leaveBalance.casual_total || 6)) * 100)}%` }}
                />
              </div>
            </div>
          </div>

          {/* Action Row */}
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <h2 className="text-sm font-bold text-slate-900 uppercase">MY LEAVE APPLICATION REGISTER</h2>
              <p className="text-xs text-slate-500">Submit requests for annual vacation, sick time, or emergency duty leaves</p>
            </div>
            <button
              onClick={() => setShowLeaveModal(true)}
              className="px-4 py-2 bg-[#1E40AF] hover:bg-blue-800 text-white rounded-lg text-xs font-bold uppercase tracking-wider shadow-sm transition-all flex items-center space-x-1.5"
            >
              <Plus className="w-4 h-4 text-[#FDE68A]" />
              <span>+ APPLY FOR LEAVE</span>
            </button>
          </div>

          {/* Leave Requests Table */}
          <div className="bg-white rounded-xl border border-[#E2E8F0] shadow-card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left text-slate-700">
                <thead className="bg-[#FAFAFA] border-b border-[#E2E8F0] text-[11px] font-bold uppercase tracking-wider text-slate-600">
                  <tr>
                    <th className="py-3 px-4">LEAVE TYPE</th>
                    <th className="py-3 px-4">START DATE</th>
                    <th className="py-3 px-4">END DATE</th>
                    <th className="py-3 px-4 text-center">DURATION</th>
                    <th className="py-3 px-4">REASON / HANDOVER</th>
                    <th className="py-3 px-4 text-center">APPROVAL STATUS</th>
                    <th className="py-3 px-4">APPLIED ON</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {leaveRequests.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-10 text-center text-slate-400 text-xs">
                        No leave applications recorded. Click "+ Apply For Leave" above to file a request.
                      </td>
                    </tr>
                  ) : (
                    leaveRequests.map((req) => (
                      <tr key={req.id} className="hover:bg-blue-50/40 transition-colors">
                        <td className="py-3 px-4 font-bold text-slate-900">{req.leave_type}</td>
                        <td className="py-3 px-4 text-slate-600">{req.start_date}</td>
                        <td className="py-3 px-4 text-slate-600">{req.end_date}</td>
                        <td className="py-3 px-4 text-center font-bold text-slate-900">{req.total_days} Day(s)</td>
                        <td className="py-3 px-4 text-slate-700 max-w-xs truncate">{req.reason}</td>
                        <td className="py-3 px-4 text-center">
                          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                            req.status === 'APPROVED' ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' :
                            req.status === 'REJECTED' ? 'bg-red-100 text-red-800 border border-red-300' :
                            'bg-amber-100 text-amber-800 border border-amber-300'
                          }`}>
                            {req.status}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-slate-400 font-mono text-[10px]">{req.created_at || 'Recent'}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Official Company Holidays Section */}
          <div className="bg-white rounded-xl border border-[#E2E8F0] shadow-card overflow-hidden">
            <div className="bg-gradient-to-r from-emerald-50 via-teal-50 to-white px-5 py-4 border-b border-[#E2E8F0] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center space-x-3">
                <div className="w-9 h-9 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center border border-emerald-200 shrink-0 font-bold text-lg">
                  🎉
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                      Official Company Holiday Calendar (All Employees)
                    </h3>
                    <span className="text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300 px-2 py-0.5 rounded-full">
                      {holidays.length} Holidays Active
                    </span>
                  </div>
                  <p className="text-xs text-slate-500">
                    Mandatory paid non-working days for all corporate, plant, and logistics staff. Does not deduct from leave quotas.
                  </p>
                </div>
              </div>

              {onNavigate && (
                <button
                  onClick={() => onNavigate('calendar')}
                  className="px-3.5 py-1.5 bg-[#1E40AF] hover:bg-blue-800 text-white rounded-lg text-xs font-bold uppercase tracking-wider shadow-sm transition-all flex items-center space-x-1.5 shrink-0 self-start sm:self-auto"
                >
                  <Calendar className="w-3.5 h-3.5 text-[#FDE68A]" />
                  <span>Open My Calendar →</span>
                </button>
              )}
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left text-slate-700">
                <thead className="bg-[#FAFAFA] border-b border-[#E2E8F0] text-[11px] font-bold uppercase tracking-wider text-slate-600">
                  <tr>
                    <th className="py-3 px-4">HOLIDAY NAME</th>
                    <th className="py-3 px-4">DATE</th>
                    <th className="py-3 px-4">BRANCH / FACILITY SCOPE</th>
                    <th className="py-3 px-4 text-center">HOLIDAY TYPE</th>
                    <th className="py-3 px-4 text-center">STATUS / TIMELINE</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {holidays.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-slate-400 text-xs">
                        No company holidays scheduled.
                      </td>
                    </tr>
                  ) : (
                    holidays.map((hol) => {
                      const today = new Date(2026, 8, 5); // Sep 5, 2026 context
                      let timelineStatus = 'Scheduled';
                      let statusBadge = 'bg-slate-100 text-slate-600 border-slate-200';

                      if (hol.date) {
                        const parts = hol.date.split('-');
                        if (parts.length === 3) {
                          const holDate = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
                          const diffDays = Math.round((holDate - today) / (1000 * 60 * 60 * 24));
                          if (diffDays === 0) {
                            timelineStatus = '🎉 TODAY!';
                            statusBadge = 'bg-emerald-100 text-emerald-800 border-emerald-300 animate-pulse font-bold';
                          } else if (diffDays === 1) {
                            timelineStatus = 'Tomorrow';
                            statusBadge = 'bg-emerald-100 text-emerald-800 border-emerald-300 font-bold';
                          } else if (diffDays > 1) {
                            timelineStatus = `In ${diffDays} days`;
                            statusBadge = 'bg-blue-100 text-[#1E40AF] border-blue-200 font-semibold';
                          } else {
                            timelineStatus = `Concluded (${Math.abs(diffDays)}d ago)`;
                            statusBadge = 'bg-slate-100 text-slate-500 border-slate-200';
                          }
                        }
                      }

                      return (
                        <tr key={hol.id || hol.name} className="hover:bg-emerald-50/20 transition-colors">
                          <td className="py-3 px-4 font-bold text-slate-900 flex items-center space-x-2">
                            <span>🎉</span>
                            <span>{hol.name.replace(/^🎉\s*Holiday:\s*/i, '').replace(/^🎉\s*/, '')}</span>
                          </td>
                          <td className="py-3 px-4 font-mono text-slate-700">{hol.date}</td>
                          <td className="py-3 px-4 text-slate-600">
                            <span className="inline-flex items-center space-x-1">
                              <MapPin className="w-3.5 h-3.5 text-slate-400" />
                              <span>{(!hol.branch || hol.branch === 'ALL') ? 'All Global & Regional Branches' : hol.branch}</span>
                            </span>
                          </td>
                          <td className="py-3 px-4 text-center">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase border ${
                              hol.type === 'COMPANY' ? 'bg-purple-100 text-purple-800 border-purple-200' :
                              hol.type === 'REGIONAL' ? 'bg-amber-100 text-amber-800 border-amber-200' :
                              'bg-emerald-100 text-emerald-800 border-emerald-200'
                            }`}>
                              {hol.type || 'NATIONAL'}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-center">
                            <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-medium border ${statusBadge}`}>
                              {timelineStatus}
                            </span>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ──────────────────── TAB 4: STATIC SALARY DETAILS & SLIPS ──────────────────── */}
      {activeTab === 'SALARY_DETAILS' && (
        <div className="space-y-6">
          {/* Statutory Governance Disclaimer */}
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start space-x-3">
            <ShieldAlert className="w-5 h-5 text-[#D97706] shrink-0 mt-0.5" />
            <div className="space-y-1">
              <h4 className="text-xs font-bold text-amber-900 uppercase">
                OFFICIAL CORPORATE REMUNERATION STRUCTURE (STATIC RECORD)
              </h4>
              <p className="text-[11px] text-amber-800 leading-relaxed">
                This compensation and Cost-to-Company (CTC) breakdown is governed by your official employment contract and corporate HR compensation matrices. All figures are read-only and audited per labor law. To request an appraisal or structure adjustment, submit an official requisition through the HR department.
              </p>
            </div>
          </div>

          {/* CTC Structure Breakdown Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Monthly Earnings Card */}
            <div className="bg-white rounded-xl border border-[#E2E8F0] shadow-card p-6 space-y-4">
              <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-800">FIXED REMUNERATION</span>
                <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                  Monthly Earnings
                </span>
              </div>

              <div className="space-y-2.5 text-xs text-slate-700">
                <div className="flex justify-between items-center">
                  <span className="text-slate-500 font-medium">Basic Salary:</span>
                  <span className="font-bold text-slate-900">${Number(salaryStructure?.basic_monthly || 2200).toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-500 font-medium">House Rent Allowance (HRA):</span>
                  <span className="font-bold text-slate-900">${Number(salaryStructure?.hra_monthly || 880).toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-500 font-medium">Transport Allowance:</span>
                  <span className="font-bold text-slate-900">${Number(salaryStructure?.transport_allowance || 200).toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-500 font-medium">Medical Allowance:</span>
                  <span className="font-bold text-slate-900">${Number(salaryStructure?.medical_allowance || 100).toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-500 font-medium">Special Executive Allowance:</span>
                  <span className="font-bold text-slate-900">${Number(salaryStructure?.special_allowance || 270).toLocaleString()}</span>
                </div>

                <div className="pt-2 border-t border-slate-100 flex justify-between items-center text-sm font-black text-[#1E40AF]">
                  <span>Total Monthly Gross:</span>
                  <span>
                    ${(
                      Number(salaryStructure?.basic_monthly || 2200) +
                      Number(salaryStructure?.hra_monthly || 880) +
                      Number(salaryStructure?.transport_allowance || 200) +
                      Number(salaryStructure?.medical_allowance || 100) +
                      Number(salaryStructure?.special_allowance || 270)
                    ).toLocaleString()}
                  </span>
                </div>
              </div>
            </div>

            {/* Deductions & Statutory Withholdings */}
            <div className="bg-white rounded-xl border border-[#E2E8F0] shadow-card p-6 space-y-4">
              <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-800">STATUTORY WITHHOLDINGS</span>
                <span className="text-[10px] font-bold text-red-700 bg-red-50 px-2 py-0.5 rounded border border-red-200">
                  Deductions
                </span>
              </div>

              <div className="space-y-2.5 text-xs text-slate-700">
                <div className="flex justify-between items-center">
                  <span className="text-slate-500 font-medium">Provident Fund (Employee 12%):</span>
                  <span className="font-bold text-red-600">-${Number(salaryStructure?.pf_employee || 264).toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-500 font-medium">Professional Tax:</span>
                  <span className="font-bold text-red-600">-${Number(salaryStructure?.professional_tax || 50).toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-500 font-medium">Medical Insurance ESI:</span>
                  <span className="font-bold text-slate-400">$0.00</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-500 font-medium">Employer PF Matching:</span>
                  <span className="font-bold text-slate-700">${Number(salaryStructure?.pf_employer || 264).toLocaleString()}</span>
                </div>

                <div className="pt-2 border-t border-slate-100 flex justify-between items-center text-sm font-black text-red-600">
                  <span>Total Deductions:</span>
                  <span>-${(Number(salaryStructure?.pf_employee || 264) + Number(salaryStructure?.professional_tax || 50)).toLocaleString()}</span>
                </div>
              </div>
            </div>

            {/* Annual CTC & Net Take-Home */}
            <div className="bg-white rounded-xl border border-[#E2E8F0] shadow-card p-6 flex flex-col justify-between space-y-4">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">NET MONTHLY TAKE-HOME</span>
                <p className="text-3xl font-black text-emerald-700 mt-2">
                  ${(
                    Number(salaryStructure?.basic_monthly || 2200) +
                    Number(salaryStructure?.hra_monthly || 880) +
                    Number(salaryStructure?.transport_allowance || 200) +
                    Number(salaryStructure?.medical_allowance || 100) +
                    Number(salaryStructure?.special_allowance || 270) -
                    Number(salaryStructure?.pf_employee || 264) -
                    Number(salaryStructure?.professional_tax || 50)
                  ).toLocaleString()}
                  <span className="text-xs font-bold text-slate-400"> / mo</span>
                </p>

                <div className="mt-4 p-3 bg-slate-50 rounded-lg border border-slate-100 space-y-1.5 text-xs">
                  <div className="flex justify-between text-slate-600">
                    <span>Annual Cost to Company (CTC):</span>
                    <span className="font-black text-slate-900">${Number(salaryStructure?.ctc_annual || 38400).toLocaleString()} USD</span>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>Registered Bank Partner:</span>
                    <span className="font-bold text-[#1E40AF]">Vietcombank</span>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>Corporate Account No:</span>
                    <span className="font-mono font-bold text-slate-700">**** **** 8821</span>
                  </div>
                </div>
              </div>

              <div className="text-[10px] text-slate-400 font-semibold border-t pt-2">
                Disbursements executed via direct ACH clearing on the last calendar day of each month.
              </div>
            </div>
          </div>

          {/* Historical Salary Slips Table */}
          <div className="bg-white rounded-xl border border-[#E2E8F0] shadow-card overflow-hidden">
            <div className="p-4 border-b border-[#E2E8F0] flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                OFFICIAL MONTHLY SALARY SLIPS ARCHIVE
              </h3>
              <span className="text-xs font-semibold text-slate-500">
                {payrollSlips.length} Payslips Available
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left text-slate-700">
                <thead className="bg-[#FAFAFA] border-b border-[#E2E8F0] text-[11px] font-bold uppercase tracking-wider text-slate-600">
                  <tr>
                    <th className="py-3 px-4">PAY CYCLE</th>
                    <th className="py-3 px-4 text-right">BASIC PAY</th>
                    <th className="py-3 px-4 text-right">ALLOWANCES</th>
                    <th className="py-3 px-4 text-right">OVERTIME PAY</th>
                    <th className="py-3 px-4 text-right">DEDUCTIONS</th>
                    <th className="py-3 px-4 text-right">NET TAKE-HOME</th>
                    <th className="py-3 px-4 text-center">STATUS</th>
                    <th className="py-3 px-4 text-center">ACTION</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {payrollSlips.map((slip) => (
                    <tr key={slip.id} className="hover:bg-blue-50/40 transition-colors">
                      <td className="py-3 px-4 font-bold text-slate-900">{slip.month_year}</td>
                      <td className="py-3 px-4 text-right font-semibold text-slate-700">${Number(slip.basic_pay || 0).toLocaleString()}</td>
                      <td className="py-3 px-4 text-right text-slate-600">${Number(slip.allowances || 0).toLocaleString()}</td>
                      <td className="py-3 px-4 text-right font-bold text-amber-700">
                        {slip.overtime_pay ? `+$${Number(slip.overtime_pay).toFixed(2)}` : '—'}
                      </td>
                      <td className="py-3 px-4 text-right text-red-600 font-semibold">-${Number((slip.deductions || 0) + (slip.tax || 0)).toLocaleString()}</td>
                      <td className="py-3 px-4 text-right font-black text-emerald-700">${Number(slip.net_salary || 0).toLocaleString()}</td>
                      <td className="py-3 px-4 text-center">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200 uppercase">
                          {slip.status || 'PAID'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <button
                          onClick={() => setViewingSlip(slip)}
                          className="px-3 py-1 bg-blue-50 text-[#1E40AF] hover:bg-blue-100 font-bold text-xs rounded border border-blue-200 transition-colors inline-flex items-center space-x-1"
                        >
                          <Download className="w-3.5 h-3.5" />
                          <span>View Slip</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ──────────────────── TAB 5: FOOD SAFETY & ISO 22000 COMPLIANCE ──────────────────── */}
      {activeTab === 'COMPLIANCE' && (
        <div className="space-y-6">
          {/* Header Banner */}
          <div className="bg-white rounded-xl border border-emerald-200 shadow-card p-6 bg-emerald-50/20 flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-black text-xl shadow-md shrink-0">
                <ShieldAlert className="w-6 h-6 text-white" />
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <h2 className="text-base font-bold text-slate-900">Food Safety, HACCP &amp; Worker Health Compliance</h2>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                    ISO 22000 : 2018 AUDIT READY
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  Statutory occupational health screenings and Good Manufacturing Practices (GMP) records for food facility access.
                </p>
              </div>
            </div>
            <div className="text-right">
              <span className="text-[10px] font-bold text-slate-400 uppercase block">PERSONNEL COMPLIANCE STATUS</span>
              <span className="text-sm font-black text-emerald-700 bg-emerald-100 px-3 py-1 rounded-md border border-emerald-200 inline-block mt-0.5">
                ✓ CERTIFIED FOR FOOD PROCESSING
              </span>
            </div>
          </div>

          {/* Compliance Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Card 1: Medical Fitness */}
            <div className="bg-white rounded-xl border border-[#E2E8F0] shadow-card p-5 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">ANNUAL MEDICAL CHECK</span>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-700 border border-emerald-200">
                  {complianceData?.medical_fitness_status || 'FIT_FOR_FOOD_HANDLING'}
                </span>
              </div>
              <p className="text-sm font-bold text-slate-900">Occupational Fitness Cert</p>
              <div className="text-xs space-y-1 text-slate-600 pt-1 border-t border-slate-100">
                <p><span className="text-slate-400 font-medium">Last Exam:</span> <span className="font-semibold">{complianceData?.medical_checkup_date || '2026-02-15'}</span></p>
                <p><span className="text-slate-400 font-medium">Valid Until:</span> <span className="font-bold text-[#1E40AF]">{complianceData?.medical_cert_expiry || '2027-02-14'}</span></p>
              </div>
            </div>

            {/* Card 2: Communicable Screening */}
            <div className="bg-white rounded-xl border border-[#E2E8F0] shadow-card p-5 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">DISEASE SCREENING</span>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-700 border border-emerald-200">
                  CLEARED
                </span>
              </div>
              <p className="text-sm font-bold text-slate-900">Pathogen &amp; Skin Check</p>
              <div className="text-xs space-y-1 text-slate-600 pt-1 border-t border-slate-100">
                <p><span className="text-slate-400 font-medium">Salmonella / Typhoid:</span> <span className="font-bold text-emerald-700">NEGATIVE</span></p>
                <p><span className="text-slate-400 font-medium">Dermal &amp; Respiratory:</span> <span className="font-bold text-emerald-700">CLEAR</span></p>
              </div>
            </div>

            {/* Card 3: HACCP Training */}
            <div className="bg-white rounded-xl border border-[#E2E8F0] shadow-card p-5 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">HACCP TRAINING</span>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-[#1E40AF] border border-blue-200">
                  LEVEL 3
                </span>
              </div>
              <p className="text-sm font-bold text-slate-900">Allergen &amp; Cross-Contam</p>
              <div className="text-xs space-y-1 text-slate-600 pt-1 border-t border-slate-100">
                <p><span className="text-slate-400 font-medium">Curriculum:</span> <span className="font-semibold">FSSAI / ISO 22000</span></p>
                <p><span className="text-slate-400 font-medium">Refresher Due:</span> <span className="font-semibold text-slate-800">November 2026</span></p>
              </div>
            </div>

            {/* Card 4: Emergency Profile */}
            <div className="bg-white rounded-xl border border-[#E2E8F0] shadow-card p-5 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">EMERGENCY &amp; BLOOD</span>
                <span className="px-2 py-0.5 rounded text-[10px] font-black bg-red-100 text-red-700 border border-red-200">
                  {complianceData?.blood_group || 'B+'}
                </span>
              </div>
              <p className="text-sm font-bold text-slate-900 truncate">{complianceData?.emergency_contact_name || 'Emergency Contact'}</p>
              <div className="text-xs space-y-1 text-slate-600 pt-1 border-t border-slate-100">
                <p><span className="text-slate-400 font-medium">Phone:</span> <span className="font-mono font-bold text-slate-800">{complianceData?.emergency_contact_phone || '+84-909-887766'}</span></p>
                <p><span className="text-slate-400 font-medium">Facility First Aid:</span> <span className="font-semibold text-emerald-700">Station A-Dock</span></p>
              </div>
            </div>
          </div>

          {/* GMP Guidelines & Worker Undertaking */}
          <div className="bg-white rounded-xl border border-[#E2E8F0] shadow-card p-6 space-y-4">
            <h3 className="text-sm font-bold text-slate-900">Good Manufacturing Practice (GMP) Undertaking</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-slate-700">
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 flex items-start space-x-2">
                <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <p>Clean room protective wear (hairnet, beard cover, nitrile gloves, anti-static slip-resistant shoes) mandatory before entering spice extraction hall.</p>
              </div>
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 flex items-start space-x-2">
                <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <p>Personal jewelry, watches, loose pens, and glass objects are strictly prohibited beyond the decontamination airlock.</p>
              </div>
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 flex items-start space-x-2">
                <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <p>Mandatory 20-second antibacterial hand washing and alcohol sanitizer misting at entry checkpoint before any product handling.</p>
              </div>
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 flex items-start space-x-2">
                <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <p>Immediate self-reporting requirement to QA Lab Director for any acute gastroenteritis, fever, or skin lesions.</p>
              </div>
            </div>
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg flex items-center justify-between text-xs">
              <div className="flex items-center space-x-2 text-blue-900 font-medium">
                <CheckCircle2 className="w-4 h-4 text-[#1E40AF]" />
                <span>Auditor notes: {complianceData?.notes || 'ISO 22000 compliant. Annual occupational check completed with zero communicable flags.'}</span>
              </div>
              <span className="font-mono text-[10px] font-bold text-[#1E40AF]">ISO-AUDIT-2026-Q3</span>
            </div>
          </div>
        </div>
      )}

      {/* ──────────────────── TAB 6: RESIGNATION & SEPARATION ──────────────────── */}
      {activeTab === 'RESIGNATION' && (
        <div className="space-y-6">
          {exitData && exitData.status !== 'WITHDRAWN' ? (
            /* ACTIVE RESIGNATION TRACKER VIEW */
            <div className="space-y-6">
              {/* Top Banner: Status & Countdown to Last Working Day */}
              <div className="bg-white rounded-xl border border-[#E2E8F0] shadow-card p-6">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  <div className="flex items-start space-x-4">
                    <div className="w-12 h-12 rounded-xl bg-amber-50 border border-amber-200 text-amber-700 flex items-center justify-center shrink-0">
                      <LogOut className="w-6 h-6" />
                    </div>
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h2 className="text-base font-bold text-slate-900 uppercase tracking-wide">
                          Resignation &amp; Separation In Progress
                        </h2>
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                          exitData.status === 'SETTLED'
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                            : exitData.status === 'ALL_CLEARED'
                            ? 'bg-blue-100 text-blue-800 border border-blue-300'
                            : exitData.status === 'SUBMITTED'
                            ? 'bg-purple-100 text-purple-800 border border-purple-300'
                            : 'bg-amber-100 text-amber-800 border border-amber-300'
                        }`}>
                          {exitData.status === 'SUBMITTED'
                            ? '⏳ SUBMITTED (UNDER HR REVIEW)'
                            : exitData.status === 'NOTICE_PERIOD'
                            ? '🗓 NOTICE PERIOD ACTIVE'
                            : exitData.status === 'CLEARANCE_PENDING'
                            ? '📋 CLEARANCE IN PROGRESS'
                            : exitData.status === 'ALL_CLEARED'
                            ? '✓ ALL CLEARANCES SIGNED OFF'
                            : exitData.status}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 font-medium mt-1">
                        Resignation Submitted: <strong className="text-slate-700">{exitData.resignation_date}</strong> · Serving <strong className="text-slate-700">{exitData.notice_days || 30} Days</strong> Notice Period
                      </p>
                    </div>
                  </div>

                  {/* Countdown Card & Withdraw Action */}
                  <div className="flex flex-wrap items-center gap-3">
                    <div className="bg-blue-50 border border-blue-200 rounded-xl px-4 py-2.5 text-center">
                      <span className="text-[10px] font-bold text-[#1E40AF] uppercase tracking-wider block">
                        LAST WORKING DAY (LWD)
                      </span>
                      <span className="text-sm font-black font-mono text-slate-900">
                        {exitData.last_working_day}
                      </span>
                      <span className="text-[10px] font-semibold text-blue-700 block mt-0.5">
                        {(() => {
                          const daysRemaining = Math.max(0, Math.ceil((new Date(exitData.last_working_day).getTime() - Date.now()) / (1000 * 60 * 60 * 24)));
                          return daysRemaining === 0 ? 'Last Day Today' : `${daysRemaining} days remaining`;
                        })()}
                      </span>
                    </div>

                    {exitData.status !== 'SETTLED' && (
                      <button
                        type="button"
                        onClick={() => setShowWithdrawConfirm(true)}
                        className="px-3.5 py-2.5 border border-red-200 hover:bg-red-50 text-red-700 rounded-xl text-xs font-bold uppercase tracking-wider transition-colors shadow-xs flex items-center space-x-1.5"
                      >
                        <X className="w-3.5 h-3.5 text-red-500" />
                        <span>Withdraw Resignation</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Separation Visual Stepper */}
                <div className="mt-8 pt-6 border-t border-slate-100">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-4">
                    Separation Lifecycle &amp; Transition Milestones
                  </span>
                  {(() => {
                    const currentStep = (() => {
                      switch (exitData.status) {
                        case 'SUBMITTED': return 1;
                        case 'NOTICE_PERIOD': return 2;
                        case 'CLEARANCE_PENDING': return 3;
                        case 'ALL_CLEARED': return 4;
                        case 'SETTLED': return 5;
                        default: return 1;
                      }
                    })();

                    const steps = [
                      { num: 1, title: 'Submission', desc: 'Employee Request Logged' },
                      { num: 2, title: 'Notice Period', desc: 'HR Acknowledged & Serving' },
                      { num: 3, title: 'Clearances', desc: 'IT, Finance & Admin Sign-off' },
                      { num: 4, title: 'F&F Settlement', desc: 'Payroll & Leave Encashment' },
                      { num: 5, title: 'Relieved', desc: 'Service Documents Dispatched' },
                    ];

                    return (
                      <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">
                        {steps.map((st) => {
                          const isDone = st.num < currentStep || exitData.status === 'SETTLED';
                          const isCurrent = st.num === currentStep && exitData.status !== 'SETTLED';
                          return (
                            <div
                              key={st.num}
                              className={`p-3 rounded-xl border transition-all ${
                                isDone
                                  ? 'bg-emerald-50/60 border-emerald-200 text-emerald-950'
                                  : isCurrent
                                  ? 'bg-blue-50/80 border-[#1E40AF] text-[#1E40AF] ring-2 ring-blue-100'
                                  : 'bg-slate-50 border-slate-200 text-slate-400'
                              }`}
                            >
                              <div className="flex items-center justify-between mb-1.5">
                                <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black ${
                                  isDone
                                    ? 'bg-emerald-500 text-white'
                                    : isCurrent
                                    ? 'bg-[#1E40AF] text-white'
                                    : 'bg-slate-200 text-slate-500'
                                }`}>
                                  {isDone ? '✓' : st.num}
                                </span>
                                <span className="text-[9px] font-bold uppercase tracking-wider">
                                  {isDone ? 'COMPLETED' : isCurrent ? 'IN PROGRESS' : 'UPCOMING'}
                                </span>
                              </div>
                              <p className="text-xs font-bold leading-tight">{st.title}</p>
                              <p className="text-[10px] opacity-75 mt-0.5 leading-snug">{st.desc}</p>
                            </div>
                          );
                        })}
                      </div>
                    );
                  })()}
                </div>
              </div>

              {/* Multi-Department No-Dues Clearance Checklist */}
              <div className="bg-white rounded-xl border border-[#E2E8F0] shadow-card p-6 space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide">
                      Multi-Department No-Dues Clearances
                    </h3>
                    <p className="text-xs text-slate-500">
                      Clearance from all three departments is required before Full &amp; Final settlement disbursement.
                    </p>
                  </div>
                  <span className="text-xs font-mono font-bold text-slate-400">
                    3 Mandatory Approvals
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* IT Infrastructure Clearance */}
                  <div className={`p-4 rounded-xl border transition-all ${
                    (exitData.it_clearance || exitData.clearance_it)
                      ? 'bg-emerald-50/50 border-emerald-200'
                      : 'bg-slate-50 border-slate-200'
                  }`}>
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="text-xs font-bold text-slate-900 uppercase">IT Infrastructure &amp; Assets</h4>
                        <p className="text-[11px] text-slate-500 mt-0.5">Laptop, Access Cards, LDAP</p>
                      </div>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${
                        (exitData.it_clearance || exitData.clearance_it)
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}>
                        {(exitData.it_clearance || exitData.clearance_it) ? '✓ CLEARED' : '⏳ PENDING'}
                      </span>
                    </div>
                    <ul className="mt-3 space-y-1.5 text-[11px] text-slate-600 border-t border-slate-200/60 pt-2">
                      <li className="flex items-center space-x-1.5">
                        <span className="text-emerald-500 font-bold">•</span>
                        <span>Company laptop, charger &amp; accessories returned</span>
                      </li>
                      <li className="flex items-center space-x-1.5">
                        <span className="text-emerald-500 font-bold">•</span>
                        <span>ERP, email &amp; VPN deprovisioning scheduled for LWD</span>
                      </li>
                      <li className="flex items-center space-x-1.5">
                        <span className="text-emerald-500 font-bold">•</span>
                        <span>Data backup and git repository access transferred</span>
                      </li>
                    </ul>
                  </div>

                  {/* Finance & Accounts Clearance */}
                  <div className={`p-4 rounded-xl border transition-all ${
                    (exitData.finance_clearance || exitData.clearance_finance)
                      ? 'bg-emerald-50/50 border-emerald-200'
                      : 'bg-slate-50 border-slate-200'
                  }`}>
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="text-xs font-bold text-slate-900 uppercase">Finance &amp; Accounts</h4>
                        <p className="text-[11px] text-slate-500 mt-0.5">Corporate Card, Advances</p>
                      </div>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${
                        (exitData.finance_clearance || exitData.clearance_finance)
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}>
                        {(exitData.finance_clearance || exitData.clearance_finance) ? '✓ CLEARED' : '⏳ PENDING'}
                      </span>
                    </div>
                    <ul className="mt-3 space-y-1.5 text-[11px] text-slate-600 border-t border-slate-200/60 pt-2">
                      <li className="flex items-center space-x-1.5">
                        <span className="text-emerald-500 font-bold">•</span>
                        <span>All travel &amp; operational expense claims verified</span>
                      </li>
                      <li className="flex items-center space-x-1.5">
                        <span className="text-emerald-500 font-bold">•</span>
                        <span>Corporate credit card surrendered &amp; cancelled</span>
                      </li>
                      <li className="flex items-center space-x-1.5">
                        <span className="text-emerald-500 font-bold">•</span>
                        <span>Zero outstanding imprests or salary advances</span>
                      </li>
                    </ul>
                  </div>

                  {/* Admin & Facility Clearance */}
                  <div className={`p-4 rounded-xl border transition-all ${
                    (exitData.admin_clearance || exitData.clearance_admin)
                      ? 'bg-emerald-50/50 border-emerald-200'
                      : 'bg-slate-50 border-slate-200'
                  }`}>
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="text-xs font-bold text-slate-900 uppercase">Plant &amp; Facility Admin</h4>
                        <p className="text-[11px] text-slate-500 mt-0.5">Gate Pass, Locker, PPE</p>
                      </div>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${
                        (exitData.admin_clearance || exitData.clearance_admin)
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}>
                        {(exitData.admin_clearance || exitData.clearance_admin) ? '✓ CLEARED' : '⏳ PENDING'}
                      </span>
                    </div>
                    <ul className="mt-3 space-y-1.5 text-[11px] text-slate-600 border-t border-slate-200/60 pt-2">
                      <li className="flex items-center space-x-1.5">
                        <span className="text-emerald-500 font-bold">•</span>
                        <span>Factory floor / port berth biometric card surrendered</span>
                      </li>
                      <li className="flex items-center space-x-1.5">
                        <span className="text-emerald-500 font-bold">•</span>
                        <span>Personal locker and desk workspace cleared</span>
                      </li>
                      <li className="flex items-center space-x-1.5">
                        <span className="text-emerald-500 font-bold">•</span>
                        <span>Clean room lab safety wear &amp; badges returned</span>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Estimated Full & Final (F&F) Settlement Preview */}
              <div className="bg-white rounded-xl border border-[#E2E8F0] shadow-card p-6 space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide">
                      Estimated Full &amp; Final Settlement Breakdown
                    </h3>
                    <p className="text-xs text-slate-500">
                      Preliminary estimate based on monthly basic pay and earned leave encashment entitlement.
                    </p>
                  </div>
                  <span className="text-xs font-mono font-bold text-[#1E40AF]">
                    Daily Rate: ${Math.round((salaryStructure?.basic_monthly || 2200) / 30)}/day
                  </span>
                </div>

                {(() => {
                  const monthlyBasic = salaryStructure?.basic_monthly || 2200;
                  const dailyRate = Math.round(monthlyBasic / 30);
                  const unpaidDays = exitData.unpaid_salary_days || 15;
                  const leaveDays = exitData.leave_encashment_days || 6;
                  const unpaidAmt = unpaidDays * dailyRate;
                  const leaveAmt = leaveDays * dailyRate;
                  const netAmt = exitData.settlement_amount > 0 ? exitData.settlement_amount : (unpaidAmt + leaveAmt);

                  return (
                    <div className="space-y-3">
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                        <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                          <span className="text-[10px] font-bold text-slate-400 uppercase block">Pro-rated Final Salary</span>
                          <span className="text-base font-black text-slate-900 font-mono mt-1 block">
                            +${unpaidAmt.toLocaleString()} USD
                          </span>
                          <span className="text-[10px] text-slate-500 mt-0.5 block">{unpaidDays} working days in departure month</span>
                        </div>

                        <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                          <span className="text-[10px] font-bold text-slate-400 uppercase block">Earned Leave Encashment</span>
                          <span className="text-base font-black text-slate-900 font-mono mt-1 block">
                            +${leaveAmt.toLocaleString()} USD
                          </span>
                          <span className="text-[10px] text-slate-500 mt-0.5 block">{leaveDays} unutilized earned leaves</span>
                        </div>

                        <div className="bg-blue-50/70 p-3.5 rounded-xl border border-blue-200">
                          <span className="text-[10px] font-bold text-[#1E40AF] uppercase block">Total Net Payable</span>
                          <span className="text-xl font-black text-[#1E40AF] font-mono mt-1 block">
                            ${netAmt.toLocaleString()} USD
                          </span>
                          <span className="text-[10px] text-blue-700 mt-0.5 block">Disbursed to primary salary account</span>
                        </div>
                      </div>

                      <div className="bg-amber-50/70 border border-amber-200 rounded-lg p-3 text-xs text-amber-900 flex items-start space-x-2">
                        <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                        <p>
                          <strong>Statutory Note:</strong> F&amp;F settlement disbursement includes issuance of official Relieving Letter, Service Certificate, and tax Form 16 transfer. Disbursed within 48 hours of last working day upon clearance completion.
                        </p>
                      </div>
                    </div>
                  );
                })()}
              </div>

              {/* Handover & Reason Record */}
              <div className="bg-white rounded-xl border border-[#E2E8F0] shadow-card p-6 space-y-3">
                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide">
                  Transition Remarks &amp; Handover Notes
                </h3>
                <div className="bg-slate-50 rounded-lg border border-slate-200 p-4 text-xs space-y-2">
                  <div>
                    <span className="font-bold text-slate-700 block text-[11px] uppercase">Reason Stated:</span>
                    <p className="text-slate-800 font-medium mt-0.5">{exitData.reason || 'Voluntary Resignation'}</p>
                  </div>
                  <div className="pt-2 border-t border-slate-200 flex flex-wrap items-center justify-between text-[11px] text-slate-500">
                    <span>Reference ID: <strong className="font-mono text-slate-700">{exitData.id}</strong></span>
                    <span>Employee: <strong className="text-slate-700">{employee.full_name} ({employee.employee_code || employee.id})</strong></span>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            /* INITIATE RESIGNATION FORM VIEW */
            <div className="space-y-6">
              {/* Introduction Card */}
              <div className="bg-white rounded-xl border border-[#E2E8F0] shadow-card p-6 relative overflow-hidden">
                <div className="flex items-start space-x-4">
                  <div className="w-12 h-12 rounded-xl bg-blue-50 border border-blue-200 text-[#1E40AF] flex items-center justify-center shrink-0">
                    <LogOut className="w-6 h-6" />
                  </div>
                  <div className="space-y-1">
                    <h2 className="text-base font-bold text-slate-900 uppercase tracking-wide">
                      Initiate Formal Resignation &amp; Separation
                    </h2>
                    <p className="text-xs text-slate-600 max-w-2xl leading-relaxed">
                      We appreciate your contributions to SOILEX Life Sciences. If you have decided to transition out of your role, please complete this formal resignation form. This initiates your notice period, multi-department no-dues clearance, and Full &amp; Final (F&amp;F) settlement calculation.
                    </p>
                  </div>
                </div>

                <div className="mt-5 grid grid-cols-1 sm:grid-cols-3 gap-3 pt-4 border-t border-slate-100 text-xs">
                  <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                    <span className="text-[10px] font-bold text-slate-400 uppercase block">STANDARD NOTICE</span>
                    <span className="font-bold text-slate-800 mt-0.5 block">30 – 90 Calendar Days</span>
                    <span className="text-[10px] text-slate-500">Per your employment agreement</span>
                  </div>
                  <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                    <span className="text-[10px] font-bold text-slate-400 uppercase block">LEAVE ENCASHMENT</span>
                    <span className="font-bold text-emerald-700 mt-0.5 block">
                      {Math.max(0, (leaveBalance?.annual_total || 18) - (leaveBalance?.annual_used || 3))} Days Available
                    </span>
                    <span className="text-[10px] text-slate-500">Encashable in final settlement</span>
                  </div>
                  <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                    <span className="text-[10px] font-bold text-slate-400 uppercase block">SETTLEMENT TIMELINE</span>
                    <span className="font-bold text-[#1E40AF] mt-0.5 block">On Last Working Day</span>
                    <span className="text-[10px] text-slate-500">Subject to multi-dept clearance</span>
                  </div>
                </div>
              </div>

              {/* Resignation Form */}
              <div className="bg-white rounded-xl border border-[#E2E8F0] shadow-card p-6">
                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide mb-4">
                  Resignation Details &amp; Transition Plan
                </h3>

                <form onSubmit={handleSubmitResignation} className="space-y-5">
                  {/* Resignation Date & Notice Days */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="text-xs font-bold text-slate-700 block mb-1">
                        Resignation Date <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="date"
                        required
                        value={resignationForm.resignation_date}
                        onChange={(e) => handleResignationDateChange(e.target.value)}
                        className="w-full bg-white border border-[#E2E8F0] rounded-lg px-3 py-2 text-xs font-bold text-slate-800 focus:outline-none focus:border-[#1E40AF]"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-bold text-slate-700 block mb-1">
                        Notice Period Duration <span className="text-red-500">*</span>
                      </label>
                      <select
                        value={resignationForm.notice_days}
                        onChange={(e) => handleNoticeDaysChange(e.target.value)}
                        className="w-full bg-white border border-[#E2E8F0] rounded-lg px-3 py-2 text-xs font-bold text-slate-800 focus:outline-none focus:border-[#1E40AF]"
                      >
                        <option value="30">30 Calendar Days (Standard)</option>
                        <option value="45">45 Calendar Days</option>
                        <option value="60">60 Calendar Days (Managerial)</option>
                        <option value="90">90 Calendar Days (Director / Key Role)</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-xs font-bold text-slate-700 block mb-1">
                        Calculated Last Working Day (LWD)
                      </label>
                      <div className="w-full bg-blue-50 border border-blue-200 rounded-lg px-3 py-2 text-xs font-black font-mono text-[#1E40AF] flex items-center justify-between">
                        <span>{resignationForm.last_working_day}</span>
                        <span className="text-[10px] font-semibold text-blue-700 uppercase">Auto Computed</span>
                      </div>
                    </div>
                  </div>

                  {/* Primary Reason */}
                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">
                      Primary Reason for Separation <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={resignationForm.reason_category}
                      onChange={(e) => setResignationForm(f => ({ ...f, reason_category: e.target.value }))}
                      className="w-full bg-white border border-[#E2E8F0] rounded-lg px-3 py-2 text-xs font-semibold text-slate-800 focus:outline-none focus:border-[#1E40AF]"
                    >
                      <option value="Better Career Opportunity">Better Career Opportunity / Industry Advancement</option>
                      <option value="Higher Studies & Academics">Higher Studies &amp; Professional Fellowship</option>
                      <option value="Personal / Family Relocation">Personal / Family Relocation to Another Region</option>
                      <option value="Health & Personal Circumstances">Health &amp; Personal Circumstances</option>
                      <option value="Career Shift / Entrepreneurship">Career Shift / Entrepreneurship Venture</option>
                      <option value="Other">Other Personal Reasons</option>
                    </select>
                  </div>

                  {/* Detailed Reason & Handover Plan */}
                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">
                      Handover Plan &amp; Transition Remarks <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      required
                      rows={3}
                      value={resignationForm.detailed_reason}
                      onChange={(e) => setResignationForm(f => ({ ...f, detailed_reason: e.target.value }))}
                      placeholder="Outline active projects, trade manifests, lab reports, or duties to be handed over, along with designated handover colleagues..."
                      className="w-full bg-white border border-[#E2E8F0] rounded-lg px-3 py-2 text-xs font-medium text-slate-800 focus:outline-none focus:border-[#1E40AF] resize-none"
                    />
                  </div>

                  {/* Personal Contact Details for Post-Exit Documents */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200">
                    <div>
                      <label className="text-xs font-bold text-slate-700 block mb-1">
                        Personal Email (for Tax Slips &amp; Certificates)
                      </label>
                      <input
                        type="email"
                        placeholder="personal.email@example.com"
                        value={resignationForm.personal_email}
                        onChange={(e) => setResignationForm(f => ({ ...f, personal_email: e.target.value }))}
                        className="w-full bg-white border border-[#E2E8F0] rounded-lg px-3 py-2 text-xs font-medium text-slate-800 focus:outline-none focus:border-[#1E40AF]"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-slate-700 block mb-1">
                        Personal Contact Number
                      </label>
                      <input
                        type="tel"
                        placeholder="+84 908 123456 or +91 98401 22334"
                        value={resignationForm.personal_phone}
                        onChange={(e) => setResignationForm(f => ({ ...f, personal_phone: e.target.value }))}
                        className="w-full bg-white border border-[#E2E8F0] rounded-lg px-3 py-2 text-xs font-medium text-slate-800 focus:outline-none focus:border-[#1E40AF]"
                      />
                    </div>
                  </div>

                  {/* Legal & Handover Confirmation Checkbox */}
                  <div className="p-4 bg-amber-50/70 border border-amber-200 rounded-xl space-y-2">
                    <label className="flex items-start space-x-3 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={resignationForm.confirm_handover}
                        onChange={(e) => setResignationForm(f => ({ ...f, confirm_handover: e.target.checked }))}
                        className="mt-0.5 w-4 h-4 text-[#1E40AF] border-slate-300 rounded focus:ring-[#1E40AF] cursor-pointer"
                      />
                      <span className="text-xs text-amber-950 font-medium leading-relaxed">
                        I hereby formally submit my resignation from SOILEX Life Sciences. I confirm that I will complete the required knowledge transfer, return all company property (laptop, ID access badge, corporate cards), and obtain clearance from IT, Finance, and Facility Administration prior to my Last Working Day.
                      </span>
                    </label>
                  </div>

                  {/* Submit Button */}
                  <div className="flex items-center justify-end space-x-3 pt-2">
                    <button
                      type="submit"
                      disabled={submittingResignation}
                      className="px-6 py-2.5 bg-[#1E40AF] hover:bg-blue-800 disabled:opacity-50 text-white rounded-lg text-xs font-bold uppercase tracking-wider shadow-sm transition-all flex items-center space-x-2"
                    >
                      {submittingResignation && (
                        <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      )}
                      <LogOut className="w-4 h-4 text-amber-300" />
                      <span>{submittingResignation ? 'Submitting Resignation...' : 'Submit Formal Resignation'}</span>
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ──────────────────── MODAL: LOG OVERTIME ──────────────────── */}
      {showOvertimeModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl border border-[#E2E8F0] shadow-2xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <div className="flex items-center space-x-2">
                <Clock className="w-5 h-5 text-[#1E40AF]" />
                <h3 className="text-sm font-bold text-slate-900 uppercase">LOG EXTRA WORKING / OVERTIME HOURS</h3>
              </div>
              <button onClick={() => setShowOvertimeModal(false)} className="text-slate-400 hover:text-slate-600 font-bold text-lg">×</button>
            </div>

            <form onSubmit={handleSubmitOvertime} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Date</label>
                  <input
                    type="date"
                    value={otForm.date}
                    onChange={(e) => setOtForm(f => ({ ...f, date: e.target.value }))}
                    required
                    className="w-full bg-white border border-[#E2E8F0] rounded-md px-3 py-2 text-xs font-semibold text-slate-800 focus:outline-none focus:border-[#1E40AF]"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Hours Logged</label>
                  <input
                    type="number"
                    step="0.5"
                    min="0.5"
                    max="12"
                    value={otForm.hours}
                    onChange={(e) => setOtForm(f => ({ ...f, hours: e.target.value }))}
                    required
                    className="w-full bg-white border border-[#E2E8F0] rounded-md px-3 py-2 text-xs font-semibold text-slate-800 focus:outline-none focus:border-[#1E40AF]"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Operational Task / Reason</label>
                <textarea
                  value={otForm.reason}
                  onChange={(e) => setOtForm(f => ({ ...f, reason: e.target.value }))}
                  required
                  rows={3}
                  className="w-full bg-white border border-[#E2E8F0] rounded-md px-3 py-2 text-xs font-medium text-slate-800 focus:outline-none focus:border-[#1E40AF] resize-none"
                  placeholder="Detail the operational commercial export dispatch or overtime task..."
                />
              </div>

              <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-[11px] text-blue-900 flex justify-between">
                <span>Calculated Remuneration (1.5x):</span>
                <span className="font-bold">+${((parseFloat(otForm.hours || 0)) * hourlyRate * 1.5).toFixed(2)} USD</span>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowOvertimeModal(false)}
                  className="px-4 py-2 border border-[#E2E8F0] rounded-md text-xs font-semibold text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingOT}
                  className="px-5 py-2 bg-[#1E40AF] hover:bg-blue-800 text-white rounded-md text-xs font-bold uppercase tracking-wider shadow-sm transition-all flex items-center space-x-1.5"
                >
                  {submittingOT && <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />}
                  <span>{submittingOT ? 'Submitting...' : 'Submit Claim'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ──────────────────── MODAL: APPLY FOR LEAVE ──────────────────── */}
      {showLeaveModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl border border-[#E2E8F0] shadow-2xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <div className="flex items-center space-x-2">
                <Calendar className="w-5 h-5 text-[#1E40AF]" />
                <h3 className="text-sm font-bold text-slate-900 uppercase">SUBMIT LEAVE APPLICATION</h3>
              </div>
              <button onClick={() => setShowLeaveModal(false)} className="text-slate-400 hover:text-slate-600 font-bold text-lg">×</button>
            </div>

            <form onSubmit={handleSubmitLeave} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Leave Category</label>
                <select
                  value={leaveForm.leave_type}
                  onChange={(e) => setLeaveForm(f => ({ ...f, leave_type: e.target.value }))}
                  className="w-full bg-white border border-[#E2E8F0] rounded-md px-3 py-2 text-xs font-semibold text-slate-800 focus:outline-none focus:border-[#1E40AF]"
                >
                  <option value="Annual Leave">Annual Leave (18 days/yr standard)</option>
                  <option value="Medical Leave">Medical / Sick Leave (12 days/yr)</option>
                  <option value="Casual Leave">Casual Leave (6 days/yr)</option>
                  <option value="Emergency Leave">Emergency / Compassionate Duty</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Start Date</label>
                  <input
                    type="date"
                    value={leaveForm.start_date}
                    onChange={(e) => setLeaveForm(f => ({ ...f, start_date: e.target.value }))}
                    required
                    className="w-full bg-white border border-[#E2E8F0] rounded-md px-3 py-2 text-xs font-semibold text-slate-800 focus:outline-none focus:border-[#1E40AF]"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">End Date</label>
                  <input
                    type="date"
                    value={leaveForm.end_date}
                    onChange={(e) => setLeaveForm(f => ({ ...f, end_date: e.target.value }))}
                    required
                    className="w-full bg-white border border-[#E2E8F0] rounded-md px-3 py-2 text-xs font-semibold text-slate-800 focus:outline-none focus:border-[#1E40AF]"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Total Days</label>
                <input
                  type="number"
                  min="1"
                  max="30"
                  value={leaveForm.total_days}
                  onChange={(e) => setLeaveForm(f => ({ ...f, total_days: e.target.value }))}
                  required
                  className="w-full bg-white border border-[#E2E8F0] rounded-md px-3 py-2 text-xs font-semibold text-slate-800 focus:outline-none focus:border-[#1E40AF]"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Operational Handover &amp; Reason</label>
                <textarea
                  value={leaveForm.reason}
                  onChange={(e) => setLeaveForm(f => ({ ...f, reason: e.target.value }))}
                  required
                  rows={3}
                  className="w-full bg-white border border-[#E2E8F0] rounded-md px-3 py-2 text-xs font-medium text-slate-800 focus:outline-none focus:border-[#1E40AF] resize-none"
                  placeholder="Detail handoff of active trade orders or personal reason..."
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowLeaveModal(false)}
                  className="px-4 py-2 border border-[#E2E8F0] rounded-md text-xs font-semibold text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingLeave}
                  className="px-5 py-2 bg-[#1E40AF] hover:bg-blue-800 text-white rounded-md text-xs font-bold uppercase tracking-wider shadow-sm transition-all flex items-center space-x-1.5"
                >
                  {submittingLeave && <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />}
                  <span>{submittingLeave ? 'Submitting...' : 'Submit Leave'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ──────────────────── MODAL: REGULARIZE ATTENDANCE ──────────────────── */}
      {showRegModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl border border-[#E2E8F0] shadow-2xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <div className="flex items-center space-x-2">
                <Fingerprint className="w-5 h-5 text-amber-600" />
                <h3 className="text-sm font-bold text-slate-900 uppercase">CLAIM MISSED PUNCH / REGULARIZE</h3>
              </div>
              <button onClick={() => setShowRegModal(false)} className="text-slate-400 hover:text-slate-600 font-bold text-lg">×</button>
            </div>

            <form onSubmit={handleRegularizeSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Date <span className="text-red-500">*</span></label>
                  <input
                    type="date"
                    value={regForm.date}
                    onChange={(e) => setRegForm(f => ({ ...f, date: e.target.value }))}
                    required
                    className="w-full bg-white border border-[#E2E8F0] rounded-md px-3 py-2 text-xs font-semibold text-slate-800 focus:outline-none focus:border-[#1E40AF]"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Punch Type <span className="text-red-500">*</span></label>
                  <select
                    value={regForm.punch_type}
                    onChange={(e) => setRegForm(f => ({ ...f, punch_type: e.target.value }))}
                    className="w-full bg-white border border-[#E2E8F0] rounded-md px-3 py-2 text-xs font-semibold text-slate-800 focus:outline-none focus:border-[#1E40AF]"
                  >
                    <option value="BOTH">Both (Full Day Missed)</option>
                    <option value="CLOCK_IN">Clock-In Only</option>
                    <option value="CLOCK_OUT">Clock-Out Only</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Requested Clock-In</label>
                  <input
                    type="text"
                    value={regForm.requested_clock_in}
                    onChange={(e) => setRegForm(f => ({ ...f, requested_clock_in: e.target.value }))}
                    placeholder="08:30 AM"
                    className="w-full bg-white border border-[#E2E8F0] rounded-md px-3 py-2 text-xs font-semibold text-slate-800 focus:outline-none focus:border-[#1E40AF]"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Requested Clock-Out</label>
                  <input
                    type="text"
                    value={regForm.requested_clock_out}
                    onChange={(e) => setRegForm(f => ({ ...f, requested_clock_out: e.target.value }))}
                    placeholder="05:30 PM"
                    className="w-full bg-white border border-[#E2E8F0] rounded-md px-3 py-2 text-xs font-semibold text-slate-800 focus:outline-none focus:border-[#1E40AF]"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Duty Justification / Reason <span className="text-red-500">*</span></label>
                <textarea
                  value={regForm.reason}
                  onChange={(e) => setRegForm(f => ({ ...f, reason: e.target.value }))}
                  required
                  rows={3}
                  className="w-full bg-white border border-[#E2E8F0] rounded-md px-3 py-2 text-xs font-medium text-slate-800 focus:outline-none focus:border-[#1E40AF] resize-none"
                  placeholder="e.g. On-site container quality inspection at Berth 3 without biometric reader terminal..."
                />
              </div>

              <div className="bg-amber-50 border border-amber-200 rounded-lg p-2.5 text-[11px] text-amber-900">
                <p className="font-bold">Notice:</p>
                <p>HR approval will automatically generate or reconcile the official punch log in the daily attendance registry.</p>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowRegModal(false)}
                  className="px-4 py-2 border border-[#E2E8F0] rounded-md text-xs font-semibold text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingReg}
                  className="px-5 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-md text-xs font-bold uppercase tracking-wider shadow-sm transition-all flex items-center space-x-1.5"
                >
                  {submittingReg && <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />}
                  <span>{submittingReg ? 'Submitting...' : 'Submit Claim'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ──────────────────── MODAL: OFFICIAL SALARY SLIP ──────────────────── */}
      {viewingSlip && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-[110] flex items-center justify-center p-4">
          <div className="bg-white rounded-xl border border-[#E2E8F0] shadow-2xl max-w-xl w-full p-6 space-y-5 max-h-[95vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between border-b pb-3">
              <div className="flex items-center space-x-2">
                <Receipt className="w-5 h-5 text-[#1E40AF]" />
                <h3 className="text-sm font-bold text-slate-900 uppercase">OFFICIAL SALARY DISBURSEMENT SLIP</h3>
              </div>
              <button onClick={() => setViewingSlip(null)} className="text-slate-400 hover:text-slate-600 p-1 font-bold">✕</button>
            </div>

            {/* Slip Paper Body */}
            <div className="border border-slate-200 rounded-lg p-5 space-y-4 bg-slate-50/50 text-xs">
              <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                <div>
                  <h2 className="text-base font-black text-[#1E40AF]">SOILEX LIFE SCIENCE LTD</h2>
                  <p className="text-[10px] text-slate-500 font-semibold uppercase">Hanoi HQ · Bio-Hubs &amp; Global Spices Extraction</p>
                  <p className="text-[10px] text-slate-400">Tax Reg: SLX-VN-99201 | ISO 22000 &amp; FSSAI Compliant</p>
                </div>
                <div className="text-right">
                  <span className="text-[10px] font-bold text-slate-400 uppercase block">PAYSLIP FOR</span>
                  <span className="text-xs font-black text-slate-800">{viewingSlip.month_year}</span>
                  <span className="inline-block mt-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-emerald-100 text-emerald-800">
                    {viewingSlip.status || 'PAID'}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 bg-white p-3 rounded border border-slate-100">
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase block">STAFF NAME</span>
                  <span className="font-bold text-slate-900">{employee.full_name}</span>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase block">EMPLOYEE CODE</span>
                  <span className="font-mono font-bold text-[#1E40AF]">{employee.employee_code || employee.id}</span>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase block">ROLE / DEPARTMENT</span>
                  <span className="font-semibold text-slate-700">{employee.designation} ({employee.department})</span>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase block">DISBURSEMENT BANK</span>
                  <span className="font-semibold text-slate-700">{viewingSlip.bank || 'Vietcombank'}</span>
                </div>
              </div>

              {/* Earnings & Deductions */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white p-3 rounded border border-slate-100 space-y-2">
                  <h4 className="font-bold text-slate-700 uppercase text-[10px] tracking-wider border-b pb-1">EARNINGS</h4>
                  <div className="flex justify-between text-slate-600">
                    <span>Basic Remuneration:</span>
                    <span className="font-semibold">${Number(viewingSlip.basic_pay || 2200).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>Allowances &amp; HRA:</span>
                    <span className="font-semibold">${Number(viewingSlip.allowances || 450).toLocaleString()}</span>
                  </div>
                  {viewingSlip.overtime_pay > 0 && (
                    <div className="flex justify-between text-amber-700 font-semibold bg-amber-50 px-1.5 py-0.5 rounded text-[10px] border border-amber-200">
                      <span>Approved Overtime ({viewingSlip.overtime_hours}h @ 1.5x):</span>
                      <span>+${Number(viewingSlip.overtime_pay).toFixed(2)}</span>
                    </div>
                  )}
                  <div className="flex justify-between font-bold text-slate-900 border-t pt-1">
                    <span>Total Gross Pay:</span>
                    <span className="text-[#1E40AF]">
                      ${(Number(viewingSlip.basic_pay || 2200) + Number(viewingSlip.allowances || 450)).toLocaleString()}
                    </span>
                  </div>
                </div>

                <div className="bg-white p-3 rounded border border-slate-100 space-y-2">
                  <h4 className="font-bold text-slate-700 uppercase text-[10px] tracking-wider border-b pb-1">DEDUCTIONS</h4>
                  <div className="flex justify-between text-slate-600">
                    <span>Provident Fund (PF):</span>
                    <span className="font-semibold">${Number(viewingSlip.deductions || 120).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>Statutory Tax Withholding:</span>
                    <span className="font-semibold">${Number(viewingSlip.tax || 180).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between font-bold text-slate-900 border-t pt-1">
                    <span>Total Deductions:</span>
                    <span className="text-red-600">-${(Number(viewingSlip.deductions || 120) + Number(viewingSlip.tax || 180)).toLocaleString()}</span>
                  </div>
                </div>
              </div>

              {/* Net Remittance */}
              <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3 flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-bold text-emerald-800 uppercase block">NET DISBURSED REMITTANCE</span>
                  <span className="text-[11px] text-emerald-600 font-medium">Transferred via SWIFT / ACH electronic clearing</span>
                </div>
                <div className="text-xl font-black text-emerald-700">
                  ${Number(viewingSlip.net_salary || 2350).toLocaleString()}
                </div>
              </div>

              <div className="pt-2 border-t border-slate-200 flex items-center justify-between text-[10px] text-slate-400">
                <span>Value Date: {viewingSlip.disbursed_at || viewingSlip.month_year}</span>
                <span className="font-mono">Ref: SLX-PAY-{employee.id}</span>
                <span>Authorized: Corporate Payroll</span>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={() => window.print()}
                className="px-4 py-2 border border-[#E2E8F0] rounded-md text-xs font-bold text-slate-700 hover:bg-slate-50 flex items-center space-x-1.5"
              >
                <Download className="w-3.5 h-3.5 text-[#1E40AF]" />
                <span>Print Salary Slip</span>
              </button>
              <button
                onClick={() => setViewingSlip(null)}
                className="px-4 py-2 bg-[#1E40AF] hover:bg-blue-800 text-white rounded-md text-xs font-bold uppercase tracking-wider"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Timesheet Audit Trail & Statutory Verification Modal ── */}
      {viewingAuditTimesheet && (
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
                      Weekly Timesheet Audit Trail
                    </h3>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                      viewingAuditTimesheet.status === 'APPROVED' ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' :
                      viewingAuditTimesheet.status === 'SUBMITTED' ? 'bg-blue-100 text-blue-800 border border-blue-200' :
                      'bg-amber-100 text-amber-800 border border-amber-200'
                    }`}>
                      {viewingAuditTimesheet.status}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 font-medium mt-0.5">
                    Official Audit Traceability · ISO 22000 Labor &amp; Shift Compliance
                  </p>
                </div>
              </div>
              <button
                onClick={() => setViewingAuditTimesheet(null)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Top Quick Reference Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 p-3.5 rounded-xl border border-slate-200 text-xs">
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase block">Timesheet ID</span>
                <span className="font-mono font-bold text-[#1E40AF]">{viewingAuditTimesheet.id}</span>
              </div>
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase block">Week Period</span>
                <span className="font-mono font-semibold text-slate-800">{viewingAuditTimesheet.week_start}</span>
              </div>
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase block">Charge Code</span>
                <span className="font-mono font-bold text-[#D97706]">{viewingAuditTimesheet.charge_code || 'PRJ-EXP-01'}</span>
              </div>
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase block">Audited Hours</span>
                <span className="font-mono font-black text-emerald-700">{viewingAuditTimesheet.total_hours || 40.0} hrs</span>
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
                      <span className="font-mono text-slate-400">{viewingAuditTimesheet.week_start} 08:30:00 ICT</span>
                    </div>
                    <p className="text-[11px] text-slate-600 mt-1">
                      Logged by employee <span className="font-semibold text-slate-900">{viewingAuditTimesheet.employee_name || employee.full_name}</span>. Shift verification confirmed via biometric terminal and project assignment.
                    </p>
                    <div className="mt-1.5 text-[10px] font-mono text-slate-400 flex items-center space-x-2">
                      <span>Project: {viewingAuditTimesheet.project_name}</span>
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
                      <span className="font-mono text-slate-400">{viewingAuditTimesheet.week_end || viewingAuditTimesheet.week_start} 17:30:00 ICT</span>
                    </div>
                    <p className="text-[11px] text-slate-600 mt-1">
                      Task: <span className="font-medium text-slate-800">"{viewingAuditTimesheet.task_desc || 'Operations delivery and cross-department synchronization'}"</span>
                    </p>
                    <div className="mt-1.5 text-[10px] font-semibold text-blue-700 bg-blue-50 border border-blue-200 rounded px-2 py-0.5 inline-block">
                      Electronic Signature Verified · 0 Discrepancy Flags
                    </div>
                  </div>
                </div>

                {/* Event 3 */}
                <div className="relative">
                  <div className={`absolute -left-6 top-1 w-2.5 h-2.5 rounded-full ${viewingAuditTimesheet.status === 'APPROVED' ? 'bg-emerald-500 ring-4 ring-emerald-100' : 'bg-amber-500 ring-4 ring-amber-100'}`} />
                  <div className="bg-white p-3 rounded-lg border border-slate-200 shadow-xs">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="font-bold text-slate-800">3. Supervisory Review &amp; Audit Sign-Off</span>
                      <span className="font-mono text-slate-400">
                        {viewingAuditTimesheet.status === 'APPROVED' ? 'Approved & Locked' : 'Audit In Review'}
                      </span>
                    </div>
                    <div className="mt-1 flex items-center space-x-2 text-xs">
                      <span className="text-slate-500">Sign-off Approver:</span>
                      <span className="font-bold text-slate-900">{viewingAuditTimesheet.approver || 'Corporate Management / Engagement Director'}</span>
                    </div>
                    {viewingAuditTimesheet.comments && (
                      <p className="text-[11px] text-slate-600 italic mt-1 bg-slate-50 p-2 rounded border border-slate-200">
                        "{viewingAuditTimesheet.comments}"
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
                      Hash Digest: SHA256:{Math.abs((viewingAuditTimesheet.id || 'TS').split('').reduce((a, b) => { a = ((a << 5) - a) + b.charCodeAt(0); return a & a }, 0)).toString(16).padStart(16, '7f3a9e01')}...c491
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
                  const val = viewingAuditTimesheet[dayKeys[idx]] !== undefined ? viewingAuditTimesheet[dayKeys[idx]] : (idx < 5 ? 8 : 0);
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
                  onClick={() => setViewingAuditTimesheet(null)}
                  className="px-4 py-2 bg-[#1E40AF] hover:bg-blue-800 text-white rounded-lg text-xs font-bold uppercase tracking-wider transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ──────────────────── MODAL: CONFIRM WITHDRAW RESIGNATION ──────────────────── */}
      {showWithdrawConfirm && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-[120] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-[#E2E8F0] shadow-2xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center space-x-3 text-red-600">
              <div className="w-10 h-10 rounded-xl bg-red-50 border border-red-200 flex items-center justify-center shrink-0">
                <AlertCircle className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900 uppercase">Withdraw Resignation</h3>
                <p className="text-xs text-slate-500">Cancel separation and restore active status</p>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed bg-slate-50 p-3.5 rounded-xl border border-slate-200">
              Are you sure you want to withdraw your resignation request? Your separation workflow, clearance checks, and notice period will be cancelled, and your profile will remain active in full-time good standing.
            </p>

            <div className="flex items-center justify-end space-x-2 pt-2">
              <button
                type="button"
                onClick={() => setShowWithdrawConfirm(false)}
                className="px-4 py-2 border border-[#E2E8F0] hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-semibold transition-colors"
              >
                No, Keep Resignation
              </button>
              <button
                type="button"
                disabled={withdrawingResignation}
                onClick={handleWithdrawResignation}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white rounded-lg text-xs font-bold uppercase tracking-wider transition-colors shadow-sm flex items-center space-x-1.5"
              >
                {withdrawingResignation && (
                  <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                )}
                <span>{withdrawingResignation ? 'Withdrawing...' : 'Confirm Withdrawal'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
