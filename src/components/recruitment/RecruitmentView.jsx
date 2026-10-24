import React, { useState, useEffect, useCallback } from 'react';
import {
  Briefcase, Users, ChevronRight, Plus, X, Filter,
  Search, ArrowRight, Trash2, UserCheck, Download
} from 'lucide-react';
import api from '../../services/api';

// ─── Constants ───────────────────────────────────────────────────────────────
const STAGES = ['APPLIED', 'SHORTLISTED', 'INTERVIEW', 'OFFER', 'JOINED'];
const STAGE_ORDER = ['APPLIED', 'SHORTLISTED', 'INTERVIEW', 'OFFER', 'JOINED'];

const DEPARTMENTS = [
  'Sales & Export',
  'Operations & Supply',
  'Quality Assurance',
  'Finance & Accounts',
  'Human Resources',
];

const BRANCHES = [
  'Hanoi HQ',
  'Kochi Terminal',
  'Hai Phong Hub',
  'Dubai Office',
  'Mumbai Office',
  'Chennai Port',
];

const SOURCES = ['LINKEDIN', 'REFERRAL', 'JOB_PORTAL', 'WALK_IN'];

// ─── Fallback Data ────────────────────────────────────────────────────────────
const FALLBACK_JDS = [
  { id: 'JD-001', title: 'Senior Export Sales Manager', department: 'Sales & Export', branch: 'Hanoi HQ', min_experience_years: 5, salary_budget_usd: 55000, deadline: '2026-11-30', status: 'OPEN', candidate_count: 2 },
  { id: 'JD-002', title: 'QA Laboratory Analyst', department: 'Quality Assurance', branch: 'Kochi Terminal', min_experience_years: 2, salary_budget_usd: 30000, deadline: '2026-11-15', status: 'OPEN', candidate_count: 1 },
  { id: 'JD-003', title: 'Logistics Coordinator', department: 'Operations & Supply', branch: 'Hai Phong Hub', min_experience_years: 3, salary_budget_usd: 28000, deadline: '2026-12-01', status: 'SCREENING', candidate_count: 1 },
];

const FALLBACK_CANDIDATES = [
  { id: 'CAN-001', jd_id: 'JD-001', full_name: 'Arjun Mehta', email: 'arjun.m@gmail.com', phone: '+91-9811123456', source: 'LINKEDIN', stage: 'SHORTLISTED', expected_salary: 55000, notice_period_days: 30, notes: 'Strong export background' },
  { id: 'CAN-002', jd_id: 'JD-001', full_name: 'Linh Pham Thi', email: 'linh.pham@outlook.com', phone: '+84-912-334455', source: 'REFERRAL', stage: 'INTERVIEW', expected_salary: 50000, notice_period_days: 60, notes: 'Referred by Vũ Thị Hoan' },
  { id: 'CAN-003', jd_id: 'JD-002', full_name: 'Deepa Krishnamurthy', email: 'deepa.k@yahoo.com', phone: '+91-9876-543210', source: 'JOB_PORTAL', stage: 'APPLIED', expected_salary: 28000, notice_period_days: 15, notes: 'FSSAI certified' },
  { id: 'CAN-004', jd_id: 'JD-003', full_name: 'Minh Tuan Nguyen', email: 'minhtuan@gmail.com', phone: '+84-908-777888', source: 'WALK_IN', stage: 'OFFER', expected_salary: 26000, notice_period_days: 30, notes: 'Ex-DHL logistics' },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────
const statusBadge = (status) => {
  switch (status) {
    case 'OPEN':        return 'text-blue-700 bg-blue-50 border-blue-200';
    case 'SCREENING':   return 'text-amber-700 bg-amber-50 border-amber-200';
    case 'INTERVIEW':   return 'text-purple-700 bg-purple-50 border-purple-200';
    case 'OFFER_STAGE': return 'text-yellow-700 bg-yellow-50 border-yellow-200';
    case 'FILLED':      return 'text-emerald-700 bg-emerald-50 border-emerald-200';
    case 'CLOSED':      return 'text-slate-600 bg-slate-100 border-slate-200';
    default:            return 'text-slate-600 bg-slate-100 border-slate-200';
  }
};

const sourceBadge = (source) => {
  switch (source) {
    case 'LINKEDIN':   return 'text-blue-700 bg-blue-50';
    case 'REFERRAL':   return 'text-emerald-700 bg-emerald-50';
    case 'JOB_PORTAL': return 'text-amber-700 bg-amber-50';
    case 'WALK_IN':    return 'text-purple-700 bg-purple-50';
    default:           return 'text-slate-600 bg-slate-100';
  }
};

const isThisWeek = (dateStr) => {
  if (!dateStr) return false;
  const d = new Date(dateStr);
  const now = new Date();
  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - now.getDay());
  startOfWeek.setHours(0, 0, 0, 0);
  const endOfWeek = new Date(startOfWeek);
  endOfWeek.setDate(startOfWeek.getDate() + 7);
  return d >= startOfWeek && d < endOfWeek;
};

