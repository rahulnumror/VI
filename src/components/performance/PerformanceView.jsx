import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  TrendingUp,
  Target,
  Award,
  Users,
  CheckCircle2,
  Clock,
  Plus,
  ChevronRight,
  Star,
  Layers,
  ArrowUpRight,
  Filter,
  RefreshCw,
  X,
  FileText,
  Download,
  FileSpreadsheet,
  Sliders,
  Sparkles,
  DollarSign,
  Calendar,
  HelpCircle,
  Info,
  ChevronDown,
  Check
} from 'lucide-react';
import api from '../../services/api';
import DocumentGeneratorModal from '../hr/DocumentGeneratorModal';

export const COMPETENCY_WEIGHTS = {
  okr_achievement: { weight: 0.40, label: 'OKR / Target Achievement', desc: 'Direct corporate deliverable completion from active OKRs' },
  functional_quality: { weight: 0.25, label: 'Functional & Technical Quality', desc: 'Standard of work, zero-defect rate, laboratory & logistics accuracy' },
  collaboration_values: { weight: 0.20, label: 'Collaboration & Core Values', desc: 'Cross-functional alignment, peer coaching, client centricity' },
  innovation_efficiency: { weight: 0.15, label: 'Innovation & Efficiency', desc: 'Process cycle time reduction, cost optimizations, proactive initiative' },
};

export const POTENTIAL_WEIGHTS = {
  learning_agility: { weight: 0.50, label: 'Learning Agility & Adaptability', desc: 'Speed in assimilating new standards, regulations, and market conditions' },
  strategic_leadership: { weight: 0.50, label: 'Strategic Vision & Succession', desc: 'Readiness for cross-border leadership, team coaching & business ownership' },
};

export const RATING_BANDS = [
  {
    min: 4.6,
    max: 5.0,
    grade: 'O',
    label: 'Outstanding / Role Model',
    shortLabel: 'Outstanding',
    desc: 'Consistently surpasses stretch targets; sets benchmark across plants',
    incrementSuggested: 18,
    incrementRange: '15% – 20%',
    badgeCls: 'bg-emerald-100 text-emerald-800 border-emerald-300',
    starColor: 'text-emerald-600',
  },
  {
    min: 4.0,
    max: 4.59,
    grade: 'EE',
    label: 'Exceeds Expectations',
    shortLabel: 'Exceeds',
    desc: 'Regularly exceeds core OKR metrics; takes high ownership',
    incrementSuggested: 14,
    incrementRange: '10% – 14%',
    badgeCls: 'bg-blue-100 text-blue-800 border-blue-300',
    starColor: 'text-blue-600',
  },
  {
    min: 3.5,
    max: 3.99,
    grade: 'ME',
    label: 'Meets Expectations',
    shortLabel: 'Meets',
    desc: 'Consistently delivers on role expectations and standard targets',
    incrementSuggested: 8,
    incrementRange: '6% – 9%',
    badgeCls: 'bg-teal-100 text-teal-800 border-teal-300',
    starColor: 'text-teal-600',
  },
  {
    min: 2.8,
    max: 3.49,
    grade: 'DE',
    label: 'Developing / Partially Meets',
    shortLabel: 'Developing',
    desc: 'Met some deliverables; needs skills coaching or supervision',
    incrementSuggested: 4,
    incrementRange: '2% – 5%',
    badgeCls: 'bg-amber-100 text-amber-800 border-amber-300',
    starColor: 'text-amber-600',
  },
  {
    min: 1.0,
    max: 2.79,
    grade: 'NI',
    label: 'Needs Improvement / PIP',
    shortLabel: 'Needs Imp.',
    desc: 'Failed to meet minimum acceptable targets; 60-day PIP initiated',
    incrementSuggested: 0,
    incrementRange: '0%',
    badgeCls: 'bg-red-100 text-red-800 border-red-300',
    starColor: 'text-red-600',
  },
];

export function getRatingBand(score) {
  const num = parseFloat(score || 0);
  for (const b of RATING_BANDS) {
    if (num >= b.min) return b;
  }
  return RATING_BANDS[RATING_BANDS.length - 1];
}

export function computeManagerRatingFromRubric(comps) {
  const okr = parseFloat(comps.okr_achievement || 4.0);
  const func = parseFloat(comps.functional_quality || 4.0);
  const collab = parseFloat(comps.collaboration_values || 4.0);
  const innov = parseFloat(comps.innovation_efficiency || 4.0);
  const val = (okr * 0.40) + (func * 0.25) + (collab * 0.20) + (innov * 0.15);
  return Math.min(5.0, Math.max(1.0, Math.round(val * 10) / 10));
}

export function computePotentialRatingFromRubric(comps) {
  const agility = parseFloat(comps.learning_agility || 4.0);
  const leader = parseFloat(comps.strategic_leadership || 4.0);
  const val = (agility * 0.50) + (leader * 0.50);
  return Math.min(5.0, Math.max(1.0, Math.round(val * 10) / 10));
}

const FALLBACK_GOALS = [
  { id: 'PGL-001', employee_id: 'EMP-001', employee_name: 'Vũ Thị Hoan', department: 'Sales & Export', title: 'Expand UAE & GCC Spice Consignment Contracts', description: 'Achieve $1.8M in Black Pepper & Cardamom export orders', quarter: 'Q3-2026', target_metric: '$1.8M USD Invoices', progress_percent: 85, status: 'IN_PROGRESS' },
  { id: 'PGL-002', employee_id: 'EMP-002', employee_name: 'Rajesh Sharma', department: 'Quality Assurance', title: 'FSSAI & ASTA Moisture Zero-Defect Rate', description: 'Maintain batch test rejection below 0.2% across Kochi lab tests', quarter: 'Q3-2026', target_metric: '<0.2% Rejection', progress_percent: 95, status: 'COMPLETED' },
  { id: 'PGL-003', employee_id: 'EMP-003', employee_name: 'Nguyễn Văn Hùng', department: 'Operations & Supply', title: 'Berth Turnaround Time Reduction', description: 'Reduce container loading & customs seal cycle to under 3.5 hrs', quarter: 'Q3-2026', target_metric: '<3.5 hrs / TEU', progress_percent: 78, status: 'IN_PROGRESS' },
  { id: 'PGL-004', employee_id: 'EMP-004', employee_name: 'Priya Nair', department: 'Human Resources', title: 'Workforce Attendance & Shift Compliance', description: 'Reach 96% shift attendance compliance across processing hubs', quarter: 'Q3-2026', target_metric: '96% Compliance', progress_percent: 92, status: 'COMPLETED' },
  { id: 'PGL-005', employee_id: 'EMP-005', employee_name: 'Trần Quốc Bảo', department: 'Finance & Accounts', title: 'Cross-Border FX & VAT Reconciliation', description: 'Eliminate currency hedging mismatches in VND/INR trade ledgers', quarter: 'Q3-2026', target_metric: 'Zero Variance', progress_percent: 88, status: 'IN_PROGRESS' },
];

const FALLBACK_REVIEWS = [
  { id: 'REV-001', employee_id: 'EMP-001', employee_name: 'Vũ Thị Hoan', department: 'Sales & Export', cycle: 'Annual Cycle 2025-26', self_rating: 4.5, manager_rating: 4.7, potential_rating: 4.8, status: 'COMPLETED', feedback: 'Outstanding export sales performance in GCC markets. Recommended for promotion to Commercial Director.', reviewer: 'Executive VP', rubric: { okr: 4.8, functional: 4.7, collaboration: 4.6, innovation: 4.6, agility: 4.8, leadership: 4.8 } },
  { id: 'REV-002', employee_id: 'EMP-002', employee_name: 'Rajesh Sharma', department: 'Quality Assurance', cycle: 'Annual Cycle 2025-26', self_rating: 4.8, manager_rating: 4.9, potential_rating: 4.7, status: 'COMPLETED', feedback: 'Exemplary leadership in ISO 22000 lab audit and chemical analysis reliability.', reviewer: 'Plant Director', rubric: { okr: 4.9, functional: 5.0, collaboration: 4.8, innovation: 4.7, agility: 4.7, leadership: 4.7 } },
  { id: 'REV-003', employee_id: 'EMP-003', employee_name: 'Nguyễn Văn Hùng', department: 'Operations & Supply', cycle: 'Annual Cycle 2025-26', self_rating: 4.0, manager_rating: 4.2, potential_rating: 4.1, status: 'COMPLETED', feedback: 'Strong container logistics dispatch throughput at Hai Phong berth during peak shipping rush.', reviewer: 'Logistics Head', rubric: { okr: 4.1, functional: 4.3, collaboration: 4.2, innovation: 4.0, agility: 4.1, leadership: 4.1 } },
  { id: 'REV-004', employee_id: 'EMP-004', employee_name: 'Priya Nair', department: 'Human Resources', cycle: 'Annual Cycle 2025-26', self_rating: 4.6, manager_rating: 4.7, potential_rating: 4.6, status: 'COMPLETED', feedback: 'Successfully implemented bi-national workforce payroll and plant shop floor compliance.', reviewer: 'Executive VP', rubric: { okr: 4.7, functional: 4.8, collaboration: 4.7, innovation: 4.5, agility: 4.6, leadership: 4.6 } },
  { id: 'REV-005', employee_id: 'EMP-005', employee_name: 'Trần Quốc Bảo', department: 'Finance & Accounts', cycle: 'Annual Cycle 2025-26', self_rating: 4.3, manager_rating: 4.4, potential_rating: 4.2, status: 'COMPLETED', feedback: 'Thorough audit execution across cross-border LC settlements.', reviewer: 'Finance Controller', rubric: { okr: 4.4, functional: 4.5, collaboration: 4.3, innovation: 4.2, agility: 4.2, leadership: 4.2 } },
];

const FALLBACK_EMPLOYEES_LIST = [
  { id: 'EMP-001', employee_code: 'SLX-E01', full_name: 'Vũ Thị Hoan', department: 'Sales & Export', designation: 'Senior Sales Executive' },
  { id: 'EMP-002', employee_code: 'SLX-E02', full_name: 'Rajesh Sharma', department: 'Quality Assurance', designation: 'QA Lab Director' },
  { id: 'EMP-003', employee_code: 'SLX-E03', full_name: 'Nguyễn Văn Hùng', department: 'Operations & Supply', designation: 'Logistics Supervisor' },
  { id: 'EMP-004', employee_code: 'SLX-E04', full_name: 'Priya Nair', department: 'Human Resources', designation: 'HR Operations Lead' },
  { id: 'EMP-005', employee_code: 'SLX-E05', full_name: 'Trần Quốc Bảo', department: 'Finance & Accounts', designation: 'Senior Trade Accountant' },
];

const BASE_SALARY_MAP = {
  'EMP-001': { basic: 2200, ctc: 38400, hra: 880, trans: 200, med: 100, spec: 270, ptax: 50 },
  'EMP-002': { basic: 2600, ctc: 43200, hra: 1040, trans: 200, med: 100, spec: 460, ptax: 75 },
  'EMP-003': { basic: 1800, ctc: 28800, hra: 720, trans: 150, med: 100, spec: 230, ptax: 50 },
  'EMP-004': { basic: 1950, ctc: 32400, hra: 780, trans: 150, med: 100, spec: 270, ptax: 50 },
  'EMP-005': { basic: 2400, ctc: 40800, hra: 960, trans: 200, med: 100, spec: 340, ptax: 75 },
};

function getEmployeeSalary(empId) {
  const fallback = { basic: 2000, ctc: 36000, hra: 800, trans: 150, med: 100, spec: 200, ptax: 50 };
  if (!empId) return fallback;

  try {
    const stored = typeof window !== 'undefined' ? localStorage.getItem('soilex_salary_structures') : null;
    if (stored) {
      const map = JSON.parse(stored);
      const cleanId = String(empId);
      const altId = cleanId.startsWith('EMP-') ? cleanId.replace('EMP-', 'SLX-E') : cleanId.replace('SLX-E', 'EMP-');
      const item = map[cleanId] || map[altId];
      if (item) {
        const basic = Number(item.basic ?? item.basic_monthly ?? 2000) || 2000;
        const ctc = Number(item.ctc ?? item.ctc_annual ?? (basic * 12 * 1.5)) || (basic * 12 * 1.5);
        const hra = Number(item.hra ?? item.hra_monthly ?? Math.round(basic * 0.4)) || Math.round(basic * 0.4);
        const trans = Number(item.trans ?? item.transport_allowance ?? 150) || 150;
        const med = Number(item.med ?? item.medical_allowance ?? 100) || 100;
        const spec = Number(item.spec ?? item.special_allowance ?? 200) || 200;
        const ptax = Number(item.ptax ?? item.professional_tax ?? 50) || 50;
        return { basic, ctc, hra, trans, med, spec, ptax, ...item };
      }
    }
  } catch {}

  try {
    const onb = typeof window !== 'undefined' ? localStorage.getItem('soilex_onboarded_employees') : null;
    if (onb) {
      const list = JSON.parse(onb);
      const found = list.find(e => e.id === empId || e.employee_code === empId);
      if (found && found.starting_salary) {
        const ctc = Number(found.starting_salary) || 30000;
        const basic = Math.round((ctc / 12) * 0.5);
        const hra = Math.round((ctc / 12) * 0.2);
        const trans = 150;
        const med = 100;
        const spec = Math.max(0, Math.round(ctc / 12) - (basic + hra + trans + med));
        return { basic, ctc, hra, trans, med, spec, ptax: 50 };
      }
    }
  } catch {}

  if (BASE_SALARY_MAP[empId]) return { ...fallback, ...BASE_SALARY_MAP[empId] };
  return fallback;
}

function getPerfTier(rating) {
  const r = parseFloat(rating || 0);
  if (r >= 4.4) return 3; // High Performance
  if (r >= 3.5) return 2; // Medium Performance
  return 1; // Low Performance
}

function getPotTier(rating) {
  const r = parseFloat(rating || 0);
  if (r >= 4.4) return 3; // High Potential
  if (r >= 3.5) return 2; // Medium Potential
  return 1; // Low Potential
}

function matchesNineBox(cell, review) {
  const perfTier = getPerfTier(review.manager_rating);
  const potTier = getPotTier(review.potential_rating);
  return cell.row === potTier && cell.col === perfTier;
}

function getQuadrantForRatings(perf, pot) {
  const perfTier = getPerfTier(perf);
  const potTier = getPotTier(pot);
  const cell = NINE_BOX_MATRIX.find(c => c.row === potTier && c.col === perfTier);
  return cell ? cell.label : 'Core Contributor (Med Pot / Med Perf)';
}

