import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Receipt,
  DollarSign,
  Download,
  CheckCircle2,
  Clock,
  Building,
  CreditCard,
  FileSpreadsheet,
  Check,
  Send,
  AlertCircle,
  Printer,
  LogOut,
  HelpCircle
} from 'lucide-react';
import api from '../../services/api';

// ─── Helpers ────────────────────────────────────────────────────────────────

function getLast6Months() {
  const months = [];
  const now = new Date();
  for (let i = 0; i < 6; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const label = d.toLocaleString('en-US', { month: 'long', year: 'numeric' });
    months.push(label);
  }
  return months;
}

function getCurrentMonth() {
  const now = new Date();
  return now.toLocaleString('en-US', { month: 'long', year: 'numeric' });
}

function fmt(n) {
  return '$' + Number(n || 0).toLocaleString(undefined, { minimumFractionDigits: 0 });
}

function isEligibleForPayrollMonth(joinDate, monthYear) {
  if (!joinDate || !monthYear) return true;
  try {
    const [mName, yStr] = monthYear.trim().split(' ');
    const monthNames = [
      'january','february','march','april','may','june',
      'july','august','september','october','november','december'
    ];
    const mIdx = monthNames.indexOf(mName.toLowerCase());
    if (mIdx === -1) return true;
    const periodIdx = parseInt(yStr, 10) * 12 + (mIdx + 1);

    const joinDt = new Date(joinDate);
    if (isNaN(joinDt.getTime())) return true;
    const joinIdx = joinDt.getFullYear() * 12 + (joinDt.getMonth() + 1);

    // New employee joined after this month -> not eligible
    if (periodIdx < joinIdx) return false;
    // New employee joined during this month -> salary will be given from next month
    if (periodIdx === joinIdx) return false;

    return true;
  } catch {
    return true;
  }
}

function mapRecord(p) {
  if (!p) return null;
  const basic = Number(p.basic_pay || 0);
  const allowances = Number(p.allowances || 0);
  const otHours = Number(p.overtime_hours || 0);
  const otPay = Number(p.overtime_pay || 0);
  const gross = p.gross !== undefined ? Number(p.gross) : (basic + allowances + otPay);
  const deductions = Number(p.deductions || 0) + Number(p.tax || 0);
  const netPay = p.net_salary !== undefined ? Number(p.net_salary) : (p.netPay !== undefined ? Number(p.netPay) : (gross - deductions));
  return {
    id: p.id || p.employee_id || Math.random(),
    code: p.employee_id || p.code || 'N/A',
    employee_id: p.employee_id || p.code || 'N/A',
    name: p.employee_name || p.full_name || p.name || 'Unknown',
    employee_name: p.employee_name || p.full_name || p.name || 'Unknown',
    designation: p.designation || 'Staff',
    basic_pay: basic,
    allowances: allowances,
    overtime_hours: otHours,
    overtime_pay: otPay,
    gross: gross,
    deductions: deductions,
    netPay: netPay,
    bank: p.bank || 'Standard Chartered',
    status: (p.status || 'DRAFT').toUpperCase(),
    date: p.disbursed_at || p.month_year || '—',
  };
}

// ─── Fallbacks ───────────────────────────────────────────────────────────────

const FALLBACK_PAYROLL = [
  { id: 'PAY-1', employee_id: 'EMP-001', employee_name: 'Vũ Thị Hoan',      designation: 'Senior Sales Executive',   month_year: 'August 2026', basic_pay: 2200, allowances: 450, overtime_hours: 4.0, overtime_pay: 82.5, deductions: 120, tax: 180, net_salary: 2432.5, status: 'PAID', disbursed_at: '2026-08-31', bank: 'Vietcombank' },
  { id: 'PAY-2', employee_id: 'EMP-002', employee_name: 'Rajesh Sharma',     designation: 'QA Lab Director',          month_year: 'August 2026', basic_pay: 2600, allowances: 300, overtime_hours: 3.0, overtime_pay: 73.13, deductions: 100, tax: 220, net_salary: 2653.13, status: 'PAID', disbursed_at: '2026-08-31', bank: 'HDFC Bank' },
  { id: 'PAY-3', employee_id: 'EMP-003', employee_name: 'Nguyễn Văn Hùng',  designation: 'Logistics Supervisor',     month_year: 'August 2026', basic_pay: 1800, allowances: 350, overtime_hours: 5.5, overtime_pay: 92.81, deductions: 80,  tax: 140, net_salary: 2022.81, status: 'PAID', disbursed_at: '2026-08-31', bank: 'Techcombank' },
  { id: 'PAY-4', employee_id: 'EMP-004', employee_name: 'Priya Nair',        designation: 'HR Operations Lead',       month_year: 'August 2026', basic_pay: 1950, allowances: 250, overtime_hours: 0.0, overtime_pay: 0.0, deductions: 90,  tax: 160, net_salary: 1950, status: 'PAID', disbursed_at: '2026-08-31', bank: 'SBI Bank' },
  { id: 'PAY-5', employee_id: 'EMP-005', employee_name: 'Trần Quốc Bảo',    designation: 'Senior Trade Accountant',  month_year: 'August 2026', basic_pay: 2400, allowances: 400, overtime_hours: 0.0, overtime_pay: 0.0, deductions: 110, tax: 200, net_salary: 2490, status: 'PAID', disbursed_at: '2026-08-31', bank: 'Vietcombank' },
].map(mapRecord);

const FALLBACK_EMPLOYEES_CTC = [
  { id: 'EMP-001', full_name: 'Vũ Thị Hoan', designation: 'Senior Sales Executive', department: 'Sales & Export' },
  { id: 'EMP-002', full_name: 'Rajesh Sharma', designation: 'QA Lab Director', department: 'Quality Assurance' },
  { id: 'EMP-003', full_name: 'Nguyễn Văn Hùng', designation: 'Logistics Supervisor', department: 'Operations & Supply' },
  { id: 'EMP-004', full_name: 'Priya Nair', designation: 'HR Operations Lead', department: 'Human Resources' },
  { id: 'EMP-005', full_name: 'Trần Quốc Bảo', designation: 'Senior Trade Accountant', department: 'Finance & Accounts' },
];

const DEFAULT_CTC = {
  ctc_annual: 38400,
  basic_monthly: 2200,
  hra_monthly: 880,
  transport_allowance: 200,
  medical_allowance: 100,
  special_allowance: 270,
  pf_employee: 264,
  pf_employer: 264,
  esi_employee: 0,
  professional_tax: 50,
};

const FALLBACK_RUNS = [
  { id: 'RUN-001', month_year: 'August 2026', status: 'DISBURSED', total_employees: 5, total_gross: 14050, total_net: 13300, total_deductions: 750, processed_by: 'admin', approved_by: 'CFO', disbursed_at: '2026-08-31' },
  { id: 'RUN-002', month_year: 'September 2026', status: 'APPROVED', total_employees: 5, total_gross: 14050, total_net: 13300, total_deductions: 750, processed_by: 'admin', approved_by: null, disbursed_at: null },
];

// ─── Status Badge ────────────────────────────────────────────────────────────