// ─── CandidateCard ────────────────────────────────────────────────────────────
function CandidateCard({ candidate, onMove, onDelete, onSelect, onOnboard }) {
  const currentIdx = STAGE_ORDER.indexOf(candidate.stage);
  const canMove = currentIdx >= 0 && currentIdx < STAGE_ORDER.length - 1;
  const isOffer = candidate.stage === 'OFFER';
  const isJoined = candidate.stage === 'JOINED';

  return (
    <div
      className="bg-white rounded-lg border border-[#E2E8F0] p-3 shadow-sm hover:shadow-md transition-shadow cursor-pointer group"
      onClick={() => onSelect(candidate)}
    >
      <div className="flex items-start justify-between gap-1">
        <p className="text-xs font-bold text-slate-900 leading-tight">{candidate.full_name}</p>
        <span className={`shrink-0 text-[9px] font-bold px-1.5 py-0.5 rounded ${sourceBadge(candidate.source)}`}>
          {candidate.source?.replace('_', ' ')}
        </span>
      </div>
      <p className="text-[10px] text-slate-500 mt-0.5 truncate">{candidate.email}</p>
      <div className="flex items-center gap-2 mt-2 text-[10px] text-slate-500">
        <span>💰 ${(candidate.expected_salary || 0).toLocaleString()}</span>
        {candidate.notice_period_days && <span>⏱ {candidate.notice_period_days}d notice</span>}
      </div>
      <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-100 gap-1 flex-wrap">
        <button
          onClick={(e) => { e.stopPropagation(); onDelete(candidate); }}
          className="text-[10px] text-slate-400 hover:text-red-500 font-semibold flex items-center gap-0.5 transition-colors"
          title="Mark Rejected"
        >
          <X className="w-3 h-3" /> Reject
        </button>
        <div className="flex items-center gap-1.5">
          {(isOffer || isJoined) && (
            <button
              onClick={(e) => { e.stopPropagation(); onOnboard && onOnboard(candidate); }}
              className="text-[10px] bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-2 py-0.5 rounded flex items-center gap-1 shadow-sm transition-colors"
              title="Convert candidate into active employee"
            >
              <UserCheck className="w-3 h-3" /> Onboard
            </button>
          )}
          {canMove && (
            <button
              onClick={(e) => { e.stopPropagation(); onMove(candidate); }}
              className="text-[10px] text-[#1E40AF] hover:text-blue-800 font-bold flex items-center gap-0.5 transition-colors"
              title={`Move to ${STAGE_ORDER[currentIdx + 1]}`}
            >
              {STAGE_ORDER[currentIdx + 1]} <ArrowRight className="w-3 h-3" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function RecruitmentView({ onNavigate }) {
  const [activeTab, setActiveTab] = useState('JOB_REQUISITIONS');
  const [jds, setJds] = useState(FALLBACK_JDS);
  const [candidates, setCandidates] = useState(FALLBACK_CANDIDATES);
  const [selectedJD, setSelectedJD] = useState(null);
  const [jdFilter, setJdFilter] = useState('');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [notification, setNotification] = useState(null);

  // Modal states
  const [showNewJD, setShowNewJD] = useState(false);
  const [showNewCandidate, setShowNewCandidate] = useState(false);
  const [selectedCandidate, setSelectedCandidate] = useState(null);
  const [saving, setSaving] = useState(false);

  // Onboard modal states
  const [onboardingCandidate, setOnboardingCandidate] = useState(null);
  const [onboardingForm, setOnboardingForm] = useState({
    full_name: '',
    email: '',
    phone: '',
    department: 'Sales & Export',
    designation: '',
    branch: 'Hanoi HQ',
    shift: 'Morning Shift',
    starting_salary: '',
    join_date: new Date().toISOString().slice(0, 10),
  });
  const [onboardingSubmitting, setOnboardingSubmitting] = useState(false);

  // Form states
  const [jdForm, setJdForm] = useState({ title: '', department: '', branch: '', min_experience_years: '', salary_budget_usd: '', deadline: '' });
  const [candidateForm, setCandidateForm] = useState({ full_name: '', email: '', phone: '', source: '', jd_id: '', current_salary: '', expected_salary: '', notice_period_days: '', notes: '' });

  // ── Notify helper ──
  const notify = (type, msg) => {
    setNotification({ type, msg });
    setTimeout(() => setNotification(null), 3500);
  };

  // ── Data fetching ──
  const refreshJDs = useCallback(async () => {
    setLoading(true);
    const data = await api.getJobRequisitions?.();
    if (data && Array.isArray(data)) setJds(data);
    setLoading(false);
  }, []);

  const refreshCandidates = useCallback(async () => {
    const jdId = selectedJD?.id || undefined;
    const data = await api.getCandidates?.(jdId);
    if (data && Array.isArray(data) && data.length > 0) {
      setCandidates(data);
    }
  }, [selectedJD]);

  useEffect(() => { refreshJDs(); }, [refreshJDs]);
  useEffect(() => { refreshCandidates(); }, [refreshCandidates]);

  // ── Derived KPIs ──
  const openPositions = jds.filter(j => j.status === 'OPEN' || j.status === 'SCREENING').length;
  const totalCandidates = jds.reduce((acc, j) => acc + (j.candidate_count || 0), 0);
  const interviewsThisWeek = candidates.filter(c => c.stage === 'INTERVIEW' && isThisWeek(c.scheduled_at)).length;

  // ── Candidate Grouping ──
  const filteredCandidates = candidates.filter(c => {
    const matchJD = selectedJD ? c.jd_id === selectedJD.id : (jdFilter ? c.jd_id === jdFilter : true);
    const matchSearch = !search || c.full_name?.toLowerCase().includes(search.toLowerCase()) || c.email?.toLowerCase().includes(search.toLowerCase());
    return matchJD && matchSearch;
  });

  const candidatesByStage = STAGES.reduce((acc, stage) => {
    acc[stage] = filteredCandidates.filter(c => c.stage === stage);
    return acc;
  }, {});

  const rejectedCandidates = filteredCandidates.filter(c => c.stage === 'REJECTED');

  // ── Handlers ──
  const handleCloseJD = async (id) => {
    const updated = await api.updateJobRequisition?.(id, { status: 'CLOSED' });
    if (updated) notify('success', 'Job requisition closed');
    else notify('success', 'Job requisition closed (offline)');
    setJds(prev => prev.map(j => j.id === id ? { ...j, status: 'CLOSED' } : j));
  };

  const handleSetStage = async (candidate, targetStage) => {
    if (!candidate || !targetStage) return;
    setCandidates(prev => prev.map(c => c.id === candidate.id ? { ...c, stage: targetStage } : c));
    if (selectedCandidate && selectedCandidate.id === candidate.id) {
      setSelectedCandidate(prev => ({ ...prev, stage: targetStage }));
    }
    notify('success', `✓ ${candidate.full_name} moved to ${targetStage}`);

    try {
      const res = await api.updateCandidate?.(candidate.id, { stage: targetStage });
      if (res && res.stage) {
        setCandidates(prev => prev.map(c => c.id === candidate.id ? { ...c, ...res } : c));
      }
    } catch {
      // offline fallback: state already updated optimistically
    }
  };

  const handleMoveCandidate = async (candidate) => {
    const stageStr = (candidate.stage || '').toUpperCase();
    const currentIdx = STAGE_ORDER.indexOf(stageStr);
    const validIdx = currentIdx >= 0 ? currentIdx : 0;
    if (validIdx >= STAGE_ORDER.length - 1) return;
    const nextStage = STAGE_ORDER[validIdx + 1];
    await handleSetStage(candidate, nextStage);
  };

  const handleDeleteCandidate = async (candidate) => {
    setCandidates(prev => prev.map(c => c.id === candidate.id ? { ...c, stage: 'REJECTED' } : c));
    if (selectedCandidate && selectedCandidate.id === candidate.id) {
      setSelectedCandidate(prev => ({ ...prev, stage: 'REJECTED' }));
    }
    notify('success', `${candidate.full_name} marked as rejected`);

    try {
      await api.deleteCandidate?.(candidate.id);
    } catch {
      // offline: state already updated optimistically
    }
  };

  const handleOnboardCandidate = (candidate) => {
    if (!candidate) return;
    const jd = jds.find(j => j.id === candidate.jd_id);
    const nameClean = (candidate.full_name || 'Staff').trim().toLowerCase().replace(/[^a-z0-9]+/g, '.');
    const defaultEmail = candidate.email && candidate.email.endsWith('@soilexlifescience.com')
      ? candidate.email
      : `${nameClean}@soilexlifescience.com`;

    setOnboardingForm({
      full_name: candidate.full_name || '',
      email: defaultEmail,
      phone: candidate.phone || '',
      department: jd?.department || 'Sales & Export',
      designation: jd?.title || 'Staff Specialist',
      branch: jd?.branch || 'Hanoi HQ',
      shift: 'Morning Shift',
      starting_salary: candidate.expected_salary || jd?.salary_budget_usd || 32000,
      join_date: new Date().toISOString().slice(0, 10),
    });
    setOnboardingCandidate(candidate);
  };

  const handleConfirmOnboard = async (e) => {
    e.preventDefault();
    if (!onboardingCandidate) return;
    setOnboardingSubmitting(true);

    // Compute next employee code
    let nextNum = 6;
    try {
      const stored = localStorage.getItem('soilex_onboarded_employees');
      if (stored) {
        const list = JSON.parse(stored);
        if (Array.isArray(list) && list.length > 0) {
          list.forEach(item => {
            const m = (item.employee_code || item.id || '').match(/\d+/);
            if (m) nextNum = Math.max(nextNum, parseInt(m[0], 10) + 1);
          });
        }
      }
    } catch {}

    const empCode = `SLX-E${String(nextNum).padStart(2, '0')}`;
    const empId = `EMP-${String(nextNum).padStart(3, '0')}`;

    const newEmp = {
      id: empId,
      employee_code: empCode,
      full_name: onboardingForm.full_name,
      email: onboardingForm.email,
      phone: onboardingForm.phone,
      department: onboardingForm.department,
      designation: onboardingForm.designation,
      branch: onboardingForm.branch,
      shift: onboardingForm.shift,
      join_date: onboardingForm.join_date,
      status: 'ACTIVE',
    };

    // 1. Optimistically update candidate to JOINED stage
    setCandidates(prev => prev.map(c => c.id === onboardingCandidate.id ? { ...c, stage: 'JOINED' } : c));
    if (selectedCandidate && selectedCandidate.id === onboardingCandidate.id) {
      setSelectedCandidate(prev => ({ ...prev, stage: 'JOINED' }));
    }

    try {
      api.updateCandidate?.(onboardingCandidate.id, { stage: 'JOINED' });
    } catch {}

    // 2. Provision employee via backend API
    let createdEmp = newEmp;
    try {
      const res = await api.createEmployee(newEmp);
      if (res && (res.id || res.employee_code)) {
        createdEmp = { ...newEmp, ...res };
      }
    } catch (err) {
      console.warn('Backend createEmployee call failed or offline, saving locally:', err);
    }

    // 3. Initialize salary structure if starting_salary provided
    if (onboardingForm.starting_salary) {
      const salaryAnnual = Number(onboardingForm.starting_salary) || 0;
      const basicMonthly = Math.round((salaryAnnual / 12) * 0.5);
      const hraMonthly = Math.round((salaryAnnual / 12) * 0.2);
      const transport = 150;
      const medical = 100;
      const special = Math.max(0, Math.round(salaryAnnual / 12) - (basicMonthly + hraMonthly + transport + medical));
      const pfEmp = Math.round(basicMonthly * 0.12);
      try {
        await api._request('POST', '/payroll/salary-structure', {
          employee_id: createdEmp.id,
          ctc_annual: salaryAnnual,
          basic_monthly: basicMonthly,
          hra_monthly: hraMonthly,
          transport_allowance: transport,
          medical_allowance: medical,
          special_allowance: special,
          pf_employee: pfEmp,
          pf_employer: pfEmp,
          professional_tax: 50,
          effective_from: onboardingForm.join_date
        });
      } catch {}
    }

    // 4. Save to localStorage so Employee Directory immediately shows the new staff
    try {
      const existingStr = localStorage.getItem('soilex_onboarded_employees');
      const existingList = existingStr ? JSON.parse(existingStr) : [];
      const filtered = existingList.filter(item => item.id !== createdEmp.id && item.employee_code !== createdEmp.employee_code);
      filtered.unshift(createdEmp);
      localStorage.setItem('soilex_onboarded_employees', JSON.stringify(filtered));
    } catch (err) {
      console.warn('LocalStorage save failed:', err);
    }

    // 5. Initialize Performance Review & 9-Box Baseline Record
    const initialReview = {
      id: `REV-${createdEmp.id}`,
      employee_id: createdEmp.id,
      employee_code: createdEmp.employee_code || createdEmp.id,
      employee_name: createdEmp.full_name,
      department: createdEmp.department,
      cycle: 'Probation / Onboarding Baseline',
      self_rating: 4.0,
      manager_rating: 4.0,
      potential_rating: 4.2,
      status: 'ONBOARDING_BASELINE',
      is_new_joiner: true,
      join_date: createdEmp.join_date,
      feedback: 'Newly onboarded employee via recruitment pipeline. Initial probation baseline established; ready for 9-Box calibration and quarterly OKR goal setting.',
      reviewer: 'Talent Acquisition & Board',
      rubric: {
        okr: 4.0,
        functional: 4.0,
        collaboration: 4.0,
        innovation: 4.0,
        agility: 4.2,
        leadership: 4.2
      }
    };

    try {
      await api.submitPerformanceReview({
        id: initialReview.id,
        employee_id: createdEmp.id,
        employee_name: createdEmp.full_name,
        department: createdEmp.department,
        cycle: initialReview.cycle,
        self_rating: 4.0,
        manager_rating: 4.0,
        potential_rating: 4.2,
        status: 'ONBOARDING_BASELINE',
        feedback: initialReview.feedback,
        reviewer: initialReview.reviewer,
        recommended_increment: 0,
      });
    } catch (err) {
      console.warn('Initial review API sync:', err);
    }

    try {
      const existingReviewsStr = localStorage.getItem('soilex_performance_reviews');
      const existingReviews = existingReviewsStr ? JSON.parse(existingReviewsStr) : [];
      const updatedRev = [initialReview, ...existingReviews.filter(r => r.employee_id !== createdEmp.id && r.id !== initialReview.id)];
      localStorage.setItem('soilex_performance_reviews', JSON.stringify(updatedRev));
    } catch {}

    setOnboardingSubmitting(false);
    setOnboardingCandidate(null);
    setSelectedCandidate(null);

    notify('success', `🎉 ${createdEmp.full_name} (${createdEmp.employee_code}) onboarded successfully! Opening Employee Directory...`);

    // 5. Navigate to employee directory
    setTimeout(() => {
      if (onNavigate) {
        onNavigate('employees');
      }
    }, 1200);
  };

  const handleExportCandidatesCsv = () => {
    if (!candidates || candidates.length === 0) {
      notify('error', 'No candidates to export.');
      return;
    }
    const headers = [
      'Candidate ID',
      'Full Name',
      'Email',
      'Phone',
      'Target JD ID',
      'Current Stage',
      'Source',
      'Expected Salary (USD)',
      'Notice Period (Days)',
      'Recruiter Notes'
    ];
    const rows = candidates.map(c => [
      `"${c.id}"`,
      `"${c.full_name}"`,
      `"${c.email || ''}"`,
      `"${c.phone || ''}"`,
      `"${c.jd_id || ''}"`,
      `"${c.stage}"`,
      `"${c.source || 'JOB_PORTAL'}"`,
      c.expected_salary || 0,
      c.notice_period_days || 30,
      `"${(c.notes || '').replace(/"/g, '""')}"`
    ]);
    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `soilex_recruitment_candidates_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    URL.revokeObjectURL(url);
    document.body.removeChild(a);
    notify('success', `Exported ${candidates.length} candidates to CSV.`);
  };

  const handleCreateJD = async (e) => {
    e.preventDefault();
    if (!jdForm.title || !jdForm.department || !jdForm.branch) return;
    setSaving(true);
    const data = await api.createJobRequisition?.({ ...jdForm, status: 'OPEN', min_experience_years: Number(jdForm.min_experience_years), salary_budget_usd: Number(jdForm.salary_budget_usd) });
    if (data) {
      notify('success', 'Job requisition created successfully');
      await refreshJDs();
    } else {
      notify('success', 'Job requisition saved (offline mode)');
      setJds(prev => [...prev, { ...jdForm, id: `JD-${Date.now()}`, status: 'OPEN', candidate_count: 0 }]);
    }
    setSaving(false);
    setShowNewJD(false);
    setJdForm({ title: '', department: '', branch: '', min_experience_years: '', salary_budget_usd: '', deadline: '' });
  };

  const handleCreateCandidate = async (e) => {
    e.preventDefault();
    if (!candidateForm.full_name || !candidateForm.email) return;
    setSaving(true);
    const payload = {
      ...candidateForm,
      stage: 'APPLIED',
      current_salary: Number(candidateForm.current_salary),
      expected_salary: Number(candidateForm.expected_salary),
      notice_period_days: Number(candidateForm.notice_period_days),
    };
    const data = await api.createCandidate?.(payload);
    if (data) {
      notify('success', 'Candidate added to pipeline');
      await refreshCandidates();
    } else {
      notify('success', 'Candidate added (offline mode)');
      setCandidates(prev => [...prev, { ...payload, id: `CAN-${Date.now()}` }]);
    }
    setSaving(false);
    setShowNewCandidate(false);
    setCandidateForm({ full_name: '', email: '', phone: '', source: '', jd_id: '', current_salary: '', expected_salary: '', notice_period_days: '', notes: '' });
  };

  // ─── Render ───────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-[#F8FAFC]">

      {/* ── Notification ── */}
      {notification && (
        <div className={`fixed top-4 right-4 z-[9999] flex items-center space-x-2 px-4 py-3 rounded-lg shadow-lg border text-xs font-bold transition-all ${notification.type === 'success' ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-red-50 border-red-200 text-red-700'}`}>
          <span>{notification.type === 'success' ? '✓' : '✕'}</span>
          <span>{notification.msg}</span>
        </div>
      )}

      {/* ── Top Tabs ── */}
      <div className="bg-white border-b border-[#E2E8F0] px-6">
        <div className="flex items-center space-x-1">
          {['JOB_REQUISITIONS', 'CANDIDATE_PIPELINE'].map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-3 text-xs font-bold tracking-wider uppercase border-b-2 transition-colors ${activeTab === tab ? 'border-[#1E40AF] text-[#1E40AF]' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
            >
              {tab === 'JOB_REQUISITIONS' ? 'Job Requisitions' : 'Candidate Pipeline'}
            </button>
          ))}
        </div>
      </div>

      {/* ════════════════════════════════════════════
          TAB 1: JOB REQUISITIONS
      ════════════════════════════════════════════ */}
      {activeTab === 'JOB_REQUISITIONS' && (
        <div className="p-6 space-y-6">

          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-lg font-black text-slate-900 tracking-tight">TALENT ACQUISITION & RECRUITMENT</h1>
              <p className="text-xs text-slate-500 mt-0.5">Manage open positions, screening pipelines and offers</p>
            </div>
            <div className="flex items-center space-x-2">
              <button
                type="button"
                onClick={handleExportCandidatesCsv}
                className="flex items-center space-x-1.5 px-3.5 py-2 bg-[#D97706] hover:bg-[#B45309] text-white rounded-md text-xs font-bold uppercase tracking-wider shadow-sm transition-colors"
                title="Export all candidates in pipeline to CSV"
              >
                <Download className="w-3.5 h-3.5" />
                <span>EXPORT CANDIDATES CSV</span>
              </button>
              <button
                onClick={() => setShowNewJD(true)}
                className="flex items-center space-x-1.5 px-4 py-2 bg-[#1E40AF] text-white rounded-md text-xs font-semibold hover:bg-blue-800 shadow-sm uppercase tracking-wider"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>New Job Requisition</span>
              </button>
            </div>
          </div>

          {/* KPI Row */}
          <div className="grid grid-cols-3 gap-4">
            {[
              { label: 'Open Positions', value: openPositions, icon: Briefcase, color: 'text-[#1E40AF]', bg: 'bg-blue-50' },
              { label: 'Total Candidates', value: totalCandidates, icon: Users, color: 'text-emerald-600', bg: 'bg-emerald-50' },
              { label: 'Interviews This Week', value: interviewsThisWeek, icon: UserCheck, color: 'text-amber-600', bg: 'bg-amber-50' },
            ].map(kpi => (
              <div key={kpi.label} className="bg-white rounded-lg border border-[#E2E8F0] shadow-sm p-5 flex items-center space-x-4">
                <div className={`w-11 h-11 rounded-lg ${kpi.bg} flex items-center justify-center shrink-0`}>
                  <kpi.icon className={`w-5 h-5 ${kpi.color}`} />
                </div>
                <div>
                  <p className="text-2xl font-black text-slate-900">{kpi.value}</p>
                  <p className="text-xs text-slate-500 font-semibold mt-0.5">{kpi.label}</p>
                </div>
              </div>
            ))}
          </div>

          {/* JD Cards Grid */}
          {loading ? (
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
              {[1, 2, 3].map(i => (
                <div key={i} className="bg-white rounded-lg border border-[#E2E8F0] p-5 space-y-3 animate-pulse">
                  <div className="h-4 bg-slate-100 rounded w-3/4"></div>
                  <div className="h-3 bg-slate-100 rounded w-1/2"></div>
                  <div className="h-3 bg-slate-100 rounded w-full"></div>
                </div>
              ))}
            </div>
          ) : jds.length === 0 ? (
            <div className="text-center py-16 text-slate-400">
              <Briefcase className="w-10 h-10 mx-auto mb-3 opacity-40" />
              <p className="font-semibold text-sm">No job requisitions found</p>
              <p className="text-xs mt-1">Create your first job requisition to get started</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
              {jds.map(jd => (
                <div
                  key={jd.id}
                  className="bg-white rounded-lg border border-[#E2E8F0] shadow-sm p-5 hover:shadow-md transition-shadow cursor-pointer"
                  onClick={() => { setSelectedJD(jd); setActiveTab('CANDIDATE_PIPELINE'); }}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <h3 className="text-sm font-bold text-slate-900 leading-snug">{jd.title}</h3>
                      <p className="text-xs text-slate-500 mt-1">{jd.department} · {jd.branch}</p>
                    </div>
                    <span className={`shrink-0 text-[10px] font-bold px-2 py-0.5 rounded border ${statusBadge(jd.status)}`}>{jd.status}</span>
                  </div>
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-4 text-[11px] text-slate-500">
                    <span>👤 {jd.candidate_count || 0} applicants</span>
                    <span>💼 {jd.min_experience_years}+ yrs exp</span>
                    <span>📅 Deadline: {jd.deadline}</span>
                  </div>
                  <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-100">
                    <span className="text-xs font-bold text-[#1E40AF]">${(jd.salary_budget_usd || 0).toLocaleString()} USD/yr budget</span>
                    <button
                      onClick={e => { e.stopPropagation(); handleCloseJD(jd.id); }}
                      className="text-[10px] text-slate-400 hover:text-red-500 font-semibold transition-colors"
                    >
                      Close JD
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ════════════════════════════════════════════
          TAB 2: CANDIDATE PIPELINE
      ════════════════════════════════════════════ */}
      {activeTab === 'CANDIDATE_PIPELINE' && (
        <div className="p-6 space-y-5">

          {/* Header */}
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div>
              <h1 className="text-lg font-black text-slate-900 tracking-tight">
                {selectedJD ? selectedJD.title : 'ALL CANDIDATES'}
              </h1>
              <p className="text-xs text-slate-500 mt-0.5">
                {selectedJD ? `${selectedJD.department} · ${selectedJD.branch}` : 'Across all job requisitions'}
              </p>
            </div>
            <div className="flex items-center gap-3">
              {/* JD Filter */}
              <div className="flex items-center gap-2 bg-white border border-[#E2E8F0] rounded-md px-3 py-2">
                <Filter className="w-3.5 h-3.5 text-slate-400" />
                <select
                  className="text-xs font-medium text-slate-700 bg-transparent focus:outline-none"
                  value={selectedJD?.id || jdFilter}
                  onChange={e => {
                    const jd = jds.find(j => j.id === e.target.value);
                    setSelectedJD(jd || null);
                    setJdFilter(e.target.value);
                  }}
                >
                  <option value="">All JDs</option>
                  {jds.map(j => (
                    <option key={j.id} value={j.id}>{j.title}</option>
                  ))}
                </select>
              </div>
              {/* Search */}
              <div className="flex items-center gap-2 bg-white border border-[#E2E8F0] rounded-md px-3 py-2">
                <Search className="w-3.5 h-3.5 text-slate-400" />
                <input
                  className="text-xs font-medium text-slate-700 bg-transparent focus:outline-none w-32 placeholder-slate-400"
                  placeholder="Search candidates…"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                />
              </div>
              <button
                onClick={handleExportCandidatesCsv}
                className="flex items-center space-x-1.5 px-3 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-md text-xs font-semibold shadow-sm uppercase tracking-wider transition-colors"
                title="Export candidates to CSV"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export CSV</span>
              </button>
              <button
                onClick={() => setShowNewCandidate(true)}
                className="flex items-center space-x-1.5 px-4 py-2 bg-[#1E40AF] text-white rounded-md text-xs font-semibold hover:bg-blue-800 shadow-sm uppercase tracking-wider"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Candidate</span>
              </button>
            </div>
          </div>

          {/* Kanban Board */}
          <div className="flex space-x-4 overflow-x-auto pb-4">
            {STAGES.map(stage => (
              <div key={stage} className="flex-none w-64">
                <div className="bg-slate-100 rounded-t-lg px-3 py-2 flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-700">{stage}</span>
                  <span className="text-[10px] font-bold bg-white px-2 py-0.5 rounded-full text-slate-500">
                    {candidatesByStage[stage]?.length || 0}
                  </span>
                </div>
                <div className="space-y-2 mt-2 min-h-[120px]">
                  {(candidatesByStage[stage] || []).length === 0 ? (
                    <div className="border-2 border-dashed border-slate-200 rounded-lg p-4 text-center text-[10px] text-slate-400 font-semibold">
                      No candidates
                    </div>
                  ) : (
                    (candidatesByStage[stage] || []).map(c => (
                      <CandidateCard
                        key={c.id}
                        candidate={c}
                        onMove={handleMoveCandidate}
                        onDelete={handleDeleteCandidate}
                        onSelect={setSelectedCandidate}
                        onOnboard={handleOnboardCandidate}
                      />
                    ))
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Rejected Section */}
          {rejectedCandidates.length > 0 && (
            <div className="mt-4">
              <p className="text-xs font-bold text-red-600 uppercase tracking-wider mb-2">
                ✕ Rejected / Not Proceeding ({rejectedCandidates.length})
              </p>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                {rejectedCandidates.map(c => (
                  <div key={c.id} className="bg-red-50 border border-red-100 rounded-lg p-3">
                    <p className="text-xs font-bold text-slate-700">{c.full_name}</p>
                    <p className="text-[10px] text-slate-500 mt-0.5">{c.email}</p>
                    <span className={`mt-2 inline-block text-[9px] font-bold px-1.5 py-0.5 rounded ${sourceBadge(c.source)}`}>
                      {c.source?.replace('_', ' ')}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ═══════════════════════════════════
          MODAL: New Job Requisition
      ═══════════════════════════════════ */}
      {showNewJD && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl border border-[#E2E8F0] shadow-2xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-slate-900">New Job Requisition</h2>
              <button onClick={() => setShowNewJD(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleCreateJD} className="space-y-3">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Job Title *</label>
                <input
                  required
                  className="w-full bg-white border border-[#E2E8F0] rounded-md px-3 py-2 text-xs focus:outline-none focus:border-[#1E40AF] font-medium"
                  placeholder="e.g. Senior Export Manager"
                  value={jdForm.title}
                  onChange={e => setJdForm(f => ({ ...f, title: e.target.value }))}
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Department *</label>
                <select
                  required
                  className="w-full bg-white border border-[#E2E8F0] rounded-md px-3 py-2 text-xs focus:outline-none focus:border-[#1E40AF] font-medium"
                  value={jdForm.department}
                  onChange={e => setJdForm(f => ({ ...f, department: e.target.value }))}
                >
                  <option value="">Select Department</option>
                  {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Branch *</label>
                <select
                  required
                  className="w-full bg-white border border-[#E2E8F0] rounded-md px-3 py-2 text-xs focus:outline-none focus:border-[#1E40AF] font-medium"
                  value={jdForm.branch}
                  onChange={e => setJdForm(f => ({ ...f, branch: e.target.value }))}
                >
                  <option value="">Select Branch</option>
                  {BRANCHES.map(b => <option key={b} value={b}>{b}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Min Experience (yrs)</label>
                  <input
                    type="number"
                    min="0"
                    className="w-full bg-white border border-[#E2E8F0] rounded-md px-3 py-2 text-xs focus:outline-none focus:border-[#1E40AF] font-medium"
                    placeholder="e.g. 3"
                    value={jdForm.min_experience_years}
                    onChange={e => setJdForm(f => ({ ...f, min_experience_years: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Salary Budget (USD/yr)</label>
                  <input
                    type="number"
                    min="0"
                    className="w-full bg-white border border-[#E2E8F0] rounded-md px-3 py-2 text-xs focus:outline-none focus:border-[#1E40AF] font-medium"
                    placeholder="e.g. 45000"
                    value={jdForm.salary_budget_usd}
                    onChange={e => setJdForm(f => ({ ...f, salary_budget_usd: e.target.value }))}
                  />
                </div>
              </div>
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Application Deadline</label>
                <input
                  type="date"
                  className="w-full bg-white border border-[#E2E8F0] rounded-md px-3 py-2 text-xs focus:outline-none focus:border-[#1E40AF] font-medium"
                  value={jdForm.deadline}
                  onChange={e => setJdForm(f => ({ ...f, deadline: e.target.value }))}
                />
              </div>
              <div className="flex items-center justify-end space-x-3 pt-2">
                <button type="button" onClick={() => setShowNewJD(false)} className="px-4 py-2 border border-[#E2E8F0] rounded-md text-xs font-semibold text-slate-600 hover:bg-slate-50">
                  Cancel
                </button>
                <button type="submit" disabled={saving} className="px-4 py-2 bg-[#1E40AF] text-white rounded-md text-xs font-semibold hover:bg-blue-800 shadow-sm disabled:opacity-60">
                  {saving ? 'Creating…' : 'Create JD'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════
          MODAL: Add Candidate
      ═══════════════════════════════════ */}
      {showNewCandidate && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl border border-[#E2E8F0] shadow-2xl max-w-lg w-full p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-slate-900">Add Candidate to Pipeline</h2>
              <button onClick={() => setShowNewCandidate(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleCreateCandidate} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Full Name *</label>
                  <input
                    required
                    className="w-full bg-white border border-[#E2E8F0] rounded-md px-3 py-2 text-xs focus:outline-none focus:border-[#1E40AF] font-medium"
                    placeholder="Full name"
                    value={candidateForm.full_name}
                    onChange={e => setCandidateForm(f => ({ ...f, full_name: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Email *</label>
                  <input
                    required
                    type="email"
                    className="w-full bg-white border border-[#E2E8F0] rounded-md px-3 py-2 text-xs focus:outline-none focus:border-[#1E40AF] font-medium"
                    placeholder="email@example.com"
                    value={candidateForm.email}
                    onChange={e => setCandidateForm(f => ({ ...f, email: e.target.value }))}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Phone</label>
                  <input
                    className="w-full bg-white border border-[#E2E8F0] rounded-md px-3 py-2 text-xs focus:outline-none focus:border-[#1E40AF] font-medium"
                    placeholder="+91-XXXXXXXXXX"
                    value={candidateForm.phone}
                    onChange={e => setCandidateForm(f => ({ ...f, phone: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Source</label>
                  <select
                    className="w-full bg-white border border-[#E2E8F0] rounded-md px-3 py-2 text-xs focus:outline-none focus:border-[#1E40AF] font-medium"
                    value={candidateForm.source}
                    onChange={e => setCandidateForm(f => ({ ...f, source: e.target.value }))}
                  >
                    <option value="">Select Source</option>
                    {SOURCES.map(s => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Applied JD</label>
                <select
                  className="w-full bg-white border border-[#E2E8F0] rounded-md px-3 py-2 text-xs focus:outline-none focus:border-[#1E40AF] font-medium"
                  value={candidateForm.jd_id}
                  onChange={e => setCandidateForm(f => ({ ...f, jd_id: e.target.value }))}
                >
                  <option value="">Select Job Requisition</option>
                  {jds.map(j => <option key={j.id} value={j.id}>{j.title}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Current Salary (USD)</label>
                  <input
                    type="number"
                    min="0"
                    className="w-full bg-white border border-[#E2E8F0] rounded-md px-3 py-2 text-xs focus:outline-none focus:border-[#1E40AF] font-medium"
                    placeholder="0"
                    value={candidateForm.current_salary}
                    onChange={e => setCandidateForm(f => ({ ...f, current_salary: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Expected Salary (USD)</label>
                  <input
                    type="number"
                    min="0"
                    className="w-full bg-white border border-[#E2E8F0] rounded-md px-3 py-2 text-xs focus:outline-none focus:border-[#1E40AF] font-medium"
                    placeholder="0"
                    value={candidateForm.expected_salary}
                    onChange={e => setCandidateForm(f => ({ ...f, expected_salary: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Notice Period (days)</label>
                  <input
                    type="number"
                    min="0"
                    className="w-full bg-white border border-[#E2E8F0] rounded-md px-3 py-2 text-xs focus:outline-none focus:border-[#1E40AF] font-medium"
                    placeholder="30"
                    value={candidateForm.notice_period_days}
                    onChange={e => setCandidateForm(f => ({ ...f, notice_period_days: e.target.value }))}
                  />
                </div>
              </div>
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Notes</label>
                <textarea
                  rows={2}
                  className="w-full bg-white border border-[#E2E8F0] rounded-md px-3 py-2 text-xs focus:outline-none focus:border-[#1E40AF] font-medium resize-none"
                  placeholder="Any additional notes about the candidate..."
                  value={candidateForm.notes}
                  onChange={e => setCandidateForm(f => ({ ...f, notes: e.target.value }))}
                />
              </div>
              <div className="flex items-center justify-end space-x-3 pt-2">
                <button type="button" onClick={() => setShowNewCandidate(false)} className="px-4 py-2 border border-[#E2E8F0] rounded-md text-xs font-semibold text-slate-600 hover:bg-slate-50">
                  Cancel
                </button>
                <button type="submit" disabled={saving} className="px-4 py-2 bg-[#1E40AF] text-white rounded-md text-xs font-semibold hover:bg-blue-800 shadow-sm disabled:opacity-60">
                  {saving ? 'Adding…' : 'Add Candidate'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════
          DRAWER: Candidate Detail
      ═══════════════════════════════════ */}
      {selectedCandidate && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-end">
          <div className="bg-white h-full w-full max-w-sm shadow-2xl border-l border-[#E2E8F0] flex flex-col">
            <div className="flex items-center justify-between px-5 py-4 border-b border-[#E2E8F0]">
              <h2 className="text-sm font-bold text-slate-900">Candidate Details</h2>
              <button onClick={() => setSelectedCandidate(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-5 space-y-4">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 rounded-full bg-[#EFF6FF] border border-[#BFDBFE] flex items-center justify-center text-lg font-black text-[#1E40AF]">
                  {selectedCandidate.full_name?.charAt(0)}
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-900">{selectedCandidate.full_name}</p>
                  <p className="text-xs text-slate-500">{selectedCandidate.email}</p>
                  {selectedCandidate.phone && <p className="text-xs text-slate-500">{selectedCandidate.phone}</p>}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: 'Stage', value: selectedCandidate.stage },
                  { label: 'Source', value: selectedCandidate.source?.replace('_', ' ') },
                  { label: 'Expected Salary', value: selectedCandidate.expected_salary ? `$${selectedCandidate.expected_salary.toLocaleString()}` : '—' },
                  { label: 'Notice Period', value: selectedCandidate.notice_period_days ? `${selectedCandidate.notice_period_days} days` : '—' },
                ].map(item => (
                  <div key={item.label} className="bg-slate-50 rounded-lg p-3 border border-[#E2E8F0]">
                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">{item.label}</p>
                    <p className="text-xs font-bold text-slate-900 mt-1">{item.value || '—'}</p>
                  </div>
                ))}
              </div>

              {selectedCandidate.notes && (
                <div className="bg-amber-50 border border-amber-100 rounded-lg p-3">
                  <p className="text-[10px] font-bold text-amber-700 uppercase tracking-wider mb-1">Notes</p>
                  <p className="text-xs text-slate-700">{selectedCandidate.notes}</p>
                </div>
              )}

              <div className="space-y-2">
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Pipeline Stage</p>
                <div className="flex items-center space-x-1">
                  {STAGES.map((s, i) => {
                    const isActive = s === selectedCandidate.stage;
                    const isPast = STAGES.indexOf(selectedCandidate.stage) > i;
                    return (
                      <React.Fragment key={s}>
                        <div className={`flex-1 h-1.5 rounded-full ${isActive ? 'bg-[#1E40AF]' : isPast ? 'bg-emerald-400' : 'bg-slate-200'}`} />
                        {i < STAGES.length - 1 && <ChevronRight className="w-3 h-3 text-slate-300 shrink-0" />}
                      </React.Fragment>
                    );
                  })}
                </div>
                <div className="flex items-center justify-between">
                  {STAGES.map(s => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => handleSetStage(selectedCandidate, s)}
                      className={`text-[9px] font-bold px-1.5 py-0.5 rounded transition-colors ${
                        s === selectedCandidate.stage
                          ? 'text-[#1E40AF] bg-blue-100/70 font-black'
                          : 'text-slate-400 hover:text-slate-700 hover:bg-slate-100'
                      }`}
                      title={`Jump directly to ${s}`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <div className="p-5 border-t border-[#E2E8F0] flex gap-2">
              {(selectedCandidate.stage === 'JOINED' || selectedCandidate.stage === 'OFFER') ? (
                <>
                  <button
                    onClick={() => handleOnboardCandidate(selectedCandidate)}
                    className="flex-1 px-3 py-2 bg-emerald-600 text-white rounded-md text-xs font-semibold hover:bg-emerald-700 flex items-center justify-center gap-1.5 shadow-sm transition-colors"
                  >
                    <UserCheck className="w-3.5 h-3.5" /> Onboard Staff
                  </button>
                  {selectedCandidate.stage === 'OFFER' && (
                    <button
                      onClick={() => handleMoveCandidate(selectedCandidate)}
                      className="px-3 py-2 bg-[#1E40AF] text-white rounded-md text-xs font-semibold hover:bg-blue-800 flex items-center justify-center gap-1 shadow-sm transition-colors"
                      title="Move to JOINED stage"
                    >
                      <ArrowRight className="w-3.5 h-3.5" /> Mark Joined
                    </button>
                  )}
                </>
              ) : (
                <button
                  onClick={() => handleMoveCandidate(selectedCandidate)}
                  className="flex-1 px-3 py-2 bg-[#1E40AF] text-white rounded-md text-xs font-semibold hover:bg-blue-800 flex items-center justify-center gap-1.5 shadow-sm transition-colors"
                >
                  <ArrowRight className="w-3.5 h-3.5" /> Move Forward
                </button>
              )}
              <button
                onClick={() => { handleDeleteCandidate(selectedCandidate); setSelectedCandidate(null); }}
                className="px-3 py-2 border border-red-200 text-red-600 rounded-md text-xs font-semibold hover:bg-red-50 flex items-center gap-1"
              >
                <Trash2 className="w-3.5 h-3.5" /> Reject
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════
          MODAL: Onboard Candidate Confirmation
      ═══════════════════════════════════ */}
      {onboardingCandidate && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[110] flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl border border-[#E2E8F0] max-w-xl w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between px-6 py-4 bg-[#1E40AF] text-white">
              <div className="flex items-center space-x-2">
                <UserCheck className="w-5 h-5 text-emerald-400" />
                <h2 className="text-sm font-bold tracking-wide">Candidate Onboarding & Employee Provisioning</h2>
              </div>
              <button 
                onClick={() => setOnboardingCandidate(null)} 
                className="text-white/80 hover:text-white transition-colors"
                disabled={onboardingSubmitting}
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="bg-blue-50/60 border-b border-blue-100 px-6 py-3 flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-slate-800">
                  Converting candidate: <span className="text-[#1E40AF]">{onboardingCandidate.full_name}</span>
                </p>
                <p className="text-[11px] text-slate-500">
                  Source: <span className="font-semibold uppercase">{onboardingCandidate.source?.replace('_', ' ')}</span> · Current Pipeline Stage: <span className="font-semibold text-emerald-700">{onboardingCandidate.stage}</span>
                </p>
              </div>
              <span className="text-[10px] font-mono bg-white border border-blue-200 text-blue-700 px-2 py-0.5 rounded font-bold shadow-sm">
                Next Code: SLX-E06+
              </span>
            </div>

            <form onSubmit={handleConfirmOnboard} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Official Full Name *
                  </label>
                  <input
                    required
                    type="text"
                    className="w-full bg-white border border-[#E2E8F0] rounded-md px-3 py-2 text-xs focus:outline-none focus:border-[#1E40AF] font-medium"
                    value={onboardingForm.full_name}
                    onChange={e => setOnboardingForm(f => ({ ...f, full_name: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Corporate Email *
                  </label>
                  <input
                    required
                    type="email"
                    className="w-full bg-white border border-[#E2E8F0] rounded-md px-3 py-2 text-xs focus:outline-none focus:border-[#1E40AF] font-medium"
                    value={onboardingForm.email}
                    onChange={e => setOnboardingForm(f => ({ ...f, email: e.target.value }))}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Contact Phone
                  </label>
                  <input
                    type="tel"
                    className="w-full bg-white border border-[#E2E8F0] rounded-md px-3 py-2 text-xs focus:outline-none focus:border-[#1E40AF] font-medium"
                    placeholder="+84 / +91 ..."
                    value={onboardingForm.phone}
                    onChange={e => setOnboardingForm(f => ({ ...f, phone: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Official Department *
                  </label>
                  <select
                    required
                    className="w-full bg-white border border-[#E2E8F0] rounded-md px-3 py-2 text-xs focus:outline-none focus:border-[#1E40AF] font-medium"
                    value={onboardingForm.department}
                    onChange={e => setOnboardingForm(f => ({ ...f, department: e.target.value }))}
                  >
                    {DEPARTMENTS.map(d => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Designation / Title *
                  </label>
                  <input
                    required
                    type="text"
                    className="w-full bg-white border border-[#E2E8F0] rounded-md px-3 py-2 text-xs focus:outline-none focus:border-[#1E40AF] font-medium"
                    value={onboardingForm.designation}
                    onChange={e => setOnboardingForm(f => ({ ...f, designation: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Base Facility / Branch *
                  </label>
                  <select
                    required
                    className="w-full bg-white border border-[#E2E8F0] rounded-md px-3 py-2 text-xs focus:outline-none focus:border-[#1E40AF] font-medium"
                    value={onboardingForm.branch}
                    onChange={e => setOnboardingForm(f => ({ ...f, branch: e.target.value }))}
                  >
                    {BRANCHES.map(b => (
                      <option key={b} value={b}>{b}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Assigned Shift *
                  </label>
                  <select
                    required
                    className="w-full bg-white border border-[#E2E8F0] rounded-md px-3 py-2 text-xs focus:outline-none focus:border-[#1E40AF] font-medium"
                    value={onboardingForm.shift}
                    onChange={e => setOnboardingForm(f => ({ ...f, shift: e.target.value }))}
                  >
                    <option value="Morning Shift">Morning Shift</option>
                    <option value="Standard Shift">Standard Shift</option>
                    <option value="Night Shift">Night Shift</option>
                    <option value="General Shift">General Shift</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Annual CTC (USD)
                  </label>
                  <input
                    type="number"
                    className="w-full bg-white border border-[#E2E8F0] rounded-md px-3 py-2 text-xs focus:outline-none focus:border-[#1E40AF] font-medium"
                    placeholder="35000"
                    value={onboardingForm.starting_salary}
                    onChange={e => setOnboardingForm(f => ({ ...f, starting_salary: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Joining Date *
                  </label>
                  <input
                    required
                    type="date"
                    className="w-full bg-white border border-[#E2E8F0] rounded-md px-3 py-2 text-xs focus:outline-none focus:border-[#1E40AF] font-medium"
                    value={onboardingForm.join_date}
                    onChange={e => setOnboardingForm(f => ({ ...f, join_date: e.target.value }))}
                  />
                </div>
              </div>

              {/* Enterprise Provisioning Highlights */}
              <div className="bg-emerald-50/70 border border-emerald-200 rounded-lg p-3 space-y-1.5">
                <p className="text-[11px] font-bold text-emerald-900 flex items-center gap-1.5">
                  <UserCheck className="w-3.5 h-3.5 text-emerald-600" /> Automated Enterprise Onboarding Package
                </p>
                <ul className="text-[11px] text-emerald-800 space-y-1 list-disc list-inside">
                  <li>Assigns sequential employee code (<code className="font-mono font-bold">SLX-E06+</code>) with corporate credentials.</li>
                  <li>Provisions standard statutory leave balance: <strong>18 Annual</strong>, <strong>12 Sick</strong>, <strong>6 Casual</strong> days.</li>
                  <li>Initializes 6-step compliance & onboarding checklist (ID proof, Bank link, ERP access).</li>
                  <li>Sets pipeline stage to <strong className="text-emerald-700">JOINED</strong> and links salary CTC breakdown.</li>
                </ul>
              </div>

              <div className="flex items-center justify-end space-x-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setOnboardingCandidate(null)}
                  disabled={onboardingSubmitting}
                  className="px-4 py-2 border border-[#E2E8F0] rounded-md text-xs font-semibold text-slate-600 hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={onboardingSubmitting}
                  className="px-4 py-2 bg-emerald-600 text-white rounded-md text-xs font-semibold hover:bg-emerald-700 shadow-sm flex items-center space-x-1.5 transition-colors disabled:opacity-60"
                >
                  <UserCheck className="w-4 h-4" />
                  <span>{onboardingSubmitting ? 'Provisioning Staff…' : 'Confirm & Complete Onboarding'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
