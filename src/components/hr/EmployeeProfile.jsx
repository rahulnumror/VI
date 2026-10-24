import React, { useState, useEffect, useCallback } from 'react';
import {
  X, Check, Clock, Calendar, DollarSign, FileText,
  User, Briefcase, MapPin, ChevronRight, ShieldAlert, LogOut, CheckCircle2,
  Printer, Download, AlertCircle, FileSpreadsheet, Send, ShieldCheck
} from 'lucide-react';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import DocumentGeneratorModal from './DocumentGeneratorModal';

// ─── helpers ───────────────────────────────────────────────────────────────
const getInitials = (name = '') =>
  name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map(w => w[0].toUpperCase())
    .join('');

const daysSince = (dateStr) => {
  if (!dateStr) return '—';
  const diff = Date.now() - new Date(dateStr).getTime();
  return Math.max(0, Math.floor(diff / 86400000));
};

const fmtCurrency = (n) =>
  n != null ? Number(n).toLocaleString('en-IN', { minimumFractionDigits: 0 }) : '—';

const statusBadge = (status) => {
  const map = {
    APPROVED: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    REJECTED: 'bg-red-100 text-red-700 border-red-200',
    PENDING:  'bg-amber-100 text-amber-800 border-amber-200',
    PAID:     'bg-emerald-100 text-emerald-800 border-emerald-200',
    PRESENT:  'bg-emerald-100 text-emerald-800 border-emerald-200',
    ABSENT:   'bg-red-100 text-red-700 border-red-200',
    LATE:     'bg-amber-100 text-amber-800 border-amber-200',
    LEAVE:    'bg-blue-100 text-blue-800 border-blue-200',
    ACTIVE:   'bg-emerald-100 text-emerald-800 border-emerald-200',
    INACTIVE: 'bg-slate-100 text-slate-500 border-slate-200',
  };
  const cls = map[status] || 'bg-slate-100 text-slate-500 border-slate-200';
  return (
    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase border ${cls}`}>
      {status}
    </span>
  );
};

// ─── Skeleton loader ────────────────────────────────────────────────────────
const Skeleton = ({ rows = 5 }) => (
  <div className="space-y-3 p-4 animate-pulse">
    {Array.from({ length: rows }).map((_, i) => (
      <div key={i} className="flex space-x-3">
        <div className="bg-slate-100 rounded h-4 w-16" />
        <div className="bg-slate-100 rounded h-4 flex-1" />
        <div className="bg-slate-100 rounded h-4 w-20" />
      </div>
    ))}
  </div>
);

// ─── DEFAULT ONBOARDING ITEMS ───────────────────────────────────────────────
const DEFAULT_ONBOARDING = [
  { id: 1, item: 'Submit ID & documents',        completed: true  },
  { id: 2, item: 'Sign employment contract',      completed: true  },
  { id: 3, item: 'IT system access setup',        completed: false },
  { id: 4, item: 'Office / desk orientation',     completed: false },
  { id: 5, item: 'Complete compliance training',  completed: false },
  { id: 6, item: 'Meet with department head',     completed: false },
];

// ═══════════════════════════════════════════════════════════════════════════
export default function EmployeeProfile({ employee, onClose, onEditRequest, initialTab = 'overview' }) {
  const { user } = useAuth();
  const isEmployeeRole = user?.role === 'EMPLOYEE';
  const [activeTab, setActiveTab] = useState(isEmployeeRole ? 'overview' : (initialTab || 'overview'));
  const [notification, setNotification] = useState(null);
  const [showDocModal, setShowDocModal] = useState(false);

  useEffect(() => {
    if (isEmployeeRole && activeTab !== 'overview') {
      setActiveTab('overview');
    }
  }, [isEmployeeRole, activeTab]);

  // tab data
  const [leaveBalance, setLeaveBalance]       = useState(null);
  const [attendance, setAttendance]           = useState(null);
  const [leaveHistory, setLeaveHistory]       = useState(null);
  const [payroll, setPayroll]                 = useState(null);
  const [onboarding, setOnboarding]           = useState(null);
  const [empHistory, setEmpHistory]           = useState(null);
  const [compliance, setCompliance]           = useState(null);
  const [exitData, setExitData]               = useState(null);

  const [loadingTab, setLoadingTab]           = useState(false);
  const [deactivating, setDeactivating]       = useState(false);
  const [showDeactivateConfirm, setShowDeactivateConfirm] = useState(false);
  const [showInitiateExitModal, setShowInitiateExitModal] = useState(false);
  const [showFnFSlipModal, setShowFnFSlipModal]           = useState(false);
  const [initiateExitForm, setInitiateExitForm]           = useState({
    resignation_date: new Date().toISOString().slice(0, 10),
    notice_days: 30,
    last_working_day: new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10),
    reason: 'Voluntary Resignation for Career Advancement',
    unpaid_salary_days: 15,
    leave_encashment_days: 6,
  });

  const notify = (type, msg) => {
    setNotification({ type, msg });
    setTimeout(() => setNotification(null), 3500);
  };

  const handleToggleClearance = async (field) => {
    if (!exitData) return;
    const updatedVal = !exitData[field];
    const nextData = {
      ...exitData,
      [field]: updatedVal,
    };
    const itVal = field === 'it_clearance' ? updatedVal : (exitData.it_clearance ?? exitData.clearance_it);
    const finVal = field === 'finance_clearance' ? updatedVal : (exitData.finance_clearance ?? exitData.clearance_finance);
    const admVal = field === 'admin_clearance' ? updatedVal : (exitData.admin_clearance ?? exitData.clearance_admin);
    const allGreen = itVal && finVal && admVal;
    const newStatus = allGreen ? 'ALL_CLEARED' : 'CLEARANCE_PENDING';
    nextData.status = exitData.status === 'SETTLED' ? 'SETTLED' : newStatus;
    setExitData(nextData);

    try {
      await api.updateExitStatus(exitData.id, {
        [field]: updatedVal,
        status: nextData.status,
      });
      notify('success', `Updated clearance: ${field.replace('_', ' ').toUpperCase()}`);
    } catch {
      notify('error', 'Failed to update clearance status.');
    }
  };

  const handleDisburseExit = async () => {
    if (!exitData) return;
    const monthlyBasic = employee.basic_pay || (employee.salary ? employee.salary * 0.75 : 2400);
    const dailyRate = Math.round(monthlyBasic / 30);
    const unpaidDays = exitData.unpaid_salary_days || 15;
    const leaveDays = exitData.leave_encashment_days || 6;
    const netTotal = exitData.settlement_amount > 0 ? exitData.settlement_amount : (unpaidDays + leaveDays) * dailyRate;

    try {
      await api.updateExitStatus(exitData.id, {
        status: 'SETTLED',
        settlement_amount: netTotal,
      });
      setExitData(prev => ({ ...prev, status: 'SETTLED', settlement_amount: netTotal }));

      // Persist to settled employees store so appraisal and salary tabs auto-remove them immediately
      try {
        const empId = employee.id || exitData.employee_id;
        const empName = employee.full_name || exitData.employee_name;
        const stored = JSON.parse(localStorage.getItem('soilex_settled_employees') || '[]');
        if (!stored.some(s => (typeof s === 'string' && s === empId) || (s && (s.id === empId || s.name === empName)))) {
          stored.push({ id: empId, name: empName, settled_at: new Date().toISOString() });
          localStorage.setItem('soilex_settled_employees', JSON.stringify(stored));
        }
        window.dispatchEvent(new CustomEvent('soilex-settlement-updated', { detail: { id: empId, name: empName } }));
      } catch {}

      notify('success', `Full & Final settlement of $${netTotal.toLocaleString()} USD disbursed. Auto-removed from appraisal & salary tabs.`);
    } catch {
      notify('error', 'Failed to disburse settlement.');
    }
  };

  const handleInitiateExit = async (e) => {
    e.preventDefault();
    const monthlyBasic = employee.basic_pay || (employee.salary ? employee.salary * 0.75 : 2400);
    const dailyRate = Math.round(monthlyBasic / 30);
    const unpaidDays = parseInt(initiateExitForm.unpaid_salary_days) || 15;
    const leaveDays = parseInt(initiateExitForm.leave_encashment_days) || 6;
    const netTotal = (unpaidDays + leaveDays) * dailyRate;

    try {
      await api.submitExitRequest({
        employee_id: employee.id,
        employee_name: employee.full_name,
        department: employee.department || 'Operations',
        resignation_date: initiateExitForm.resignation_date,
        last_working_day: initiateExitForm.last_working_day,
        notice_days: parseInt(initiateExitForm.notice_days) || 30,
        reason: initiateExitForm.reason,
        unpaid_salary_days: unpaidDays,
        leave_encashment_days: leaveDays,
        settlement_amount: netTotal,
      });
      notify('success', `Separation workflow initiated for ${employee.full_name}.`);
      setShowInitiateExitModal(false);
      const d = await api.getAllExits();
      if (d && Array.isArray(d)) {
        const matched = d.find(x => x.employee_id === employee.id);
        setExitData(matched || null);
      }
    } catch {
      notify('error', 'Failed to initiate separation.');
    }
  };

  // ── fetch leave balance on mount ──
  useEffect(() => {
    (async () => {
      const data = await api._request('GET', `/employees/${employee.id}/leave-balance`);
      if (data) setLeaveBalance(data);
      else setLeaveBalance({ annual_used: 3, sick_used: 1, casual_used: 0 }); // mock fallback
    })();
  }, [employee.id]);

  // ── fetch data when tab changes ──
  useEffect(() => {
    const fetchTab = async () => {
      setLoadingTab(true);
      try {
        if (activeTab === 'attendance' && attendance === null) {
          const d = await api._request('GET', `/employees/${employee.id}/attendance`);
          setAttendance(d && Array.isArray(d) && d.length ? d : MOCK_ATTENDANCE);
        }
        if (activeTab === 'leave' && leaveHistory === null) {
          const d = await api._request('GET', `/employees/${employee.id}/leaves`);
          setLeaveHistory(d && Array.isArray(d) && d.length ? d : MOCK_LEAVES);
        }
        if (activeTab === 'payroll' && payroll === null) {
          const d = await api._request('GET', `/employees/${employee.id}/payroll`);
          setPayroll(d && Array.isArray(d) ? d : []);
        }
        if (activeTab === 'onboarding' && onboarding === null) {
          const d = await api._request('GET', `/employees/${employee.id}/onboarding`);
          setOnboarding(d && Array.isArray(d) && d.length ? d : DEFAULT_ONBOARDING);
        }
        if (activeTab === 'history' && empHistory === null) {
          const d = await api._request('GET', `/employees/${employee.id}/history`);
          setEmpHistory(d && Array.isArray(d) ? d : []);
        }
        if (activeTab === 'compliance' && compliance === null) {
          try {
            const d = await api.getEmployeeCompliance(employee.id);
            if (d) setCompliance(d);
            else setCompliance(MOCK_COMPLIANCE);
          } catch { setCompliance(MOCK_COMPLIANCE); }
        }
        if (activeTab === 'exit' && exitData === null) {
          try {
            const d = await api.getAllExits();
            if (d && Array.isArray(d)) {
              const matched = d.find(x => x.employee_id === employee.id);
              setExitData(matched || null);
            } else { setExitData(null); }
          } catch { setExitData(null); }
        }
      } finally {
        setLoadingTab(false);
      }
    };
    fetchTab();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, employee.id]);

  // ── onboarding toggle ──
  const handleToggleOnboarding = async (empId, itemId) => {
    setOnboarding(prev =>
      prev.map(i => i.id === itemId ? { ...i, completed: !i.completed } : i)
    );
    await api._request('PATCH', `/employees/${empId}/onboarding/${itemId}/toggle`);
  };

  // ── deactivate ──
  const handleDeactivate = async () => {
    setDeactivating(true);
    try {
      const result = await api.updateEmployee(employee.id, { status: 'INACTIVE' });
      if (result !== null) {
        notify('success', `${employee.full_name} has been deactivated.`);
      } else {
        notify('success', 'Status updated locally (offline mode).');
      }
      setShowDeactivateConfirm(false);
    } catch {
      notify('error', 'Failed to deactivate employee.');
    } finally {
      setDeactivating(false);
    }
  };

  const allTabs = [
    { id: 'overview',   label: 'Overview'           },
    { id: 'attendance', label: 'Attendance'          },
    { id: 'leave',      label: 'Leave History'       },
    { id: 'payroll',    label: 'Payroll'             },
    { id: 'onboarding', label: 'Onboarding'          },
    { id: 'compliance', label: 'Compliance & Health' },
    { id: 'exit',       label: 'Exit & Settlement'   },
    { id: 'history',    label: 'Employment History'  },
  ];

  const tabs = isEmployeeRole
    ? [{ id: 'overview', label: 'Static Overview' }]
    : allTabs;

  // ───────────────────────────────────────────────────────────────────────────
  return (
    <div className="fixed inset-0 z-[100] flex justify-end">
      {/* Notification */}
      {notification && (
        <div className={`fixed top-4 right-4 z-[9999] flex items-center space-x-2 px-4 py-3 rounded-lg shadow-lg border text-xs font-bold transition-all ${
          notification.type === 'success'
            ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
            : 'bg-red-50 border-red-200 text-red-700'
        }`}>
          <span>{notification.type === 'success' ? '✓' : '✕'}</span>
          <span>{notification.msg}</span>
        </div>
      )}

      {/* Backdrop */}
      <div
        className="flex-1 bg-slate-900/40 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Panel */}
      <div className="w-full max-w-2xl bg-[#F8FAFC] h-full overflow-y-auto shadow-2xl border-l border-[#E2E8F0] flex flex-col">

        {/* ── Header ── */}
        <div className="bg-white border-b border-[#E2E8F0] p-6 flex items-center space-x-4 shrink-0">
          {/* Avatar */}
          <div className="w-16 h-16 rounded-xl bg-[#1E40AF] text-white font-black text-2xl flex items-center justify-center shrink-0 select-none shadow-md">
            {getInitials(employee.full_name)}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center space-x-2 flex-wrap gap-y-1">
              <h2 className="text-lg font-bold text-slate-900 truncate">{employee.full_name}</h2>
              {statusBadge(employee.status || 'ACTIVE')}
            </div>
            <p className="text-xs text-slate-500 font-semibold mt-0.5 truncate">
              {employee.designation} · {employee.department}
            </p>
            <div className="flex items-center flex-wrap gap-x-3 gap-y-0.5 mt-1 text-[11px] text-slate-400 font-medium">
              <span>📍 {employee.branch}</span>
              <span>🕐 {employee.shift}</span>
              <span className="font-mono text-[#D97706]">{employee.employee_code}</span>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-100 rounded-lg text-slate-400 transition-colors shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* ── IAM Security & Access Policy Pill ── */}
        {isEmployeeRole && (
          <div className="bg-emerald-50 border-b border-emerald-200 px-6 py-2.5 flex items-center justify-between text-xs shrink-0">
            <div className="flex items-center space-x-2 text-emerald-900 font-semibold">
              <span className="text-sm">🔒</span>
              <span>IAM Policy: <strong>EMPLOYEE</strong> · Minimum Level Access Control (Static Details Only)</span>
            </div>
            <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-emerald-200/60 text-emerald-800 font-mono">
              Read-Only
            </span>
          </div>
        )}

        {/* ── Tab Bar ── */}
        <div className="flex border-b border-[#E2E8F0] bg-white overflow-x-auto shrink-0">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-3 text-xs font-bold uppercase whitespace-nowrap transition-colors border-b-2 ${
                activeTab === tab.id
                  ? 'border-[#1E40AF] text-[#1E40AF] bg-blue-50/50'
                  : 'border-transparent text-slate-500 hover:text-slate-700'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* ── Tab Content ── */}
        <div className="flex-1 p-5 space-y-4">

          {/* ════════════ OVERVIEW ════════════ */}
          {activeTab === 'overview' && (
            <div className="space-y-4">
              {/* Info cards grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Personal Info */}
                <div className="bg-white rounded-lg border border-[#E2E8F0] p-4 space-y-3">
                  <div className="flex items-center space-x-2 mb-1">
                    <User className="w-4 h-4 text-[#1E40AF]" />
                    <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Personal Info</h3>
                  </div>
                  <InfoRow label="Full Name"  value={employee.full_name} />
                  <InfoRow label="Email"      value={employee.email || '—'} />
                  <InfoRow label="Phone"      value={employee.phone || '—'} />
                  <InfoRow label="Join Date"  value={employee.join_date || '—'} />
                </div>

                {/* Employment Info */}
                <div className="bg-white rounded-lg border border-[#E2E8F0] p-4 space-y-3">
                  <div className="flex items-center space-x-2 mb-1">
                    <Briefcase className="w-4 h-4 text-[#D97706]" />
                    <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Employment</h3>
                  </div>
                  <InfoRow label="Department"  value={employee.department} />
                  <InfoRow label="Designation" value={employee.designation} />
                  <InfoRow label="Branch"      value={employee.branch} />
                  <InfoRow label="Shift"       value={employee.shift} />
                  <InfoRow label="Emp Code"    value={employee.employee_code} mono />
                </div>
              </div>

              {/* Quick Stats */}
              <div className="bg-white rounded-lg border border-[#E2E8F0] p-4">
                <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-3">
                  {isEmployeeRole ? 'Workforce Allocation (Static)' : 'Quick Stats'}
                </h3>
                {isEmployeeRole ? (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <StatCard
                      label="Days In Company"
                      value={daysSince(employee.join_date)}
                      color="blue"
                    />
                    <StatCard
                      label="Designation Role"
                      value={employee.designation || 'Staff'}
                      color="emerald"
                    />
                    <StatCard
                      label="Branch Facility"
                      value={employee.branch || 'Hanoi HQ'}
                      color="amber"
                    />
                    <StatCard
                      label="Operational Shift"
                      value={employee.shift || 'Standard'}
                      color="purple"
                    />
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <StatCard
                      label="Days Since Joining"
                      value={daysSince(employee.join_date)}
                      color="blue"
                    />
                    <StatCard
                      label="Annual Leave Left"
                      value={leaveBalance ? `${18 - (leaveBalance.annual_used || 0)}/18` : '…'}
                      color="emerald"
                    />
                    <StatCard
                      label="Sick Leave Left"
                      value={leaveBalance ? `${12 - (leaveBalance.sick_used || 0)}/12` : '…'}
                      color="amber"
                    />
                    <StatCard
                      label="Casual Leave Left"
                      value={leaveBalance ? `${6 - (leaveBalance.casual_used || 0)}/6` : '…'}
                      color="purple"
                    />
                  </div>
                )}
              </div>

              {/* Actions & Access Policy */}
              <div className="bg-white rounded-lg border border-[#E2E8F0] p-4">
                <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-3">
                  {isEmployeeRole ? 'IAM Security & Access Policy' : 'Actions'}
                </h3>
                {isEmployeeRole ? (
                  <div className="bg-slate-50 border border-slate-200 rounded-lg p-3.5 flex items-start space-x-3">
                    <div className="w-8 h-8 rounded-lg bg-emerald-100 border border-emerald-300 text-emerald-800 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                      🔒
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 flex-wrap">
                        <span className="text-xs font-bold text-slate-900">Minimum Level Access Control Active</span>
                        <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                          ROLE: EMPLOYEE
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
                        Under least-privilege enterprise IAM policy, staff members with an Employee role only have authorization to view static directory details for other colleagues. Confidential compensation, salary disbursals, clearance sign-offs, and profile modifications are strictly restricted.
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => onEditRequest && onEditRequest(employee)}
                      className="px-4 py-2 bg-[#D97706] hover:bg-[#B45309] text-white rounded-md text-xs font-semibold shadow-sm transition-colors"
                    >
                      ✏️ Edit Profile
                    </button>
                    <button
                      onClick={() => setActiveTab('payroll')}
                      className="px-4 py-2 border border-[#1E40AF] text-[#1E40AF] hover:bg-blue-50 rounded-md text-xs font-semibold transition-colors"
                    >
                      💰 View Payslips
                    </button>
                    <button
                      onClick={() => setShowDocModal(true)}
                      className="px-4 py-2 bg-[#1E40AF] hover:bg-blue-800 text-white rounded-md text-xs font-semibold shadow-sm transition-colors flex items-center space-x-1"
                    >
                      <span>📄</span>
                      <span>Official Documents</span>
                    </button>
                    {!showDeactivateConfirm ? (
                      <button
                        onClick={() => setShowDeactivateConfirm(true)}
                        className="px-4 py-2 border border-red-300 text-red-600 hover:bg-red-50 rounded-md text-xs font-semibold transition-colors"
                      >
                        🚫 Deactivate
                      </button>
                    ) : (
                      <div className="flex items-center space-x-2">
                        <span className="text-[11px] text-red-600 font-semibold">Are you sure?</span>
                        <button
                          onClick={handleDeactivate}
                          disabled={deactivating}
                          className="px-3 py-1.5 bg-red-600 text-white rounded-md text-xs font-bold hover:bg-red-700 disabled:opacity-50"
                        >
                          {deactivating ? 'Deactivating…' : 'Confirm'}
                        </button>
                        <button
                          onClick={() => setShowDeactivateConfirm(false)}
                          className="px-3 py-1.5 border border-slate-200 text-slate-600 rounded-md text-xs font-semibold hover:bg-slate-50"
                        >
                          Cancel
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ════════════ ATTENDANCE ════════════ */}
          {!isEmployeeRole && activeTab === 'attendance' && (
            <div className="space-y-4">
              {loadingTab && attendance === null ? (
                <Skeleton rows={6} />
              ) : (
                <>
                  {/* Stats row */}
                  {(() => {
                    const records = attendance || [];
                    const present = records.filter(r => r.status === 'PRESENT').length;
                    const absent  = records.filter(r => r.status === 'ABSENT').length;
                    const late    = records.filter(r => r.status === 'LATE').length;
                    const avgHrs  = records.length
                      ? (records.reduce((s, r) => s + (parseFloat(r.hours_worked) || 0), 0) / records.length).toFixed(1)
                      : '—';
                    return (
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        <StatCard label="Days Present" value={present}  color="emerald" />
                        <StatCard label="Days Absent"  value={absent}   color="red"     />
                        <StatCard label="Days Late"    value={late}     color="amber"   />
                        <StatCard label="Avg Hours"    value={avgHrs}   color="blue"    />
                      </div>
                    );
                  })()}

                  {/* Table */}
                  <div className="bg-white rounded-lg border border-[#E2E8F0] overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full text-xs text-left">
                        <thead className="bg-[#FAFAFA] border-b border-[#E2E8F0] text-[11px] font-bold uppercase tracking-wider text-slate-600">
                          <tr>
                            <th className="py-2.5 px-4">Date</th>
                            <th className="py-2.5 px-4">Clock In</th>
                            <th className="py-2.5 px-4">Clock Out</th>
                            <th className="py-2.5 px-4">Hours</th>
                            <th className="py-2.5 px-4">Status</th>
                            <th className="py-2.5 px-4">Source</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 font-medium">
                          {(attendance || []).length === 0 ? (
                            <tr>
                              <td colSpan={6} className="py-10 text-center text-slate-400 text-xs">No attendance records found.</td>
                            </tr>
                          ) : (attendance || []).map((rec, i) => (
                            <tr key={i} className="hover:bg-blue-50/40 transition-colors">
                              <td className="py-2.5 px-4 whitespace-nowrap font-mono text-slate-700">{rec.date}</td>
                              <td className="py-2.5 px-4 whitespace-nowrap text-slate-600">{rec.clock_in || '—'}</td>
                              <td className="py-2.5 px-4 whitespace-nowrap text-slate-600">{rec.clock_out || '—'}</td>
                              <td className="py-2.5 px-4 whitespace-nowrap text-slate-700 font-bold">{rec.hours_worked || '—'}</td>
                              <td className="py-2.5 px-4 whitespace-nowrap">{statusBadge(rec.status)}</td>
                              <td className="py-2.5 px-4 whitespace-nowrap text-slate-400">{rec.source || '—'}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </>
              )}
            </div>
          )}

          {/* ════════════ LEAVE HISTORY ════════════ */}
          {!isEmployeeRole && activeTab === 'leave' && (
            <div className="space-y-4">
              {loadingTab && leaveHistory === null ? (
                <Skeleton rows={5} />
              ) : (
                <div className="bg-white rounded-lg border border-[#E2E8F0] overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs text-left">
                      <thead className="bg-[#FAFAFA] border-b border-[#E2E8F0] text-[11px] font-bold uppercase tracking-wider text-slate-600">
                        <tr>
                          <th className="py-2.5 px-4">Leave Type</th>
                          <th className="py-2.5 px-4">From</th>
                          <th className="py-2.5 px-4">To</th>
                          <th className="py-2.5 px-4">Days</th>
                          <th className="py-2.5 px-4">Reason</th>
                          <th className="py-2.5 px-4">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 font-medium">
                        {(leaveHistory || []).length === 0 ? (
                          <tr>
                            <td colSpan={6} className="py-10 text-center text-slate-400 text-xs">No leave records found.</td>
                          </tr>
                        ) : (leaveHistory || []).map((rec, i) => (
                          <tr key={i} className="hover:bg-blue-50/40 transition-colors">
                            <td className="py-2.5 px-4 whitespace-nowrap font-semibold text-slate-700">{rec.leave_type}</td>
                            <td className="py-2.5 px-4 whitespace-nowrap text-slate-600">{rec.from_date || rec.start_date}</td>
                            <td className="py-2.5 px-4 whitespace-nowrap text-slate-600">{rec.to_date || rec.end_date}</td>
                            <td className="py-2.5 px-4 whitespace-nowrap font-bold text-slate-900">{rec.days ?? rec.total_days ?? 1}</td>
                            <td className="py-2.5 px-4 text-slate-500 max-w-[160px] truncate">{rec.reason || '—'}</td>
                            <td className="py-2.5 px-4 whitespace-nowrap">{statusBadge(rec.status)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ════════════ PAYROLL ════════════ */}
          {!isEmployeeRole && activeTab === 'payroll' && (
            <div className="space-y-4">
              {loadingTab && payroll === null ? (
                <Skeleton rows={6} />
              ) : (
                <>
                  <div className="bg-white rounded-lg border border-[#E2E8F0] overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full text-xs text-left">
                        <thead className="bg-[#FAFAFA] border-b border-[#E2E8F0] text-[11px] font-bold uppercase tracking-wider text-slate-600">
                          <tr>
                            <th className="py-2.5 px-4">Month</th>
                            <th className="py-2.5 px-4">Basic Pay</th>
                            <th className="py-2.5 px-4">Allowances</th>
                            <th className="py-2.5 px-4">Deductions</th>
                            <th className="py-2.5 px-4">Tax</th>
                            <th className="py-2.5 px-4">Net Salary</th>
                            <th className="py-2.5 px-4">Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 font-medium">
                          {(payroll || []).length === 0 ? (
                            <tr>
                              <td colSpan={7} className="py-8 px-4 text-center">
                                <div className="max-w-md mx-auto p-4 bg-blue-50/70 border border-blue-200 rounded-lg text-center space-y-2">
                                  <div className="w-8 h-8 rounded-full bg-blue-100 text-[#1E40AF] flex items-center justify-center mx-auto font-bold text-xs">
                                    ℹ️
                                  </div>
                                  <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                                    New Employee Pay Cycle Schedule
                                  </h4>
                                  <p className="text-[11px] text-slate-600 leading-relaxed">
                                    {employee.full_name} joined on <strong className="text-slate-800 font-mono">{employee.join_date || 'recently'}</strong>.
                                    Per corporate policy, first salary disbursement will be computed and processed starting from the next monthly payroll cycle. No pending salary or prior month dues exist.
                                  </p>
                                </div>
                              </td>
                            </tr>
                          ) : (payroll || []).map((rec, i) => (
                            <tr key={i} className="hover:bg-blue-50/40 transition-colors">
                              <td className="py-2.5 px-4 whitespace-nowrap font-bold text-slate-900">{rec.month_year}</td>
                              <td className="py-2.5 px-4 whitespace-nowrap text-slate-600">{fmtCurrency(rec.basic_pay)}</td>
                              <td className="py-2.5 px-4 whitespace-nowrap text-emerald-700">{fmtCurrency(rec.allowances)}</td>
                              <td className="py-2.5 px-4 whitespace-nowrap text-red-600">{fmtCurrency(rec.deductions)}</td>
                              <td className="py-2.5 px-4 whitespace-nowrap text-amber-700">{fmtCurrency(rec.tax)}</td>
                              <td className="py-2.5 px-4 whitespace-nowrap font-black text-[#1E40AF]">{fmtCurrency(rec.net_salary)}</td>
                              <td className="py-2.5 px-4 whitespace-nowrap">{statusBadge(rec.status)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* YTD total */}
                  {(payroll || []).length > 0 && (
                    <div className="bg-[#1E40AF]/5 border border-[#BFDBFE] rounded-lg p-4 flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-700 uppercase tracking-wide">Total Earned YTD</span>
                      <span className="text-lg font-black text-[#1E40AF]">
                        {fmtCurrency(
                          (payroll || []).reduce((s, r) => s + (parseFloat(r.net_salary) || 0), 0)
                        )}
                      </span>
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {/* ════════════ ONBOARDING ════════════ */}
          {!isEmployeeRole && activeTab === 'onboarding' && (
            <div className="space-y-4">
              {loadingTab && onboarding === null ? (
                <Skeleton rows={6} />
              ) : (
                <>
                  {/* Progress bar */}
                  {(() => {
                    const items   = onboarding || DEFAULT_ONBOARDING;
                    const done    = items.filter(i => i.completed).length;
                    const total   = items.length;
                    const pct     = total ? Math.round((done / total) * 100) : 0;
                    return (
                      <div className="bg-white rounded-lg border border-[#E2E8F0] p-4">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs font-bold text-slate-700">Onboarding Progress</span>
                          <span className="text-xs font-black text-[#1E40AF]">{done}/{total} complete ({pct}%)</span>
                        </div>
                        <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-[#1E40AF] rounded-full transition-all"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    );
                  })()}

                  {/* Checklist */}
                  <div className="space-y-2">
                    {(onboarding || DEFAULT_ONBOARDING).map(item => (
                      <div
                        key={item.id}
                        className="flex items-center space-x-3 p-3 bg-white rounded-lg border border-[#E2E8F0] cursor-pointer hover:bg-blue-50/30 transition-colors"
                        onClick={() => handleToggleOnboarding(employee.id, item.id)}
                      >
                        <div className={`w-5 h-5 rounded flex items-center justify-center border-2 transition-colors shrink-0 ${
                          item.completed ? 'bg-emerald-500 border-emerald-500' : 'border-slate-300'
                        }`}>
                          {item.completed && <Check className="w-3 h-3 text-white" />}
                        </div>
                        <span className={`text-xs font-semibold ${
                          item.completed ? 'text-slate-400 line-through' : 'text-slate-700'
                        }`}>
                          {item.item}
                        </span>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          )}

          {/* ════════════ COMPLIANCE & FOOD SAFETY ════════════ */}
          {!isEmployeeRole && activeTab === 'compliance' && (
            <div className="space-y-4">
              <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4 flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <ShieldAlert className="w-5 h-5 text-emerald-700 shrink-0" />
                  <div>
                    <h4 className="text-xs font-bold text-emerald-900 uppercase">ISO 22000 : 2018 &amp; HACCP Audit Ready</h4>
                    <p className="text-[11px] text-emerald-700">Occupational health screening and food handler qualification status</p>
                  </div>
                </div>
                <span className="px-2.5 py-1 bg-emerald-600 text-white rounded text-[10px] font-bold">
                  {compliance?.medical_fitness_status || 'FIT_FOR_FOOD_HANDLING'}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-white rounded-lg border border-[#E2E8F0] p-4 space-y-3">
                  <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider border-b pb-2">Medical Certifications</h4>
                  <InfoRow label="Annual Exam Date" value={compliance?.medical_checkup_date || '2026-02-15'} />
                  <InfoRow label="Certificate Expiry" value={compliance?.medical_cert_expiry || '2027-02-14'} />
                  <InfoRow label="Communicable Screening" value={compliance?.communicable_disease_screened ? '✓ Cleared (Zero Flags)' : 'Pending'} />
                  <InfoRow label="Blood Group" value={compliance?.blood_group || 'B+'} mono />
                </div>

                <div className="bg-white rounded-lg border border-[#E2E8F0] p-4 space-y-3">
                  <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider border-b pb-2">Food Safety Qualifications</h4>
                  <InfoRow label="HACCP Certified" value={compliance?.haccp_trained ? 'Level 3 Qualified' : 'Not Certified'} />
                  <InfoRow label="Emergency Contact" value={compliance?.emergency_contact_name || 'Dr. Nguyen Minh'} />
                  <InfoRow label="Emergency Phone" value={compliance?.emergency_contact_phone || '+84-909-887766'} mono />
                  <InfoRow label="Facility Access" value="Clean Room Extraction & Berths" />
                </div>
              </div>

              <div className="bg-white rounded-lg border border-[#E2E8F0] p-4 text-xs text-slate-600 space-y-1">
                <span className="font-bold text-slate-800 uppercase text-[10px] block">Auditor Verification Note:</span>
                <p>{compliance?.notes || 'Cleared for high-purity spice extraction clean rooms and cold berths with strict hygiene protocols.'}</p>
              </div>
            </div>
          )}

          {/* ════════════ EXIT & F&F SETTLEMENT ════════════ */}
          {!isEmployeeRole && activeTab === 'exit' && (
            <div className="space-y-4">
              {/* If no exit request has been submitted */}
              {!exitData ? (
                <div className="bg-white rounded-lg border border-[#E2E8F0] p-6 text-center space-y-3">
                  <div className="w-12 h-12 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center mx-auto">
                    <CheckCircle2 className="w-6 h-6" />
                  </div>
                  <h4 className="text-sm font-bold text-slate-800 uppercase tracking-wide">
                    Active Workforce Member • In Good Standing
                  </h4>
                  <p className="text-xs text-slate-500 max-w-md mx-auto">
                    No resignation or separation has been logged for {employee.full_name}. To begin the offboarding checklist, multi-department no-dues clearance, and Full &amp; Final settlement calculation, initiate a separation request below.
                  </p>
                  <div className="pt-2">
                    <button
                      type="button"
                      onClick={() => setShowInitiateExitModal(true)}
                      className="px-4 py-2 bg-[#1E40AF] hover:bg-blue-800 text-white rounded-lg text-xs font-bold uppercase tracking-wider shadow-sm transition-all inline-flex items-center space-x-1.5"
                    >
                      <LogOut className="w-4 h-4 text-amber-300" />
                      <span>+ Initiate Resignation / Exit</span>
                    </button>
                  </div>
                </div>
              ) : (
                /* Exit record exists */
                <div className="space-y-4">
                  {/* Status Banner */}
                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center space-x-3">
                      <LogOut className="w-5 h-5 text-amber-700 shrink-0" />
                      <div>
                        <div className="flex items-center space-x-2">
                          <h4 className="text-xs font-bold text-amber-900 uppercase">Resignation &amp; Full &amp; Final Settlement</h4>
                          <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${
                            exitData.status === 'SETTLED'
                              ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                              : exitData.status === 'ALL_CLEARED'
                              ? 'bg-blue-100 text-blue-800 border border-blue-300'
                              : exitData.status === 'SUBMITTED'
                              ? 'bg-purple-100 text-purple-800 border border-purple-300'
                              : 'bg-amber-100 text-amber-800 border border-amber-300'
                          }`}>
                            {exitData.status === 'SUBMITTED' ? 'SUBMITTED (AWAITING HR)' : exitData.status}
                          </span>
                        </div>
                        <p className="text-[11px] text-amber-700 mt-0.5">
                          Resigned: <strong>{exitData.resignation_date}</strong> · Last Working Day: <strong>{exitData.last_working_day}</strong> ({exitData.notice_days || 30} Days Notice)
                        </p>
                        <p className="text-[10px] text-amber-600 italic mt-0.5">
                          Reason: {exitData.reason || 'Career advancement'}
                        </p>
                      </div>
                    </div>

                    {exitData.status === 'SUBMITTED' && (
                      <button
                        type="button"
                        onClick={async () => {
                          try {
                            await api.updateExitStatus(exitData.id, { status: 'NOTICE_PERIOD' });
                            setExitData(prev => ({ ...prev, status: 'NOTICE_PERIOD' }));
                            window.dispatchEvent(new CustomEvent('soilex-exit-updated', { detail: { id: exitData.id, status: 'NOTICE_PERIOD' } }));
                            notify('success', `Resignation accepted for ${employee.full_name}. Notice period initiated.`);
                          } catch {
                            notify('error', 'Failed to update exit status.');
                          }
                        }}
                        className="px-3.5 py-1.5 bg-[#1E40AF] hover:bg-blue-800 text-white rounded-md text-xs font-bold uppercase tracking-wider shadow-sm transition-all flex items-center space-x-1.5 shrink-0 self-start sm:self-auto"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Accept Resignation</span>
                      </button>
                    )}
                  </div>

                  {/* Multi-Department No-Dues Clearance Checklist */}
                  <div className="bg-white rounded-lg border border-[#E2E8F0] p-4 space-y-3">
                    <div className="flex items-center justify-between border-b pb-2">
                      <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                        1. Multi-Department No-Dues Clearances
                      </h4>
                      <span className="text-[10px] font-bold text-slate-400">
                        Click cards to toggle clearance
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      {/* IT Clearance */}
                      <div
                        onClick={() => handleToggleClearance('it_clearance')}
                        className={`p-3 rounded-lg border transition-all cursor-pointer select-none ${
                          (exitData.it_clearance ?? exitData.clearance_it)
                            ? 'bg-emerald-50/50 border-emerald-200 hover:bg-emerald-100/40'
                            : 'bg-slate-50 border-slate-200 hover:bg-amber-50/50'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-xs font-bold text-slate-800">IT Infrastructure</p>
                            <p className="text-[10px] text-slate-500">LDAP, 2FA, Laptop</p>
                          </div>
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            (exitData.it_clearance ?? exitData.clearance_it) ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                          }`}>
                            {(exitData.it_clearance ?? exitData.clearance_it) ? '✓ CLEARED' : 'PENDING'}
                          </span>
                        </div>
                        <p className="text-[9px] text-slate-400 mt-1">
                          {(exitData.it_clearance ?? exitData.clearance_it) ? 'Company laptop returned; LDAP revoked' : 'Click to approve IT clearance'}
                        </p>
                      </div>

                      {/* Finance Clearance */}
                      <div
                        onClick={() => handleToggleClearance('finance_clearance')}
                        className={`p-3 rounded-lg border transition-all cursor-pointer select-none ${
                          (exitData.finance_clearance ?? exitData.clearance_finance)
                            ? 'bg-emerald-50/50 border-emerald-200 hover:bg-emerald-100/40'
                            : 'bg-slate-50 border-slate-200 hover:bg-amber-50/50'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-xs font-bold text-slate-800">Finance &amp; Accounts</p>
                            <p className="text-[10px] text-slate-500">Advances &amp; Card</p>
                          </div>
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            (exitData.finance_clearance ?? exitData.clearance_finance) ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                          }`}>
                            {(exitData.finance_clearance ?? exitData.clearance_finance) ? '✓ CLEARED' : 'PENDING'}
                          </span>
                        </div>
                        <p className="text-[9px] text-slate-400 mt-1">
                          {(exitData.finance_clearance ?? exitData.clearance_finance) ? 'Corporate cards cancelled; advances settled' : 'Click to approve Finance clearance'}
                        </p>
                      </div>

                      {/* Admin Clearance */}
                      <div
                        onClick={() => handleToggleClearance('admin_clearance')}
                        className={`p-3 rounded-lg border transition-all cursor-pointer select-none ${
                          (exitData.admin_clearance ?? exitData.clearance_admin)
                            ? 'bg-emerald-50/50 border-emerald-200 hover:bg-emerald-100/40'
                            : 'bg-slate-50 border-slate-200 hover:bg-amber-50/50'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-xs font-bold text-slate-800">Plant &amp; Facility</p>
                            <p className="text-[10px] text-slate-500">Badge &amp; Locker</p>
                          </div>
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            (exitData.admin_clearance ?? exitData.clearance_admin) ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                          }`}>
                            {(exitData.admin_clearance ?? exitData.clearance_admin) ? '✓ CLEARED' : 'PENDING'}
                          </span>
                        </div>
                        <p className="text-[9px] text-slate-400 mt-1">
                          {(exitData.admin_clearance ?? exitData.clearance_admin) ? 'Berth badge surrendered; locker cleared' : 'Click to approve Admin clearance'}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* F&F Calculator Breakdown */}
                  {(() => {
                    const monthlyBasic = employee.basic_pay || (employee.salary ? employee.salary * 0.75 : 2400);
                    const dailyRate = Math.round(monthlyBasic / 30);
                    const unpaidDays = exitData.unpaid_salary_days || 15;
                    const leaveDays = exitData.leave_encashment_days || 6;
                    const unpaidAmount = unpaidDays * dailyRate;
                    const leaveAmount = leaveDays * dailyRate;
                    const netTotal = exitData.settlement_amount > 0 ? exitData.settlement_amount : (unpaidAmount + leaveAmount);

                    return (
                      <div className="bg-white rounded-lg border border-[#E2E8F0] p-4 space-y-3">
                        <div className="flex items-center justify-between border-b pb-2">
                          <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                            2. Full &amp; Final Settlement Breakdown (F&amp;F)
                          </h4>
                          <span className="text-[10px] font-mono font-bold text-[#1E40AF]">
                            Daily Rate: ${dailyRate}/day (${monthlyBasic.toLocaleString()}/mo basic)
                          </span>
                        </div>

                        <div className="space-y-2 text-xs">
                          <div className="flex justify-between items-center text-slate-600 bg-slate-50 p-2 rounded">
                            <div>
                              <span className="font-semibold text-slate-800 block">Unpaid Salary ({unpaidDays} Working Days)</span>
                              <span className="text-[10px] text-slate-400">Pro-rated for final month service</span>
                            </div>
                            <span className="font-bold text-slate-900">+${unpaidAmount.toLocaleString()} USD</span>
                          </div>

                          <div className="flex justify-between items-center text-slate-600 bg-slate-50 p-2 rounded">
                            <div>
                              <span className="font-semibold text-slate-800 block">Leave Encashment ({leaveDays} Unused Days)</span>
                              <span className="text-[10px] text-slate-400">Encashment of accumulated annual earned leave</span>
                            </div>
                            <span className="font-bold text-slate-900">+${leaveAmount.toLocaleString()} USD</span>
                          </div>

                          <div className="flex justify-between items-center text-slate-600 bg-slate-50 p-2 rounded">
                            <div>
                              <span className="font-semibold text-slate-800 block">Notice Shortfall &amp; Asset Recovery</span>
                              <span className="text-[10px] text-slate-400">Zero notice shortfall penalty (Served full notice)</span>
                            </div>
                            <span className="font-bold text-emerald-600">$0.00 USD</span>
                          </div>

                          <div className="flex justify-between items-center font-bold text-sm text-slate-900 border-t pt-2 bg-blue-50/70 p-3 rounded">
                            <div>
                              <span className="text-[#1E40AF] block font-black">Net Full &amp; Final Payable</span>
                              <span className="text-[10px] text-slate-500 font-normal">Approved for bank wire disbursement</span>
                            </div>
                            <span className="text-[#1E40AF] font-black text-base">${netTotal.toLocaleString()} USD</span>
                          </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                          <button
                            type="button"
                            onClick={() => setShowFnFSlipModal(true)}
                            className="px-3 py-1.5 border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-md text-xs font-bold flex items-center space-x-1.5 transition-all"
                          >
                            <Printer className="w-3.5 h-3.5 text-slate-500" />
                            <span>Print F&amp;F Statement</span>
                          </button>

                          {exitData.status !== 'SETTLED' ? (
                            <button
                              type="button"
                              onClick={handleDisburseExit}
                              className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-md text-xs font-bold uppercase tracking-wider shadow-sm flex items-center space-x-1.5 transition-all"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>Disburse &amp; Settle F&amp;F</span>
                            </button>
                          ) : (
                            <span className="text-xs font-bold text-emerald-700 flex items-center space-x-1 bg-emerald-50 px-3 py-1.5 rounded border border-emerald-200">
                              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                              <span>Settlement Disbursed &amp; Archived</span>
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })()}
                </div>
              )}
            </div>
          )}

          {/* ════════════ EMPLOYMENT HISTORY ════════════ */}
          {!isEmployeeRole && activeTab === 'history' && (
            <div className="space-y-4">
              {loadingTab && empHistory === null ? (
                <Skeleton rows={4} />
              ) : (
                <div className="bg-white rounded-lg border border-[#E2E8F0] p-5">
                  <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-4">Job Timeline</h3>
                  <div className="space-y-0">
                    {/* Current position */}
                    <div className="flex space-x-3">
                      <div className="flex flex-col items-center">
                        <div className="w-3 h-3 rounded-full bg-[#1E40AF] border-2 border-blue-300 shrink-0" />
                        <div className={`w-0.5 ${(empHistory || []).length > 0 ? 'flex-1 min-h-[32px]' : ''} bg-slate-200`} />
                      </div>
                      <div className="pb-5">
                        <p className="text-xs font-bold text-slate-900">{employee.designation}</p>
                        <p className="text-[11px] text-slate-500">{employee.department} · {employee.branch}</p>
                        <p className="text-[11px] text-slate-400">Since {employee.join_date || '—'}</p>
                        <span className="mt-1 inline-block text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200 px-2 py-0.5 rounded-full">Current</span>
                      </div>
                    </div>

                    {/* History entries */}
                    {(empHistory || []).map((h, i) => (
                      <div key={h.id || i} className="flex space-x-3">
                        <div className="flex flex-col items-center">
                          <div className="w-3 h-3 rounded-full bg-amber-400 border-2 border-amber-200 shrink-0" />
                          <div className={`w-0.5 ${i < (empHistory || []).length - 1 ? 'flex-1 min-h-[32px]' : ''} bg-slate-200`} />
                        </div>
                        <div className="pb-5">
                          <p className="text-xs font-bold text-slate-700">
                            {(h.event_type || '').replace(/_/g, ' ')}
                          </p>
                          <p className="text-[11px] text-slate-500">
                            {h.from_designation} → {h.to_designation}
                          </p>
                          <p className="text-[11px] text-slate-400">
                            {h.effective_date} · {h.remarks || ''}
                          </p>
                        </div>
                      </div>
                    ))}

                    {(empHistory || []).length === 0 && (
                      <p className="text-xs text-slate-400 text-center py-6">No job changes recorded yet.</p>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

        </div>
      </div>

      {showDocModal && (
        <DocumentGeneratorModal
          employee={employee}
          onClose={() => setShowDocModal(false)}
        />
      )}

      {/* ──────────────────── MODAL: INITIATE SEPARATION / EXIT ──────────────────── */}
      {showInitiateExitModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-[110] flex items-center justify-center p-4">
          <div className="bg-white rounded-xl border border-[#E2E8F0] shadow-2xl max-w-lg w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <div className="flex items-center space-x-2">
                <LogOut className="w-5 h-5 text-amber-600" />
                <h3 className="text-sm font-bold text-slate-900 uppercase">
                  INITIATE SEPARATION &amp; F&amp;F SETTLEMENT
                </h3>
              </div>
              <button
                onClick={() => setShowInitiateExitModal(false)}
                className="text-slate-400 hover:text-slate-600 font-bold text-lg"
              >
                ×
              </button>
            </div>

            <form onSubmit={handleInitiateExit} className="space-y-4">
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase block">EMPLOYEE</span>
                <span className="text-xs font-bold text-slate-800">
                  {employee.full_name} ({employee.employee_code || employee.id}) · {employee.designation}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Resignation Date</label>
                  <input
                    type="date"
                    required
                    value={initiateExitForm.resignation_date}
                    onChange={(e) => setInitiateExitForm(f => ({ ...f, resignation_date: e.target.value }))}
                    className="w-full bg-white border border-[#E2E8F0] rounded-md px-3 py-2 text-xs font-bold text-slate-800 focus:outline-none focus:border-[#1E40AF]"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Notice Days</label>
                  <input
                    type="number"
                    min="0"
                    max="90"
                    value={initiateExitForm.notice_days}
                    onChange={(e) => {
                      const days = parseInt(e.target.value) || 0;
                      const resDate = new Date(initiateExitForm.resignation_date || Date.now());
                      const lwd = new Date(resDate.getTime() + days * 86400000).toISOString().slice(0, 10);
                      setInitiateExitForm(f => ({ ...f, notice_days: days, last_working_day: lwd }));
                    }}
                    className="w-full bg-white border border-[#E2E8F0] rounded-md px-3 py-2 text-xs font-bold text-slate-800 focus:outline-none focus:border-[#1E40AF]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Last Working Day (LWD)</label>
                  <input
                    type="date"
                    required
                    value={initiateExitForm.last_working_day}
                    onChange={(e) => setInitiateExitForm(f => ({ ...f, last_working_day: e.target.value }))}
                    className="w-full bg-white border border-[#E2E8F0] rounded-md px-3 py-2 text-xs font-bold text-[#1E40AF] focus:outline-none focus:border-[#1E40AF]"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Reason for Separation</label>
                  <select
                    value={initiateExitForm.reason}
                    onChange={(e) => setInitiateExitForm(f => ({ ...f, reason: e.target.value }))}
                    className="w-full bg-white border border-[#E2E8F0] rounded-md px-3 py-2 text-xs font-semibold text-slate-800 focus:outline-none focus:border-[#1E40AF]"
                  >
                    <option value="Voluntary Resignation for Career Advancement">Voluntary Resignation (Career)</option>
                    <option value="Relocation to Another Region / Country">Relocation / Family Move</option>
                    <option value="Higher Education / Fellowship">Higher Education</option>
                    <option value="Health / Personal Reasons">Personal / Health</option>
                    <option value="Retirement on Superannuation">Retirement</option>
                    <option value="Mutual Separation Agreement">Mutual Separation</option>
                    <option value="Involuntary Termination / Role Redundancy">Involuntary / Redundancy</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 bg-slate-50 p-3 rounded-lg border border-slate-200">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Unpaid Days in Final Month</label>
                  <input
                    type="number"
                    min="0"
                    max="31"
                    value={initiateExitForm.unpaid_salary_days}
                    onChange={(e) => setInitiateExitForm(f => ({ ...f, unpaid_salary_days: e.target.value }))}
                    className="w-full bg-white border border-[#E2E8F0] rounded-md px-3 py-2 text-xs font-bold text-slate-800 focus:outline-none focus:border-[#1E40AF]"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Leave Encashment Days</label>
                  <input
                    type="number"
                    min="0"
                    max="60"
                    value={initiateExitForm.leave_encashment_days}
                    onChange={(e) => setInitiateExitForm(f => ({ ...f, leave_encashment_days: e.target.value }))}
                    className="w-full bg-white border border-[#E2E8F0] rounded-md px-3 py-2 text-xs font-bold text-slate-800 focus:outline-none focus:border-[#1E40AF]"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowInitiateExitModal(false)}
                  className="px-4 py-2 border border-[#E2E8F0] rounded-md text-xs font-semibold text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#1E40AF] hover:bg-blue-800 text-white rounded-md text-xs font-bold uppercase tracking-wider shadow-sm transition-all"
                >
                  Initiate Separation
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ──────────────────── MODAL: OFFICIAL F&F SETTLEMENT STATEMENT ──────────────────── */}
      {showFnFSlipModal && exitData && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-[110] flex items-center justify-center p-4">
          <div className="bg-white rounded-xl border border-[#E2E8F0] shadow-2xl max-w-xl w-full p-6 space-y-4 max-h-[95vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b pb-3">
              <div className="flex items-center space-x-2">
                <Printer className="w-5 h-5 text-[#1E40AF]" />
                <h3 className="text-sm font-bold text-slate-900 uppercase">FULL &amp; FINAL SETTLEMENT VOUCHER</h3>
              </div>
              <button
                onClick={() => setShowFnFSlipModal(false)}
                className="text-slate-400 hover:text-slate-600 font-bold text-lg"
              >
                ×
              </button>
            </div>

            {/* Printable Statement Sheet */}
            <div className="border border-slate-200 rounded-lg p-5 space-y-4 bg-slate-50/40 text-xs">
              {/* Header */}
              <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                <div>
                  <h2 className="text-base font-black text-[#1E40AF] tracking-tight">SOILEX LIFE SCIENCE LTD</h2>
                  <p className="text-[10px] text-slate-500 font-semibold uppercase">Global Spice Bio-Hubs &amp; Industrial Logistics</p>
                  <p className="text-[10px] text-slate-400">Tax Reg: SLX-VN-99201 | Statutory Labor Clearance</p>
                </div>
                <div className="text-right">
                  <span className="text-[10px] font-bold text-slate-400 uppercase block">SETTLEMENT REF</span>
                  <span className="text-xs font-black text-slate-800 font-mono">{exitData.id || 'EXT-001'}</span>
                  <span className="inline-block mt-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-emerald-100 text-emerald-800">
                    {exitData.status}
                  </span>
                </div>
              </div>

              {/* Staff Details */}
              <div className="grid grid-cols-2 gap-3 bg-white p-3 rounded border border-slate-100">
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase block">EMPLOYEE NAME</span>
                  <span className="font-bold text-slate-900">{employee.full_name}</span>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase block">EMP CODE &amp; DEPT</span>
                  <span className="font-mono font-bold text-[#1E40AF]">{employee.employee_code || employee.id}</span>
                  <span className="text-slate-500 text-[10px] block">{employee.department}</span>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase block">RESIGNATION DATE</span>
                  <span className="font-semibold text-slate-700">{exitData.resignation_date}</span>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase block">LAST WORKING DAY (LWD)</span>
                  <span className="font-semibold text-slate-700">{exitData.last_working_day}</span>
                </div>
              </div>

              {/* Clearance Summary */}
              <div className="p-2.5 bg-blue-50/60 rounded border border-blue-100 text-[11px] space-y-1">
                <span className="font-bold text-[#1E40AF] uppercase block text-[10px]">No-Dues Departmental Sign-Off:</span>
                <div className="grid grid-cols-3 gap-2 text-center text-[10px]">
                  <span className="bg-white p-1 rounded border border-blue-200 font-bold text-emerald-700">IT: CLEARED ✓</span>
                  <span className="bg-white p-1 rounded border border-blue-200 font-bold text-emerald-700">FINANCE: CLEARED ✓</span>
                  <span className="bg-white p-1 rounded border border-blue-200 font-bold text-emerald-700">ADMIN: CLEARED ✓</span>
                </div>
              </div>

              {/* Earnings & Deductions Breakdown */}
              {(() => {
                const monthlyBasic = employee.basic_pay || 2400;
                const dailyRate = Math.round(monthlyBasic / 30);
                const unpaidDays = exitData.unpaid_salary_days || 15;
                const leaveDays = exitData.leave_encashment_days || 6;
                const unpaidAmount = unpaidDays * dailyRate;
                const leaveAmount = leaveDays * dailyRate;
                const netAmount = exitData.settlement_amount > 0 ? exitData.settlement_amount : (unpaidAmount + leaveAmount);

                return (
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-white p-3 rounded border border-slate-100 space-y-2">
                      <h4 className="font-bold text-slate-700 uppercase text-[10px] tracking-wider border-b pb-1">
                        EARNINGS &amp; PAYOUTS
                      </h4>
                      <div className="flex justify-between text-slate-600">
                        <span>Unpaid Salary ({unpaidDays} days):</span>
                        <span className="font-semibold">${unpaidAmount.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between text-slate-600">
                        <span>Leave Encashment ({leaveDays} days):</span>
                        <span className="font-semibold">${leaveAmount.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between font-bold text-slate-900 border-t pt-1">
                        <span>Gross Payout:</span>
                        <span className="text-[#1E40AF]">${(unpaidAmount + leaveAmount).toLocaleString()}</span>
                      </div>
                    </div>

                    <div className="bg-white p-3 rounded border border-slate-100 space-y-2">
                      <h4 className="font-bold text-slate-700 uppercase text-[10px] tracking-wider border-b pb-1">
                        RECOVERIES &amp; DEDUCTIONS
                      </h4>
                      <div className="flex justify-between text-slate-600">
                        <span>Notice Shortfall:</span>
                        <span className="font-semibold">$0.00</span>
                      </div>
                      <div className="flex justify-between text-slate-600">
                        <span>Asset / Advance Dues:</span>
                        <span className="font-semibold">$0.00</span>
                      </div>
                      <div className="flex justify-between font-bold text-slate-900 border-t pt-1">
                        <span>Total Deductions:</span>
                        <span className="text-emerald-700">$0.00</span>
                      </div>
                    </div>
                  </div>
                );
              })()}

              {/* Net Disbursement */}
              <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3 flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-bold text-emerald-800 uppercase block">NET F&amp;F SETTLEMENT AMOUNT</span>
                  <span className="text-[10px] text-emerald-600 font-medium">To be wired to employee primary bank ledger</span>
                </div>
                <div className="text-xl font-black text-emerald-700">
                  ${(exitData.settlement_amount || 2850).toLocaleString()} USD
                </div>
              </div>

              {/* Signatures Block */}
              <div className="grid grid-cols-3 gap-4 pt-4 border-t border-slate-200 text-center text-[10px] text-slate-500">
                <div>
                  <div className="border-b border-slate-300 h-8 mb-1" />
                  <span>Employee Acceptance</span>
                </div>
                <div>
                  <div className="border-b border-slate-300 h-8 mb-1" />
                  <span>Head of HR</span>
                </div>
                <div>
                  <div className="border-b border-slate-300 h-8 mb-1" />
                  <span>CFO / Finance Controller</span>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between pt-2">
              <button
                type="button"
                onClick={() => window.print()}
                className="px-4 py-2 bg-[#1E40AF] text-white rounded-md text-xs font-bold uppercase tracking-wider flex items-center space-x-1.5 hover:bg-blue-800 shadow-sm"
              >
                <Printer className="w-4 h-4" />
                <span>Print Document</span>
              </button>
              <button
                type="button"
                onClick={() => setShowFnFSlipModal(false)}
                className="px-4 py-2 border border-[#E2E8F0] text-slate-600 rounded-md text-xs font-semibold hover:bg-slate-50"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Small reusable sub-components ─────────────────────────────────────────
function InfoRow({ label, value, mono }) {
  return (
    <div className="flex justify-between items-start gap-2">
      <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wide shrink-0">{label}</span>
      <span className={`text-xs font-semibold text-slate-800 text-right ${mono ? 'font-mono text-[#D97706]' : ''}`}>
        {value}
      </span>
    </div>
  );
}

function StatCard({ label, value, color = 'blue' }) {
  const colorMap = {
    blue:   'bg-blue-50 border-blue-100 text-[#1E40AF]',
    emerald:'bg-emerald-50 border-emerald-100 text-emerald-700',
    amber:  'bg-amber-50 border-amber-100 text-amber-700',
    red:    'bg-red-50 border-red-100 text-red-600',
    purple: 'bg-purple-50 border-purple-100 text-purple-700',
  };
  return (
    <div className={`rounded-lg border p-3 text-center ${colorMap[color]}`}>
      <p className="text-lg font-black">{value}</p>
      <p className="text-[10px] font-bold uppercase tracking-wide opacity-70 mt-0.5">{label}</p>
    </div>
  );
}

// ─── Mock fallback data ─────────────────────────────────────────────────────
const MOCK_ATTENDANCE = [
  { date: '2026-10-21', clock_in: '08:55', clock_out: '18:02', hours_worked: '9.1', status: 'PRESENT',  source: 'WEB'     },
  { date: '2026-10-20', clock_in: '09:12', clock_out: '18:15', hours_worked: '9.0', status: 'LATE',     source: 'MOBILE'  },
  { date: '2026-10-19', clock_in: null,    clock_out: null,    hours_worked: null,  status: 'ABSENT',   source: '—'       },
  { date: '2026-10-18', clock_in: '08:50', clock_out: '18:00', hours_worked: '9.2', status: 'PRESENT',  source: 'WEB'     },
  { date: '2026-10-17', clock_in: '08:45', clock_out: '17:58', hours_worked: '9.2', status: 'PRESENT',  source: 'BIOMETRIC'},
];

const MOCK_LEAVES = [
  { leave_type: 'Annual Leave', from_date: '2026-09-01', to_date: '2026-09-03', days: 3, reason: 'Family vacation',   status: 'APPROVED' },
  { leave_type: 'Sick Leave',   from_date: '2026-08-14', to_date: '2026-08-14', days: 1, reason: 'Medical appointment', status: 'APPROVED' },
];

const MOCK_PAYROLL = [
  { month_year: 'Oct 2026', basic_pay: 18000, allowances: 3500, deductions: 900,  tax: 1200, net_salary: 19400, status: 'PENDING' },
  { month_year: 'Sep 2026', basic_pay: 18000, allowances: 3500, deductions: 900,  tax: 1200, net_salary: 19400, status: 'PAID'    },
  { month_year: 'Aug 2026', basic_pay: 18000, allowances: 3500, deductions: 1200, tax: 1200, net_salary: 19100, status: 'PAID'    },
];

const MOCK_COMPLIANCE = {
  medical_fitness_status: 'FIT_FOR_FOOD_HANDLING',
  medical_checkup_date: '2026-02-15',
  medical_cert_expiry: '2027-02-14',
  communicable_disease_screened: true,
  haccp_trained: true,
  blood_group: 'B+',
  emergency_contact_name: 'Dr. Nguyen Minh (Spouse)',
  emergency_contact_phone: '+84-909-887766',
  notes: 'Cleared for high-purity spice extraction clean rooms and cold berths.'
};

const MOCK_EXIT = {
  resignation_date: '2026-09-01',
  notice_period_days: 30,
  last_working_date: '2026-10-01',
  status: 'UNDER_CLEARANCE',
  clearance_it: true,
  clearance_finance: true,
  clearance_admin: false,
  leave_encashment_days: 14,
  leave_encashment_amount: 1540.0,
  unpaid_salary_amount: 2200.0,
  notice_shortfall_recovery: 0.0,
  net_fnf_settlement: 3740.0
};
