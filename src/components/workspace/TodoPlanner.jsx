import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  CheckSquare,
  Sun,
  Plus,
  Clock,
  AlertCircle,
  CheckCircle2,
  Trash2,
  X,
  User,
  Users,
  Filter,
  Calendar,
  Sparkles,
  Briefcase,
  Building2,
  ChevronDown,
  MapPin,
  ArrowRight,
  Tag,
  ListTodo
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';

// ─── Constants & Categories ──────────────────────────────────────────────────
const CATEGORIES = ['ALL', 'Operations', 'Compliance', 'HR & Payroll', 'Maintenance', 'Finance'];
const PRIORITY_OPTIONS = ['URGENT', 'HIGH', 'MEDIUM', 'LOW'];
const CATEGORY_OPTIONS = ['Operations', 'Compliance', 'HR & Payroll', 'Maintenance', 'Finance'];
const TIME_SLOT_OPTIONS = [
  'Morning Focus (08:30 - 12:00)',
  'Afternoon Operations (12:00 - 15:30)',
  'Wrap-up & Audits (15:30 - 18:00)',
];

// ─── Fallback Employees Directory ─────────────────────────────────────────────
const FALLBACK_EMPLOYEES = [
  { id: 'EMP-001', employee_code: 'SLX-E01', full_name: 'Vũ Thị Hoan', email: 'hoan.vu@soilexlifescience.com', phone: '+84-908-112233', department: 'Sales & Export', designation: 'Senior Sales Executive', branch: 'Hanoi HQ' },
  { id: 'EMP-002', employee_code: 'SLX-E02', full_name: 'Rajesh Sharma', email: 'rajesh.s@soilexlifescience.com', phone: '+91-98401-22334', department: 'Quality Assurance', designation: 'QA Lab Director', branch: 'Kochi Terminal' },
  { id: 'EMP-003', employee_code: 'SLX-E03', full_name: 'Nguyễn Văn Hùng', email: 'hung.nguyen@soilexlifescience.com', phone: '+84-912-445566', department: 'Operations & Supply', designation: 'Logistics Supervisor', branch: 'Hai Phong Hub' },
  { id: 'EMP-004', employee_code: 'SLX-E04', full_name: 'Priya Nair', email: 'priya.n@soilexlifescience.com', phone: '+91-98765-43210', department: 'Human Resources', designation: 'HR Operations Lead', branch: 'Kochi Terminal' },
  { id: 'EMP-005', employee_code: 'SLX-E05', full_name: 'Trần Quốc Bảo', email: 'bao.tran@soilexlifescience.com', phone: '+84-983-998877', department: 'Finance & Accounts', designation: 'Senior Trade Accountant', branch: 'Hanoi HQ' },
];