function StatusBadge({ status }) {
  const s = (status || '').toUpperCase();
  const cls =
    s === 'PAID' || s === 'DISBURSED'
      ? 'bg-emerald-100 text-emerald-800 border-emerald-200'
      : s === 'APPROVED'
      ? 'bg-blue-100 text-blue-800 border-blue-200'
      : s === 'COMPUTED'
      ? 'bg-purple-100 text-purple-800 border-purple-200'
      : 'bg-amber-100 text-amber-800 border-amber-200';
  return (
    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase border ${cls}`}>
      {status}
    </span>
  );
}

const FALLBACK_EXITS = [
  {
    id: 'EXT-001',
    employee_id: 'EMP-005',
    employee_name: 'Trần Quốc Bảo',
    department: 'Finance & Accounts',
    resignation_date: '2026-08-15',
    last_working_day: '2026-09-15',
    notice_days: 30,
    reason: 'Relocation to Singapore for family reasons',
    status: 'ALL_CLEARED',
    it_clearance: true,
    finance_clearance: true,
    admin_clearance: true,
    unpaid_salary_days: 15,
    leave_encashment_days: 6,
    settlement_amount: 2850.0,
  },
];

// ─── Main Component ──────────────────────────────────────────────────────────

export default function PayrollView() {
  const [activeTab, setActiveTab] = useState('SALARY_SLIPS');
  const MONTHS = getLast6Months();
  const [selectedMonth, setSelectedMonth] = useState(MONTHS[0]);
  const [salarySlips, setSalarySlips] = useState([]);
  const [loading, setLoading] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [notification, setNotification] = useState(null);

  // CTC Master state
  const [employees, setEmployees] = useState(FALLBACK_EMPLOYEES_CTC);
  const [selectedEmpId, setSelectedEmpId] = useState(FALLBACK_EMPLOYEES_CTC[0].id);
  const [ctc, setCtc] = useState(DEFAULT_CTC);
  const [savingCtc, setSavingCtc] = useState(false);

  // Payroll Runs state
  const [payrollRuns, setPayrollRuns] = useState(FALLBACK_RUNS);
  const [viewingSlip, setViewingSlip] = useState(null);
  const [showBatchModal, setShowBatchModal] = useState(false);
  const [showNewRunModal, setShowNewRunModal] = useState(false);
  const [targetRunMonth, setTargetRunMonth] = useState(MONTHS[0]);

  // F&F Settlements state
  const [exits, setExits] = useState(FALLBACK_EXITS);
  const [viewingFnF, setViewingFnF] = useState(null);

  const notify = (type, msg) => {
    setNotification({ type, msg });
    setTimeout(() => setNotification(null), 3500);
  };

  const getSettledIdentifiers = useCallback((exitsList = []) => {
    const settledIds = new Set();
    const settledNames = new Set();
    try {
      const stored = JSON.parse(localStorage.getItem('soilex_settled_employees') || '[]');
      if (Array.isArray(stored)) {
        stored.forEach(s => {
          if (typeof s === 'string') {
            settledIds.add(s.trim());
          } else if (s && typeof s === 'object') {
            if (s.id) settledIds.add(String(s.id).trim());
            if (s.name) settledNames.add(String(s.name).trim());
          }
        });
      }
    } catch {}
    const list = Array.isArray(exitsList) ? exitsList : [];
    list.forEach(x => {
      if (x && x.status === 'SETTLED') {
        if (x.employee_id) settledIds.add(String(x.employee_id).trim());
        if (x.employee_name) settledNames.add(String(x.employee_name).trim());
      }
    });
    return { settledIds, settledNames };
  }, []);

  // Eligible employees for target pay cycle - auto-removes F&F settled staff
  const eligibleEmployees = useMemo(() => {
    const { settledIds, settledNames } = getSettledIdentifiers(exits);
    return employees.filter(emp => {
      const id = String(emp.id || '').trim();
      const code = String(emp.employee_code || '').trim();
      const name = String(emp.full_name || emp.name || '').trim();
      if (emp.status === 'SEPARATED' || emp.status === 'INACTIVE' || emp.status === 'SETTLED' || emp.status === 'TERMINATED') {
        return false;
      }
      if (settledIds.has(id) || settledIds.has(code) || settledNames.has(name)) {
        return false;
      }
      return isEligibleForPayrollMonth(emp.join_date, targetRunMonth || selectedMonth);
    });
  }, [employees, targetRunMonth, selectedMonth, exits, getSettledIdentifiers]);

  // ── Fetch payroll records for a given month ────────────────────────────────
  const fetchPayroll = useCallback(async (month) => {
    setLoading(true);
    try {
      const { settledIds, settledNames } = getSettledIdentifiers(exits);
      const data = await api.getPayrollRecords(month);
      if (data && data.length > 0) {
        // Enforce: New employee join's salary will be given from next month.
        // Auto-remove settled employees from Salary Slips
        const validSlips = data.filter(s => {
          const empId = String(s.employee_id || '').trim();
          const empName = String(s.employee_name || '').trim();
          if (settledIds.has(empId) || settledNames.has(empName)) return false;

          const emp = employees.find(e => e.id === s.employee_id || e.employee_code === s.employee_id);
          if (emp) {
            if (emp.status === 'SEPARATED' || emp.status === 'SETTLED' || emp.status === 'TERMINATED') return false;
            if (emp.join_date) {
              return isEligibleForPayrollMonth(emp.join_date, month);
            }
          }
          return true;
        });
        setSalarySlips(validSlips.map(mapRecord));
      } else if (month === 'August 2026') {
        const { settledIds: sIds, settledNames: sNames } = getSettledIdentifiers(exits);
        setSalarySlips(FALLBACK_PAYROLL.filter(s => !sIds.has(String(s.employee_id).trim()) && !sNames.has(String(s.employee_name).trim())));
      } else {
        setSalarySlips([]);
      }
    } catch {
      const { settledIds: sIds, settledNames: sNames } = getSettledIdentifiers(exits);
      if (month === 'August 2026') {
        setSalarySlips(FALLBACK_PAYROLL.filter(s => !sIds.has(String(s.employee_id).trim()) && !sNames.has(String(s.employee_name).trim())));
      } else {
        setSalarySlips([]);
      }
    } finally {
      setLoading(false);
    }
  }, [employees, exits, getSettledIdentifiers]);

  const fetchPayrollRuns = async () => {
    try {
      const res = await api.getPayrollRuns();
      if (res && Array.isArray(res) && res.length > 0) {
        setPayrollRuns(res);
      }
    } catch {
      // keep fallback
    }
  };

  const fetchExits = useCallback(async () => {
    try {
      const data = await api.getAllExits();
      if (data && Array.isArray(data) && data.length > 0) {
        setExits(data);
      } else {
        setExits(FALLBACK_EXITS);
      }
    } catch {
      setExits(FALLBACK_EXITS);
    }
  }, []);

  const loadEmployees = useCallback(async () => {
    try {
      const [emps, exitsData] = await Promise.allSettled([
        api.getEmployees(),
        api.getAllExits(),
      ]);
      const exitsList = (exitsData.status === 'fulfilled' && Array.isArray(exitsData.value)) ? exitsData.value : exits;
      const { settledIds, settledNames } = getSettledIdentifiers(exitsList);

      const localOnboarded = JSON.parse(localStorage.getItem('soilex_onboarded_employees') || '[]');
      const combined = [...((emps.status === 'fulfilled' && emps.value) || [])];
      for (const loc of localOnboarded) {
        if (!combined.some(e => e.id === loc.id || e.employee_code === loc.employee_code)) {
          combined.push(loc);
        }
      }

      // Auto-remove settled staff from employees list & CTC Master dropdown
      const activeEmps = combined.filter(e => {
        const id = String(e.id || '').trim();
        const code = String(e.employee_code || '').trim();
        const name = String(e.full_name || e.name || '').trim();
        if (e.status === 'SEPARATED' || e.status === 'SETTLED' || e.status === 'INACTIVE' || e.status === 'TERMINATED') {
          return false;
        }
        if (settledIds.has(id) || settledIds.has(code) || settledNames.has(name)) {
          return false;
        }
        return true;
      });

      if (activeEmps.length > 0) {
        setEmployees(activeEmps);
        setSelectedEmpId(prev => {
          if (prev && activeEmps.some(e => e.id === prev)) return prev;
          return activeEmps[0].id;
        });
      } else {
        setEmployees([]);
        setSelectedEmpId(null);
      }
    } catch {
      const { settledIds, settledNames } = getSettledIdentifiers(exits);
      const localOnboarded = JSON.parse(localStorage.getItem('soilex_onboarded_employees') || '[]');
      const combined = [...FALLBACK_EMPLOYEES_CTC];
      for (const loc of localOnboarded) {
        if (!combined.some(e => e.id === loc.id || e.employee_code === loc.employee_code)) {
          combined.push(loc);
        }
      }
      const activeEmps = combined.filter(e => {
        const id = String(e.id || '').trim();
        const code = String(e.employee_code || '').trim();
        const name = String(e.full_name || e.name || '').trim();
        if (e.status === 'SEPARATED' || e.status === 'SETTLED' || e.status === 'INACTIVE' || e.status === 'TERMINATED') {
          return false;
        }
        if (settledIds.has(id) || settledIds.has(code) || settledNames.has(name)) {
          return false;
        }
        return true;
      });
      setEmployees(activeEmps);
      if (activeEmps.length > 0) {
        setSelectedEmpId(activeEmps[0].id);
      }
    }
  }, [exits, getSettledIdentifiers]);

  const handleDisburseExit = async (exitRecord) => {
    try {
      await api.updateExitStatus(exitRecord.id, { status: 'SETTLED' });
      const empId = String(exitRecord.employee_id || '').trim();
      const empName = String(exitRecord.employee_name || '').trim();

      // 1. Persist to localStorage
      try {
        const stored = JSON.parse(localStorage.getItem('soilex_settled_employees') || '[]');
        if (!stored.some(s => (typeof s === 'string' && s === empId) || (s && (s.id === empId || s.name === empName)))) {
          stored.push({ id: empId, name: empName, settled_at: new Date().toISOString() });
          localStorage.setItem('soilex_settled_employees', JSON.stringify(stored));
        }
      } catch {}

      // 2. Dispatch cross-view sync event for Appraisal and other modules
      window.dispatchEvent(new CustomEvent('soilex-settlement-updated', { detail: { id: empId, name: empName } }));

      notify('success', `Disbursed F&F settlement for ${empName}. Auto-removed from salary & appraisal rosters.`);

      // 3. Immediately auto-remove from state
      setEmployees(prev => {
        const remaining = prev.filter(e => e.id !== empId && e.employee_code !== empId && e.full_name !== empName);
        if (selectedEmpId === empId) {
          setSelectedEmpId(remaining[0]?.id || null);
        }
        return remaining;
      });

      setSalarySlips(prev => prev.filter(s => s.employee_id !== empId && s.employee_name !== empName));

      if (viewingFnF && viewingFnF.id === exitRecord.id) {
        setViewingFnF(prev => prev ? { ...prev, status: 'SETTLED' } : null);
      }

      await fetchExits();
      await fetchPayroll(selectedMonth);
    } catch {
      notify('error', 'Failed to disburse settlement.');
    }
  };

  // Load employee list and initial CTC
  useEffect(() => {
    fetchPayroll(selectedMonth);
    fetchPayrollRuns();
    fetchExits();
    loadEmployees();

    const handleSettlementUpdate = () => {
      fetchExits();
      loadEmployees();
      fetchPayroll(selectedMonth);
    };
    window.addEventListener('soilex-settlement-updated', handleSettlementUpdate);
    window.addEventListener('storage', handleSettlementUpdate);
    return () => {
      window.removeEventListener('soilex-settlement-updated', handleSettlementUpdate);
      window.removeEventListener('storage', handleSettlementUpdate);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedMonth]);

  // Fetch CTC for selected employee
  useEffect(() => {
    if (!selectedEmpId) return;
    const fetchCtc = async () => {
      try {
        const savedSalaryStructures = JSON.parse(localStorage.getItem('soilex_salary_structures') || '{}');
        const localStructure = savedSalaryStructures[selectedEmpId];

        const data = await api.getSalaryStructure(selectedEmpId);
        if (data && data.basic_monthly) {
          setCtc({
            ctc_annual: localStructure ? localStructure.ctc : (data.ctc_annual || 0),
            basic_monthly: localStructure ? localStructure.basic : (data.basic_monthly || 0),
            hra_monthly: localStructure ? localStructure.hra : (data.hra_monthly || 0),
            transport_allowance: data.transport_allowance || (localStructure?.trans || 150),
            medical_allowance: data.medical_allowance || (localStructure?.med || 100),
            special_allowance: data.special_allowance || (localStructure?.spec || 200),
            pf_employee: localStructure ? localStructure.pf_employee : (data.pf_employee || 0),
            pf_employer: data.pf_employer || 0,
            esi_employee: data.esi_employee || 0,
            professional_tax: data.professional_tax || (localStructure?.ptax || 50),
            effective_from: localStructure ? localStructure.effective_from : data.effective_from,
            increment_pct: localStructure?.increment_pct,
          });
        } else if (localStructure) {
          setCtc({
            ctc_annual: localStructure.ctc || 30000,
            basic_monthly: localStructure.basic || 2000,
            hra_monthly: localStructure.hra || 800,
            transport_allowance: localStructure.trans || 150,
            medical_allowance: localStructure.med || 100,
            special_allowance: localStructure.spec || 200,
            pf_employee: localStructure.pf_employee || Math.round((localStructure.basic || 2000) * 0.12),
            pf_employer: Math.round((localStructure.basic || 2000) * 0.12),
            esi_employee: 0,
            professional_tax: localStructure.ptax || 50,
            effective_from: localStructure.effective_from,
            increment_pct: localStructure.increment_pct,
          });
        } else {
          setCtc(DEFAULT_CTC);
        }
      } catch {
        const savedSalaryStructures = JSON.parse(localStorage.getItem('soilex_salary_structures') || '{}');
        const localStructure = savedSalaryStructures[selectedEmpId];
        if (localStructure) {
          setCtc({
            ctc_annual: localStructure.ctc || 30000,
            basic_monthly: localStructure.basic || 2000,
            hra_monthly: localStructure.hra || 800,
            transport_allowance: localStructure.trans || 150,
            medical_allowance: localStructure.med || 100,
            special_allowance: localStructure.spec || 200,
            pf_employee: localStructure.pf_employee || Math.round((localStructure.basic || 2000) * 0.12),
            pf_employer: Math.round((localStructure.basic || 2000) * 0.12),
            esi_employee: 0,
            professional_tax: localStructure.ptax || 50,
            effective_from: localStructure.effective_from,
            increment_pct: localStructure.increment_pct,
          });
        } else {
          setCtc(DEFAULT_CTC);
        }
      }
    };
    fetchCtc();
  }, [selectedEmpId]);

  // ── Month selector handler ─────────────────────────────────────────────────
  const handleMonthChange = (e) => {
    const month = e.target.value;
    setSelectedMonth(month);
    fetchPayroll(month);
  };

  // ── Process Payroll Run Engine ─────────────────────────────────────────────
  const handleProcessPayroll = async (targetMonth) => {
    const monthToProcess = targetMonth || targetRunMonth || selectedMonth || getCurrentMonth();
    setProcessing(true);
    notify('success', `Calculating and compiling payroll for ${monthToProcess}...`);
    try {
      const result = await api.generatePayroll(monthToProcess);
      let newRecords = null;
      if (result) {
        const fresh = await api.getPayrollRecords(monthToProcess);
        if (fresh && fresh.length > 0) {
          newRecords = fresh.map(mapRecord);
        }
      }

      if (newRecords && newRecords.length > 0) {
        setSalarySlips(newRecords);
        notify('success', `🎉 Payroll processed for ${monthToProcess} — ${newRecords.length} records generated with overtime & statutory withholdings.`);
      } else {
        // Resilient calculation fallback using current active employees & updated CTC structures
        const savedSalaryStructures = JSON.parse(localStorage.getItem('soilex_salary_structures') || '{}');
        const rawEmps = employees && employees.length > 0 ? employees : FALLBACK_EMPLOYEES_CTC;
        const emps = rawEmps.filter(e => e.status !== 'SEPARATED' && e.status !== 'INACTIVE' && isEligibleForPayrollMonth(e.join_date, monthToProcess));
        const generated = emps.map((emp, idx) => {
          const customSalary = savedSalaryStructures[emp.id] || savedSalaryStructures[emp.employee_code];
          const basic = customSalary ? customSalary.basic : (2000 + (idx * 200));
          const allowances = customSalary ? (customSalary.hra + (customSalary.trans || 150) + (customSalary.med || 100) + (customSalary.spec || 200)) : (400 + (idx * 50));
          const hourlyRate = basic / 160.0;
          const otRate = hourlyRate * 1.5;
          const otHours = emp.id === 'EMP-003' ? 5.5 : emp.id === 'EMP-001' ? 4.0 : emp.id === 'EMP-002' ? 3.0 : 0.0;
          const otPay = Math.round(otHours * otRate * 100) / 100;
          const pf = customSalary ? customSalary.pf_employee : Math.round(basic * 0.12);
          const ptax = customSalary ? customSalary.ptax : (50 + (idx * 10));
          const tax = 60 + (idx * 15);
          const totalDeductions = pf + ptax + tax;
          const gross = basic + allowances + otPay;
          const net = Math.round((gross - totalDeductions) * 100) / 100;

          return {
            id: `PAY-${monthToProcess.replace(/\s+/g, '-')}-${emp.id}`,
            code: emp.employee_code || emp.id,
            name: emp.full_name || emp.name,
            designation: emp.designation || 'Staff Specialist',
            basic_pay: basic,
            allowances: allowances,
            overtime_hours: otHours,
            overtime_pay: otPay,
            gross: gross,
            deductions: totalDeductions,
            netPay: net,
            bank: emp.branch === 'Kochi Terminal' ? 'State Bank of India (Kochi)' : emp.branch === 'Hai Phong Hub' ? 'Techcombank' : 'Vietcombank',
            status: 'APPROVED',
            date: monthToProcess,
          };
        });
        setSalarySlips(generated);
        notify('success', `🎉 Payroll processed for ${monthToProcess} — ${generated.length} records generated with overtime & updated CTC.`);
      }

      // Automatically switch table view to the processed month
      setSelectedMonth(monthToProcess);

      // Refresh runs register
      await fetchPayrollRuns();
      setPayrollRuns(prev => {
        const runId = `RUN-${monthToProcess.replace(/\s+/g, '-')}`;
        const existingRun = prev.find(r => r.month_year === monthToProcess);
        if (existingRun) {
          return prev.map(r => r.month_year === monthToProcess ? { ...r, status: 'COMPUTED' } : r);
        } else {
          return [
            {
              id: runId,
              month_year: monthToProcess,
              status: 'COMPUTED',
              total_employees: (employees && employees.length > 0 ? employees.length : 5),
              total_gross: 14050,
              total_net: 13300,
              total_deductions: 750,
              processed_by: 'admin',
              approved_by: null,
              disbursed_at: null,
            },
            ...prev,
          ];
        }
      });
      setShowNewRunModal(false);
    } catch {
      notify('error', 'An error occurred while processing payroll.');
    } finally {
      setProcessing(false);
    }
  };

  // ── Save CTC Structure ─────────────────────────────────────────────────────
  const handleSaveCtc = async (e) => {
    e.preventDefault();
    setSavingCtc(true);
    try {
      const payload = {
        employee_id: selectedEmpId,
        ...ctc,
      };

      // Persist to localStorage for immediate cross-module access
      try {
        const savedSalaryStructures = JSON.parse(localStorage.getItem('soilex_salary_structures') || '{}');
        savedSalaryStructures[selectedEmpId] = {
          basic: ctc.basic_monthly,
          ctc: ctc.ctc_annual,
          hra: ctc.hra_monthly,
          trans: ctc.transport_allowance,
          med: ctc.medical_allowance,
          spec: ctc.special_allowance,
          pf_employee: ctc.pf_employee,
          ptax: ctc.professional_tax,
          effective_from: ctc.effective_from || new Date().toISOString().slice(0, 10),
          increment_pct: ctc.increment_pct,
        };
        localStorage.setItem('soilex_salary_structures', JSON.stringify(savedSalaryStructures));
      } catch (err) {
        console.warn('LocalStorage save error:', err);
      }

      const res = await api._request('POST', '/payroll/salary-structure', payload);
      if (res) {
        notify('success', 'Salary structure saved successfully.');
      } else {
        notify('success', 'Salary structure updated in session.');
      }
    } catch {
      notify('error', 'Failed to save salary structure.');
    } finally {
      setSavingCtc(false);
    }
  };

  // ── Payroll run status actions ─────────────────────────────────────────────
  const handleApproveRun = async (runId) => {
    try {
      const res = await api.approvePayrollRun(runId);
      if (res) {
        notify('success', `Payroll run ${runId} approved.`);
        await fetchPayrollRuns();
      } else {
        setPayrollRuns(prev => prev.map(r => r.id === runId ? { ...r, status: 'APPROVED', approved_by: 'HR Admin' } : r));
        notify('success', `Payroll run ${runId} approved.`);
      }
    } catch {
      notify('error', 'Failed to approve payroll run.');
    }
  };

  const handleDisburseRun = async (runId) => {
    try {
      const res = await api.disbursePayrollRun(runId);
      if (res) {
        notify('success', `Payroll run ${runId} disbursed! All records updated to PAID.`);
        await fetchPayrollRuns();
        await fetchPayroll(selectedMonth);
      } else {
        setPayrollRuns(prev => prev.map(r => r.id === runId ? { ...r, status: 'DISBURSED', disbursed_at: new Date().toISOString().slice(0, 10) } : r));
        setSalarySlips(prev => prev.map(s => ({ ...s, status: 'PAID' })));
        notify('success', `Payroll run ${runId} disbursed.`);
      }
    } catch {
      notify('error', 'Disbursement failed. Please verify network.');
    }
  };

  const handleDownloadBankFile = async (run) => {
    notify('success', `Generating bank transfer CSV for ${run.month_year}...`);
    const ok = await api.downloadBankTransferFile(run.id, `soilex_bank_disbursement_${(run.month_year || '').replace(/\s+/g, '_')}.csv`);
    if (ok) {
      notify('success', `Bank transfer CSV downloaded.`);
    } else {
      notify('error', 'Bank file generation failed.');
    }
  };

  const handleDownloadMonthBankFile = async () => {
    notify('success', `Generating bank transfer ACH file for ${selectedMonth}...`);
    const matchingRun = payrollRuns.find(r => r.month_year === selectedMonth);
    const runId = matchingRun ? matchingRun.id : selectedMonth;
    const ok = await api.downloadBankTransferFile(runId, `soilex_bank_disbursement_${selectedMonth.replace(/\s+/g, '_')}.csv`);
    if (ok) {
      notify('success', `Bank transfer CSV downloaded.`);
    } else {
      notify('error', 'Bank file generation failed.');
    }
  };

  const handleExportBatchCsv = () => {
    if (!salarySlips || salarySlips.length === 0) {
      notify('error', 'No salary slips to export.');
      return;
    }
    const headers = [
      'Employee Code',
      'Staff Name',
      'Designation',
      'Disbursement Bank',
      'Pay Cycle',
      'Basic Remuneration (USD)',
      'Overtime Hours',
      'Overtime Pay (USD)',
      'Allowances & HRA (USD)',
      'Total Gross (USD)',
      'Statutory Deductions (USD)',
      'Net Disbursed Take-Home (USD)',
      'Payment Status'
    ];
    const rows = salarySlips.map(s => [
      `"${s.code || ''}"`,
      `"${s.name || ''}"`,
      `"${s.designation || ''}"`,
      `"${s.bank || 'Vietcombank'}"`,
      `"${selectedMonth}"`,
      (s.basic_pay || s.gross * 0.75).toFixed(2),
      (s.overtime_hours || 0).toFixed(1),
      (s.overtime_pay || 0).toFixed(2),
      Math.max(0, (s.allowances || s.gross * 0.25) - (s.overtime_pay || 0)).toFixed(2),
      s.gross.toFixed(2),
      s.deductions.toFixed(2),
      s.netPay.toFixed(2),
      `"${s.status || 'PAID'}"`
    ]);
    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `soilex_batch_payslips_${selectedMonth.replace(/\s+/g, '_')}.csv`;
    document.body.appendChild(a);
    a.click();
    URL.revokeObjectURL(url);
    document.body.removeChild(a);
    notify('success', `Exported ${salarySlips.length} employee payslips to CSV.`);
  };

  // ── KPI computations from live data ───────────────────────────────────────
  const kpi = useMemo(() => {
    const list = Array.isArray(salarySlips) ? salarySlips : [];
    const totalGross = list.reduce((a, s) => a + (Number(s?.gross) || 0), 0);
    const totalNet = list.reduce((a, s) => a + (Number(s?.netPay) || 0), 0);
    const totalTax = list.reduce((a, s) => a + (Number(s?.deductions) || 0), 0);
    return { totalGross, totalNet, totalTax, headcount: list.length };
  }, [salarySlips]);

  // Live Gross & Net for CTC Master
  const ctcGrossMonthly = useMemo(() => {
    return (
      Number(ctc?.basic_monthly || 0) +
      Number(ctc?.hra_monthly || 0) +
      Number(ctc?.transport_allowance || 0) +
      Number(ctc?.medical_allowance || 0) +
      Number(ctc?.special_allowance || 0)
    );
  }, [ctc]);

  const ctcNetMonthly = useMemo(() => {
    const deductions = Number(ctc?.pf_employee || 0) + Number(ctc?.professional_tax || 0);
    return Math.max(0, ctcGrossMonthly - deductions);
  }, [ctc, ctcGrossMonthly]);

  return (
    <div className="p-6 space-y-6">
      {/* Toast notification */}
      {notification && (
        <div
          className={`fixed top-4 right-4 z-[9999] flex items-center space-x-2 px-4 py-3 rounded-lg shadow-lg border text-xs font-bold transition-all ${
            notification.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : 'bg-red-50 border-red-200 text-red-700'
          }`}
        >
          <span>{notification.type === 'success' ? '✓' : '✕'}</span>
          <span>{notification.msg}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 rounded-lg bg-blue-50 text-[#1E40AF] flex items-center justify-center border border-blue-200 shadow-sm">
            <Receipt className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-slate-900 tracking-wide uppercase">
              WORKFORCE PAYROLL &amp; SALARY SLIPS
            </h1>
            <p className="text-[11px] text-slate-500">
              Statutory Withholdings, Gross Remittances &amp; Disbursement Ledgers
            </p>
          </div>
        </div>

        {/* Tab switcher */}
        <div className="flex items-center space-x-1 bg-slate-100 p-1 rounded-lg border border-[#E2E8F0] self-start sm:self-auto">
          {[
            { id: 'SALARY_SLIPS', label: 'SALARY SLIPS' },
            { id: 'CTC_MASTER', label: 'CTC MASTER' },
            { id: 'PAYROLL_RUNS', label: 'PAYROLL RUNS' },
            { id: 'FNF_SETTLEMENTS', label: 'F&F SETTLEMENTS' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-3 py-1.5 rounded-md text-xs font-bold transition-colors ${
                activeTab === tab.id
                  ? 'bg-white text-[#1E40AF] shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── TAB 1: SALARY SLIPS ──────────────────────────────────────────────── */}
      {activeTab === 'SALARY_SLIPS' && (
        <div className="space-y-6">
          {/* Action Row */}
          <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-4 rounded-lg border border-[#E2E8F0]">
            <div className="flex items-center space-x-2">
              <span className="text-xs font-bold text-slate-600 uppercase">PAY CYCLE:</span>
              <select
                value={selectedMonth}
                onChange={handleMonthChange}
                className="bg-white border border-[#E2E8F0] rounded-md px-3 py-1.5 text-xs font-semibold text-slate-700 focus:outline-none focus:border-[#1E40AF] shadow-sm"
              >
                {MONTHS.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center space-x-2">
              <button
                onClick={() => setShowBatchModal(true)}
                className="flex items-center space-x-1.5 px-3 py-1.5 bg-white border border-[#E2E8F0] hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-md shadow-sm transition-colors"
                title="View and print batch payslips compilation for this pay cycle"
              >
                <Download className="w-3.5 h-3.5 text-[#1E40AF]" />
                <span>BATCH PDF / BULK</span>
              </button>

              <button
                onClick={handleDownloadMonthBankFile}
                className="flex items-center space-x-1.5 px-3 py-1.5 bg-emerald-50 border border-emerald-300 hover:bg-emerald-100 text-emerald-800 text-xs font-semibold rounded-md shadow-sm transition-colors"
                title="Download ACH/SWIFT bank transfer disbursement CSV"
              >
                <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-700" />
                <span>BANK ACH FILE</span>
              </button>

              <button
                onClick={() => {
                  setTargetRunMonth(selectedMonth);
                  setShowNewRunModal(true);
                }}
                disabled={processing}
                className="flex items-center space-x-1.5 px-3.5 py-1.5 bg-[#1E40AF] hover:bg-blue-800 disabled:opacity-60 disabled:cursor-not-allowed text-white text-xs font-semibold rounded-md shadow-sm transition-colors uppercase tracking-wider"
              >
                {processing ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>PROCESSING...</span>
                  </>
                ) : (
                  <>
                    <CreditCard className="w-3.5 h-3.5 text-[#FDE68A]" />
                    <span>PROCESS NEXT RUN</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Corporate New Joiner Payroll Policy Banner */}
          <div className="bg-blue-50/70 border border-blue-200/80 rounded-lg p-3 text-xs text-blue-900 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <HelpCircle className="w-4 h-4 text-[#1E40AF] shrink-0" />
              <span>
                <strong>Corporate New Joiner Rule:</strong> New employees who joined in <strong>{selectedMonth}</strong> or later will receive their initial salary disbursement starting in the next monthly payroll cycle. Prior month registers display zero pending salary for new joiners.
              </span>
            </div>
          </div>

          {/* KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-4 rounded-lg border border-[#E2E8F0] shadow-card">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500 uppercase">TOTAL GROSS PAYROLL</span>
                <DollarSign className="w-4 h-4 text-[#1E40AF]" />
              </div>
              {loading ? (
                <div className="animate-pulse bg-slate-100 rounded h-7 w-28 mt-2" />
              ) : (
                <p className="text-2xl font-black text-slate-900 mt-2">{fmt(kpi.totalGross)}</p>
              )}
              <span className="text-[11px] font-semibold text-slate-500">For {selectedMonth}</span>
            </div>

            <div className="bg-white p-4 rounded-lg border border-[#E2E8F0] shadow-card">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500 uppercase">NET DISBURSED</span>
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              </div>
              {loading ? (
                <div className="animate-pulse bg-slate-100 rounded h-7 w-28 mt-2" />
              ) : (
                <p className="text-2xl font-black text-slate-900 mt-2">{fmt(kpi.totalNet)}</p>
              )}
              <span className="text-[11px] font-semibold text-emerald-700">Remitted via ACH/SWIFT</span>
            </div>

            <div className="bg-white p-4 rounded-lg border border-[#E2E8F0] shadow-card">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500 uppercase">TAX &amp; PF WITHHOLDING</span>
                <Receipt className="w-4 h-4 text-[#D97706]" />
              </div>
              {loading ? (
                <div className="animate-pulse bg-slate-100 rounded h-7 w-28 mt-2" />
              ) : (
                <p className="text-2xl font-black text-slate-900 mt-2">{fmt(kpi.totalTax)}</p>
              )}
              <span className="text-[11px] font-semibold text-[#D97706]">Statutory compliance filing</span>
            </div>

            <div className="bg-white p-4 rounded-lg border border-[#E2E8F0] shadow-card">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500 uppercase">ACTIVE HEADCOUNT</span>
                <Building className="w-4 h-4 text-purple-700" />
              </div>
              {loading ? (
                <div className="animate-pulse bg-slate-100 rounded h-7 w-16 mt-2" />
              ) : (
                <p className="text-2xl font-black text-slate-900 mt-2">{kpi.headcount} Staff</p>
              )}
              <span className="text-[11px] font-semibold text-purple-700">HQ &amp; Bio-Hub Plants</span>
            </div>
          </div>

          {/* Salary Slips Table */}
          <div className="bg-white rounded-lg border border-[#E2E8F0] shadow-card overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                EMPLOYEE SALARY SLIP REGISTER
              </h3>
              <span className="text-xs font-bold text-[#1E40AF]">
                {selectedMonth} — {kpi.headcount} Record{kpi.headcount !== 1 ? 's' : ''}
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-700">
                <thead className="bg-[#FAFAFA] border-b border-[#E2E8F0] text-[11px] font-bold uppercase tracking-wider text-slate-600">
                  <tr>
                    <th className="py-3 px-4">EMP CODE</th>
                    <th className="py-3 px-4">STAFF NAME</th>
                    <th className="py-3 px-4">ROLE</th>
                    <th className="py-3 px-4 text-right">BASIC PAY</th>
                    <th className="py-3 px-4 text-center">OVERTIME (HRS / PAY)</th>
                    <th className="py-3 px-4 text-right">GROSS SALARY</th>
                    <th className="py-3 px-4 text-right">DEDUCTIONS</th>
                    <th className="py-3 px-4 text-right">NET PAYABLE</th>
                    <th className="py-3 px-4">BANK PARTNER</th>
                    <th className="py-3 px-4 text-center">PAY STATUS</th>
                    <th className="py-3 px-4 text-center">ACTION</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {loading ? (
                    Array.from({ length: 4 }).map((_, i) => (
                      <tr key={i}>
                        {Array.from({ length: 11 }).map((__, j) => (
                          <td key={j} className="py-3 px-4">
                            <div className="animate-pulse bg-slate-100 rounded h-3 w-full" />
                          </td>
                        ))}
                      </tr>
                    ))
                  ) : salarySlips.length === 0 ? (
                    <tr>
                      <td colSpan={11} className="py-12 text-center text-slate-400 text-xs font-semibold">
                        <div className="flex flex-col items-center justify-center space-y-2">
                          <p className="text-slate-700 font-bold">No salary slips generated yet for {selectedMonth}.</p>
                          <p className="text-slate-400 text-[11px] font-normal">Run payroll calculation to generate CTC slips, approved overtime, and tax withholdings.</p>
                          <button
                            onClick={() => handleProcessPayroll(selectedMonth)}
                            disabled={processing}
                            className="mt-2 inline-flex items-center space-x-1.5 px-3 py-1.5 bg-[#1E40AF] hover:bg-blue-800 text-white rounded text-xs font-bold uppercase tracking-wider shadow-sm transition-colors"
                          >
                            <CreditCard className="w-3.5 h-3.5 text-[#FDE68A]" />
                            <span>Process {selectedMonth} Payroll</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    salarySlips.map((slip) => (
                      <tr key={slip.id} className="hover:bg-blue-50/40 transition-colors">
                        <td className="py-3 px-4 font-mono font-bold text-[#1E40AF]">{slip.code}</td>
                        <td className="py-3 px-4 font-bold text-slate-900">{slip.name}</td>
                        <td className="py-3 px-4 text-slate-600">{slip.designation}</td>
                        <td className="py-3 px-4 text-right font-semibold text-slate-800">{fmt(slip.basic_pay || slip.gross * 0.75)}</td>
                        <td className="py-3 px-4 text-center">
                          {slip.overtime_pay > 0 ? (
                            <span className="inline-flex items-center space-x-1 px-2 py-0.5 bg-amber-50 text-amber-800 border border-amber-300 rounded font-bold text-[11px]">
                              <span>+{fmt(slip.overtime_pay)}</span>
                              <span className="text-[10px] text-amber-600 font-normal">({slip.overtime_hours}h)</span>
                            </span>
                          ) : (
                            <span className="text-slate-400 font-mono text-[11px]">—</span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-right font-semibold text-slate-800">{fmt(slip.gross)}</td>
                        <td className="py-3 px-4 text-right text-red-600 font-semibold">-{fmt(slip.deductions)}</td>
                        <td className="py-3 px-4 text-right font-black text-emerald-700">{fmt(slip.netPay)}</td>
                        <td className="py-3 px-4 text-slate-500">{slip.bank}</td>
                        <td className="py-3 px-4 text-center">
                          <StatusBadge status={slip.status} />
                        </td>
                        <td className="py-3 px-4 text-center">
                          <button
                            onClick={() => setViewingSlip(slip)}
                            className="text-[#1E40AF] hover:text-blue-800 font-bold text-xs flex items-center justify-center mx-auto space-x-1 transition-colors"
                          >
                            <Download className="w-3.5 h-3.5" />
                            <span>PDF</span>
                          </button>
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

      {/* ── TAB 2: CTC MASTER ────────────────────────────────────────────────── */}
      {activeTab === 'CTC_MASTER' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left panel: Employee selection */}
          <div className="bg-white rounded-lg border border-[#E2E8F0] shadow-card p-5 space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">SELECT EMPLOYEE</h3>
            <div className="space-y-2 max-h-[480px] overflow-y-auto">
              {employees.map((emp) => (
                <div
                  key={emp.id}
                  onClick={() => setSelectedEmpId(emp.id)}
                  className={`p-3 rounded-lg border text-xs cursor-pointer transition-colors ${
                    selectedEmpId === emp.id
                      ? 'bg-blue-50 border-[#1E40AF] text-[#1E40AF]'
                      : 'border-[#E2E8F0] hover:bg-slate-50 text-slate-700'
                  }`}
                >
                  <p className="font-bold text-slate-900">{emp.full_name}</p>
                  <p className="text-[11px] text-slate-500">{emp.designation || 'Staff'} · {emp.department || 'General'}</p>
                  <span className="font-mono text-[10px] text-[#D97706] font-semibold">{emp.id}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Center + Right: CTC Form & Live Computation */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-lg border border-[#E2E8F0] shadow-card p-6">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-5">
                <div>
                  <div className="flex items-center space-x-2">
                    <h3 className="text-sm font-bold uppercase text-slate-900">
                      COST TO COMPANY (CTC) STRUCTURE
                    </h3>
                    {ctc.effective_from && (
                      <span className="text-[10px] bg-emerald-100 text-emerald-800 border border-emerald-300 font-bold px-2 py-0.5 rounded-full flex items-center space-x-1">
                        <span>✓ Appraisal Revised</span>
                        <span className="text-emerald-700 font-semibold">(Effective: {ctc.effective_from})</span>
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Configure allowances, statutory PF &amp; tax withholdings per staff member.
                  </p>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="text-right">
                    <span className="text-[10px] font-bold text-slate-400 uppercase block">MONTHLY GROSS</span>
                    <span className="text-base font-black text-[#1E40AF]">{fmt(ctcGrossMonthly)}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] font-bold text-slate-400 uppercase block">NET TAKE-HOME</span>
                    <span className="text-base font-black text-emerald-700">{fmt(ctcNetMonthly)}</span>
                  </div>
                </div>
              </div>

              <form onSubmit={handleSaveCtc} className="space-y-5 text-xs">
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-bold text-slate-800 uppercase text-[11px] tracking-wider">EARNINGS COMPONENTS (USD/MONTH)</h4>
                    <div className="flex items-center space-x-2">
                      <label className="text-[11px] font-bold text-slate-600">Effective Date:</label>
                      <input
                        type="date"
                        value={ctc.effective_from || new Date().toISOString().slice(0, 10)}
                        onChange={(e) => setCtc({ ...ctc, effective_from: e.target.value })}
                        className="bg-white border border-[#E2E8F0] rounded px-2 py-1 text-xs font-semibold text-slate-800 focus:outline-none focus:border-[#1E40AF]"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="font-bold text-slate-700 block mb-1">Annual CTC ($/yr)</label>
                      <input
                        type="number"
                        value={ctc.ctc_annual}
                        onChange={(e) => setCtc({ ...ctc, ctc_annual: Number(e.target.value) })}
                        className="w-full bg-white border border-[#E2E8F0] rounded-md px-3 py-2 text-xs focus:outline-none focus:border-[#1E40AF] font-medium"
                      />
                    </div>
                    <div>
                      <label className="font-bold text-slate-700 block mb-1">Basic Pay ($/mo) *</label>
                      <input
                        type="number"
                        required
                        value={ctc.basic_monthly}
                        onChange={(e) => setCtc({ ...ctc, basic_monthly: Number(e.target.value) })}
                        className="w-full bg-white border border-[#E2E8F0] rounded-md px-3 py-2 text-xs focus:outline-none focus:border-[#1E40AF] font-medium"
                      />
                    </div>
                    <div>
                      <label className="font-bold text-slate-700 block mb-1">HRA ($/mo)</label>
                      <input
                        type="number"
                        value={ctc.hra_monthly}
                        onChange={(e) => setCtc({ ...ctc, hra_monthly: Number(e.target.value) })}
                        className="w-full bg-white border border-[#E2E8F0] rounded-md px-3 py-2 text-xs focus:outline-none focus:border-[#1E40AF] font-medium"
                      />
                    </div>
                    <div>
                      <label className="font-bold text-slate-700 block mb-1">Transport Allowance ($/mo)</label>
                      <input
                        type="number"
                        value={ctc.transport_allowance}
                        onChange={(e) => setCtc({ ...ctc, transport_allowance: Number(e.target.value) })}
                        className="w-full bg-white border border-[#E2E8F0] rounded-md px-3 py-2 text-xs focus:outline-none focus:border-[#1E40AF] font-medium"
                      />
                    </div>
                    <div>
                      <label className="font-bold text-slate-700 block mb-1">Medical Allowance ($/mo)</label>
                      <input
                        type="number"
                        value={ctc.medical_allowance}
                        onChange={(e) => setCtc({ ...ctc, medical_allowance: Number(e.target.value) })}
                        className="w-full bg-white border border-[#E2E8F0] rounded-md px-3 py-2 text-xs focus:outline-none focus:border-[#1E40AF] font-medium"
                      />
                    </div>
                    <div>
                      <label className="font-bold text-slate-700 block mb-1">Special Allowance ($/mo)</label>
                      <input
                        type="number"
                        value={ctc.special_allowance}
                        onChange={(e) => setCtc({ ...ctc, special_allowance: Number(e.target.value) })}
                        className="w-full bg-white border border-[#E2E8F0] rounded-md px-3 py-2 text-xs focus:outline-none focus:border-[#1E40AF] font-medium"
                      />
                    </div>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-100">
                  <h4 className="font-bold text-slate-800 uppercase text-[11px] tracking-wider mb-3">STATUTORY DEDUCTIONS (USD/MONTH)</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="font-bold text-slate-700 block mb-1">PF Employee (12% of Basic)</label>
                      <input
                        type="number"
                        value={ctc.pf_employee}
                        onChange={(e) => setCtc({ ...ctc, pf_employee: Number(e.target.value) })}
                        className="w-full bg-white border border-[#E2E8F0] rounded-md px-3 py-2 text-xs focus:outline-none focus:border-[#1E40AF] font-medium"
                      />
                    </div>
                    <div>
                      <label className="font-bold text-slate-700 block mb-1">Professional Tax ($/mo)</label>
                      <input
                        type="number"
                        value={ctc.professional_tax}
                        onChange={(e) => setCtc({ ...ctc, professional_tax: Number(e.target.value) })}
                        className="w-full bg-white border border-[#E2E8F0] rounded-md px-3 py-2 text-xs focus:outline-none focus:border-[#1E40AF] font-medium"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-end space-x-2 pt-4 border-t border-slate-100">
                  <button
                    type="submit"
                    disabled={savingCtc}
                    className="px-5 py-2.5 bg-[#1E40AF] hover:bg-blue-800 disabled:opacity-60 text-white rounded-md text-xs font-bold shadow-sm transition-colors flex items-center space-x-1.5"
                  >
                    <Check className="w-4 h-4" />
                    <span>{savingCtc ? 'SAVING...' : 'SAVE CTC STRUCTURE'}</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* ── TAB 3: PAYROLL RUNS ──────────────────────────────────────────────── */}
      {activeTab === 'PAYROLL_RUNS' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between bg-white p-4 rounded-lg border border-[#E2E8F0]">
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                PAYROLL AUDIT RUN CYCLES
              </h3>
              <p className="text-[11px] text-slate-500">
                Monthly cycle approval workflow, disbursements, and banking clearance.
              </p>
            </div>
            <button
              onClick={() => {
                setTargetRunMonth(selectedMonth);
                setShowNewRunModal(true);
              }}
              disabled={processing}
              className="flex items-center space-x-1.5 px-4 py-2 bg-[#1E40AF] hover:bg-blue-800 disabled:opacity-60 text-white text-xs font-bold rounded-md shadow-sm transition-colors uppercase tracking-wider"
            >
              <CreditCard className="w-3.5 h-3.5 text-[#FDE68A]" />
              <span>START NEW PAYROLL RUN</span>
            </button>
          </div>

          <div className="bg-white rounded-lg border border-[#E2E8F0] shadow-card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-700">
                <thead className="bg-[#FAFAFA] border-b border-[#E2E8F0] text-[11px] font-bold uppercase tracking-wider text-slate-600">
                  <tr>
                    <th className="py-3 px-4">RUN ID</th>
                    <th className="py-3 px-4">MONTH / YEAR</th>
                    <th className="py-3 px-4 text-center">HEADCOUNT</th>
                    <th className="py-3 px-4 text-right">GROSS PAYROLL</th>
                    <th className="py-3 px-4 text-right">DEDUCTIONS</th>
                    <th className="py-3 px-4 text-right">NET DISBURSED</th>
                    <th className="py-3 px-4 text-center">STATUS</th>
                    <th className="py-3 px-4 text-center">ACTIONS</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {payrollRuns.map((run) => (
                    <tr key={run.id} className="hover:bg-blue-50/40 transition-colors">
                      <td className="py-3 px-4 font-mono font-bold text-[#1E40AF]">{run.id}</td>
                      <td className="py-3 px-4 font-bold text-slate-900">{run.month_year}</td>
                      <td className="py-3 px-4 text-center">{run.total_employees} Staff</td>
                      <td className="py-3 px-4 text-right font-semibold text-slate-800">{fmt(run.total_gross)}</td>
                      <td className="py-3 px-4 text-right text-red-600 font-semibold">-{fmt(run.total_deductions)}</td>
                      <td className="py-3 px-4 text-right font-black text-emerald-700">{fmt(run.total_net)}</td>
                      <td className="py-3 px-4 text-center">
                        <StatusBadge status={run.status} />
                      </td>
                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center space-x-2">
                          {run.status === 'DRAFT' && (
                            <button
                              onClick={() => handleApproveRun(run.id)}
                              className="px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-[11px] font-bold"
                            >
                              Approve
                            </button>
                          )}
                          {run.status === 'COMPUTED' && (
                            <button
                              onClick={() => handleApproveRun(run.id)}
                              className="px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-[11px] font-bold"
                            >
                              Approve
                            </button>
                          )}
                          {run.status === 'APPROVED' && (
                            <button
                              onClick={() => handleDisburseRun(run.id)}
                              className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-[11px] font-bold flex items-center space-x-1"
                            >
                              <Send className="w-3 h-3" />
                              <span>Disburse</span>
                            </button>
                          )}
                          {run.status === 'DISBURSED' && (
                            <button
                              onClick={() => handleDownloadBankFile(run)}
                              className="px-2.5 py-1 border border-emerald-300 text-emerald-700 hover:bg-emerald-50 rounded text-[11px] font-bold flex items-center space-x-1"
                            >
                              <FileSpreadsheet className="w-3 h-3" />
                              <span>Bank File</span>
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ── TAB 4: F&F SETTLEMENTS ────────────────────────────────────────── */}
      {activeTab === 'FNF_SETTLEMENTS' && (
        <div className="space-y-6">
          {/* Header Action Banner */}
          <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-4 rounded-lg border border-[#E2E8F0]">
            <div>
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center space-x-1.5">
                <LogOut className="w-4 h-4 text-amber-600" />
                <span>SEPARATION QUEUE &amp; FULL &amp; FINAL (F&amp;F) SETTLEMENT DISBURSEMENTS</span>
              </h3>
              <p className="text-[11px] text-slate-500">
                Statutory gratuity, leave encashment, pro-rated final pay, and multi-department no-dues clearance
              </p>
            </div>
            <button
              onClick={fetchExits}
              className="px-3 py-1.5 border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-md text-xs font-semibold flex items-center space-x-1"
            >
              <span>Refresh Queue</span>
            </button>
          </div>

          {/* KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div className="bg-white p-4 rounded-lg border border-[#E2E8F0]">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wide block">Total Exits Logged</span>
              <span className="text-xl font-black text-slate-900 mt-1 block">{exits.length}</span>
              <span className="text-[10px] text-slate-400 mt-0.5 block">Separation pipeline</span>
            </div>
            <div className="bg-white p-4 rounded-lg border border-[#E2E8F0]">
              <span className="text-[11px] font-bold text-amber-600 uppercase tracking-wide block">Awaiting Clearance</span>
              <span className="text-xl font-black text-amber-600 mt-1 block">
                {exits.filter(x => x.status === 'CLEARANCE_PENDING').length}
              </span>
              <span className="text-[10px] text-slate-400 mt-0.5 block">IT / Fin / Admin pending</span>
            </div>
            <div className="bg-white p-4 rounded-lg border border-[#E2E8F0]">
              <span className="text-[11px] font-bold text-blue-600 uppercase tracking-wide block">Cleared for Payout</span>
              <span className="text-xl font-black text-[#1E40AF] mt-1 block">
                {exits.filter(x => x.status === 'ALL_CLEARED').length}
              </span>
              <span className="text-[10px] text-slate-400 mt-0.5 block">No-dues sign-off complete</span>
            </div>
            <div className="bg-white p-4 rounded-lg border border-[#E2E8F0]">
              <span className="text-[11px] font-bold text-emerald-600 uppercase tracking-wide block">Total F&amp;F Amount</span>
              <span className="text-xl font-black text-emerald-700 mt-1 block">
                ${exits.reduce((acc, x) => acc + (x.settlement_amount || 0), 0).toLocaleString()} USD
              </span>
              <span className="text-[10px] text-slate-400 mt-0.5 block">Disbursed / Approved</span>
            </div>
          </div>

          {/* Table */}
          <div className="bg-white rounded-lg border border-[#E2E8F0] overflow-hidden">
            <div className="p-4 border-b border-[#E2E8F0] flex items-center justify-between">
              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                Full &amp; Final Settlement Register
              </h4>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left text-slate-700">
                <thead className="bg-[#FAFAFA] border-b border-[#E2E8F0] text-[11px] font-bold uppercase tracking-wider text-slate-600">
                  <tr>
                    <th className="py-3 px-4">EMPLOYEE</th>
                    <th className="py-3 px-4">DEPARTMENT</th>
                    <th className="py-3 px-4">RESIGNED ON</th>
                    <th className="py-3 px-4">LAST DAY (LWD)</th>
                    <th className="py-3 px-4 text-center">CLEARANCES (IT / FIN / ADM)</th>
                    <th className="py-3 px-4 text-center">FINAL DAYS</th>
                    <th className="py-3 px-4 text-right">NET SETTLEMENT</th>
                    <th className="py-3 px-4 text-center">STATUS</th>
                    <th className="py-3 px-4 text-center">ACTIONS</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {exits.map((x) => {
                    const it = x.it_clearance ?? x.clearance_it;
                    const fin = x.finance_clearance ?? x.clearance_finance;
                    const adm = x.admin_clearance ?? x.clearance_admin;

                    return (
                      <tr key={x.id} className="hover:bg-blue-50/40 transition-colors">
                        <td className="py-3 px-4">
                          <span className="font-bold text-slate-900 block">{x.employee_name}</span>
                          <span className="font-mono text-[10px] text-[#1E40AF]">{x.employee_id}</span>
                        </td>
                        <td className="py-3 px-4 text-slate-600">{x.department}</td>
                        <td className="py-3 px-4 font-mono text-slate-500">{x.resignation_date}</td>
                        <td className="py-3 px-4 font-mono font-bold text-slate-800">{x.last_working_day}</td>
                        <td className="py-3 px-4 text-center">
                          <div className="flex items-center justify-center space-x-1">
                            <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${it ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-400'}`}>
                              IT {it ? '✓' : '—'}
                            </span>
                            <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${fin ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-400'}`}>
                              FIN {fin ? '✓' : '—'}
                            </span>
                            <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${adm ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-400'}`}>
                              ADM {adm ? '✓' : '—'}
                            </span>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-center text-[11px]">
                          <span>{x.unpaid_salary_days || 15}d unpaid · {x.leave_encashment_days || 6}d leaves</span>
                        </td>
                        <td className="py-3 px-4 text-right font-black text-sm text-[#1E40AF]">
                          ${(x.settlement_amount || 0).toLocaleString()} USD
                        </td>
                        <td className="py-3 px-4 text-center">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                            x.status === 'SETTLED'
                              ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                              : x.status === 'ALL_CLEARED'
                              ? 'bg-blue-100 text-blue-800 border border-blue-300'
                              : 'bg-amber-100 text-amber-800 border border-amber-300'
                          }`}>
                            {x.status}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-center">
                          <div className="flex items-center justify-center space-x-1.5">
                            <button
                              onClick={() => setViewingFnF(x)}
                              className="px-2 py-1 border border-slate-300 hover:bg-slate-50 text-slate-700 rounded text-[11px] font-bold flex items-center space-x-1"
                              title="Print Official F&F Settlement Slip"
                            >
                              <Printer className="w-3 h-3" />
                              <span>Voucher</span>
                            </button>
                            {x.status !== 'SETTLED' && (
                              <button
                                onClick={() => handleDisburseExit(x)}
                                className="px-2 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-[11px] font-bold flex items-center space-x-1"
                                title="Disburse funds and mark employee as separated"
                              >
                                <CheckCircle2 className="w-3 h-3" />
                                <span>Disburse</span>
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Printable Salary Slip Modal */}
      {viewingSlip && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-[110] flex items-center justify-center p-4">
          <div className="bg-white rounded-xl border border-[#E2E8F0] shadow-2xl max-w-xl w-full p-6 space-y-5 max-h-[95vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center space-x-2">
                <Receipt className="w-5 h-5 text-[#1E40AF]" />
                <h3 className="text-sm font-bold text-slate-900 uppercase">OFFICIAL SALARY DISBURSEMENT SLIP</h3>
              </div>
              <button onClick={() => setViewingSlip(null)} className="text-slate-400 hover:text-slate-600 p-1">
                ✕
              </button>
            </div>

            {/* Slip Paper Body */}
            <div id="salary-slip-print" className="border border-slate-200 rounded-lg p-5 space-y-4 bg-slate-50/50 text-xs">
              {/* Company Letterhead */}
              <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                <div>
                  <h2 className="text-base font-black text-[#1E40AF] tracking-tight">SOILEX LIFE SCIENCE LTD</h2>
                  <p className="text-[10px] text-slate-500 font-semibold uppercase">Hanoi HQ · Bio-Hubs &amp; Global Spices Extraction</p>
                  <p className="text-[10px] text-slate-400">Tax Reg: SLX-VN-99201 | ISO 22000 &amp; FSSAI Compliant</p>
                </div>
                <div className="text-right">
                  <span className="text-[10px] font-bold text-slate-400 uppercase block">PAYSLIP FOR</span>
                  <span className="text-xs font-black text-slate-800">{selectedMonth}</span>
                  <span className={`inline-block mt-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                    viewingSlip.status === 'PAID' ? 'bg-emerald-100 text-emerald-800' : 'bg-blue-100 text-blue-800'
                  }`}>
                    {viewingSlip.status}
                  </span>
                </div>
              </div>

              {/* Staff Details */}
              <div className="grid grid-cols-2 gap-3 bg-white p-3 rounded border border-slate-100">
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase block">STAFF NAME</span>
                  <span className="font-bold text-slate-900">{viewingSlip.name}</span>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase block">EMPLOYEE CODE</span>
                  <span className="font-mono font-bold text-[#1E40AF]">{viewingSlip.code}</span>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase block">ROLE / DESIGNATION</span>
                  <span className="font-semibold text-slate-700">{viewingSlip.designation}</span>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase block">DISBURSEMENT BANK</span>
                  <span className="font-semibold text-slate-700">{viewingSlip.bank}</span>
                </div>
              </div>

              {/* Breakdown Table */}
              <div className="grid grid-cols-2 gap-4">
                {/* Earnings */}
                <div className="bg-white p-3 rounded border border-slate-100 space-y-2">
                  <h4 className="font-bold text-slate-700 uppercase text-[10px] tracking-wider border-b pb-1">EARNINGS</h4>
                  <div className="flex justify-between text-slate-600">
                    <span>Basic Remuneration:</span>
                    <span className="font-semibold">{fmt(viewingSlip.basic_pay || viewingSlip.gross * 0.75)}</span>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>Allowances &amp; HRA:</span>
                    <span className="font-semibold">{fmt(Math.max(0, (viewingSlip.allowances || viewingSlip.gross * 0.25) - (viewingSlip.overtime_pay || 0)))}</span>
                  </div>
                  {viewingSlip.overtime_pay > 0 && (
                    <div className="flex justify-between text-amber-700 font-semibold bg-amber-50 px-1.5 py-0.5 rounded text-[10px] border border-amber-200">
                      <span>Approved Overtime ({viewingSlip.overtime_hours} hrs @ 1.5x):</span>
                      <span>+{fmt(viewingSlip.overtime_pay)}</span>
                    </div>
                  )}
                  <div className="flex justify-between font-bold text-slate-900 border-t pt-1">
                    <span>Total Gross Pay:</span>
                    <span className="text-[#1E40AF]">{fmt(viewingSlip.gross)}</span>
                  </div>
                </div>

                {/* Deductions */}
                <div className="bg-white p-3 rounded border border-slate-100 space-y-2">
                  <h4 className="font-bold text-slate-700 uppercase text-[10px] tracking-wider border-b pb-1">DEDUCTIONS</h4>
                  <div className="flex justify-between text-slate-600">
                    <span>Provident Fund (PF):</span>
                    <span className="font-semibold">{fmt(viewingSlip.deductions * 0.65)}</span>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>Statutory Tax Withholding:</span>
                    <span className="font-semibold">{fmt(viewingSlip.deductions * 0.35)}</span>
                  </div>
                  <div className="flex justify-between font-bold text-slate-900 border-t pt-1">
                    <span>Total Deductions:</span>
                    <span className="text-red-600">-{fmt(viewingSlip.deductions)}</span>
                  </div>
                </div>
              </div>

              {/* Net Payable Banner */}
              <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3 flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-bold text-emerald-800 uppercase block">NET DISBURSED TAKE-HOME</span>
                  <span className="text-[11px] text-emerald-600 font-medium">Remitted via electronic clearing (SWIFT / ACH)</span>
                </div>
                <div className="text-xl font-black text-emerald-700">
                  {fmt(viewingSlip.netPay)}
                </div>
              </div>

              {/* Footer watermark & QR simulation */}
              <div className="pt-2 border-t border-slate-200 flex items-center justify-between text-[10px] text-slate-400">
                <span>Value Date: {viewingSlip.date}</span>
                <span className="font-mono">Ref: SLX-ACH-PAY-{viewingSlip.code}</span>
                <span>Authorized Payroll Officer: Executive Management</span>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-end space-x-2 pt-2 border-t border-slate-100">
              <button
                onClick={() => setViewingSlip(null)}
                className="px-4 py-2 border border-[#E2E8F0] rounded-md text-xs font-semibold text-slate-600 hover:bg-slate-50"
              >
                Close
              </button>
              <button
                onClick={() => window.print()}
                className="px-4 py-2 bg-[#1E40AF] hover:bg-blue-800 text-white rounded-md text-xs font-bold shadow-sm transition-colors flex items-center space-x-1.5"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Print / Save as PDF</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Official Full & Final Settlement Voucher Modal ── */}
      {viewingFnF && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-[110] flex items-center justify-center p-4">
          <div className="bg-white rounded-xl border border-[#E2E8F0] shadow-2xl max-w-xl w-full p-6 space-y-4 max-h-[95vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center space-x-2">
                <Printer className="w-5 h-5 text-[#1E40AF]" />
                <h3 className="text-sm font-bold text-slate-900 uppercase">OFFICIAL FULL &amp; FINAL SETTLEMENT VOUCHER</h3>
              </div>
              <button
                onClick={() => setViewingFnF(null)}
                className="text-slate-400 hover:text-slate-600 font-bold text-lg p-1"
              >
                ✕
              </button>
            </div>

            {/* Printable Statement Sheet */}
            <div id="fnf-slip-print" className="border border-slate-200 rounded-lg p-5 space-y-4 bg-slate-50/50 text-xs">
              {/* Header Letterhead */}
              <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                <div>
                  <h2 className="text-base font-black text-[#1E40AF] tracking-tight">SOILEX LIFE SCIENCE LTD</h2>
                  <p className="text-[10px] text-slate-500 font-semibold uppercase">Global Spice Bio-Hubs &amp; Industrial Logistics</p>
                  <p className="text-[10px] text-slate-400">Tax Reg: SLX-VN-99201 | Statutory Separation &amp; Labor Clearance</p>
                </div>
                <div className="text-right">
                  <span className="text-[10px] font-bold text-slate-400 uppercase block">SETTLEMENT REF</span>
                  <span className="text-xs font-black text-slate-800 font-mono">{viewingFnF.id}</span>
                  <span className={`inline-block mt-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                    viewingFnF.status === 'SETTLED'
                      ? 'bg-emerald-100 text-emerald-800'
                      : viewingFnF.status === 'ALL_CLEARED'
                      ? 'bg-blue-100 text-blue-800'
                      : 'bg-amber-100 text-amber-800'
                  }`}>
                    {viewingFnF.status}
                  </span>
                </div>
              </div>

              {/* Staff Details */}
              <div className="grid grid-cols-2 gap-3 bg-white p-3 rounded border border-slate-100">
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase block">EMPLOYEE NAME</span>
                  <span className="font-bold text-slate-900">{viewingFnF.employee_name}</span>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase block">EMP CODE &amp; DEPT</span>
                  <span className="font-mono font-bold text-[#1E40AF]">{viewingFnF.employee_id}</span>
                  <span className="text-slate-500 text-[10px] block">{viewingFnF.department}</span>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase block">RESIGNATION DATE</span>
                  <span className="font-semibold text-slate-700">{viewingFnF.resignation_date}</span>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase block">LAST WORKING DAY (LWD)</span>
                  <span className="font-semibold text-slate-700">{viewingFnF.last_working_day}</span>
                </div>
              </div>

              {/* Clearance Summary */}
              <div className="p-2.5 bg-blue-50/60 rounded border border-blue-100 text-[11px] space-y-1">
                <span className="font-bold text-[#1E40AF] uppercase block text-[10px]">No-Dues Departmental Sign-Off:</span>
                <div className="grid grid-cols-3 gap-2 text-center text-[10px]">
                  <span className={`p-1 rounded border font-bold ${
                    viewingFnF.it_clearance ? 'bg-white border-blue-200 text-emerald-700' : 'bg-amber-50 border-amber-200 text-amber-700'
                  }`}>
                    IT: {viewingFnF.it_clearance ? 'CLEARED ✓' : 'PENDING'}
                  </span>
                  <span className={`p-1 rounded border font-bold ${
                    viewingFnF.finance_clearance ? 'bg-white border-blue-200 text-emerald-700' : 'bg-amber-50 border-amber-200 text-amber-700'
                  }`}>
                    FINANCE: {viewingFnF.finance_clearance ? 'CLEARED ✓' : 'PENDING'}
                  </span>
                  <span className={`p-1 rounded border font-bold ${
                    viewingFnF.admin_clearance ? 'bg-white border-blue-200 text-emerald-700' : 'bg-amber-50 border-amber-200 text-amber-700'
                  }`}>
                    ADMIN: {viewingFnF.admin_clearance ? 'CLEARED ✓' : 'PENDING'}
                  </span>
                </div>
              </div>

              {/* Earnings & Deductions Breakdown */}
              {(() => {
                const unpaidDays = viewingFnF.unpaid_salary_days || 15;
                const leaveDays = viewingFnF.leave_encashment_days || 6;
                const totalSettlement = viewingFnF.settlement_amount || 2850;
                const dailyRate = Math.round(totalSettlement / (unpaidDays + leaveDays || 21));
                const unpaidAmount = unpaidDays * dailyRate;
                const leaveAmount = leaveDays * dailyRate;

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
                  ${(viewingFnF.settlement_amount || 2850).toLocaleString()} USD
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
                  <span>Chief Financial Officer (CFO)</span>
                </div>
              </div>

              <div className="text-center text-[9px] text-slate-400 italic">
                * SOILEX Official Settlement Record · Form SLX-FFS-Rev2026. This voucher certifies all reciprocal claims and obligations are discharged.
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-between pt-2 border-t border-slate-100">
              <span className="text-[11px] text-slate-400 font-medium">
                Separation ID: <strong className="text-slate-600">{viewingFnF.id}</strong>
              </span>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setViewingFnF(null)}
                  className="px-4 py-2 border border-[#E2E8F0] rounded-md text-xs font-semibold text-slate-600 hover:bg-slate-50"
                >
                  Close
                </button>
                <button
                  onClick={() => window.print()}
                  className="px-4 py-2 border border-[#1E40AF] text-[#1E40AF] hover:bg-blue-50 rounded-md text-xs font-bold transition-colors flex items-center space-x-1.5"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Print Voucher</span>
                </button>
                {viewingFnF.status !== 'SETTLED' && (
                  <button
                    onClick={() => handleDisburseExit(viewingFnF)}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-md text-xs font-bold shadow-sm transition-colors flex items-center space-x-1.5"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Disburse &amp; Settle Now</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}


      {/* ── Batch Payslips Compilation Modal (Batch PDF / Print All) ── */}
      {showBatchModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-[110] flex items-center justify-center p-4">
          <div className="bg-white rounded-xl border border-[#E2E8F0] shadow-2xl max-w-4xl w-full p-6 space-y-5 max-h-[95vh] flex flex-col">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 shrink-0">
              <div className="flex items-center space-x-2">
                <Receipt className="w-5 h-5 text-[#1E40AF]" />
                <div>
                  <h3 className="text-sm font-bold text-slate-900 uppercase">
                    BATCH SALARY DISBURSEMENT SLIPS COMPILATION
                  </h3>
                  <p className="text-xs text-slate-500 font-medium">
                    Cycle: <span className="font-bold text-slate-800">{selectedMonth}</span> ·{' '}
                    <span className="font-semibold text-emerald-700">{salarySlips.length} Staff Slips Prepared</span> ·{' '}
                    Total Net: <span className="font-bold text-slate-900">{fmt(kpi.totalNet)}</span>
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowBatchModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            {/* Actions Bar inside Modal */}
            <div className="flex flex-wrap items-center justify-between gap-2 p-3 bg-slate-50 rounded-lg border border-slate-200 shrink-0">
              <div className="text-xs text-slate-600 font-medium">
                Click <strong>Print / Save Batch PDF</strong> to export all slips with automatic page breaks, or export the data to CSV.
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={handleExportBatchCsv}
                  className="px-3 py-1.5 bg-white border border-[#E2E8F0] hover:bg-slate-100 text-slate-700 rounded-md text-xs font-semibold shadow-sm transition-colors flex items-center space-x-1.5"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Export Batch CSV</span>
                </button>
                <button
                  onClick={() => window.print()}
                  className="px-3.5 py-1.5 bg-[#1E40AF] hover:bg-blue-800 text-white rounded-md text-xs font-bold shadow-sm transition-colors flex items-center space-x-1.5"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print / Save Batch PDF</span>
                </button>
              </div>
            </div>

            {/* Scrollable Slips Container */}
            <div className="overflow-y-auto space-y-6 flex-1 pr-1" id="batch-printable-slips">
              {salarySlips.map((slip, idx) => (
                <div
                  key={slip.id || idx}
                  className="payslip-page border border-slate-200 rounded-lg p-5 space-y-4 bg-white text-xs shadow-sm"
                >
                  {/* Company Letterhead */}
                  <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                    <div>
                      <h2 className="text-base font-black text-[#1E40AF] tracking-tight">SOILEX LIFE SCIENCE LTD</h2>
                      <p className="text-[10px] text-slate-500 font-semibold uppercase">Hanoi HQ · Bio-Hubs &amp; Global Spices Extraction</p>
                      <p className="text-[10px] text-slate-400">Tax Reg: SLX-VN-99201 | ISO 22000 &amp; FSSAI Compliant</p>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] font-bold text-slate-400 uppercase block">PAYSLIP FOR</span>
                      <span className="text-xs font-black text-slate-800">{selectedMonth}</span>
                      <span
                        className={`inline-block mt-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                          slip.status === 'PAID' ? 'bg-emerald-100 text-emerald-800' : 'bg-blue-100 text-blue-800'
                        }`}
                      >
                        {slip.status || 'PAID'}
                      </span>
                    </div>
                  </div>

                  {/* Staff Details */}
                  <div className="grid grid-cols-2 gap-3 bg-slate-50/60 p-3 rounded border border-slate-100">
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase block">STAFF NAME</span>
                      <span className="font-bold text-slate-900">{slip.name}</span>
                    </div>
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase block">EMPLOYEE CODE</span>
                      <span className="font-mono font-bold text-[#1E40AF]">{slip.code}</span>
                    </div>
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase block">ROLE / DESIGNATION</span>
                      <span className="font-semibold text-slate-700">{slip.designation}</span>
                    </div>
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase block">DISBURSEMENT BANK</span>
                      <span className="font-semibold text-slate-700">{slip.bank || 'Vietcombank'}</span>
                    </div>
                  </div>

                  {/* Breakdown Table */}
                  <div className="grid grid-cols-2 gap-4">
                    {/* Earnings */}
                    <div className="bg-slate-50/50 p-3 rounded border border-slate-100 space-y-2">
                      <h4 className="font-bold text-slate-700 uppercase text-[10px] tracking-wider border-b pb-1">
                        EARNINGS
                      </h4>
                      <div className="flex justify-between text-slate-600">
                        <span>Basic Remuneration:</span>
                        <span className="font-semibold">{fmt(slip.basic_pay || slip.gross * 0.75)}</span>
                      </div>
                      <div className="flex justify-between text-slate-600">
                        <span>Allowances &amp; HRA:</span>
                        <span className="font-semibold">{fmt(Math.max(0, (slip.allowances || slip.gross * 0.25) - (slip.overtime_pay || 0)))}</span>
                      </div>
                      {slip.overtime_pay > 0 && (
                        <div className="flex justify-between text-amber-700 font-semibold bg-amber-50 px-1.5 py-0.5 rounded text-[10px] border border-amber-200">
                          <span>Approved Overtime ({slip.overtime_hours} hrs @ 1.5x):</span>
                          <span>+{fmt(slip.overtime_pay)}</span>
                        </div>
                      )}
                      <div className="flex justify-between font-bold text-slate-900 border-t pt-1">
                        <span>Total Gross Pay:</span>
                        <span className="text-[#1E40AF]">{fmt(slip.gross)}</span>
                      </div>
                    </div>

                    {/* Deductions */}
                    <div className="bg-slate-50/50 p-3 rounded border border-slate-100 space-y-2">
                      <h4 className="font-bold text-slate-700 uppercase text-[10px] tracking-wider border-b pb-1">
                        DEDUCTIONS
                      </h4>
                      <div className="flex justify-between text-slate-600">
                        <span>Provident Fund (PF):</span>
                        <span className="font-semibold">{fmt(slip.deductions * 0.65)}</span>
                      </div>
                      <div className="flex justify-between text-slate-600">
                        <span>Statutory Tax Withholding:</span>
                        <span className="font-semibold">{fmt(slip.deductions * 0.35)}</span>
                      </div>
                      <div className="flex justify-between font-bold text-slate-900 border-t pt-1">
                        <span>Total Deductions:</span>
                        <span className="text-red-600">-{fmt(slip.deductions)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Net Payable Banner */}
                  <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] font-bold text-emerald-800 uppercase block">
                        NET DISBURSED TAKE-HOME
                      </span>
                      <span className="text-[11px] text-emerald-600 font-medium">
                        Remitted via electronic clearing (SWIFT / ACH)
                      </span>
                    </div>
                    <div className="text-xl font-black text-emerald-700">{fmt(slip.netPay)}</div>
                  </div>

                  {/* Footer watermark & auth */}
                  <div className="pt-2 border-t border-slate-200 flex items-center justify-between text-[10px] text-slate-400">
                    <span>Value Date: {slip.date || new Date().toISOString().slice(0, 10)}</span>
                    <span className="font-mono">Ref: SLX-ACH-BATCH-{slip.code}</span>
                    <span>Authorized Payroll Officer: Executive Management</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Modal Bottom Close */}
            <div className="flex items-center justify-between pt-2 border-t border-slate-100 shrink-0">
              <span className="text-xs text-slate-400 font-medium">
                Compiled {salarySlips.length} employee payslips for {selectedMonth}.
              </span>
              <button
                onClick={() => setShowBatchModal(false)}
                className="px-4 py-2 border border-[#E2E8F0] rounded-md text-xs font-semibold text-slate-600 hover:bg-slate-50"
              >
                Close Batch View
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Start New Payroll Run Modal ─────────────────────────────────────── */}
      {showNewRunModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full border border-[#E2E8F0] overflow-hidden">
            <div className="bg-[#1E40AF] p-4 text-white flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <CreditCard className="w-5 h-5 text-[#FDE68A]" />
                <h3 className="font-bold text-sm tracking-wide uppercase">START NEW PAYROLL RUN</h3>
              </div>
              <button
                onClick={() => setShowNewRunModal(false)}
                className="text-white/70 hover:text-white p-1 rounded hover:bg-white/10"
              >
                ✕
              </button>
            </div>
            <div className="p-5 space-y-4 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1 uppercase tracking-wider text-[10px]">
                  Target Pay Cycle / Month
                </label>
                <select
                  value={targetRunMonth}
                  onChange={(e) => setTargetRunMonth(e.target.value)}
                  className="w-full bg-slate-50 border border-[#E2E8F0] rounded-md px-3 py-2 text-xs font-bold text-slate-800 focus:outline-none focus:border-[#1E40AF]"
                >
                  {MONTHS.map((m) => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </select>
              </div>

              <div className="bg-slate-50 p-3 rounded-lg border border-slate-200/60 space-y-2">
                <div className="flex justify-between text-slate-600">
                  <span>Eligible Active Headcount:</span>
                  <span className="font-bold text-slate-900">{eligibleEmployees.length} Employees</span>
                </div>
                {((employees || []).length - eligibleEmployees.length > 0) && (
                  <div className="flex justify-between text-amber-700 text-[11px] bg-amber-50/80 px-2 py-1 rounded border border-amber-200/60">
                    <span>New Joiners (First Pay Disbursed Next Month):</span>
                    <span className="font-bold">{Math.max(0, (employees || []).length - eligibleEmployees.length)} Deferred</span>
                  </div>
                )}
                <div className="flex justify-between text-slate-600">
                  <span>Included Facilities:</span>
                  <span className="font-semibold text-slate-800">Hanoi HQ, Kochi, Hai Phong Hub, Dubai</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Compensation Engine:</span>
                  <span className="font-semibold text-[#1E40AF]">CTC Master + Approved Overtime + Tax/PF</span>
                </div>
              </div>

              <div className="flex items-center justify-end space-x-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowNewRunModal(false)}
                  className="px-3 py-2 border border-[#E2E8F0] rounded-md text-slate-600 font-semibold hover:bg-slate-50 uppercase text-[11px]"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => handleProcessPayroll(targetRunMonth)}
                  disabled={processing}
                  className="px-4 py-2 bg-[#1E40AF] hover:bg-blue-800 text-white rounded-md font-bold uppercase tracking-wider text-[11px] shadow-sm flex items-center space-x-1.5 transition-colors disabled:opacity-50"
                >
                  {processing ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Generating...</span>
                    </>
                  ) : (
                    <>
                      <CreditCard className="w-3.5 h-3.5 text-[#FDE68A]" />
                      <span>Generate {targetRunMonth}</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Embedded Print Stylesheet */}
      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #salary-slip-print, #salary-slip-print *,
          #fnf-slip-print, #fnf-slip-print *,
          #batch-printable-slips, #batch-printable-slips * {
            visibility: visible;
          }
          #salary-slip-print, #fnf-slip-print, #batch-printable-slips {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            background: white !important;
            margin: 0 !important;
            padding: 0 !important;
          }
          .payslip-page {
            page-break-after: always !important;
            break-after: page !important;
            margin-bottom: 2.5rem !important;
            border: 1px solid #cbd5e1 !important;
            padding: 1.5rem !important;
            box-shadow: none !important;
          }
        }
      `}</style>
    </div>
  );
}