const NINE_BOX_MATRIX = [
  { row: 3, col: 1, label: 'Enigma (High Pot / Low Perf)', desc: 'High potential talent requiring execution mentoring' },
  { row: 3, col: 2, label: 'Growth Star (High Pot / Med Perf)', desc: 'Fast track for leadership development' },
  { row: 3, col: 3, label: 'Future Leader (High Pot / High Perf)', desc: 'Consistent star performer ready for promotion' },
  { row: 2, col: 1, label: 'Dilemma (Med Pot / Low Perf)', desc: 'Needs performance improvement plan' },
  { row: 2, col: 2, label: 'Core Contributor (Med Pot / Med Perf)', desc: 'Solid consistent functional backbone' },
  { row: 2, col: 3, label: 'High Impact Performer (Med Pot / High Perf)', desc: 'Subject matter expert and top achiever' },
  { row: 1, col: 1, label: 'Underperformer (Low Pot / Low Perf)', desc: 'Requires immediate performance intervention' },
  { row: 1, col: 2, label: 'Effective Specialist (Low Pot / Med Perf)', desc: 'Valued specialized contributor' },
  { row: 1, col: 3, label: 'Trusted Workhorse (Low Pot / High Perf)', desc: 'Master in functional operational role' },
];

export default function PerformanceView({ onNavigate }) {
  const [activeTab, setActiveTab] = useState('GOALS');
  const [goals, setGoals] = useState(FALLBACK_GOALS);
  const [reviews, setReviews] = useState(FALLBACK_REVIEWS);
  const [employeeList, setEmployeeList] = useState(FALLBACK_EMPLOYEES_LIST);
  const [loading, setLoading] = useState(true);
  const [notification, setNotification] = useState(null);

  // Filter states
  const [selectedQuarter, setSelectedQuarter] = useState('ALL');
  const [selectedDept, setSelectedDept] = useState('ALL');
  const [matrixDeptFilter, setMatrixDeptFilter] = useState('ALL');
  const [reviewFilterTab, setReviewFilterTab] = useState('ALL'); // 'ALL' | 'COMPLETED' | 'NEW_JOINERS'

  // Modal states
  const [showGoalModal, setShowGoalModal] = useState(false);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [showRubricGuideModal, setShowRubricGuideModal] = useState(false);
  const [expandedReviewId, setExpandedReviewId] = useState(null);
  const [selectedGoal, setSelectedGoal] = useState(null);
  const [generatingDocEmployee, setGeneratingDocEmployee] = useState(null);
  const [calibratingReview, setCalibratingReview] = useState(null);
  const [calibrationForm, setCalibrationForm] = useState({
    manager_rating: 4.5,
    potential_rating: 4.5,
    quadrant: 'Future Leader (High Pot / High Perf)',
    feedback: '',
  });

  // Dynamic Competency Rubric Scoring States
  const [evalMode, setEvalMode] = useState('RUBRIC'); // 'RUBRIC' (Dynamic Weighted Scorecard) | 'DIRECT' (Executive Override)
  const [competencies, setCompetencies] = useState({
    okr_achievement: 4.3, // 40% weight
    functional_quality: 4.6, // 25% weight
    collaboration_values: 4.7, // 20% weight
    innovation_efficiency: 4.5, // 15% weight
    learning_agility: 4.7, // 50% potential
    strategic_leadership: 4.6, // 50% potential
  });

  // Salary & CTC link state
  const [applyToCtc, setApplyToCtc] = useState(true);

  // Form states
  const [goalForm, setGoalForm] = useState({
    employee_id: 'EMP-001',
    title: '',
    description: '',
    quarter: 'Q3-2026',
    target_metric: '',
    progress_percent: 0,
  });

  const [reviewForm, setReviewForm] = useState({
    employee_id: 'EMP-001',
    effective_date: new Date().toISOString().slice(0, 10),
    cycle: 'Annual Cycle 2025-26',
    self_rating: 4.5,
    manager_rating: 4.6,
    potential_rating: 4.7,
    recommended_increment: '15',
    promotion_track: 'Promote to Senior Specialist',
    feedback: 'Consistently exceeds commercial quarterly targets and maintains high team leadership standard.',
  });

  // Open Review Modal with full pre-population for specific review or employee
  const handleOpenReviewModalFor = (target) => {
    let rev = null;
    let empId = 'EMP-001';
    if (typeof target === 'string') {
      empId = target;
      rev = reviews.find(r => r.employee_id === empId || r.employee_code === empId) || null;
    } else if (target && typeof target === 'object') {
      rev = target;
      empId = rev.employee_id || rev.employee_code || rev.id;
    }

    const empGoals = (goals || []).filter(g => g.employee_id === empId);
    const avgProgress = empGoals.length > 0
      ? Math.round(empGoals.reduce((s, g) => s + (g.progress_percent || 0), 0) / empGoals.length)
      : 85;
    const autoOkrScore = Math.min(5.0, Math.max(1.0, Math.round((avgProgress / 20) * 10) / 10));

    const comps = rev?.rubric || {
      okr: autoOkrScore,
      functional: Number(rev?.manager_rating) || 4.2,
      collaboration: 4.2,
      innovation: 4.0,
      agility: Number(rev?.potential_rating) || 4.2,
      leadership: Number(rev?.potential_rating) || 4.2,
    };
    setCompetencies(comps);

    const mgr = Number(rev?.manager_rating) || 4.2;
    const pot = Number(rev?.potential_rating) || 4.2;
    const band = getRatingBand(mgr);

    setReviewForm({
      id: rev?.id,
      employee_id: empId,
      effective_date: rev?.effective_date || new Date().toISOString().slice(0, 10),
      cycle: rev?.cycle || 'Annual Cycle 2025-26',
      self_rating: Number(rev?.self_rating) || 4.0,
      manager_rating: mgr,
      potential_rating: pot,
      recommended_increment: String(band.incrementSuggested || 15),
      promotion_track: mgr >= 4.6 && pot >= 4.5
        ? 'Promote to Senior Specialist'
        : mgr >= 4.0
        ? 'Promote to Team / Lab Lead'
        : 'Retain Current Role',
      feedback: rev?.feedback || `Annual performance appraisal conducted. High dedication to quality standards and operational milestones.`,
    });
    setShowReviewModal(true);
  };

  // Dynamic Employee Change Handler with OKR Auto-Derivation
  const handleEmployeeChangeInReview = (empId) => {
    const rev = reviews.find(r => r.employee_id === empId || r.employee_code === empId);
    const empGoals = (goals || []).filter(g => g.employee_id === empId);
    const avgProgress = empGoals.length > 0
      ? Math.round(empGoals.reduce((s, g) => s + (g.progress_percent || 0), 0) / empGoals.length)
      : 85;
    const autoOkrScore = Math.min(5.0, Math.max(1.0, Math.round((avgProgress / 20) * 10) / 10));

    const updatedComps = rev?.rubric || {
      ...competencies,
      okr_achievement: autoOkrScore,
    };
    setCompetencies(updatedComps);

    const autoManager = rev?.manager_rating ? Number(rev.manager_rating) : computeManagerRatingFromRubric(updatedComps);
    const autoPotential = rev?.potential_rating ? Number(rev.potential_rating) : computePotentialRatingFromRubric(updatedComps);
    const band = getRatingBand(autoManager);

    setReviewForm(prev => ({
      ...prev,
      id: rev?.id,
      employee_id: empId,
      manager_rating: autoManager,
      potential_rating: autoPotential,
      recommended_increment: String(band.incrementSuggested || 15),
      promotion_track: autoManager >= 4.6 && autoPotential >= 4.5
        ? 'Promote to Senior Specialist'
        : autoManager >= 4.0
        ? 'Promote to Team / Lab Lead'
        : 'Retain Current Role',
      feedback: rev?.feedback || prev.feedback || 'Consistent performance against operational milestones.',
    }));
  };

  // Dynamic Competency Slider Handler
  const handleCompetencyChange = (field, value) => {
    const val = parseFloat(value);
    const updated = { ...competencies, [field]: val };
    setCompetencies(updated);

    if (evalMode === 'RUBRIC') {
      const autoManager = computeManagerRatingFromRubric(updated);
      const autoPotential = computePotentialRatingFromRubric(updated);
      const band = getRatingBand(autoManager);

      setReviewForm(prev => ({
        ...prev,
        manager_rating: autoManager,
        potential_rating: autoPotential,
        recommended_increment: String(band.incrementSuggested),
        promotion_track: autoManager >= 4.6 && autoPotential >= 4.5
          ? 'Promote to Senior Specialist'
          : autoManager >= 4.0
          ? 'Promote to Team / Lab Lead'
          : 'Retain Current Role',
      }));
    }
  };

  const notify = (type, msg) => {
    setNotification({ type, msg });
    setTimeout(() => setNotification(null), 3500);
  };

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [goalsRes, reviewsRes, empsRes, exitsRes] = await Promise.allSettled([
        api.getPerformanceGoals(),
        api.getPerformanceReviews(),
        api.getEmployees(),
        api.getAllExits(),
      ]);

      // Collect settled exit identifiers from backend and local cache
      const settledIds = new Set();
      const settledNames = new Set();

      if (exitsRes.status === 'fulfilled' && exitsRes.value && Array.isArray(exitsRes.value)) {
        exitsRes.value.forEach(x => {
          if (x.status === 'SETTLED') {
            if (x.employee_id) settledIds.add(String(x.employee_id).trim());
            if (x.employee_name) settledNames.add(String(x.employee_name).trim());
          }
        });
      }

      try {
        const storedSettled = JSON.parse(localStorage.getItem('soilex_settled_employees') || '[]');
        if (Array.isArray(storedSettled)) {
          storedSettled.forEach(s => {
            if (typeof s === 'string') {
              settledIds.add(s.trim());
            } else if (s && typeof s === 'object') {
              if (s.id) settledIds.add(String(s.id).trim());
              if (s.name) settledNames.add(String(s.name).trim());
            }
          });
        }
      } catch {}

      // Goals: exclude settled staff
      if (goalsRes.status === 'fulfilled' && goalsRes.value && Array.isArray(goalsRes.value) && goalsRes.value.length > 0) {
        setGoals(goalsRes.value.filter(g => !settledIds.has(String(g.employee_id).trim()) && !settledNames.has(String(g.employee_name).trim())));
      } else {
        setGoals(FALLBACK_GOALS.filter(g => !settledIds.has(String(g.employee_id).trim()) && !settledNames.has(String(g.employee_name).trim())));
      }

      // 1. Gather all active employees (backend + fallback + newly onboarded candidates)
      let emps = (empsRes.status === 'fulfilled' && empsRes.value && Array.isArray(empsRes.value) && empsRes.value.length > 0)
        ? [...empsRes.value]
        : [...FALLBACK_EMPLOYEES_LIST];

      try {
        const stored = localStorage.getItem('soilex_onboarded_employees');
        if (stored) {
          const onboarded = JSON.parse(stored);
          if (Array.isArray(onboarded)) {
            onboarded.forEach(e => {
              if (!emps.some(item => item.id === e.id || item.employee_code === e.employee_code)) {
                emps.push(e);
              }
            });
          }
        }
      } catch {}

      // Auto-remove settled / separated employees from employee list
      emps = emps.filter(e => {
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
      setEmployeeList(emps);

      // 2. Gather all performance reviews
      let baseReviews = [];
      if (reviewsRes.status === 'fulfilled' && reviewsRes.value && Array.isArray(reviewsRes.value) && reviewsRes.value.length > 0) {
        baseReviews = [...reviewsRes.value];
      } else {
        baseReviews = [...FALLBACK_REVIEWS];
      }

      // Merge reviews saved in localStorage
      try {
        const storedRevStr = localStorage.getItem('soilex_performance_reviews');
        if (storedRevStr) {
          const storedRevs = JSON.parse(storedRevStr);
          if (Array.isArray(storedRevs)) {
            storedRevs.forEach(sr => {
              const srId = String(sr.employee_id || '').trim();
              const srName = String(sr.employee_name || '').trim();
              if (settledIds.has(srId) || settledNames.has(srName)) return;
              const idx = baseReviews.findIndex(r => r.id === sr.id || r.employee_id === sr.employee_id);
              if (idx >= 0) {
                baseReviews[idx] = { ...baseReviews[idx], ...sr };
              } else {
                baseReviews.push(sr);
              }
            });
          }
        }
      } catch {}

      // Strictly filter baseReviews against settled personnel
      baseReviews = baseReviews.filter(r => {
        const id = String(r.employee_id || '').trim();
        const code = String(r.employee_code || '').trim();
        const name = String(r.employee_name || '').trim();
        if (settledIds.has(id) || settledIds.has(code) || settledNames.has(name)) {
          return false;
        }
        return true;
      });

      // 3. Auto-synthesize baseline review for ANY active non-settled employee who lacks one
      emps.forEach(emp => {
        const hasReview = baseReviews.some(
          r => r.employee_id === emp.id || r.employee_id === emp.employee_code || r.employee_name === emp.full_name
        );
        if (!hasReview) {
          const fallbackMatch = FALLBACK_REVIEWS.find(
            f => f.employee_id === emp.id || f.employee_id === emp.employee_code || f.employee_name === emp.full_name
          );
          if (fallbackMatch) {
            baseReviews.push({
              ...fallbackMatch,
              department: emp.department || fallbackMatch.department,
              designation: emp.designation || 'Specialist',
              join_date: emp.join_date
            });
          } else {
            const baselineRev = {
              id: `REV-${emp.id || emp.employee_code}`,
              employee_id: emp.id || emp.employee_code,
              employee_code: emp.employee_code || emp.id,
              employee_name: emp.full_name || emp.name,
              department: emp.department || 'Operations & Supply',
              designation: emp.designation || 'Staff Specialist',
              cycle: 'Probation / Onboarding Baseline',
              self_rating: 4.0,
              manager_rating: 4.0,
              potential_rating: 4.2,
              status: 'ONBOARDING_BASELINE',
              is_new_joiner: true,
              join_date: emp.join_date || new Date().toISOString().slice(0, 10),
              feedback: 'Newly onboarded candidate via talent pipeline. Initial probation baseline established; ready for 9-Box calibration and quarterly appraisal review.',
              reviewer: 'Talent Acquisition & HR Board',
              rubric: {
                okr: 4.0,
                functional: 4.0,
                collaboration: 4.0,
                innovation: 4.0,
                agility: 4.2,
                leadership: 4.2
              }
            };
            baseReviews.push(baselineRev);
          }
        }
      });

      // Final filter against settled personnel
      baseReviews = baseReviews.filter(r => {
        const id = String(r.employee_id || '').trim();
        const code = String(r.employee_code || '').trim();
        const name = String(r.employee_name || '').trim();
        return !settledIds.has(id) && !settledIds.has(code) && !settledNames.has(name);
      });

      setReviews(baseReviews);
    } catch {
      setGoals(FALLBACK_GOALS);
      setReviews(FALLBACK_REVIEWS);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
    const handleSettlementUpdate = () => loadData();
    window.addEventListener('soilex-settlement-updated', handleSettlementUpdate);
    window.addEventListener('storage', handleSettlementUpdate);
    return () => {
      window.removeEventListener('soilex-settlement-updated', handleSettlementUpdate);
      window.removeEventListener('storage', handleSettlementUpdate);
    };
  }, [loadData]);

  // KPI computations
  const avgOrgProgress = useMemo(() => {
    if (!goals.length) return 0;
    const total = goals.reduce((sum, g) => sum + (g.progress_percent || 0), 0);
    return Math.round(total / goals.length);
  }, [goals]);

  const completedGoalsCount = useMemo(() => {
    return goals.filter(g => g.progress_percent >= 100 || g.status === 'COMPLETED').length;
  }, [goals]);

  const filteredGoals = useMemo(() => {
    return goals.filter(g => {
      const matchQ = selectedQuarter === 'ALL' || g.quarter === selectedQuarter;
      const matchD = selectedDept === 'ALL' || g.department === selectedDept;
      return matchQ && matchD;
    });
  }, [goals, selectedQuarter, selectedDept]);

  const filteredAppraisalReviews = useMemo(() => {
    return reviews.filter(r => {
      if (reviewFilterTab === 'COMPLETED') {
        return r.status === 'COMPLETED' || r.status === 'CALIBRATED';
      }
      if (reviewFilterTab === 'NEW_JOINERS') {
        return r.is_new_joiner || r.status === 'ONBOARDING_BASELINE';
      }
      return true;
    });
  }, [reviews, reviewFilterTab]);

  // Handle Goal Creation
  const handleSaveGoal = async (e) => {
    e.preventDefault();
    try {
      const res = await api.createPerformanceGoal(goalForm);
      if (res !== null) {
        notify('success', 'Corporate Goal / OKR established successfully.');
        setShowGoalModal(false);
        setGoalForm({
          employee_id: 'EMP-001',
          title: '',
          description: '',
          quarter: 'Q3-2026',
          target_metric: '',
          progress_percent: 0,
        });
        await loadData();
      } else {
        notify('error', 'Failed to save goal.');
      }
    } catch {
      notify('error', 'Server error establishing goal.');
    }
  };

  // Handle Progress update
  const handleUpdateProgress = async (goalId, newProgress) => {
    try {
      const res = await api.updatePerformanceGoal(goalId, { progress_percent: newProgress });
      if (res !== null) {
        setGoals(prev => prev.map(g => g.id === goalId ? { ...g, progress_percent: newProgress, status: newProgress >= 100 ? 'COMPLETED' : 'IN_PROGRESS' } : g));
        notify('success', `Progress updated to ${newProgress}%`);
      }
    } catch {
      notify('error', 'Failed to update progress.');
    }
  };

  // Handle Review Submission
  const handleSaveReview = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    try {
      const matchedEmp = (employeeList || []).find(e => e.id === reviewForm.employee_id || e.employee_code === reviewForm.employee_id);
      const empMap = {
        'EMP-001': { name: 'Vũ Thị Hoan', dept: 'Sales & Export', desig: 'Senior Sales Executive' },
        'EMP-002': { name: 'Rajesh Sharma', dept: 'Quality Assurance', desig: 'QA Lab Director' },
        'EMP-003': { name: 'Nguyễn Văn Hùng', dept: 'Operations & Supply', desig: 'Logistics Supervisor' },
        'EMP-004': { name: 'Priya Nair', dept: 'Human Resources', desig: 'HR Operations Lead' },
        'EMP-005': { name: 'Trần Quốc Bảo', dept: 'Finance & Accounts', desig: 'Senior Trade Accountant' },
      };
      const empInfo = matchedEmp
        ? { name: matchedEmp.full_name, dept: matchedEmp.department, desig: matchedEmp.designation }
        : (empMap[reviewForm.employee_id] || { name: 'Staff Member', dept: 'General', desig: 'Executive' });

      const incPct = parseFloat(reviewForm.recommended_increment || '0') || 0;
      const factor = 1 + (incPct / 100);
      const curr = getEmployeeSalary(reviewForm.employee_id);
      const newBasic = Math.round(curr.basic * factor);
      const newHra = Math.round(curr.hra * factor);
      const newCtc = Math.round(curr.ctc * factor);
      const newPf = Math.round(newBasic * 0.12);
      const effectiveDate = reviewForm.effective_date || new Date().toISOString().slice(0, 10);
      const reviewId = reviewForm.id || `REV-${reviewForm.employee_id}`;

      const payload = {
        ...reviewForm,
        id: reviewId,
        employee_id: reviewForm.employee_id,
        employee_name: empInfo.name,
        department: empInfo.dept,
        status: 'COMPLETED',
        is_new_joiner: false,
        reviewer: 'Executive Evaluation Board',
        effective_date: effectiveDate,
        recommended_increment: incPct,
        new_ctc: applyToCtc ? newCtc : undefined,
        new_basic: applyToCtc ? newBasic : undefined,
        promotion_track: reviewForm.promotion_track || 'Promote to Senior Specialist',
        feedback: reviewForm.feedback || `Performance review successfully completed. Recommended for ${reviewForm.promotion_track || 'standard progression'}.`,
        rubric: {
          okr: competencies.okr_achievement || 4.0,
          functional: competencies.functional_quality || 4.0,
          collaboration: competencies.collaboration_values || 4.0,
          innovation: competencies.innovation_efficiency || 4.0,
          agility: competencies.learning_agility || 4.0,
          leadership: competencies.strategic_leadership || 4.0,
        },
      };

      // 1. Update in-memory & LocalStorage salary structure if checked
      let ctcUpdatedMsg = '';
      if (applyToCtc) {
        BASE_SALARY_MAP[reviewForm.employee_id] = {
          ...curr,
          basic: newBasic,
          hra: newHra,
          ctc: newCtc,
          pf_employee: newPf,
          effective_from: effectiveDate,
          last_appraisal_rating: reviewForm.manager_rating,
          last_appraisal_date: effectiveDate,
          increment_pct: incPct,
        };

        try {
          const existingSaved = JSON.parse(localStorage.getItem('soilex_salary_structures') || '{}');
          existingSaved[reviewForm.employee_id] = {
            ...curr,
            basic: newBasic,
            hra: newHra,
            ctc: newCtc,
            pf_employee: newPf,
            effective_from: effectiveDate,
            last_appraisal_rating: reviewForm.manager_rating,
            last_appraisal_date: effectiveDate,
            increment_pct: incPct,
          };
          localStorage.setItem('soilex_salary_structures', JSON.stringify(existingSaved));
        } catch (err) {
          console.warn('LocalStorage save error:', err);
        }

        try {
          await api.updateSalaryStructure({
            employee_id: reviewForm.employee_id,
            effective_from: effectiveDate,
            ctc_annual: newCtc,
            basic_monthly: newBasic,
            hra_monthly: newHra,
            transport_allowance: curr.trans,
            medical_allowance: curr.med,
            special_allowance: curr.spec,
            pf_employee: newPf,
            professional_tax: curr.ptax,
          });
          ctcUpdatedMsg = ` • CTC Structure updated from ${effectiveDate} (+${incPct}% increment applied, New Basic: $${newBasic.toLocaleString()}/mo, Annual CTC: $${newCtc.toLocaleString()})`;
        } catch (err) {
          ctcUpdatedMsg = ` • CTC updated (+${incPct}% increment, New Basic: $${newBasic.toLocaleString()}/mo)`;
        }
      }

      // 2. Persist to localStorage immediately
      try {
        const existingReviewsStr = localStorage.getItem('soilex_performance_reviews');
        const existingReviews = existingReviewsStr ? JSON.parse(existingReviewsStr) : [];
        const updatedList = [
          payload,
          ...existingReviews.filter(r => r.employee_id !== payload.employee_id && r.id !== payload.id)
        ];
        localStorage.setItem('soilex_performance_reviews', JSON.stringify(updatedList));
      } catch (err) {
        console.warn('LocalStorage save error:', err);
      }

      // 3. Immediately update component state so UI updates in real time
      setReviews(prev => {
        const filtered = prev.filter(r => r.employee_id !== payload.employee_id && r.id !== payload.id);
        return [payload, ...filtered];
      });

      // 4. Submit to backend API
      try {
        await api.submitPerformanceReview(payload);
      } catch (err) {
        console.warn('Backend review submission warning:', err);
      }

      notify('success', `Performance appraisal recorded for ${empInfo.name}${ctcUpdatedMsg}.`);
      setShowReviewModal(false);

      // 5. Reload data to synchronize with backend
      await loadData();
    } catch (error) {
      console.error('Error saving review:', error);
      notify('error', 'Error recording appraisal: ' + (error.message || 'Please check form inputs.'));
    }
  };

  // 9-Box Calibration Handlers
  const handleOpenCalibration = (review, targetCell = null) => {
    let perf = review.manager_rating;
    let pot = review.potential_rating;
    if (targetCell) {
      perf = targetCell.col === 3 ? 4.7 : targetCell.col === 2 ? 4.0 : 3.0;
      pot = targetCell.row === 3 ? 4.7 : targetCell.row === 2 ? 4.0 : 3.0;
    }
    setCalibratingReview(review);
    setCalibrationForm({
      manager_rating: perf,
      potential_rating: pot,
      quadrant: targetCell ? targetCell.label : getQuadrantForRatings(perf, pot),
      feedback: review.feedback || '',
    });
  };

  const handleSaveCalibration = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    if (!calibratingReview) return;
    try {
      const updated = {
        ...calibratingReview,
        manager_rating: parseFloat(calibrationForm.manager_rating) || 4.0,
        potential_rating: parseFloat(calibrationForm.potential_rating) || 4.0,
        feedback: calibrationForm.feedback || calibratingReview.feedback,
        status: 'CALIBRATED',
        is_new_joiner: false,
      };

      try {
        await api.submitPerformanceReview(updated);
      } catch (err) {
        console.warn('Backend calibration update error:', err);
      }

      try {
        const existingReviewsStr = localStorage.getItem('soilex_performance_reviews');
        const existingReviews = existingReviewsStr ? JSON.parse(existingReviewsStr) : [];
        const updatedList = [updated, ...existingReviews.filter(r => r.employee_id !== updated.employee_id && r.id !== updated.id)];
        localStorage.setItem('soilex_performance_reviews', JSON.stringify(updatedList));
      } catch {}

      setReviews(prev => prev.map(r => (r.id === calibratingReview.id || r.employee_id === calibratingReview.employee_id) ? updated : r));
      notify('success', `Calibrated ${calibratingReview.employee_name} into "${getQuadrantForRatings(updated.manager_rating, updated.potential_rating)}".`);
      setCalibratingReview(null);
    } catch (err) {
      console.error('Calibration error:', err);
      notify('error', 'Failed to calibrate talent ratings.');
    }
  };

  const handleExportAppraisalsCsv = () => {
    if (!reviews || reviews.length === 0) {
      notify('error', 'No appraisal records to export.');
      return;
    }
    const headers = [
      'Appraisal ID',
      'Employee Code',
      'Employee Name',
      'Department',
      'Evaluation Cycle',
      'Self Rating',
      'Manager Rating',
      'Potential Rating',
      'Evaluation Feedback',
      'Reviewer / Board',
      'Status'
    ];
    const rows = reviews.map(r => [
      `"${r.id}"`,
      `"${r.employee_id}"`,
      `"${r.employee_name}"`,
      `"${r.department || 'Operations'}"`,
      `"${r.cycle}"`,
      r.self_rating,
      r.manager_rating,
      r.potential_rating,
      `"${(r.feedback || '').replace(/"/g, '""')}"`,
      `"${r.reviewer || 'HR Committee'}"`,
      `"${r.status || 'COMPLETED'}"`
    ]);
    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `soilex_performance_appraisals_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    URL.revokeObjectURL(url);
    document.body.removeChild(a);
    notify('success', `Exported ${reviews.length} appraisal records to CSV.`);
  };

  const handleExportGoalsCsv = () => {
    if (!goals || goals.length === 0) {
      notify('error', 'No OKR records to export.');
      return;
    }
    const headers = ['Goal ID', 'Employee Code', 'Staff Name', 'Department', 'Objective Title', 'Quarter', 'Target Metric', 'Progress %', 'Status'];
    const rows = goals.map(g => [
      `"${g.id}"`,
      `"${g.employee_id}"`,
      `"${g.employee_name}"`,
      `"${g.department || ''}"`,
      `"${g.title.replace(/"/g, '""')}"`,
      `"${g.quarter}"`,
      `"${g.target_metric}"`,
      g.progress_percent,
      `"${g.status}"`
    ]);
    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `soilex_okrs_goals_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    URL.revokeObjectURL(url);
    document.body.removeChild(a);
    notify('success', `Exported ${goals.length} corporate OKRs to CSV.`);
  };

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

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-[#1E40AF] flex items-center justify-center border border-blue-200 shadow-sm">
            <TrendingUp className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-slate-900 tracking-wide uppercase">
              WORKFORCE PERFORMANCE, OKRs &amp; APPRAISALS
            </h1>
            <p className="text-xs text-slate-500">
              Strategic Objectives, Key Results (OKRs), 360 Reviews &amp; 9-Box Talent Matrix
            </p>
          </div>
        </div>

        {/* Tab Controls */}
        <div className="flex items-center space-x-1 bg-slate-100 p-1 rounded-lg border border-[#E2E8F0]">
          {[
            { id: 'GOALS', label: 'QUARTERLY OKRs & GOALS', icon: Target },
            { id: 'REVIEWS', label: 'APPRAISAL EVALUATIONS', icon: Award },
            { id: 'MATRIX', label: '9-BOX TALENT GRID', icon: Layers },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-md text-xs font-bold transition-colors ${
                  isActive
                    ? 'bg-white text-[#1E40AF] shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* KPI Highlights */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-xl border border-[#E2E8F0] shadow-card">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase">ACTIVE OKRs</span>
            <Target className="w-4 h-4 text-[#1E40AF]" />
          </div>
          <p className="text-2xl font-black text-slate-900 mt-2">{goals.length} Goals</p>
          <span className="text-[11px] font-semibold text-emerald-600">Across All Plants &amp; HQ</span>
        </div>

        <div className="bg-white p-5 rounded-xl border border-[#E2E8F0] shadow-card">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase">ORG COMPLETION RATE</span>
            <TrendingUp className="w-4 h-4 text-emerald-600" />
          </div>
          <p className="text-2xl font-black text-emerald-700 mt-2">{avgOrgProgress}%</p>
          <div className="w-full bg-slate-100 rounded-full h-1.5 mt-2">
            <div className="bg-emerald-500 h-1.5 rounded-full" style={{ width: `${avgOrgProgress}%` }} />
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-[#E2E8F0] shadow-card">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase">TARGETS ACHIEVED</span>
            <CheckCircle2 className="w-4 h-4 text-blue-600" />
          </div>
          <p className="text-2xl font-black text-[#1E40AF] mt-2">{completedGoalsCount} OKRs</p>
          <span className="text-[11px] font-semibold text-slate-500">100% Target Met</span>
        </div>

        <div className="bg-white p-5 rounded-xl border border-[#E2E8F0] shadow-card">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase">APPRAISALS AUDITED</span>
            <Award className="w-4 h-4 text-[#D97706]" />
          </div>
          <p className="text-2xl font-black text-slate-900 mt-2">{reviews.length} Finalized</p>
          <span className="text-[11px] font-semibold text-[#D97706]">Annual Review Cycle</span>
        </div>
      </div>

      {/* ──────────────────── TAB 1: OKRs & GOALS ──────────────────── */}
      {activeTab === 'GOALS' && (
        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-[#E2E8F0] shadow-card p-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
              <div className="flex items-center space-x-3">
                <select
                  value={selectedQuarter}
                  onChange={(e) => setSelectedQuarter(e.target.value)}
                  className="bg-slate-50 border border-[#E2E8F0] rounded-lg px-3 py-1.5 text-xs font-bold text-slate-700 focus:outline-none focus:border-[#1E40AF]"
                >
                  <option value="ALL">All Quarters</option>
                  <option value="Q3-2026">Q3-2026</option>
                  <option value="Q2-2026">Q2-2026</option>
                  <option value="Q1-2026">Q1-2026</option>
                </select>

                <select
                  value={selectedDept}
                  onChange={(e) => setSelectedDept(e.target.value)}
                  className="bg-slate-50 border border-[#E2E8F0] rounded-lg px-3 py-1.5 text-xs font-bold text-slate-700 focus:outline-none focus:border-[#1E40AF]"
                >
                  <option value="ALL">All Departments</option>
                  <option value="Sales & Export">Sales &amp; Export</option>
                  <option value="Quality Assurance">Quality Assurance</option>
                  <option value="Operations & Supply">Operations &amp; Supply</option>
                  <option value="Finance & Accounts">Finance &amp; Accounts</option>
                  <option value="Human Resources">Human Resources</option>
                </select>
              </div>

              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={handleExportGoalsCsv}
                  className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold border border-slate-300 transition-all flex items-center space-x-1.5"
                  title="Export all OKR goals to CSV spreadsheet"
                >
                  <Download className="w-4 h-4 text-slate-500" />
                  <span>EXPORT OKRs CSV</span>
                </button>
                <button
                  onClick={() => setShowGoalModal(true)}
                  className="px-4 py-2 bg-[#1E40AF] hover:bg-blue-800 text-white rounded-lg text-xs font-bold uppercase tracking-wider shadow-sm transition-all flex items-center space-x-1.5"
                >
                  <Plus className="w-4 h-4 text-[#FDE68A]" />
                  <span>+ ESTABLISH NEW OKR</span>
                </button>
              </div>
            </div>

            {/* OKR Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              {filteredGoals.map((g) => (
                <div
                  key={g.id}
                  className="p-5 rounded-xl border border-[#E2E8F0] bg-slate-50/50 hover:bg-white hover:shadow-md transition-all space-y-3"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                        {g.quarter} · {g.department || 'Operations'}
                      </span>
                      <h3 className="text-sm font-bold text-slate-900 mt-0.5">{g.title}</h3>
                    </div>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                      g.progress_percent >= 100 || g.status === 'COMPLETED'
                        ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                        : 'bg-blue-100 text-blue-800 border border-blue-300'
                    }`}>
                      {g.progress_percent >= 100 ? 'COMPLETED' : 'IN PROGRESS'}
                    </span>
                  </div>

                  <p className="text-xs text-slate-600 leading-relaxed">{g.description}</p>

                  <div className="p-2.5 bg-white rounded-lg border border-slate-100 flex items-center justify-between text-xs">
                    <span className="text-slate-500 font-semibold">Key Result Target:</span>
                    <span className="font-bold text-[#1E40AF]">{g.target_metric}</span>
                  </div>

                  {/* Progress Slider */}
                  <div className="space-y-1.5 pt-1">
                    <div className="flex justify-between text-xs font-bold">
                      <span className="text-slate-600">Goal Completion</span>
                      <span className="text-[#1E40AF]">{g.progress_percent}%</span>
                    </div>
                    <div className="w-full bg-slate-200 rounded-full h-2">
                      <div
                        className="bg-[#1E40AF] h-2 rounded-full transition-all duration-300"
                        style={{ width: `${Math.min(100, g.progress_percent)}%` }}
                      />
                    </div>
                  </div>

                  {/* Quick Action buttons */}
                  <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-[11px]">
                    <span className="text-slate-500 font-medium">Assigned: {g.employee_name || g.employee_id}</span>
                    <div className="flex items-center space-x-1.5">
                      <button
                        onClick={() => handleUpdateProgress(g.id, Math.min(100, (g.progress_percent || 0) + 10))}
                        className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded"
                      >
                        +10%
                      </button>
                      <button
                        onClick={() => handleUpdateProgress(g.id, 100)}
                        className="px-2 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold rounded"
                      >
                        Mark 100%
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ──────────────────── TAB 2: APPRAISALS & REVIEWS ──────────────────── */}
      {activeTab === 'REVIEWS' && (
        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-[#E2E8F0] shadow-card overflow-hidden">
            <div className="p-4 border-b border-[#E2E8F0] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                  ANNUAL WORKFORCE PERFORMANCE APPRAISALS
                </h3>
                <p className="text-[11px] text-slate-500">
                  Multi-pillar weighted evaluations (OKR 40%, Functional 25%, Values 20%, Innovation 15%) &amp; 9-Box potential
                </p>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={() => setShowRubricGuideModal(true)}
                  className="px-3 py-2 bg-blue-50 hover:bg-blue-100 text-[#1E40AF] rounded-lg text-xs font-bold border border-blue-200 transition-all flex items-center space-x-1.5"
                  title="View Standard 5-Band Rating & Competency Rubric Methodology"
                >
                  <HelpCircle className="w-4 h-4 text-[#1E40AF]" />
                  <span>RUBRIC &amp; BANDS GUIDE</span>
                </button>
                <button
                  type="button"
                  onClick={handleExportAppraisalsCsv}
                  className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold border border-slate-300 transition-all flex items-center space-x-1.5"
                  title="Export all appraisals to CSV spreadsheet"
                >
                  <Download className="w-4 h-4 text-slate-500" />
                  <span>EXPORT CSV</span>
                </button>
                <button
                  onClick={() => {
                    const targetEmpId = reviewForm.employee_id || (employeeList[0] ? employeeList[0].id : 'EMP-001');
                    handleOpenReviewModalFor(targetEmpId);
                  }}
                  className="px-4 py-2 bg-[#1E40AF] hover:bg-blue-800 text-white rounded-lg text-xs font-bold uppercase tracking-wider shadow-sm transition-all flex items-center space-x-1.5"
                >
                  <Plus className="w-4 h-4 text-[#FDE68A]" />
                  <span>+ CONDUCT APPRAISAL</span>
                </button>
              </div>
            </div>

            {/* Filter Tabs for Appraisals */}
            <div className="px-4 py-2.5 bg-slate-50 border-b border-[#E2E8F0] flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center space-x-1.5 bg-slate-200/60 p-1 rounded-lg">
                <button
                  type="button"
                  onClick={() => setReviewFilterTab('ALL')}
                  className={`px-3 py-1 text-xs font-bold rounded-md transition-all ${
                    reviewFilterTab === 'ALL'
                      ? 'bg-white text-[#1E40AF] shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  All Staff ({reviews.length})
                </button>
                <button
                  type="button"
                  onClick={() => setReviewFilterTab('COMPLETED')}
                  className={`px-3 py-1 text-xs font-bold rounded-md transition-all ${
                    reviewFilterTab === 'COMPLETED'
                      ? 'bg-white text-emerald-800 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Finalized Appraisals ({reviews.filter(r => r.status === 'COMPLETED' || r.status === 'CALIBRATED').length})
                </button>
                <button
                  type="button"
                  onClick={() => setReviewFilterTab('NEW_JOINERS')}
                  className={`px-3 py-1 text-xs font-bold rounded-md transition-all flex items-center space-x-1 ${
                    reviewFilterTab === 'NEW_JOINERS'
                      ? 'bg-white text-blue-900 shadow-xs ring-1 ring-blue-300'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Sparkles className="w-3 h-3 text-[#D97706]" />
                  <span>Newly Onboarded / Probation ({reviews.filter(r => r.is_new_joiner || r.status === 'ONBOARDING_BASELINE').length})</span>
                </button>
              </div>
              <span className="text-[11px] text-slate-500 font-medium">
                Showing {filteredAppraisalReviews.length} workforce review records
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left text-slate-700">
                <thead className="bg-[#FAFAFA] border-b border-[#E2E8F0] text-[11px] font-bold uppercase tracking-wider text-slate-600">
                  <tr>
                    <th className="py-3 px-4">EMPLOYEE</th>
                    <th className="py-3 px-4">DEPARTMENT</th>
                    <th className="py-3 px-4">CYCLE</th>
                    <th className="py-3 px-4 text-center">SELF (360° Δ)</th>
                    <th className="py-3 px-4 text-center">PERFORMANCE (X)</th>
                    <th className="py-3 px-4 text-center">POTENTIAL (Y)</th>
                    <th className="py-3 px-4 text-center">SCORECARD</th>
                    <th className="py-3 px-4 text-center">ACTION</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {filteredAppraisalReviews.map((rev) => {
                    const band = getRatingBand(rev.manager_rating);
                    const quadrant = getQuadrantForRatings(rev.manager_rating, rev.potential_rating);
                    const delta = Math.round((rev.manager_rating - rev.self_rating) * 10) / 10;
                    const isExpanded = expandedReviewId === rev.id;

                    return (
                      <React.Fragment key={rev.id}>
                        <tr className={`hover:bg-blue-50/40 transition-colors ${isExpanded ? 'bg-blue-50/20' : ''}`}>
                          <td className="py-3 px-4">
                            <span className="font-bold text-slate-900 block">{rev.employee_name}</span>
                            <div className="flex items-center space-x-1.5 mt-0.5">
                              <span className="font-mono text-[10px] text-slate-400">{rev.employee_id}</span>
                              {(rev.is_new_joiner || rev.status === 'ONBOARDING_BASELINE') && (
                                <span className="text-[9px] font-extrabold bg-blue-100 text-[#1E40AF] border border-blue-200 px-1.5 py-0.5 rounded-full inline-flex items-center space-x-0.5">
                                  <Sparkles className="w-2.5 h-2.5 text-[#D97706]" />
                                  <span>NEW ONBOARDED</span>
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="py-3 px-4 text-slate-600">{rev.department || 'Operations'}</td>
                          <td className="py-3 px-4 text-slate-500 font-mono text-[10px]">
                            <span className="font-semibold text-slate-700 block">{rev.cycle}</span>
                            {rev.join_date && (
                              <span className="text-[9px] text-slate-400">Joined: {rev.join_date}</span>
                            )}
                          </td>
                          <td className="py-3 px-4 text-center">
                            <span className="font-bold text-slate-700">{rev.self_rating}★</span>
                            <span className={`block text-[9px] font-bold mt-0.5 ${
                              Math.abs(delta) <= 0.3 ? 'text-emerald-600' : delta > 0 ? 'text-blue-600' : 'text-amber-600'
                            }`}>
                              Δ {delta > 0 ? `+${delta}` : delta}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-center">
                            <div className="flex flex-col items-center">
                              <span className="font-black text-sm text-[#1E40AF] flex items-center space-x-1">
                                <Star className="w-3.5 h-3.5 fill-blue-600 text-[#1E40AF]" />
                                <span>{rev.manager_rating}</span>
                              </span>
                              <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded border mt-0.5 ${band.badgeCls}`}>
                                {band.grade} · {band.shortLabel}
                              </span>
                            </div>
                          </td>
                          <td className="py-3 px-4 text-center">
                            <div className="flex flex-col items-center">
                              <span className="font-black text-xs text-emerald-700 flex items-center space-x-1">
                                <Sparkles className="w-3 h-3 text-emerald-600" />
                                <span>{rev.potential_rating}</span>
                              </span>
                              <span className="text-[9px] font-semibold text-slate-600 mt-0.5 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">
                                {quadrant.split(' ')[0]}
                              </span>
                            </div>
                          </td>
                          <td className="py-3 px-4 text-center">
                            <button
                              type="button"
                              onClick={() => setExpandedReviewId(isExpanded ? null : rev.id)}
                              className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-[11px] font-semibold transition-all inline-flex items-center space-x-1"
                            >
                              <span>{isExpanded ? 'Hide' : 'Rubric'}</span>
                              <ChevronDown className={`w-3 h-3 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                            </button>
                          </td>
                          <td className="py-3 px-4 text-center">
                            <div className="flex items-center justify-center space-x-1.5">
                              {(rev.is_new_joiner || rev.status === 'ONBOARDING_BASELINE') ? (
                                <button
                                  type="button"
                                  onClick={() => handleOpenReviewModalFor(rev)}
                                  className="px-2.5 py-1.5 bg-[#1E40AF] hover:bg-blue-800 text-white rounded text-xs font-bold transition-all flex items-center space-x-1 shadow-xs"
                                  title="Conduct Official Appraisal for Newly Onboarded Staff"
                                >
                                  <Award className="w-3.5 h-3.5 text-amber-300" />
                                  <span>Appraise</span>
                                </button>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => handleOpenReviewModalFor(rev)}
                                  className="px-2 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-xs font-bold transition-all flex items-center space-x-1"
                                  title="Re-evaluate or adjust appraisal"
                                >
                                  <span>Edit</span>
                                </button>
                              )}
                              <button
                                type="button"
                                onClick={() => {
                                  setGeneratingDocEmployee({
                                    id: rev.employee_id,
                                    employee_code: rev.employee_id,
                                    full_name: rev.employee_name,
                                    designation: rev.designation || (rev.department === 'Sales & Export' ? 'Senior Sales Executive' :
                                                 rev.department === 'Quality Assurance' ? 'QA Lab Director' :
                                                 rev.department === 'Operations & Supply' ? 'Logistics Supervisor' :
                                                 rev.department === 'Human Resources' ? 'HR Operations Lead' :
                                                 rev.department === 'Finance & Accounts' ? 'Senior Trade Accountant' : 'Senior Specialist'),
                                    department: rev.department || 'Operations',
                                    manager_rating: rev.manager_rating,
                                    feedback: rev.feedback,
                                  });
                                }}
                                className="px-2 py-1.5 bg-blue-50 hover:bg-blue-100 text-[#1E40AF] rounded border border-blue-200 text-xs font-bold transition-all flex items-center space-x-1"
                                title="Generate Official Annual Appraisal & Increment Letterhead"
                              >
                                <FileText className="w-3.5 h-3.5" />
                                <span>Letter</span>
                              </button>
                            </div>
                          </td>
                        </tr>

                        {/* Inline Scorecard Rubric Drawer */}
                        {isExpanded && (
                          <tr className="bg-slate-50/80 border-b border-blue-100">
                            <td colSpan={8} className="p-4">
                              <div className="bg-white p-4 rounded-lg border border-blue-200 shadow-sm space-y-3 text-xs">
                                <div className="flex items-center justify-between border-b pb-2">
                                  <span className="font-bold text-[#1E40AF] uppercase text-[11px] flex items-center space-x-1.5">
                                    <Sparkles className="w-3.5 h-3.5 text-[#D97706]" />
                                    <span>Detailed Competency Scorecard &amp; Rubric Breakdown — {rev.employee_name}</span>
                                  </span>
                                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${band.badgeCls}`}>
                                    Band {band.grade}: {band.label} (Suggested Increment: {band.incrementRange})
                                  </span>
                                </div>

                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-[11px]">
                                  <div className="bg-slate-50 p-2.5 rounded border border-slate-200">
                                    <span className="text-slate-500 block text-[10px]">1. OKR Execution (40%)</span>
                                    <span className="font-black text-slate-800 text-sm">{rev.rubric?.okr || 4.5} ★</span>
                                    <p className="text-[9px] text-slate-400 mt-0.5">Commercial &amp; operational metrics</p>
                                  </div>
                                  <div className="bg-slate-50 p-2.5 rounded border border-slate-200">
                                    <span className="text-slate-500 block text-[10px]">2. Quality &amp; SOP (25%)</span>
                                    <span className="font-black text-slate-800 text-sm">{rev.rubric?.functional || 4.6} ★</span>
                                    <p className="text-[9px] text-slate-400 mt-0.5">Zero defect &amp; lab accuracy</p>
                                  </div>
                                  <div className="bg-slate-50 p-2.5 rounded border border-slate-200">
                                    <span className="text-slate-500 block text-[10px]">3. Core Values (20%)</span>
                                    <span className="font-black text-slate-800 text-sm">{rev.rubric?.collaboration || 4.7} ★</span>
                                    <p className="text-[9px] text-slate-400 mt-0.5">Cross-team collaboration &amp; ethics</p>
                                  </div>
                                  <div className="bg-slate-50 p-2.5 rounded border border-slate-200">
                                    <span className="text-slate-500 block text-[10px]">4. Innovation (15%)</span>
                                    <span className="font-black text-slate-800 text-sm">{rev.rubric?.innovation || 4.5} ★</span>
                                    <p className="text-[9px] text-slate-400 mt-0.5">Efficiency &amp; problem solving</p>
                                  </div>
                                </div>

                                <div className="p-2.5 bg-blue-50/60 rounded border border-blue-100 flex items-start space-x-2">
                                  <Info className="w-4 h-4 text-[#1E40AF] shrink-0 mt-0.5" />
                                  <div className="text-[11px]">
                                    <span className="font-bold text-slate-800">Executive Feedback &amp; Calibration Notes: </span>
                                    <span className="text-slate-600">{rev.feedback}</span>
                                    <span className="text-[10px] text-slate-400 block mt-0.5">Reviewed by: {rev.reviewer || 'HR Committee'}</span>
                                  </div>
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ──────────────────── TAB 3: 9-BOX TALENT MATRIX ──────────────────── */}
      {activeTab === 'MATRIX' && (
        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-[#E2E8F0] shadow-card p-6 space-y-5">
            {/* Header & Controls */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#E2E8F0] pb-4">
              <div>
                <div className="flex items-center space-x-2">
                  <Layers className="w-4 h-4 text-[#1E40AF]" />
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                    ENTERPRISE 9-BOX TALENT &amp; LEADERSHIP SUCCESSION GRID
                  </h3>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  Strategic workforce alignment mapping Performance (X-Axis) against Leadership Potential (Y-Axis)
                </p>
              </div>

              {/* Department Filter & Actions */}
              <div className="flex items-center space-x-3">
                <div className="flex items-center space-x-2 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5">
                  <Filter className="w-3.5 h-3.5 text-slate-500" />
                  <select
                    value={matrixDeptFilter}
                    onChange={(e) => setMatrixDeptFilter(e.target.value)}
                    className="bg-transparent text-xs font-bold text-slate-700 outline-none cursor-pointer"
                  >
                    <option value="ALL">All Departments ({reviews.length})</option>
                    <option value="Sales & Export">Sales &amp; Export</option>
                    <option value="Quality Assurance">Quality Assurance</option>
                    <option value="Operations & Supply">Operations &amp; Supply</option>
                    <option value="Human Resources">Human Resources</option>
                    <option value="Finance & Accounts">Finance &amp; Accounts</option>
                  </select>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    const candidateRev = reviews[0] || FALLBACK_REVIEWS[0];
                    handleOpenCalibration(candidateRev);
                  }}
                  className="px-3 py-1.5 bg-[#1E40AF] hover:bg-blue-800 text-white rounded-lg text-xs font-bold transition-all flex items-center space-x-1.5 shadow-sm"
                >
                  <Sliders className="w-3.5 h-3.5" />
                  <span>Calibrate Talent</span>
                </button>
              </div>
            </div>

            {/* Quick KPI summary */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="p-3 bg-blue-50/60 border border-blue-200 rounded-lg">
                <div className="text-[10px] font-bold text-blue-700 uppercase">Future Leaders (Stars)</div>
                <div className="text-lg font-black text-[#1E40AF]">
                  {reviews.filter(r => matchesNineBox({ row: 3, col: 3 }, r)).length}
                </div>
                <div className="text-[10px] text-blue-600">Top promotion succession tier</div>
              </div>
              <div className="p-3 bg-emerald-50/60 border border-emerald-200 rounded-lg">
                <div className="text-[10px] font-bold text-emerald-700 uppercase">High Growth Stars</div>
                <div className="text-lg font-black text-emerald-800">
                  {reviews.filter(r => matchesNineBox({ row: 3, col: 2 }, r) || matchesNineBox({ row: 2, col: 3 }, r)).length}
                </div>
                <div className="text-[10px] text-emerald-600">High impact &amp; fast-track potential</div>
              </div>
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
                <div className="text-[10px] font-bold text-slate-700 uppercase">Core Contributors</div>
                <div className="text-lg font-black text-slate-800">
                  {reviews.filter(r => matchesNineBox({ row: 2, col: 2 }, r)).length}
                </div>
                <div className="text-[10px] text-slate-500">Solid functional operational backbone</div>
              </div>
              <div className="p-3 bg-amber-50/60 border border-amber-200 rounded-lg">
                <div className="text-[10px] font-bold text-amber-700 uppercase">Intervention / Action</div>
                <div className="text-lg font-black text-amber-800">
                  {reviews.filter(r => matchesNineBox({ row: 1, col: 1 }, r) || matchesNineBox({ row: 2, col: 1 }, r)).length}
                </div>
                <div className="text-[10px] text-amber-600">Requires targeted mentorship or PIP</div>
              </div>
            </div>

            {/* Newly Onboarded Candidates Quick Calibration Shelf */}
            {reviews.filter(r => r.is_new_joiner || r.status === 'ONBOARDING_BASELINE').length > 0 && (
              <div className="bg-gradient-to-r from-blue-50/90 via-indigo-50/70 to-amber-50/80 border border-blue-200/90 rounded-xl p-4 shadow-xs">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 rounded-lg bg-[#1E40AF] text-white flex items-center justify-center font-bold text-sm shadow-xs shrink-0">
                      ✨
                    </div>
                    <div>
                      <div className="flex items-center space-x-2">
                        <h4 className="text-xs font-black uppercase tracking-wider text-slate-900">
                          Newly Onboarded Talent Pipeline ({reviews.filter(r => r.is_new_joiner || r.status === 'ONBOARDING_BASELINE').length} Candidates)
                        </h4>
                        <span className="text-[9px] font-bold bg-amber-100 text-amber-800 border border-amber-300 px-2 py-0.5 rounded-full">
                          Probation Baseline Active
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-600 mt-0.5">
                        Candidates onboarded via recruitment are automatically mapped at probation baseline in the 9-Box Grid. Click <strong>"Calibrate"</strong> to adjust their quadrant.
                      </p>
                    </div>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2 mt-3 pt-3 border-t border-blue-200/60">
                  {reviews.filter(r => r.is_new_joiner || r.status === 'ONBOARDING_BASELINE').map(emp => (
                    <div key={emp.id} className="bg-white border border-blue-200/80 rounded-lg px-3 py-2 flex items-center space-x-3 shadow-xs">
                      <div className="text-left">
                        <div className="flex items-center space-x-1.5">
                          <span className="text-xs font-bold text-slate-900">{emp.employee_name}</span>
                          <span className="font-mono text-[9px] text-slate-400">({emp.employee_id})</span>
                        </div>
                        <span className="text-[10px] text-slate-500 font-medium block">
                          {emp.department} · {emp.designation || 'Specialist'}
                        </span>
                      </div>
                      <span className="text-[10px] font-bold bg-blue-50 text-[#1E40AF] px-1.5 py-0.5 rounded border border-blue-200 whitespace-nowrap">
                        {getQuadrantForRatings(emp.manager_rating, emp.potential_rating).split('(')[0].trim()}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleOpenCalibration(emp)}
                        className="px-2.5 py-1 bg-[#1E40AF] hover:bg-blue-800 text-white rounded text-[11px] font-bold flex items-center space-x-1 shadow-xs transition-colors"
                      >
                        <Sliders className="w-3 h-3 text-amber-300" />
                        <span>Calibrate</span>
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Main 9-Box Grid with 2-Axis Labels */}
            <div className="relative pt-2">
              {/* Y-Axis Label */}
              <div className="flex items-center justify-between mb-2 px-1 text-[11px] font-bold text-slate-500">
                <span className="flex items-center space-x-1 text-[#1E40AF]">
                  <span>▲</span>
                  <span>Y-AXIS: LEADERSHIP &amp; GROWTH POTENTIAL (HIGH ➔ LOW)</span>
                </span>
                <span className="text-[10px] text-slate-400 italic">Click any employee chip or [+ Place Staff] to calibrate ratings</span>
              </div>

              {/* 3x3 Grid */}
              <div className="grid grid-cols-3 gap-3">
                {NINE_BOX_MATRIX.map((cell, idx) => {
                  const filteredReviews = reviews.filter(r => {
                    const matchDept = matrixDeptFilter === 'ALL' || r.department === matrixDeptFilter;
                    return matchDept && matchesNineBox(cell, r);
                  });

                  const isStar = cell.row === 3 && cell.col === 3;
                  const isHighImpact = cell.row === 3 || cell.col === 3;
                  const isLow = cell.row === 1 && cell.col === 1;

                  return (
                    <div
                      key={idx}
                      className={`p-3.5 rounded-xl border transition-all min-h-[175px] flex flex-col justify-between ${
                        isStar
                          ? 'bg-blue-50/80 border-blue-300 shadow-sm ring-1 ring-blue-200'
                          : isLow
                          ? 'bg-rose-50/40 border-rose-200'
                          : isHighImpact
                          ? 'bg-amber-50/30 border-amber-200'
                          : 'bg-slate-50/70 border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <div>
                        {/* Cell Title & Badges */}
                        <div className="flex items-start justify-between gap-1">
                          <div>
                            <div className="flex items-center space-x-1.5">
                              <span className={`text-[11px] font-bold uppercase ${isStar ? 'text-[#1E40AF]' : 'text-slate-800'}`}>
                                {cell.label.split('(')[0].trim()}
                              </span>
                              {isStar && <Star className="w-3.5 h-3.5 text-[#D97706] fill-amber-400 inline" />}
                            </div>
                            <span className="text-[9px] font-mono text-slate-500 font-semibold block">
                              {cell.label.includes('(') ? `(${cell.label.split('(')[1]}` : ''}
                            </span>
                          </div>
                          <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                            filteredReviews.length > 0
                              ? isStar ? 'bg-blue-200 text-blue-900' : 'bg-slate-200 text-slate-800'
                              : 'bg-slate-100 text-slate-400'
                          }`}>
                            {filteredReviews.length}
                          </span>
                        </div>
                        <p className="text-[10px] text-slate-500 mt-1 leading-snug">{cell.desc}</p>
                      </div>

                      {/* Employee Badges & Quick Place Button */}
                      <div className="pt-2 mt-2 border-t border-slate-200/70 space-y-2">
                        <div className="flex flex-wrap gap-1.5 min-h-[32px] items-center">
                          {filteredReviews.length > 0 ? (
                            filteredReviews.map(emp => (
                              <button
                                key={emp.id}
                                type="button"
                                onClick={() => handleOpenCalibration(emp)}
                                className={`group flex items-center space-x-1 px-2 py-1 rounded-md text-[10px] font-bold border shadow-xs transition-all ${
                                  emp.is_new_joiner || emp.status === 'ONBOARDING_BASELINE'
                                    ? 'bg-amber-50/90 border-amber-300 text-amber-900 hover:border-amber-500 hover:bg-amber-100/60 ring-1 ring-amber-200'
                                    : isStar
                                    ? 'bg-white border-blue-300 text-blue-900 hover:border-blue-500 hover:bg-blue-50'
                                    : 'bg-white border-slate-300 text-slate-800 hover:border-[#1E40AF] hover:text-[#1E40AF]'
                                }`}
                                title="Click to calibrate performance / potential scores"
                              >
                                <span>{(emp.is_new_joiner || emp.status === 'ONBOARDING_BASELINE') ? '✨' : '👤'}</span>
                                <span>{emp.employee_name}</span>
                                <span className="font-mono text-[9px] text-[#1E40AF]">({emp.manager_rating}P/{emp.potential_rating}L)</span>
                                <Sliders className="w-2.5 h-2.5 text-slate-400 group-hover:text-[#1E40AF]" />
                              </button>
                            ))
                          ) : (
                            <span className="text-[10px] text-slate-400 italic">No staff placed</span>
                          )}
                        </div>

                        {/* Place Staff CTA */}
                        <div className="flex justify-end">
                          <button
                            type="button"
                            onClick={() => {
                              const pick = reviews[0] || FALLBACK_REVIEWS[0];
                              handleOpenCalibration(pick, cell);
                            }}
                            className="text-[10px] font-bold text-slate-500 hover:text-[#1E40AF] flex items-center space-x-1 transition-colors"
                          >
                            <Plus className="w-3 h-3" />
                            <span>Calibrate into Box</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* X-Axis Label */}
              <div className="mt-3 flex items-center justify-center space-x-2 text-[11px] font-bold text-[#1E40AF] border-t border-slate-100 pt-2">
                <span>X-AXIS: PERFORMANCE &amp; COMMERCIAL TARGET DELIVERY (LOW ➔ MEDIUM ➔ HIGH)</span>
                <span>►</span>
              </div>
            </div>

            {/* Matrix Operational Guide Footer */}
            <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 text-[11px] text-slate-600 flex flex-col md:flex-row md:items-center justify-between gap-2">
              <div className="flex items-center space-x-4">
                <span className="font-bold text-slate-700">Classification Tiers:</span>
                <span>• <strong>High</strong>: Rating ≥ 4.4</span>
                <span>• <strong>Medium</strong>: Rating 3.5 – 4.3</span>
                <span>• <strong>Low</strong>: Rating &lt; 3.5</span>
              </div>
              <div className="text-[10px] text-slate-500">
                Staff placement updates automatically when ratings are adjusted in appraisals or the calibration drawer.
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ──────────────────── MODAL: CREATE OKR / GOAL ──────────────────── */}
      {showGoalModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl border border-[#E2E8F0] shadow-2xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <div className="flex items-center space-x-2">
                <Target className="w-5 h-5 text-[#1E40AF]" />
                <h3 className="text-sm font-bold text-slate-900 uppercase">ESTABLISH NEW STRATEGIC OKR</h3>
              </div>
              <button onClick={() => setShowGoalModal(false)} className="text-slate-400 hover:text-slate-600 font-bold text-lg">×</button>
            </div>

            <form onSubmit={handleSaveGoal} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Assign to Employee</label>
                <select
                  value={goalForm.employee_id}
                  onChange={(e) => setGoalForm(f => ({ ...f, employee_id: e.target.value }))}
                  className="w-full bg-white border border-[#E2E8F0] rounded-md px-3 py-2 text-xs font-semibold text-slate-800 focus:outline-none focus:border-[#1E40AF]"
                >
                  <option value="EMP-001">Vũ Thị Hoan (Sales & Export)</option>
                  <option value="EMP-002">Rajesh Sharma (Quality Assurance)</option>
                  <option value="EMP-003">Nguyễn Văn Hùng (Operations & Supply)</option>
                  <option value="EMP-004">Priya Nair (Human Resources)</option>
                  <option value="EMP-005">Trần Quốc Bảo (Finance & Accounts)</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Objective Title</label>
                <input
                  type="text"
                  required
                  value={goalForm.title}
                  onChange={(e) => setGoalForm(f => ({ ...f, title: e.target.value }))}
                  placeholder="e.g. Expand High-Grade Black Pepper Sourcing"
                  className="w-full bg-white border border-[#E2E8F0] rounded-md px-3 py-2 text-xs font-semibold text-slate-800 focus:outline-none focus:border-[#1E40AF]"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Measurable Key Result Metric</label>
                <input
                  type="text"
                  required
                  value={goalForm.target_metric}
                  onChange={(e) => setGoalForm(f => ({ ...f, target_metric: e.target.value }))}
                  placeholder="e.g. 1,200 Metric Tons Exported"
                  className="w-full bg-white border border-[#E2E8F0] rounded-md px-3 py-2 text-xs font-semibold text-slate-800 focus:outline-none focus:border-[#1E40AF]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Quarter Cycle</label>
                  <select
                    value={goalForm.quarter}
                    onChange={(e) => setGoalForm(f => ({ ...f, quarter: e.target.value }))}
                    className="w-full bg-white border border-[#E2E8F0] rounded-md px-3 py-2 text-xs font-semibold text-slate-800 focus:outline-none focus:border-[#1E40AF]"
                  >
                    <option value="Q3-2026">Q3-2026</option>
                    <option value="Q4-2026">Q4-2026</option>
                    <option value="Q1-2027">Q1-2027</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Starting Progress %</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={goalForm.progress_percent}
                    onChange={(e) => setGoalForm(f => ({ ...f, progress_percent: parseInt(e.target.value || 0, 10) }))}
                    className="w-full bg-white border border-[#E2E8F0] rounded-md px-3 py-2 text-xs font-semibold text-slate-800 focus:outline-none focus:border-[#1E40AF]"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Description &amp; Milestones</label>
                <textarea
                  rows={3}
                  value={goalForm.description}
                  onChange={(e) => setGoalForm(f => ({ ...f, description: e.target.value }))}
                  placeholder="Key milestones, required cross-department collaboration..."
                  className="w-full bg-white border border-[#E2E8F0] rounded-md px-3 py-2 text-xs font-medium text-slate-800 focus:outline-none focus:border-[#1E40AF] resize-none"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowGoalModal(false)}
                  className="px-4 py-2 border border-[#E2E8F0] rounded-md text-xs font-semibold text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#1E40AF] hover:bg-blue-800 text-white rounded-md text-xs font-bold uppercase tracking-wider shadow-sm transition-all"
                >
                  Save OKR
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ──────────────────── MODAL: CONDUCT APPRAISAL (DYNAMIC MULTI-PILLAR RUBRIC) ──────────────────── */}
      {showReviewModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-xl border border-[#E2E8F0] shadow-2xl max-w-3xl w-full my-auto overflow-hidden flex flex-col max-h-[92vh]">
            {/* Modal Header */}
            <div className="bg-[#1E40AF] px-6 py-4 text-white flex items-center justify-between shrink-0">
              <div className="flex items-center space-x-3">
                <div className="w-9 h-9 rounded-lg bg-white/10 flex items-center justify-center border border-white/20">
                  <Award className="w-5 h-5 text-amber-300" />
                </div>
                <div>
                  <h3 className="text-sm font-black tracking-wider uppercase">RECORD PERFORMANCE APPRAISAL</h3>
                  <p className="text-[11px] text-blue-100 font-medium">Standard Multi-Pillar Scorecard &amp; 360° Perception Calibration</p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={() => setShowRubricGuideModal(true)}
                  className="px-2.5 py-1 bg-white/10 hover:bg-white/20 text-white rounded text-[11px] font-bold border border-white/20 flex items-center space-x-1"
                >
                  <HelpCircle className="w-3.5 h-3.5 text-amber-300" />
                  <span>Rubric Guide</span>
                </button>
                <button
                  onClick={() => setShowReviewModal(false)}
                  className="text-white/70 hover:text-white font-bold text-xl leading-none px-2 py-0.5"
                >
                  ×
                </button>
              </div>
            </div>

            <form onSubmit={handleSaveReview} className="p-6 space-y-4 overflow-y-auto flex-1">
              {/* Employee & Cycle Row */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-1">
                  <label className="text-xs font-bold text-slate-700 block mb-1">Employee to Review</label>
                  <select
                    value={reviewForm.employee_id}
                    onChange={(e) => handleEmployeeChangeInReview(e.target.value)}
                    className="w-full bg-white border border-[#E2E8F0] rounded-md px-3 py-2 text-xs font-semibold text-slate-800 focus:outline-none focus:border-[#1E40AF]"
                  >
                    {(employeeList || []).map(emp => (
                      <option key={emp.id} value={emp.id}>
                        {emp.full_name} ({emp.employee_code || emp.id})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Effective Date</label>
                  <input
                    type="date"
                    required
                    value={reviewForm.effective_date || new Date().toISOString().slice(0, 10)}
                    onChange={(e) => setReviewForm(f => ({ ...f, effective_date: e.target.value }))}
                    className="w-full bg-white border border-[#E2E8F0] rounded-md px-3 py-2 text-xs font-bold text-slate-800 focus:outline-none focus:border-[#1E40AF]"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Evaluation Cycle</label>
                  <select
                    value={reviewForm.cycle || 'FY2026-Annual'}
                    onChange={(e) => setReviewForm(f => ({ ...f, cycle: e.target.value }))}
                    className="w-full bg-white border border-[#E2E8F0] rounded-md px-3 py-2 text-xs font-semibold text-slate-800 focus:outline-none focus:border-[#1E40AF]"
                  >
                    <option value="Annual Cycle 2025-26">FY2026 Annual Review</option>
                    <option value="Mid-Year Review 2026">FY2026 Mid-Year Review</option>
                    <option value="Probation Confirmation">Probation Confirmation</option>
                    <option value="Ad-hoc Merit Revision">Ad-hoc Merit Revision</option>
                  </select>
                </div>
              </div>

              {/* Mode Toggle Switch */}
              <div className="bg-slate-100 p-1 rounded-lg flex items-center justify-between border border-slate-200">
                <span className="text-[11px] font-bold text-slate-700 pl-2">RATING METHODOLOGY:</span>
                <div className="flex space-x-1">
                  <button
                    type="button"
                    onClick={() => {
                      setEvalMode('RUBRIC');
                      const autoM = computeManagerRatingFromRubric(competencies);
                      const autoP = computePotentialRatingFromRubric(competencies);
                      const band = getRatingBand(autoM);
                      setReviewForm(f => ({
                        ...f,
                        manager_rating: autoM,
                        potential_rating: autoP,
                        recommended_increment: String(band.incrementSuggested),
                      }));
                    }}
                    className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all flex items-center space-x-1.5 ${
                      evalMode === 'RUBRIC'
                        ? 'bg-[#1E40AF] text-white shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                    <span>Multi-Pillar Rubric (Dynamic Weighted)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setEvalMode('DIRECT')}
                    className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all flex items-center space-x-1.5 ${
                      evalMode === 'DIRECT'
                        ? 'bg-[#1E40AF] text-white shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <Sliders className="w-3.5 h-3.5" />
                    <span>Direct Executive Score</span>
                  </button>
                </div>
              </div>

              {/* DYNAMIC RUBRIC MODE */}
              {evalMode === 'RUBRIC' ? (
                <div className="space-y-4">
                  {/* Performance Pillars Header */}
                  <div className="border border-blue-200 rounded-lg p-3 bg-blue-50/40 space-y-3">
                    <div className="flex items-center justify-between border-b border-blue-100 pb-2">
                      <div>
                        <span className="text-xs font-black text-[#1E40AF] uppercase tracking-wider">
                          Section A: Performance Pillars (X-Axis — 100% Weight)
                        </span>
                        <p className="text-[10px] text-slate-500">
                          Weighted corporate scorecard calculating Manager Performance Rating (Max 5.0)
                        </p>
                      </div>
                      <span className="text-xs font-black text-[#1E40AF] bg-blue-100 px-2 py-0.5 rounded border border-blue-200">
                        Calculated: {reviewForm.manager_rating} ★
                      </span>
                    </div>

                    {/* Pillar 1: OKRs */}
                    {(() => {
                      const empGoals = (goals || []).filter(g => g.employee_id === reviewForm.employee_id);
                      const avgPct = empGoals.length > 0
                        ? Math.round(empGoals.reduce((s, g) => s + (g.progress_percent || 0), 0) / empGoals.length)
                        : null;
                      return (
                        <div className="bg-white p-3 rounded-lg border border-slate-200 space-y-1.5">
                          <div className="flex items-center justify-between">
                            <div>
                              <div className="flex items-center space-x-2">
                                <span className="text-xs font-bold text-slate-800">1. OKR / Target Achievement</span>
                                <span className="text-[10px] font-bold bg-blue-100 text-[#1E40AF] px-1.5 py-0.2 rounded">40% Weight</span>
                              </div>
                              <p className="text-[10px] text-slate-500">
                                {avgPct !== null
                                  ? `Auto-synced with ${empGoals.length} active OKR(s) averaging ${avgPct}% completion`
                                  : 'No quarterly OKRs logged; using benchmark evaluation'}
                              </p>
                            </div>
                            <span className="text-xs font-black text-[#1E40AF] font-mono">
                              {competencies.okr_achievement} ★ ({Math.round(competencies.okr_achievement * 0.40 * 100) / 100} pts)
                            </span>
                          </div>
                          <input
                            type="range"
                            min="1.0"
                            max="5.0"
                            step="0.1"
                            value={competencies.okr_achievement}
                            onChange={(e) => handleCompetencyChange('okr_achievement', e.target.value)}
                            className="w-full h-2 bg-slate-200 rounded appearance-none cursor-pointer accent-[#1E40AF]"
                          />
                          <div className="flex justify-between text-[9px] text-slate-400">
                            <span>1.0 (Critical Miss &lt;50%)</span>
                            <span>3.5 (Target Met 70%)</span>
                            <span>5.0 (Stretch Surpassed 100%+)</span>
                          </div>
                        </div>
                      );
                    })()}

                    {/* Pillar 2: Functional Quality */}
                    <div className="bg-white p-3 rounded-lg border border-slate-200 space-y-1.5">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="flex items-center space-x-2">
                            <span className="text-xs font-bold text-slate-800">2. Functional &amp; Technical Quality</span>
                            <span className="text-[10px] font-bold bg-blue-100 text-[#1E40AF] px-1.5 py-0.2 rounded">25% Weight</span>
                          </div>
                          <p className="text-[10px] text-slate-500">
                            Zero-defect rate, laboratory SOP adherence, ISO/FSSAI trade compliance
                          </p>
                        </div>
                        <span className="text-xs font-black text-[#1E40AF] font-mono">
                          {competencies.functional_quality} ★ ({Math.round(competencies.functional_quality * 0.25 * 100) / 100} pts)
                        </span>
                      </div>
                      <input
                        type="range"
                        min="1.0"
                        max="5.0"
                        step="0.1"
                        value={competencies.functional_quality}
                        onChange={(e) => handleCompetencyChange('functional_quality', e.target.value)}
                        className="w-full h-2 bg-slate-200 rounded appearance-none cursor-pointer accent-[#1E40AF]"
                      />
                      <div className="flex justify-between text-[9px] text-slate-400">
                        <span>1.0 (Frequent Rework)</span>
                        <span>3.5 (Compliant with Standard SOP)</span>
                        <span>5.0 (Flawless / Industry Benchmark)</span>
                      </div>
                    </div>

                    {/* Pillar 3: Values & Collaboration */}
                    <div className="bg-white p-3 rounded-lg border border-slate-200 space-y-1.5">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="flex items-center space-x-2">
                            <span className="text-xs font-bold text-slate-800">3. Collaboration &amp; Core Values</span>
                            <span className="text-[10px] font-bold bg-blue-100 text-[#1E40AF] px-1.5 py-0.2 rounded">20% Weight</span>
                          </div>
                          <p className="text-[10px] text-slate-500">
                            Cross-functional teamwork, client centricity, peer mentoring &amp; ethics
                          </p>
                        </div>
                        <span className="text-xs font-black text-[#1E40AF] font-mono">
                          {competencies.collaboration_values} ★ ({Math.round(competencies.collaboration_values * 0.20 * 100) / 100} pts)
                        </span>
                      </div>
                      <input
                        type="range"
                        min="1.0"
                        max="5.0"
                        step="0.1"
                        value={competencies.collaboration_values}
                        onChange={(e) => handleCompetencyChange('collaboration_values', e.target.value)}
                        className="w-full h-2 bg-slate-200 rounded appearance-none cursor-pointer accent-[#1E40AF]"
                      />
                      <div className="flex justify-between text-[9px] text-slate-400">
                        <span>1.0 (Siloed / Friction)</span>
                        <span>3.5 (Reliable Collaborator)</span>
                        <span>5.0 (Culture Carrier &amp; Mentor)</span>
                      </div>
                    </div>

                    {/* Pillar 4: Innovation & Efficiency */}
                    <div className="bg-white p-3 rounded-lg border border-slate-200 space-y-1.5">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="flex items-center space-x-2">
                            <span className="text-xs font-bold text-slate-800">4. Innovation &amp; Efficiency</span>
                            <span className="text-[10px] font-bold bg-blue-100 text-[#1E40AF] px-1.5 py-0.2 rounded">15% Weight</span>
                          </div>
                          <p className="text-[10px] text-slate-500">
                            Process cycle reduction, logistics cost optimization, proactive improvements
                          </p>
                        </div>
                        <span className="text-xs font-black text-[#1E40AF] font-mono">
                          {competencies.innovation_efficiency} ★ ({Math.round(competencies.innovation_efficiency * 0.15 * 100) / 100} pts)
                        </span>
                      </div>
                      <input
                        type="range"
                        min="1.0"
                        max="5.0"
                        step="0.1"
                        value={competencies.innovation_efficiency}
                        onChange={(e) => handleCompetencyChange('innovation_efficiency', e.target.value)}
                        className="w-full h-2 bg-slate-200 rounded appearance-none cursor-pointer accent-[#1E40AF]"
                      />
                      <div className="flex justify-between text-[9px] text-slate-400">
                        <span>1.0 (Resistant to Change)</span>
                        <span>3.5 (Adopts Improvements)</span>
                        <span>5.0 (Initiated Breakthrough)</span>
                      </div>
                    </div>
                  </div>

                  {/* Section B: Leadership Potential Pillars */}
                  <div className="border border-emerald-200 rounded-lg p-3 bg-emerald-50/40 space-y-3">
                    <div className="flex items-center justify-between border-b border-emerald-100 pb-2">
                      <div>
                        <span className="text-xs font-black text-emerald-800 uppercase tracking-wider">
                          Section B: Leadership Potential (Y-Axis — 100% Weight)
                        </span>
                        <p className="text-[10px] text-slate-500">
                          Evaluates growth runway, adaptability, and 9-Box talent quadrant placement
                        </p>
                      </div>
                      <span className="text-xs font-black text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded border border-emerald-200">
                        Calculated: {reviewForm.potential_rating} ★
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="bg-white p-3 rounded-lg border border-slate-200 space-y-1.5">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-slate-800">Learning Agility (50%)</span>
                          <span className="text-xs font-black text-emerald-700 font-mono">{competencies.learning_agility} ★</span>
                        </div>
                        <p className="text-[10px] text-slate-400">Pace of assimilating complex trade SOPs</p>
                        <input
                          type="range"
                          min="1.0"
                          max="5.0"
                          step="0.1"
                          value={competencies.learning_agility}
                          onChange={(e) => handleCompetencyChange('learning_agility', e.target.value)}
                          className="w-full h-2 bg-slate-200 rounded appearance-none cursor-pointer accent-emerald-600"
                        />
                      </div>

                      <div className="bg-white p-3 rounded-lg border border-slate-200 space-y-1.5">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-slate-800">Strategic Leadership (50%)</span>
                          <span className="text-xs font-black text-emerald-700 font-mono">{competencies.strategic_leadership} ★</span>
                        </div>
                        <p className="text-[10px] text-slate-400">Succession readiness for regional/plant lead</p>
                        <input
                          type="range"
                          min="1.0"
                          max="5.0"
                          step="0.1"
                          value={competencies.strategic_leadership}
                          onChange={(e) => handleCompetencyChange('strategic_leadership', e.target.value)}
                          className="w-full h-2 bg-slate-200 rounded appearance-none cursor-pointer accent-emerald-600"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Section C: Self-Rating & 360 Calibration */}
                  <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 flex items-center justify-between gap-4">
                    <div className="flex-1">
                      <label className="text-xs font-bold text-slate-800 block">
                        Employee Self-Rating (360° Benchmark)
                      </label>
                      <p className="text-[10px] text-slate-500">
                        Candidate self-assessment score for perception variance (Δ) analysis
                      </p>
                    </div>
                    <div className="w-32 flex items-center space-x-2">
                      <input
                        type="number"
                        step="0.1"
                        min="1"
                        max="5"
                        value={reviewForm.self_rating}
                        onChange={(e) => setReviewForm(f => ({ ...f, self_rating: parseFloat(e.target.value) || 1 }))}
                        className="w-full bg-white border border-[#E2E8F0] rounded-md px-2 py-1 text-xs font-bold text-slate-800 focus:outline-none focus:border-[#1E40AF]"
                      />
                      <span className="text-xs font-bold text-slate-500">/ 5.0</span>
                    </div>
                  </div>
                </div>
              ) : (
                /* DIRECT EXECUTIVE SCORE MODE */
                <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-xs font-black text-slate-800 uppercase">Direct Executive Override Inputs</span>
                      <p className="text-[10px] text-slate-500">Directly set ratings; grade band and increment matrix will automatically update</p>
                    </div>
                    <span className="text-[10px] font-bold bg-amber-100 text-amber-800 px-2 py-0.5 rounded border border-amber-300">
                      ⚡ Manual Override Active
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="text-xs font-bold text-slate-700 block mb-1">Self Rating (360°)</label>
                      <input
                        type="number"
                        step="0.1"
                        min="1"
                        max="5"
                        value={reviewForm.self_rating}
                        onChange={(e) => setReviewForm(f => ({ ...f, self_rating: parseFloat(e.target.value) }))}
                        className="w-full bg-white border border-[#E2E8F0] rounded-md px-3 py-2 text-xs font-bold text-slate-800 focus:outline-none focus:border-[#1E40AF]"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-slate-700 block mb-1">Manager Rating (Perf)</label>
                      <input
                        type="number"
                        step="0.1"
                        min="1"
                        max="5"
                        value={reviewForm.manager_rating}
                        onChange={(e) => {
                          const val = parseFloat(e.target.value) || 1;
                          const b = getRatingBand(val);
                          setReviewForm(f => ({
                            ...f,
                            manager_rating: val,
                            recommended_increment: String(b.incrementSuggested),
                          }));
                        }}
                        className="w-full bg-white border border-[#E2E8F0] rounded-md px-3 py-2 text-xs font-bold text-[#1E40AF] focus:outline-none focus:border-[#1E40AF]"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-slate-700 block mb-1">Leadership Potential</label>
                      <input
                        type="number"
                        step="0.1"
                        min="1"
                        max="5"
                        value={reviewForm.potential_rating}
                        onChange={(e) => setReviewForm(f => ({ ...f, potential_rating: parseFloat(e.target.value) }))}
                        className="w-full bg-white border border-[#E2E8F0] rounded-md px-3 py-2 text-xs font-bold text-emerald-700 focus:outline-none focus:border-[#1E40AF]"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* LIVE EVALUATION SCORECARD SUMMARY BAR */}
              {(() => {
                const band = getRatingBand(reviewForm.manager_rating);
                const quadrant = getQuadrantForRatings(reviewForm.manager_rating, reviewForm.potential_rating);
                const delta = Math.round((reviewForm.manager_rating - reviewForm.self_rating) * 10) / 10;

                return (
                  <div className="bg-slate-900 text-white rounded-lg p-3 space-y-2">
                    <div className="flex items-center justify-between text-xs font-bold">
                      <span className="flex items-center space-x-1.5 text-amber-300">
                        <Sparkles className="w-4 h-4" />
                        <span>LIVE APPRAISAL RESULT &amp; 9-BOX PLACEMENT</span>
                      </span>
                      <span className={`text-[10px] font-black px-2 py-0.5 rounded border ${band.badgeCls}`}>
                        Band {band.grade}: {band.label}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center text-xs">
                      <div className="bg-slate-800 p-2 rounded border border-slate-700">
                        <span className="text-[10px] text-slate-400 block uppercase font-semibold">Manager Score (X)</span>
                        <span className="text-sm font-black text-blue-400 mt-0.5 block">{reviewForm.manager_rating} / 5.0</span>
                      </div>
                      <div className="bg-slate-800 p-2 rounded border border-slate-700">
                        <span className="text-[10px] text-slate-400 block uppercase font-semibold">Potential Score (Y)</span>
                        <span className="text-sm font-black text-emerald-400 mt-0.5 block">{reviewForm.potential_rating} / 5.0</span>
                      </div>
                      <div className="bg-slate-800 p-2 rounded border border-slate-700">
                        <span className="text-[10px] text-slate-400 block uppercase font-semibold">360° Perception Gap</span>
                        <span className={`text-sm font-black mt-0.5 block ${Math.abs(delta) <= 0.3 ? 'text-emerald-400' : delta > 0 ? 'text-blue-400' : 'text-amber-400'}`}>
                          Δ {delta > 0 ? `+${delta}` : delta}
                        </span>
                      </div>
                      <div className="bg-slate-800 p-2 rounded border border-slate-700">
                        <span className="text-[10px] text-slate-400 block uppercase font-semibold">9-Box Quadrant</span>
                        <span className="text-xs font-black text-amber-300 mt-1 block truncate" title={quadrant}>
                          {quadrant}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })()}

              {/* Increment & Promotion Controls */}
              {(() => {
                const band = getRatingBand(reviewForm.manager_rating);
                return (
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="text-xs font-bold text-slate-700">Recommended Increment %</label>
                        <span className="text-[10px] font-bold text-slate-500">
                          Band {band.grade} Guide: {band.incrementRange}
                        </span>
                      </div>
                      <input
                        type="number"
                        min="0"
                        max="50"
                        value={reviewForm.recommended_increment || '15'}
                        onChange={(e) => setReviewForm(f => ({ ...f, recommended_increment: e.target.value }))}
                        className="w-full bg-white border border-[#E2E8F0] rounded-md px-3 py-2 text-xs font-bold text-[#1E40AF] focus:outline-none focus:border-[#1E40AF]"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-slate-700 block mb-1">Promotion Track</label>
                      <select
                        value={reviewForm.promotion_track || 'Promote to Senior Specialist'}
                        onChange={(e) => setReviewForm(f => ({ ...f, promotion_track: e.target.value }))}
                        className="w-full bg-white border border-[#E2E8F0] rounded-md px-3 py-2 text-xs font-semibold text-slate-800 focus:outline-none focus:border-[#1E40AF]"
                      >
                        <option value="Promote to Senior Specialist">Promote to Senior Specialist</option>
                        <option value="Promote to Team / Lab Lead">Promote to Team / Lab Lead</option>
                        <option value="Promote to Regional Manager">Promote to Regional Manager</option>
                        <option value="Promote to Department Director">Promote to Department Director</option>
                        <option value="Retain Current Role">Retain Current Role</option>
                      </select>
                    </div>
                  </div>
                );
              })()}

              {/* Live CTC & Compensation Impact Preview */}
              {(() => {
                const curr = getEmployeeSalary(reviewForm.employee_id);
                const incPct = parseFloat(reviewForm.recommended_increment || '0') || 0;
                const factor = 1 + (incPct / 100);
                const revisedBasic = Math.round(curr.basic * factor);
                const revisedCtc = Math.round(curr.ctc * factor);
                const basicDiff = revisedBasic - curr.basic;
                const ctcDiff = revisedCtc - curr.ctc;
                const effDate = reviewForm.effective_date || new Date().toISOString().slice(0, 10);

                return (
                  <div className="bg-blue-50/70 border border-blue-200 rounded-lg p-3 space-y-2">
                    <div className="flex items-center justify-between text-xs font-bold text-[#1E40AF]">
                      <span className="flex items-center space-x-1">
                        <DollarSign className="w-3.5 h-3.5" />
                        <span>COMPENSATION IMPACT &amp; CTC REVISION</span>
                      </span>
                      <div className="flex items-center space-x-1.5">
                        <span className="text-[10px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full font-bold">
                          From: {effDate}
                        </span>
                        <span className="text-[10px] bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full font-bold">
                          +{incPct}%
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-[11px] pt-1">
                      <div className="bg-white p-2 rounded border border-blue-100">
                        <span className="text-slate-500 block text-[10px]">Monthly Basic Pay</span>
                        <div className="font-bold text-slate-800 mt-0.5">
                          <span className="line-through text-slate-400 mr-1.5">${curr.basic.toLocaleString()}</span>
                          <span className="text-[#1E40AF] font-black">${revisedBasic.toLocaleString()}</span>
                          <span className="text-emerald-600 text-[10px] ml-1">(+${basicDiff})</span>
                        </div>
                      </div>

                      <div className="bg-white p-2 rounded border border-blue-100">
                        <span className="text-slate-500 block text-[10px]">Annual CTC Master</span>
                        <div className="font-bold text-slate-800 mt-0.5">
                          <span className="line-through text-slate-400 mr-1.5">${curr.ctc.toLocaleString()}</span>
                          <span className="text-emerald-700 font-black">${revisedCtc.toLocaleString()}</span>
                          <span className="text-emerald-600 text-[10px] ml-1">(+${ctcDiff})</span>
                        </div>
                      </div>
                    </div>

                    <label className="flex items-center space-x-2 pt-1 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={applyToCtc}
                        onChange={(e) => setApplyToCtc(e.target.checked)}
                        className="w-4 h-4 text-[#1E40AF] rounded border-slate-300 focus:ring-blue-500"
                      />
                      <span className="text-xs font-bold text-slate-700">
                        Automatically update Employee CTC Structure in Payroll Master
                      </span>
                    </label>
                    <p className="text-[10px] text-slate-500 italic pl-6">
                      When enabled, the revised basic pay (${revisedBasic}/mo) directly updates the salary structure database, and will disburse in the next payroll run.
                    </p>
                  </div>
                );
              })()}

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Evaluation &amp; Promotion Remarks</label>
                <textarea
                  rows={2}
                  required
                  value={reviewForm.feedback}
                  onChange={(e) => setReviewForm(f => ({ ...f, feedback: e.target.value }))}
                  placeholder="Detail achievements, leadership potential, recommendations..."
                  className="w-full bg-white border border-[#E2E8F0] rounded-md px-3 py-2 text-xs font-medium text-slate-800 focus:outline-none focus:border-[#1E40AF] resize-none"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowReviewModal(false)}
                  className="px-4 py-2 border border-[#E2E8F0] rounded-md text-xs font-semibold text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#1E40AF] hover:bg-blue-800 text-white rounded-md text-xs font-bold uppercase tracking-wider shadow-sm transition-all"
                >
                  Record Appraisal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ──────────────────── MODAL: 9-BOX TALENT CALIBRATION ──────────────────── */}
      {calibratingReview && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl border border-[#E2E8F0] shadow-2xl max-w-lg w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <div className="flex items-center space-x-2">
                <Sliders className="w-5 h-5 text-[#1E40AF]" />
                <div>
                  <h3 className="text-sm font-bold text-slate-900 uppercase">9-BOX TALENT CALIBRATION</h3>
                  <p className="text-[11px] text-slate-500 font-medium">
                    {calibratingReview.employee_name} ({calibratingReview.employee_id}) · {calibratingReview.department}
                  </p>
                </div>
              </div>
              <button onClick={() => setCalibratingReview(null)} className="text-slate-400 hover:text-slate-600 font-bold text-lg">×</button>
            </div>

            <form onSubmit={handleSaveCalibration} className="space-y-4">
              {/* Employee Select if re-targeting */}
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Calibrate Staff Member</label>
                <select
                  value={calibratingReview.id}
                  onChange={(e) => {
                    const found = reviews.find(r => r.id === e.target.value);
                    if (found) {
                      setCalibratingReview(found);
                      setCalibrationForm(prev => ({
                        ...prev,
                        manager_rating: found.manager_rating,
                        potential_rating: found.potential_rating,
                        feedback: found.feedback || '',
                      }));
                    }
                  }}
                  className="w-full bg-white border border-[#E2E8F0] rounded-md px-3 py-2 text-xs font-semibold text-slate-800 focus:outline-none focus:border-[#1E40AF]"
                >
                  {reviews.map(r => (
                    <option key={r.id} value={r.id}>
                      {(r.is_new_joiner || r.status === 'ONBOARDING_BASELINE') ? '✨ ' : ''}
                      {r.employee_name} ({r.employee_id}) - {r.department}
                      {(r.is_new_joiner || r.status === 'ONBOARDING_BASELINE') ? ' [New Joiner Baseline]' : ''}
                    </option>
                  ))}
                </select>
              </div>

              {/* Ratings sliders */}
              <div className="grid grid-cols-2 gap-4 bg-slate-50 p-3 rounded-lg border border-slate-200">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-bold text-slate-700">Performance (X-Axis)</label>
                    <span className="text-xs font-black text-[#1E40AF]">{calibrationForm.manager_rating} / 5.0</span>
                  </div>
                  <input
                    type="range"
                    min="1.0"
                    max="5.0"
                    step="0.1"
                    value={calibrationForm.manager_rating}
                    onChange={(e) => setCalibrationForm(f => ({ ...f, manager_rating: parseFloat(e.target.value) }))}
                    className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-[#1E40AF]"
                  />
                  <div className="flex justify-between text-[9px] text-slate-400 mt-0.5">
                    <span>Low (&lt;3.5)</span>
                    <span>Med (3.5-4.3)</span>
                    <span>High (≥4.4)</span>
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-bold text-slate-700">Potential (Y-Axis)</label>
                    <span className="text-xs font-black text-emerald-700">{calibrationForm.potential_rating} / 5.0</span>
                  </div>
                  <input
                    type="range"
                    min="1.0"
                    max="5.0"
                    step="0.1"
                    value={calibrationForm.potential_rating}
                    onChange={(e) => setCalibrationForm(f => ({ ...f, potential_rating: parseFloat(e.target.value) }))}
                    className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-emerald-600"
                  />
                  <div className="flex justify-between text-[9px] text-slate-400 mt-0.5">
                    <span>Low (&lt;3.5)</span>
                    <span>Med (3.5-4.3)</span>
                    <span>High (≥4.4)</span>
                  </div>
                </div>
              </div>

              {/* Calibrated Target Box Indicator */}
              <div className="p-3 bg-blue-50/80 border border-blue-200 rounded-lg flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-bold text-blue-700 uppercase block">Resulting 9-Box Placement</span>
                  <span className="text-xs font-black text-[#1E40AF]">
                    {getQuadrantForRatings(calibrationForm.manager_rating, calibrationForm.potential_rating)}
                  </span>
                </div>
                <Sparkles className="w-5 h-5 text-[#D97706]" />
              </div>

              {/* Calibration Feedback */}
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Calibration Committee Rationale</label>
                <textarea
                  rows={3}
                  value={calibrationForm.feedback}
                  onChange={(e) => setCalibrationForm(f => ({ ...f, feedback: e.target.value }))}
                  placeholder="Enter calibration committee notes justifying movement across grid quadrants..."
                  className="w-full bg-white border border-[#E2E8F0] rounded-md px-3 py-2 text-xs font-medium text-slate-800 focus:outline-none focus:border-[#1E40AF] resize-none"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setCalibratingReview(null)}
                  className="px-4 py-2 border border-[#E2E8F0] rounded-md text-xs font-semibold text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#1E40AF] hover:bg-blue-800 text-white rounded-md text-xs font-bold uppercase tracking-wider shadow-sm transition-all"
                >
                  Save Calibration
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ──────────────────── MODAL: OFFICIAL APPRAISAL LETTER GENERATOR ──────────────────── */}
      {generatingDocEmployee && (
        <DocumentGeneratorModal
          employee={generatingDocEmployee}
          onClose={() => setGeneratingDocEmployee(null)}
        />
      )}

      {/* ──────────────────── MODAL: RATING RUBRIC & BANDS GUIDE ──────────────────── */}
      {showRubricGuideModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-xl border border-[#E2E8F0] shadow-2xl max-w-3xl w-full my-auto overflow-hidden flex flex-col max-h-[92vh]">
            <div className="bg-[#1E40AF] px-6 py-4 text-white flex items-center justify-between shrink-0">
              <div className="flex items-center space-x-3">
                <div className="w-9 h-9 rounded-lg bg-white/10 flex items-center justify-center border border-white/20">
                  <HelpCircle className="w-5 h-5 text-amber-300" />
                </div>
                <div>
                  <h3 className="text-sm font-black tracking-wider uppercase">ENTERPRISE PERFORMANCE APPRAISAL METHODOLOGY</h3>
                  <p className="text-[11px] text-blue-100 font-medium">5-Band Rating Scales, Multi-Pillar Scoring, and 9-Box Calibration</p>
                </div>
              </div>
              <button
                onClick={() => setShowRubricGuideModal(false)}
                className="text-white/70 hover:text-white font-bold text-xl leading-none px-2 py-0.5"
              >
                ×
              </button>
            </div>

            <div className="p-6 space-y-5 overflow-y-auto flex-1 text-slate-700 text-xs">
              {/* Pillar 1: How ratings are calculated */}
              <div className="space-y-2">
                <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center space-x-1.5">
                  <Sparkles className="w-4 h-4 text-[#D97706]" />
                  <span>1. Multi-Pillar Scoring Formulas</span>
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="p-3 bg-blue-50/60 rounded-lg border border-blue-200 space-y-1.5">
                    <span className="font-bold text-[#1E40AF] block text-xs">Manager Performance Rating (X-Axis, Max 5.0)</span>
                    <p className="text-[11px] text-slate-600 font-mono bg-white p-2 rounded border border-blue-100">
                      Score = (OKR × 40%) + (Functional Quality × 25%) + (Values &amp; Teamwork × 20%) + (Innovation × 15%)
                    </p>
                    <ul className="text-[10px] space-y-1 text-slate-500 list-disc pl-4">
                      <li><strong>OKR Achievement (40%):</strong> Auto-synced from employee's quarterly OKRs in system (Score = OKR% ÷ 20).</li>
                      <li><strong>Functional Quality (25%):</strong> Zero-defect batch rate, lab tests, export documentation SOPs.</li>
                      <li><strong>Values &amp; Teamwork (20%):</strong> Cross-functional collaboration, coaching, and client delivery.</li>
                      <li><strong>Innovation (15%):</strong> Turnaround time reduction, cost efficiency, and automation initiatives.</li>
                    </ul>
                  </div>

                  <div className="p-3 bg-emerald-50/60 rounded-lg border border-emerald-200 space-y-1.5">
                    <span className="font-bold text-emerald-800 block text-xs">Leadership Potential Rating (Y-Axis, Max 5.0)</span>
                    <p className="text-[11px] text-slate-600 font-mono bg-white p-2 rounded border border-emerald-100">
                      Score = (Learning Agility × 50%) + (Strategic Leadership × 50%)
                    </p>
                    <ul className="text-[10px] space-y-1 text-slate-500 list-disc pl-4">
                      <li><strong>Learning Agility (50%):</strong> Ability to quickly master new commodity grades, trade policies, and technologies.</li>
                      <li><strong>Strategic Leadership (50%):</strong> Succession readiness to take over plant/terminal leadership or director roles.</li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* 5 Rating Bands Table */}
              <div className="space-y-2">
                <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center space-x-1.5">
                  <Award className="w-4 h-4 text-[#1E40AF]" />
                  <span>2. The 5 Performance Grade Bands &amp; Compensation Increments</span>
                </h4>
                <div className="overflow-x-auto border border-[#E2E8F0] rounded-lg">
                  <table className="w-full text-[11px] text-left">
                    <thead className="bg-slate-50 text-slate-600 font-bold border-b border-[#E2E8F0]">
                      <tr>
                        <th className="py-2 px-3">BAND</th>
                        <th className="py-2 px-3">RATING RANGE</th>
                        <th className="py-2 px-3">LABEL</th>
                        <th className="py-2 px-3">RECOMMENDED INCREMENT</th>
                        <th className="py-2 px-3">EXECUTIVE ACTION</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {RATING_BANDS.map(b => (
                        <tr key={b.grade} className="hover:bg-slate-50">
                          <td className="py-2 px-3 font-bold">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-black border ${b.badgeCls}`}>
                              Band {b.grade}
                            </span>
                          </td>
                          <td className="py-2 px-3 font-mono font-bold text-slate-700">
                            {b.min.toFixed(1)} – {b.max.toFixed(2)}
                          </td>
                          <td className="py-2 px-3 font-semibold text-slate-800">{b.label}</td>
                          <td className="py-2 px-3 font-bold text-[#1E40AF]">{b.incrementRange} (Suggested: {b.incrementSuggested}%)</td>
                          <td className="py-2 px-3 text-slate-500 text-[10px]">{b.desc}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* 9-Box Grid Explanation */}
              <div className="space-y-2">
                <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center space-x-1.5">
                  <Sliders className="w-4 h-4 text-[#1E40AF]" />
                  <span>3. The 9-Box Talent Matrix Placement</span>
                </h4>
                <p className="text-[11px] text-slate-600">
                  The 9-Box Matrix maps Performance (X-Axis) vs Leadership Potential (Y-Axis). Each employee falls into one of 9 strategic talent quadrants:
                </p>
                <div className="grid grid-cols-3 gap-2 text-[10px]">
                  <div className="p-2.5 bg-purple-50 border border-purple-200 rounded">
                    <strong className="text-purple-800 block text-[11px]">Enigma / Rough Diamond</strong>
                    <span className="text-slate-500">Low Perf, High Pot</span>
                    <p className="text-[9px] text-slate-600 mt-1">High raw intelligence; needs role alignment or mentoring.</p>
                  </div>
                  <div className="p-2.5 bg-blue-50 border border-blue-200 rounded">
                    <strong className="text-[#1E40AF] block text-[11px]">Growth Star</strong>
                    <span className="text-slate-500">Med Perf, High Pot</span>
                    <p className="text-[9px] text-slate-600 mt-1">Fast learner; provide cross-functional stretch projects.</p>
                  </div>
                  <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded">
                    <strong className="text-emerald-800 block text-[11px]">Future Leader (Star)</strong>
                    <span className="text-slate-500">High Perf, High Pot</span>
                    <p className="text-[9px] text-slate-600 mt-1">Benchmark pillar; fast-track promotion &amp; maximum retention increment.</p>
                  </div>
                  <div className="p-2.5 bg-amber-50 border border-amber-200 rounded">
                    <strong className="text-amber-800 block text-[11px]">Dilemma</strong>
                    <span className="text-slate-500">Low Perf, Med Pot</span>
                    <p className="text-[9px] text-slate-600 mt-1">Inconsistent execution; assess skill mismatch or motivation.</p>
                  </div>
                  <div className="p-2.5 bg-slate-50 border border-slate-200 rounded">
                    <strong className="text-slate-800 block text-[11px]">Core Performer</strong>
                    <span className="text-slate-500">Med Perf, Med Pot</span>
                    <p className="text-[9px] text-slate-600 mt-1">Solid organizational backbone; reward with standard merit increments.</p>
                  </div>
                  <div className="p-2.5 bg-blue-50 border border-blue-200 rounded">
                    <strong className="text-[#1E40AF] block text-[11px]">High Impact Performer</strong>
                    <span className="text-slate-500">High Perf, Med Pot</span>
                    <p className="text-[9px] text-slate-600 mt-1">Outstanding functional expert; deepen technical specialization.</p>
                  </div>
                  <div className="p-2.5 bg-red-50 border border-red-200 rounded">
                    <strong className="text-red-800 block text-[11px]">Action Needed / PIP</strong>
                    <span className="text-slate-500">Low Perf, Low Pot</span>
                    <p className="text-[9px] text-slate-600 mt-1">Does not meet acceptable standard; 60-day corrective plan initiated.</p>
                  </div>
                  <div className="p-2.5 bg-amber-50 border border-amber-200 rounded">
                    <strong className="text-amber-800 block text-[11px]">Effective Performer</strong>
                    <span className="text-slate-500">Med Perf, Low Pot</span>
                    <p className="text-[9px] text-slate-600 mt-1">Steady operator; maintain in current operational scope.</p>
                  </div>
                  <div className="p-2.5 bg-teal-50 border border-teal-200 rounded">
                    <strong className="text-teal-800 block text-[11px]">Core Workhorse</strong>
                    <span className="text-slate-500">High Perf, Low Pot</span>
                    <p className="text-[9px] text-slate-600 mt-1">Highly dependable master of execution; retain and protect.</p>
                  </div>
                </div>
              </div>

              {/* 360 Perception Gap & CTC Auto Sync */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                  <span className="font-bold text-slate-800 block text-xs">4. 360° Perception Gap (Δ = Manager - Self)</span>
                  <p className="text-[11px] text-slate-600 mt-1">
                    Compares employee self-perception with manager evaluation:
                  </p>
                  <ul className="text-[10px] space-y-1 text-slate-500 list-disc pl-4 mt-1">
                    <li><strong className="text-emerald-700">|Δ| ≤ 0.3:</strong> High mutual calibration &amp; objective alignment.</li>
                    <li><strong className="text-blue-700">Δ &gt; 0:</strong> Employee is humble; manager recognizes unseen impact.</li>
                    <li><strong className="text-amber-700">Δ &lt; -0.4:</strong> Self-rating exceeds manager evaluation; requires coaching dialogue.</li>
                  </ul>
                </div>

                <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                  <span className="font-bold text-slate-800 block text-xs">5. Next Salary Disbursement &amp; CTC Sync</span>
                  <p className="text-[11px] text-slate-600 mt-1">
                    Once the appraisal is recorded:
                  </p>
                  <ul className="text-[10px] space-y-1 text-slate-500 list-disc pl-4 mt-1">
                    <li>The employee's <strong>Annual CTC</strong> and <strong>Monthly Basic Pay</strong> are automatically recalculated by the increment percentage.</li>
                    <li>Synchronized directly to the Payroll CTC Master in DuckDB and client cache.</li>
                    <li>The revised basic pay is factored into overtime calculations (1.5× hourly rate) and next monthly salary disbursement.</li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="bg-slate-50 px-6 py-3 border-t border-[#E2E8F0] flex justify-end">
              <button
                type="button"
                onClick={() => setShowRubricGuideModal(false)}
                className="px-5 py-2 bg-[#1E40AF] hover:bg-blue-800 text-white rounded-md text-xs font-bold uppercase tracking-wider transition-all"
              >
                Close Guide
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