// ─── Unique Daily Tasks per Employee ──────────────────────────────────────────
const UNIQUE_TASKS_BY_EMPLOYEE = {
  'EMP-001': [
    { id: 'TSK-EXP-01', title: 'Review Bill of Lading & Phytosanitary for Dubai Container MSCU-884102', category: 'Operations', priority: 'HIGH', due_date: '2026-10-23', assigned_to: 'Vũ Thị Hoan', completed: false, time_slot: 'Morning Focus (08:30 - 12:00)', notes: 'Verify gross weights match container manifest' },
    { id: 'TSK-EXP-02', title: 'Draft CIF Rotterdam Price Quotation for Black Pepper 550 G/L', category: 'Operations', priority: 'HIGH', due_date: '2026-10-23', assigned_to: 'Vũ Thị Hoan', completed: false, time_slot: 'Morning Focus (08:30 - 12:00)', notes: 'Inquiry from Naturex GmbH for 18.5 MT batch' },
    { id: 'TSK-EXP-03', title: 'Finalize Letter of Credit (LC 90 Days) with Al Rawdah Trading LLC', category: 'Finance', priority: 'URGENT', due_date: '2026-10-24', assigned_to: 'Vũ Thị Hoan', completed: false, time_slot: 'Afternoon Operations (12:00 - 15:30)', notes: 'Export contract SLX-EXP-2026-001' },
    { id: 'TSK-EXP-04', title: 'Verify customs HS code 090411 for EU Spice Consignment', category: 'Compliance', priority: 'MEDIUM', due_date: '2026-10-25', assigned_to: 'Vũ Thị Hoan', completed: true, time_slot: 'Wrap-up & Audits (15:30 - 18:00)', notes: 'Phytosanitary inspection cleared' },
    { id: 'TSK-EXP-05', title: 'Weekly sales pipeline review with Regional Dubai Commercial Desk', category: 'Operations', priority: 'LOW', due_date: '2026-10-26', assigned_to: 'Vũ Thị Hoan', completed: false, time_slot: 'Afternoon Operations (12:00 - 15:30)', notes: 'Q4 volume allocation targets' },
  ],
  'EMP-002': [
    { id: 'TSK-QA-01', title: 'Calibrate Moisture Meters & Bulk Density Testers at Kochi Spices Lab', category: 'Maintenance', priority: 'HIGH', due_date: '2026-10-23', assigned_to: 'Rajesh Sharma', completed: false, time_slot: 'Morning Focus (08:30 - 12:00)', notes: 'Quarterly calibration routine per ISO 17025' },
    { id: 'TSK-QA-02', title: 'Inspect FSSAI & ASTA chemical laboratory samples for Cardamom Lot 88', category: 'Compliance', priority: 'URGENT', due_date: '2026-10-23', assigned_to: 'Rajesh Sharma', completed: false, time_slot: 'Morning Focus (08:30 - 12:00)', notes: 'Test volatile oil content and moisture below 11.5%' },
    { id: 'TSK-QA-03', title: 'Review aflatoxin & pesticide residue chromatography for Kerala harvest', category: 'Compliance', priority: 'HIGH', due_date: '2026-10-24', assigned_to: 'Rajesh Sharma', completed: false, time_slot: 'Afternoon Operations (12:00 - 15:30)', notes: 'Export batch release verification for EU dispatch' },
    { id: 'TSK-QA-04', title: 'Verify ISO 22000 cleanroom sanitization logs for spice extraction hall', category: 'Compliance', priority: 'MEDIUM', due_date: '2026-10-24', assigned_to: 'Rajesh Sharma', completed: true, time_slot: 'Wrap-up & Audits (15:30 - 18:00)', notes: 'Microbial swab testing negative' },
    { id: 'TSK-QA-05', title: 'Conduct quarterly internal QA audit for Kochi processing terminal', category: 'Operations', priority: 'LOW', due_date: '2026-10-27', assigned_to: 'Rajesh Sharma', completed: false, time_slot: 'Wrap-up & Audits (15:30 - 18:00)', notes: 'Audit preparation for external surveillance' },
  ],
  'EMP-003': [
    { id: 'TSK-OPS-01', title: 'Submit Vietnam Perfumed Rice Phytosanitary Certificate to Customs', category: 'Compliance', priority: 'URGENT', due_date: '2026-10-23', assigned_to: 'Nguyễn Văn Hùng', completed: false, time_slot: 'Morning Focus (08:30 - 12:00)', notes: 'Hai Phong Customs Berth 3 release clearance' },
    { id: 'TSK-OPS-02', title: 'Port berth container dispatch for Maersk Line shipment SLX-SH-2026-002', category: 'Operations', priority: 'HIGH', due_date: '2026-10-23', assigned_to: 'Nguyễn Văn Hùng', completed: false, time_slot: 'Morning Focus (08:30 - 12:00)', notes: 'Ensure 4 reefer containers loaded before cutoff' },
    { id: 'TSK-OPS-03', title: 'Inspect cold-storage reefer container temperatures (below 18°C)', category: 'Operations', priority: 'HIGH', due_date: '2026-10-24', assigned_to: 'Nguyễn Văn Hùng', completed: false, time_slot: 'Afternoon Operations (12:00 - 15:30)', notes: 'Container MEDU-556219-7 sensor logs' },
    { id: 'TSK-OPS-04', title: 'Forklift safety & pallet strapping check at Hai Phong Port Logistics Depot', category: 'Maintenance', priority: 'MEDIUM', due_date: '2026-10-24', assigned_to: 'Nguyễn Văn Hùng', completed: true, time_slot: 'Wrap-up & Audits (15:30 - 18:00)', notes: 'Weekly fleet inspection completed' },
    { id: 'TSK-OPS-05', title: 'Reconcile container tare weight vs manifest for Rice DDGS consignment', category: 'Operations', priority: 'LOW', due_date: '2026-10-25', assigned_to: 'Nguyễn Văn Hùng', completed: false, time_slot: 'Afternoon Operations (12:00 - 15:30)', notes: 'Check net 26,000 kg per container' },
  ],
  'EMP-004': [
    { id: 'TSK-HR-01', title: 'Run Monthly Employee Statutory Deductions, PF & Tax Slips', category: 'HR & Payroll', priority: 'URGENT', due_date: '2026-10-23', assigned_to: 'Priya Nair', completed: true, time_slot: 'Morning Focus (08:30 - 12:00)', notes: 'October salary reconciliation finalized' },
    { id: 'TSK-HR-02', title: 'Screen shortlist candidate applications for Senior Export Sales Manager JD', category: 'HR & Payroll', priority: 'HIGH', due_date: '2026-10-23', assigned_to: 'Priya Nair', completed: false, time_slot: 'Morning Focus (08:30 - 12:00)', notes: 'Review candidate profiles with HR Director' },
    { id: 'TSK-HR-03', title: 'Review pending biometric clock-in regularizations and leave requests', category: 'HR & Payroll', priority: 'HIGH', due_date: '2026-10-24', assigned_to: 'Priya Nair', completed: false, time_slot: 'Afternoon Operations (12:00 - 15:30)', notes: 'Process supervisor sign-offs for missed punches' },
    { id: 'TSK-HR-04', title: 'Conduct new employee onboarding orientation & food hygiene induction', category: 'HR & Payroll', priority: 'MEDIUM', due_date: '2026-10-24', assigned_to: 'Priya Nair', completed: false, time_slot: 'Afternoon Operations (12:00 - 15:30)', notes: 'Schedule GMP cleanroom walkthrough' },
    { id: 'TSK-HR-05', title: 'Process employee separation clearance checklist with IT and Accounts', category: 'HR & Payroll', priority: 'LOW', due_date: '2026-10-26', assigned_to: 'Priya Nair', completed: false, time_slot: 'Wrap-up & Audits (15:30 - 18:00)', notes: 'Check no-dues signoff progress' },
  ],
  'EMP-005': [
    { id: 'TSK-FIN-01', title: 'Reconcile SWIFT wire remittance for export contract SLX-EXP-2026-001', category: 'Finance', priority: 'URGENT', due_date: '2026-10-23', assigned_to: 'Trần Quốc Bảo', completed: false, time_slot: 'Morning Focus (08:30 - 12:00)', notes: '$198,000 USD payment receipt confirmation' },
    { id: 'TSK-FIN-02', title: 'Review supplier payment vouchers for Mekong Delta Agro Farms', category: 'Finance', priority: 'HIGH', due_date: '2026-10-23', assigned_to: 'Trần Quốc Bảo', completed: false, time_slot: 'Morning Focus (08:30 - 12:00)', notes: 'TT 15 Days procurement milestone' },
    { id: 'TSK-FIN-03', title: 'Verify corporate credit card statements and petty cash log', category: 'Finance', priority: 'MEDIUM', due_date: '2026-10-24', assigned_to: 'Trần Quốc Bảo', completed: true, time_slot: 'Wrap-up & Audits (15:30 - 18:00)', notes: 'Monthly operational reconciliations' },
    { id: 'TSK-FIN-04', title: 'Audit monthly statutory tax withholding schedule with Tax Dept', category: 'Compliance', priority: 'HIGH', due_date: '2026-10-25', assigned_to: 'Trần Quốc Bảo', completed: false, time_slot: 'Afternoon Operations (12:00 - 15:30)', notes: 'Hanoi HQ corporate tax filing' },
    { id: 'TSK-FIN-05', title: 'Quarterly financial budget variance analysis for Hanoi Corporate HQ', category: 'Finance', priority: 'LOW', due_date: '2026-10-26', assigned_to: 'Trần Quốc Bảo', completed: false, time_slot: 'Wrap-up & Audits (15:30 - 18:00)', notes: 'Consolidated export margins breakdown' },
  ],
};

function getDefaultTasksForEmployee(emp) {
  if (!emp) return [];
  if (UNIQUE_TASKS_BY_EMPLOYEE[emp.id]) return UNIQUE_TASKS_BY_EMPLOYEE[emp.id];
  return [
    { id: `TSK-${emp.id}-1`, title: `Daily operational workflow sync for ${emp.department}`, category: 'Operations', priority: 'HIGH', due_date: new Date().toISOString().split('T')[0], assigned_to: emp.full_name, completed: false, time_slot: 'Morning Focus (08:30 - 12:00)', notes: `Department deliverables at ${emp.branch}` },
    { id: `TSK-${emp.id}-2`, title: `Standard Operating Procedure (SOP) & ISO 22000 verification`, category: 'Compliance', priority: 'MEDIUM', due_date: new Date().toISOString().split('T')[0], assigned_to: emp.full_name, completed: false, time_slot: 'Afternoon Operations (12:00 - 15:30)', notes: 'Statutory compliance routine' },
    { id: `TSK-${emp.id}-3`, title: `Weekly timesheet & deliverables submission`, category: 'HR & Payroll', priority: 'LOW', due_date: new Date().toISOString().split('T')[0], assigned_to: emp.full_name, completed: true, time_slot: 'Wrap-up & Audits (15:30 - 18:00)', notes: 'Internal operations signoff' },
  ];
}

// ─── Helpers ─────────────────────────────────────────────────────────────────
function priorityBadge(priority) {
  const p = (priority || '').toUpperCase();
  const cls =
    p === 'URGENT'
      ? 'bg-red-100 text-red-700 border-red-300 font-black'
      : p === 'HIGH'
      ? 'bg-amber-100 text-amber-800 border-amber-300'
      : p === 'MEDIUM'
      ? 'bg-blue-100 text-blue-800 border-blue-200'
      : 'bg-slate-100 text-slate-600 border-slate-200';
  return (
    <span className={`px-2.5 py-0.5 rounded text-[10px] font-bold uppercase border ${cls}`}>
      {priority}
    </span>
  );
}

function isCompleted(task) {
  return task.completed === true || task.status === 'Completed';
}

// ─── Component ───────────────────────────────────────────────────────────────
export default function TodoPlanner({ isMyDay = false }) {
  const { user } = useAuth();
  const isEmployeeRole = user?.role === 'EMPLOYEE';

  const [employees, setEmployees] = useState(FALLBACK_EMPLOYEES);

  // Resolve current employee ID
  const defaultEmpId = useMemo(() => {
    if (user?.employee_id) return user.employee_id;
    const match = employees.find(e => e.email?.toLowerCase() === user?.email?.toLowerCase());
    return match ? match.id : 'EMP-001';
  }, [user, employees]);

  const [selectedEmpId, setSelectedEmpId] = useState(defaultEmpId);

  useEffect(() => {
    if (defaultEmpId) {
      setSelectedEmpId(defaultEmpId);
    }
  }, [defaultEmpId]);

  useEffect(() => {
    if (isEmployeeRole && defaultEmpId && selectedEmpId !== defaultEmpId) {
      setSelectedEmpId(defaultEmpId);
    }
  }, [isEmployeeRole, defaultEmpId, selectedEmpId]);

  const activeEmployee = useMemo(() => {
    return employees.find(e => e.id === selectedEmpId) || employees[0];
  }, [employees, selectedEmpId]);

  // Tasks state
  const [tasks, setTasks] = useState([]);
  const [activeCategory, setActiveCategory] = useState('ALL');
  const [timeSlotFilter, setTimeSlotFilter] = useState('ALL');
  const [filterEmployeeId, setFilterEmployeeId] = useState('ALL'); // used when isMyDay === false
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [notification, setNotification] = useState(null);

  // Form state
  const [newTitle, setNewTitle] = useState('');
  const [newCategory, setNewCategory] = useState('Operations');
  const [newPriority, setNewPriority] = useState('HIGH');
  const [newDue, setNewDue] = useState(new Date().toISOString().split('T')[0]);
  const [newTimeSlot, setNewTimeSlot] = useState('Morning Focus (08:30 - 12:00)');
  const [newAssignedTo, setNewAssignedTo] = useState(activeEmployee.full_name);
  const [newNotes, setNewNotes] = useState('');

  // Keep newAssignedTo synced when activeEmployee changes
  useEffect(() => {
    if (activeEmployee) {
      setNewAssignedTo(activeEmployee.full_name);
    }
  }, [activeEmployee]);

  // Load employee master
  useEffect(() => {
    api.getEmployees().then(res => {
      if (res && Array.isArray(res) && res.length > 0) {
        setEmployees(res);
      }
    }).catch(() => {});
  }, []);

  const notify = (type, msg) => {
    setNotification({ type, msg });
    setTimeout(() => setNotification(null), 3500);
  };

  // ─── Fetch Tasks (Unique per Employee when isMyDay === true) ────────────────
  const fetchTasks = useCallback(async () => {
    setLoading(true);
    try {
      let filterParam = null;
      if (isMyDay) {
        filterParam = activeEmployee.full_name;
      } else if (filterEmployeeId !== 'ALL') {
        const emp = employees.find(e => e.id === filterEmployeeId);
        filterParam = emp ? emp.full_name : filterEmployeeId;
      }

      const data = await api.getTasks(activeCategory, filterParam);
      if (data && Array.isArray(data) && data.length > 0) {
        setTasks(data);
      } else {
        // Fallback to employee's unique predefined tasks
        if (isMyDay) {
          const uniqueDefault = getDefaultTasksForEmployee(activeEmployee);
          setTasks(uniqueDefault);
        } else {
          // Company-wide fallback
          const allFallbacks = Object.values(UNIQUE_TASKS_BY_EMPLOYEE).flat();
          if (filterEmployeeId !== 'ALL') {
            const filtered = allFallbacks.filter(t => t.assigned_to === activeEmployee.full_name);
            setTasks(filtered.length ? filtered : getDefaultTasksForEmployee(activeEmployee));
          } else {
            setTasks(allFallbacks);
          }
        }
      }
    } catch {
      if (isMyDay) {
        setTasks(getDefaultTasksForEmployee(activeEmployee));
      } else {
        setTasks(Object.values(UNIQUE_TASKS_BY_EMPLOYEE).flat());
      }
    } finally {
      setLoading(false);
    }
  }, [isMyDay, activeEmployee, activeCategory, filterEmployeeId, employees]);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  // ─── Toggle Task Completion ────────────────────────────────────────────────
  const handleToggle = async (task) => {
    setTasks(prev =>
      prev.map(t => (t.id === task.id ? { ...t, completed: !isCompleted(t) } : t))
    );
    try {
      await api.toggleTask(task.id);
      notify('success', `Task status updated: ${task.title.slice(0, 35)}...`);
    } catch {
      notify('error', 'Status updated locally (offline mode).');
    }
  };

  // ─── Delete Task ───────────────────────────────────────────────────────────
  const handleDelete = async (task) => {
    setTasks(prev => prev.filter(t => t.id !== task.id));
    try {
      await api.deleteTask(task.id);
      notify('success', `Task deleted: "${task.title.slice(0, 35)}..."`);
    } catch {
      notify('success', 'Task removed locally.');
    }
  };

  // ─── Add Task ──────────────────────────────────────────────────────────────
  const handleAddTask = async (e) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    setSaving(true);
    try {
      const assignedTarget = isMyDay ? activeEmployee.full_name : (newAssignedTo || activeEmployee.full_name);
      const payload = {
        title: newTitle.trim(),
        category: newCategory,
        priority: newPriority,
        due_date: newDue || new Date().toISOString().split('T')[0],
        assigned_to: assignedTarget,
        completed: false,
        notes: newNotes.trim() ? `${newTimeSlot ? '[' + newTimeSlot + '] ' : ''}${newNotes.trim()}` : newTimeSlot || '',
      };

      const res = await api.createTask(payload);
      if (res) {
        notify('success', `Task assigned to ${assignedTarget}.`);
      } else {
        setTasks(prev => [
          { id: `TSK-${Date.now() % 10000}`, ...payload, time_slot: newTimeSlot },
          ...prev,
        ]);
        notify('success', `Task added locally for ${assignedTarget}.`);
      }
      await fetchTasks();
      setShowAddModal(false);
      setNewTitle('');
      setNewNotes('');
    } catch {
      notify('error', 'Failed to create task.');
    } finally {
      setSaving(false);
    }
  };

  // ─── Filtered Tasks List ────────────────────────────────────────────────────
  const displayedTasks = useMemo(() => {
    return tasks.filter(t => {
      // Category filter
      if (activeCategory !== 'ALL' && t.category !== activeCategory) return false;

      // In isMyDay mode, ensure it only shows this employee's unique tasks
      if (isMyDay) {
        const matchesEmp =
          t.assigned_to === activeEmployee.full_name ||
          t.assigned_to === activeEmployee.id ||
          t.assigned_to === activeEmployee.employee_code ||
          (t.assigned_to && activeEmployee.full_name.includes(t.assigned_to));
        if (!matchesEmp) return false;

        // Time slot filter if selected
        if (timeSlotFilter !== 'ALL') {
          const slot = t.time_slot || t.notes || '';
          if (!slot.includes(timeSlotFilter.split(' ')[0])) return false;
        }
      }

      return true;
    });
  }, [tasks, activeCategory, isMyDay, activeEmployee, timeSlotFilter]);

  // ─── Metrics ───────────────────────────────────────────────────────────────
  const inProgressCount = displayedTasks.filter(t => !isCompleted(t)).length;
  const urgentCount = displayedTasks.filter(t => (t.priority || '').toUpperCase() === 'URGENT' && !isCompleted(t)).length;
  const completedCount = displayedTasks.filter(t => isCompleted(t)).length;
  const totalCount = displayedTasks.length;
  const completionPercent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

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

      {/* ─── Top Header Card: Employee Identity & View Switcher ─── */}
      <div className="bg-white rounded-xl border border-[#E2E8F0] shadow-sm p-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-full bg-gradient-to-l from-blue-50/50 to-transparent pointer-events-none" />

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          {/* Identity & Header Text */}
          <div className="flex items-center space-x-4">
            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center font-black text-2xl shadow-sm shrink-0 ${
              isMyDay
                ? 'bg-gradient-to-br from-[#D97706] to-amber-600 text-white'
                : 'bg-gradient-to-br from-[#1E40AF] to-blue-700 text-white'
            }`}>
              {isMyDay ? <Sun className="w-7 h-7 text-amber-100" /> : <ListTodo className="w-7 h-7 text-blue-100" />}
            </div>

            <div className="space-y-1">
              <div className="flex items-center space-x-2">
                <h1 className="text-xl font-black text-slate-900 tracking-tight">
                  {isMyDay ? 'My Daily Agenda & Task Focus' : 'Operations Task & Work Order Queue'}
                </h1>
                <span className="text-[10px] font-bold bg-blue-100 text-[#1E40AF] border border-blue-200 px-2 py-0.5 rounded-full uppercase">
                  {isMyDay ? 'PERSONAL DESK' : 'WORKFORCE QUEUE'}
                </span>
              </div>

              {isMyDay ? (
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-600 font-semibold">
                  <span>Daily Planner for: <strong className="text-slate-900 font-bold">{activeEmployee.full_name}</strong></span>
                  <span>•</span>
                  <span className="text-[#1E40AF] font-bold">{activeEmployee.designation}</span>
                  <span>•</span>
                  <span className="text-slate-500 font-medium">{activeEmployee.department} ({activeEmployee.branch})</span>
                </div>
              ) : (
                <p className="text-xs text-slate-500 font-medium">
                  Centralized operational checklist, statutory deadlines &amp; quality deliverables across all bio-hubs.
                </p>
              )}
            </div>
          </div>

          {/* Right Controls: Employee Switcher & Actions */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
            {/* Employee Switcher (for Admin/HR testing & oversight) */}
            {(!user || user.role === 'ADMIN' || user.role === 'HR_MANAGER') ? (
              <div className="text-right sm:text-left">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                  {isMyDay ? 'VIEW DAILY PLANNER FOR' : 'FILTER BY ASSIGNED STAFF'}
                </span>
                <select
                  value={isMyDay ? selectedEmpId : filterEmployeeId}
                  onChange={(e) => {
                    if (isMyDay) {
                      setSelectedEmpId(e.target.value);
                    } else {
                      setFilterEmployeeId(e.target.value);
                    }
                  }}
                  className="mt-0.5 bg-slate-50 border border-[#E2E8F0] rounded-lg px-3 py-1.5 text-xs font-bold text-slate-800 focus:outline-none focus:border-[#1E40AF] shadow-sm cursor-pointer"
                >
                  {!isMyDay && <option value="ALL">All Workforce Members (Company-wide)</option>}
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
                  <div className="text-xs font-bold text-emerald-950">Minimum Access: Personal Daily Desk</div>
                </div>
              </div>
            )}

            {/* New Task Action Button */}
            <button
              onClick={() => setShowAddModal(true)}
              className="flex items-center space-x-1.5 px-4 py-2 bg-[#1E40AF] hover:bg-blue-800 text-white text-xs font-bold uppercase tracking-wider rounded-lg shadow-sm transition-all"
            >
              <Plus className="w-3.5 h-3.5 text-[#FDE68A]" />
              <span>+ NEW TASK</span>
            </button>
          </div>
        </div>

        {/* Daily Motivation & Operational Focus Banner for isMyDay */}
        {isMyDay && (
          <div className="mt-5 pt-4 border-t border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center space-x-2.5 text-xs font-bold text-slate-700">
              <Sparkles className="w-4 h-4 text-amber-500" />
              <span>
                Today&apos;s Focus Deliverables for <span className="text-[#1E40AF] font-black">{activeEmployee.full_name}</span>:
              </span>
              <span className="font-semibold text-slate-500">
                {inProgressCount} active action item{inProgressCount !== 1 ? 's' : ''} scheduled
              </span>
            </div>

            {/* Daily Completion Progress Bar */}
            <div className="flex items-center space-x-3 w-full md:w-72">
              <div className="flex-1 bg-slate-100 rounded-full h-2.5 overflow-hidden border border-slate-200">
                <div
                  className="bg-emerald-500 h-full rounded-full transition-all duration-500"
                  style={{ width: `${completionPercent}%` }}
                />
              </div>
              <span className="text-xs font-black font-mono text-emerald-700 whitespace-nowrap">
                {completedCount}/{totalCount} ({completionPercent}%)
              </span>
            </div>
          </div>
        )}
      </div>

      {/* ─── Metric KPI Cards ─── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Card 1: Active In Progress */}
        <div className="bg-white p-5 rounded-xl border border-[#E2E8F0] shadow-card flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              {isMyDay ? 'TODAY FOCUS ITEMS' : 'TASKS IN PROGRESS'}
            </span>
            <p className="text-2xl font-black text-[#1E40AF] mt-1">{inProgressCount}</p>
            <span className="text-[10px] text-slate-400 font-medium">Pending action</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-[#1E40AF] flex items-center justify-center">
            <Clock className="w-5 h-5" />
          </div>
        </div>

        {/* Card 2: Urgent Deadlines */}
        <div className="bg-white p-5 rounded-xl border border-[#E2E8F0] shadow-card flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">URGENT PRIORITIES</span>
            <p className="text-2xl font-black text-amber-600 mt-1">{urgentCount}</p>
            <span className="text-[10px] text-amber-600 font-semibold">Immediate attention</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
            <AlertCircle className="w-5 h-5" />
          </div>
        </div>

        {/* Card 3: Completed */}
        <div className="bg-white p-5 rounded-xl border border-[#E2E8F0] shadow-card flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">DELIVERED &amp; CLOSED</span>
            <p className="text-2xl font-black text-emerald-600 mt-1">{completedCount}</p>
            <span className="text-[10px] text-emerald-600 font-semibold">Completed successfully</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* ─── Filters & Time-Slot Navigation Strip ─── */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3.5 rounded-xl border border-[#E2E8F0] shadow-sm">
        {/* Category Pills */}
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-[10px] font-bold text-slate-400 uppercase mr-1">CATEGORY:</span>
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all border ${
                activeCategory === cat
                  ? 'bg-[#1E40AF] text-white border-[#1E40AF] shadow-xs'
                  : 'bg-white text-slate-600 border-[#E2E8F0] hover:bg-slate-50'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Time-Slot Filter for isMyDay */}
        {isMyDay && (
          <div className="flex items-center space-x-1.5 text-xs">
            <span className="text-[10px] font-bold text-slate-400 uppercase">SCHEDULE:</span>
            <select
              value={timeSlotFilter}
              onChange={(e) => setTimeSlotFilter(e.target.value)}
              className="bg-slate-50 border border-[#E2E8F0] rounded-lg px-2.5 py-1 text-xs font-bold text-slate-700 focus:outline-none focus:border-[#1E40AF]"
            >
              <option value="ALL">All Time Blocks</option>
              <option value="Morning">Morning Focus (08:30 - 12:00)</option>
              <option value="Afternoon">Afternoon Operations (12:00 - 15:30)</option>
              <option value="Wrap-up">Wrap-up &amp; Audits (15:30 - 18:00)</option>
            </select>
          </div>
        )}
      </div>

      {/* ─── Unique Task Queue List Card ─── */}
      <div className="bg-white rounded-xl border border-[#E2E8F0] shadow-card overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center space-x-2">
            <CheckSquare className="w-4 h-4 text-[#1E40AF]" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
              {isMyDay
                ? `${activeEmployee.full_name}'s Daily Focus Deliverables (${displayedTasks.length})`
                : `Active Assignments & Operational Work Orders (${displayedTasks.length})`}
            </h3>
          </div>
          <span className="text-[11px] text-slate-400 font-medium">Click circle to toggle status</span>
        </div>

        <div className="divide-y divide-slate-100">
          {loading ? (
            Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="p-4 flex items-center space-x-3 animate-pulse">
                <div className="bg-slate-100 rounded-lg w-5 h-5 flex-shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="bg-slate-100 rounded h-3 w-3/4" />
                  <div className="bg-slate-100 rounded h-2.5 w-1/3" />
                </div>
                <div className="bg-slate-100 rounded h-5 w-14" />
              </div>
            ))
          ) : displayedTasks.length === 0 ? (
            <div className="py-16 text-center text-slate-400 space-y-2">
              <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto" />
              <p className="text-xs font-bold text-slate-700">No pending tasks for this view.</p>
              <p className="text-[11px] text-slate-400">All scheduled action items have been completed or none match the filter.</p>
            </div>
          ) : (
            displayedTasks.map((task) => {
              const done = isCompleted(task);
              const status = done ? 'Completed' : 'In Progress';
              return (
                <div
                  key={task.id}
                  className={`p-4 flex items-center justify-between transition-colors ${
                    done ? 'bg-slate-50/60 opacity-65' : 'hover:bg-blue-50/20'
                  }`}
                >
                  <div className="flex items-start space-x-3.5 flex-1 min-w-0">
                    {/* Toggle Checkbox Button */}
                    <button
                      onClick={() => handleToggle(task)}
                      className={`w-5 h-5 rounded-md flex-shrink-0 flex items-center justify-center border transition-all mt-0.5 ${
                        done
                          ? 'bg-emerald-600 border-emerald-600 text-white'
                          : 'border-slate-300 hover:border-[#1E40AF] bg-white'
                      }`}
                      title={done ? 'Mark as In Progress' : 'Mark as Completed'}
                    >
                      {done && <CheckCircle2 className="w-3.5 h-3.5" />}
                    </button>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center space-x-2">
                        <h4
                          className={`text-xs font-bold truncate ${
                            done ? 'line-through text-slate-400' : 'text-slate-900'
                          }`}
                        >
                          {task.title}
                        </h4>
                      </div>

                      {/* Metadata Row */}
                      <div className="flex items-center flex-wrap gap-x-3 gap-y-1 text-[11px] text-slate-400 mt-1">
                        {task.due_date && (
                          <span className="flex items-center space-x-1">
                            <Calendar className="w-3 h-3 text-slate-400" />
                            <span className="font-mono text-slate-600">Due: {task.due_date}</span>
                          </span>
                        )}

                        {task.category && (
                          <>
                            <span>•</span>
                            <span className="font-semibold text-slate-600 bg-slate-100 px-2 py-0.5 rounded text-[10px]">
                              {task.category}
                            </span>
                          </>
                        )}

                        {task.assigned_to && (
                          <>
                            <span>•</span>
                            <span className="flex items-center space-x-1 text-slate-700 font-bold">
                              <User className="w-3 h-3 text-[#1E40AF]" />
                              <span>{task.assigned_to}</span>
                            </span>
                          </>
                        )}

                        <span>•</span>
                        <span
                          className={`font-bold text-[10px] uppercase ${
                            done ? 'text-emerald-700' : 'text-[#1E40AF]'
                          }`}
                        >
                          {status}
                        </span>
                      </div>

                      {/* Notes / Time Slot */}
                      {(task.notes || task.time_slot) && (
                        <p className="text-[11px] text-slate-500 mt-1 italic line-clamp-1 max-w-xl">
                          {task.time_slot && !task.notes?.includes(task.time_slot)
                            ? `[${task.time_slot}] ${task.notes || ''}`
                            : task.notes}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Priority & Delete Actions */}
                  <div className="flex items-center space-x-3 flex-shrink-0 ml-4">
                    {priorityBadge(task.priority)}
                    <button
                      onClick={() => handleDelete(task)}
                      className="text-slate-300 hover:text-red-600 p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
                      title="Delete task"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* ─── Modal: Create Task ─── */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl border border-[#E2E8F0] shadow-2xl max-w-lg w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center space-x-2">
                <CheckSquare className="w-5 h-5 text-[#1E40AF]" />
                <h3 className="text-sm font-bold text-slate-900 uppercase">
                  {isMyDay ? `Add Focus Item for ${activeEmployee.full_name}` : 'Create Operational Task'}
                </h3>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1 font-bold text-lg"
              >
                ×
              </button>
            </div>

            <form onSubmit={handleAddTask} className="space-y-4 text-xs">
              {/* Title */}
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Task Title <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Verify phytosanitary lab certificate for export shipment..."
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full bg-white border border-[#E2E8F0] rounded-md px-3 py-2 text-xs font-bold text-slate-800 focus:outline-none focus:border-[#1E40AF]"
                />
              </div>

              {/* Priority & Category */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Priority</label>
                  <select
                    value={newPriority}
                    onChange={(e) => setNewPriority(e.target.value)}
                    className="w-full bg-white border border-[#E2E8F0] rounded-md px-3 py-2 text-xs font-bold text-slate-800 focus:outline-none focus:border-[#1E40AF]"
                  >
                    {PRIORITY_OPTIONS.map((p) => (
                      <option key={p} value={p}>{p}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Category</label>
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                    className="w-full bg-white border border-[#E2E8F0] rounded-md px-3 py-2 text-xs font-semibold text-slate-800 focus:outline-none focus:border-[#1E40AF]"
                  >
                    {CATEGORY_OPTIONS.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Assigned Staff & Due Date */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Assigned Employee</label>
                  {isMyDay ? (
                    <div className="w-full bg-slate-50 border border-slate-200 rounded-md px-3 py-2 text-xs font-bold text-slate-800">
                      {activeEmployee.full_name} ({activeEmployee.department})
                    </div>
                  ) : (
                    <select
                      value={newAssignedTo}
                      onChange={(e) => setNewAssignedTo(e.target.value)}
                      className="w-full bg-white border border-[#E2E8F0] rounded-md px-3 py-2 text-xs font-bold text-slate-800 focus:outline-none focus:border-[#1E40AF]"
                    >
                      {employees.map(emp => (
                        <option key={emp.id} value={emp.full_name}>
                          {emp.full_name} ({emp.department})
                        </option>
                      ))}
                    </select>
                  )}
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Due Date</label>
                  <input
                    type="date"
                    value={newDue}
                    onChange={(e) => setNewDue(e.target.value)}
                    className="w-full bg-white border border-[#E2E8F0] rounded-md px-3 py-2 text-xs font-bold text-slate-800 focus:outline-none focus:border-[#1E40AF]"
                  />
                </div>
              </div>

              {/* Time Slot (for Daily Planner) */}
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Schedule Time Block</label>
                <select
                  value={newTimeSlot}
                  onChange={(e) => setNewTimeSlot(e.target.value)}
                  className="w-full bg-white border border-[#E2E8F0] rounded-md px-3 py-2 text-xs font-semibold text-slate-800 focus:outline-none focus:border-[#1E40AF]"
                >
                  {TIME_SLOT_OPTIONS.map((ts) => (
                    <option key={ts} value={ts}>{ts}</option>
                  ))}
                </select>
              </div>

              {/* Notes */}
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Notes / Action Details</label>
                <textarea
                  rows={2}
                  value={newNotes}
                  onChange={(e) => setNewNotes(e.target.value)}
                  placeholder="Add specific instructions, container IDs, or reference documents..."
                  className="w-full bg-white border border-[#E2E8F0] rounded-md px-3 py-2 text-xs font-medium text-slate-800 focus:outline-none focus:border-[#1E40AF] resize-none"
                />
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end space-x-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 border border-[#E2E8F0] rounded-md text-xs font-semibold text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2 bg-[#1E40AF] text-white rounded-md text-xs font-bold uppercase tracking-wider hover:bg-blue-800 shadow-sm disabled:opacity-60 flex items-center space-x-1.5"
                >
                  {saving && <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />}
                  <span>{saving ? 'Saving...' : 'Add Task'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
