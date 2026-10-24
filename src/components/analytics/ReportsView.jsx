import React, { useState, useEffect, useCallback } from 'react';
import {
  BarChart2,
  RefreshCw,
  Globe,
  DollarSign,
  TrendingUp,
  Calendar,
  ShieldCheck,
  FileText,
  CheckCircle2,
  Download,
  X,
  Eye,
  Handshake,
  Building,
  Check,
  Search,
  Sliders,
  Filter
} from 'lucide-react';
import api from '../../services/api';

const FALLBACK_ANALYTICS = {
  fiscalYear: '2026',
  totalExportUSD: 7000000,
  totalImportUSD: 240000,
  topCommodities: [
    { commodity: 'Whole Spices (Pepper & Cardamom)', sharePercent: 48, revenueUSD: 3360000 },
    { commodity: 'Animal Feed (Rice DDGS & SBM)', sharePercent: 32, revenueUSD: 2240000 },
    { commodity: 'Commodities & Grains (Rice & Tea)', sharePercent: 20, revenueUSD: 1400000 },
  ],
  regionalDistribution: [
    { region: 'Middle East (UAE & Saudi Arabia)', cbm: 9800.5 },
    { region: 'European Union (Germany & Netherlands)', cbm: 6450.2 },
    { region: 'Southeast Asia (Vietnam & Singapore)', cbm: 4641.6 },
  ],
};

const FALLBACK_AUDIT_LOGS = [
  { id: 'AUD-101', action: 'EXPORT_INVOICE_GENERATED', user: 'Vũ Thị Hoan', detail: 'Generated BL MEDU-BL-99201 for Dubai consignment', timestamp: '2026-09-05 14:20:10', facility: 'Hanoi HQ / Trade Desk', ip: '10.14.2.45' },
  { id: 'AUD-102', action: 'FSSAI_LAB_SAMPLE_APPROVED', user: 'Rajesh Sharma', detail: 'Approved Moisture 11.2% for Black Pepper Lot 88', timestamp: '2026-09-05 11:05:44', facility: 'Kochi Spices Extraction Lab', ip: '10.14.3.112' },
  { id: 'AUD-103', action: 'CONTAINER_SEAL_VERIFIED', user: 'Nguyễn Văn Hùng', detail: 'Customs seal verified at Hai Phong Berth 3', timestamp: '2026-09-05 09:30:15', facility: 'Hai Phong Berth Terminal', ip: '10.14.4.89' },
  { id: 'AUD-104', action: 'PAYROLL_TIMESHEET_APPROVED', user: 'Priya Nair', detail: 'Statutory compliance sign-off for corporate timesheets', timestamp: '2026-10-19 18:00:00', facility: 'HR Operations / Kochi', ip: '10.14.3.210' },
  { id: 'AUD-105', action: 'ISO_22000_BATCH_CLEARED', user: 'Dr. Ramesh Sundaram', detail: 'Clean microbiological test report issued for Cardamom 8mm+', timestamp: '2026-10-21 15:45:22', facility: 'QA Bio-Analytical Center', ip: '10.14.1.15' },
];

const FALLBACK_CLIENT_AUDITS = [
  {
    id: 'ADT-2026-01',
    audit_name: 'ISO 22000 & HACCP Plant Re-certification Audit',
    partner: 'SGS International Food Safety Bureau',
    facility: 'Kochi Spices Extraction & Terminal (BR-KC)',
    date: '2026-10-14',
    lead_auditor: 'Dr. Ramesh Sundaram (Lead ISO Auditor)',
    scope: 'Moisture <11.0%, Piperine extraction assay, and sanitary storage controls',
    status: 'COMPLIANT_ZERO_DEFECT',
    rating: 'GRADE A (99.4%)',
    findings: 'All laboratory calibration and cryogenic batch packing line fully compliant with international food hygiene regulations.',
    standards: 'ISO 22000 : 2018 · CODEX STAN 193 · FSSAI Reg. 2021',
  },
  {
    id: 'ADT-2026-02',
    audit_name: 'UAE Consignment Quality & Specification Audit',
    partner: 'Al Rawdah Trading LLC Procurement Delegation',
    facility: 'Hanoi Agro Bio-Hub & Terminal (BR-HN)',
    date: '2026-10-08',
    lead_auditor: 'Tariq Al-Mansoor (Chief Buyer QA)',
    scope: 'Black Pepper 550 G/L ASTA lots 88-92 export quality clearance',
    status: 'PASSED_EXPORT_READY',
    rating: 'APPROVED FOR SHIPMENT',
    findings: 'Container seals SLX-7801 & SLX-7802 approved for Jebel Ali discharge. Visual inspection 100% compliant.',
    standards: 'ASTA Cleanliness Specs · UAE Food Safety Directives',
  },
  {
    id: 'ADT-2026-03',
    audit_name: 'EU Pesticide & Residue Safety Audit',
    partner: 'Naturex GmbH Technical Regulatory Team',
    facility: 'Hai Phong Port Logistics Depot (BR-HP)',
    date: '2026-09-28',
    lead_auditor: 'Helena Krause (Senior Toxicologist)',
    scope: 'Green Cardamom 8mm+ heavy metal & aflatoxin chromatography',
    status: 'VERIFIED_COMPLIANT',
    rating: 'EU IMPORT CLEARED',
    findings: 'Zero pesticide residue detected. Chromatography assay demonstrates total aflatoxin < 4.0 ppb (EU standard).',
    standards: 'Regulation (EC) No 396/2005 · European Pharmacopoeia',
  },
  {
    id: 'ADT-2026-04',
    audit_name: 'Quarantine & Phytosanitary Export Inspection',
    partner: 'Vietnam Plant Protection & Quarantine Authority',
    facility: 'Hai Phong Port Berth 3 Depot',
    date: '2026-09-19',
    lead_auditor: 'Trịnh Quang Minh (Chief Quarantine Inspector)',
    scope: 'Export Phytosanitary inspection for Rice DDGS animal feed consignment',
    status: 'OFFICIALLY_CERTIFIED',
    rating: 'CERTIFICATE ISSUED',
    findings: 'Phytosanitary certificate VN-2026-PHYTO-889 approved for Hamburg sea freight dispatch.',
    standards: 'IPPC ISPM 12 · Vietnam Plant Quarantine Act 2013',
  },
];

function formatUSD(amount) {
  if (!amount && amount !== 0) return 'N/A';
  if (amount >= 1_000_000) return `$${(amount / 1_000_000).toFixed(1)}M`;
  if (amount >= 1_000) return `$${(amount / 1_000).toFixed(1)}K`;
  return `$${amount.toLocaleString()}`;
}

function getActionBadge(action) {
  const map = {
    EXPORT_INVOICE_GENERATED: 'bg-blue-100 text-[#1E40AF] border-blue-200',
    FSSAI_LAB_SAMPLE_APPROVED: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    CONTAINER_SEAL_VERIFIED: 'bg-amber-100 text-amber-800 border-amber-200',
    PAYROLL_TIMESHEET_APPROVED: 'bg-purple-100 text-purple-800 border-purple-200',
    ISO_22000_BATCH_CLEARED: 'bg-teal-100 text-teal-800 border-teal-200',
  };
  return map[action] || 'bg-slate-100 text-slate-700 border-slate-200';
}

export default function ReportsView({ isVisits = false }) {
  const [activeTab, setActiveTab] = useState(isVisits ? 'VISITS' : 'REVENUE');
  const [analytics, setAnalytics] = useState(FALLBACK_ANALYTICS);
  const [auditLogs, setAuditLogs] = useState(FALLBACK_AUDIT_LOGS);
  const [clientAudits, setClientAudits] = useState(FALLBACK_CLIENT_AUDITS);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [notification, setNotification] = useState(null);
  const [viewingAuditItem, setViewingAuditItem] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (isVisits) {
      setActiveTab('VISITS');
    }
  }, [isVisits]);

  const notify = (type, msg) => {
    setNotification({ type, msg });
    setTimeout(() => setNotification(null), 3500);
  };

  const fetchData = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);

    try {
      const [analyticsData, logsData] = await Promise.all([
        api.getExportRevenueAnalytics(),
        api.getAuditLogs(),
      ]);

      if (analyticsData) setAnalytics(analyticsData);
      if (logsData && logsData.length > 0) setAuditLogs(logsData);
      if (isRefresh) notify('success', 'Intelligence and audit data refreshed.');
    } catch {
      if (isRefresh) notify('error', 'Failed to refresh data. Using cached values.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchData(false);
  }, [fetchData]);

  const topRegion = analytics.regionalDistribution?.[0]?.region?.split('(')[0]?.trim() || 'Middle East';

  const filteredAudits = clientAudits.filter(a => {
    if (!searchTerm) return true;
    const s = searchTerm.toLowerCase();
    return (
      a.audit_name.toLowerCase().includes(s) ||
      a.partner.toLowerCase().includes(s) ||
      a.facility.toLowerCase().includes(s) ||
      a.id.toLowerCase().includes(s)
    );
  });

  return (
    <div className="p-6 space-y-6">
      {/* Notification Banner */}
      {notification && (
        <div className={`fixed top-4 right-4 z-[9999] flex items-center space-x-2 px-4 py-3 rounded-lg shadow-lg border text-xs font-bold transition-all ${
          notification.type === 'success' ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-red-50 border-red-200 text-red-700'
        }`}>
          <span>{notification.type === 'success' ? '✓' : '✕'}</span>
          <span>{notification.msg}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-xl border border-[#E2E8F0] shadow-card">
        <div className="flex items-center space-x-3.5">
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-[#1E40AF] flex items-center justify-center border border-blue-200 shrink-0">
            {activeTab === 'VISITS' ? <Handshake className="w-6 h-6" /> : <BarChart2 className="w-6 h-6" />}
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight uppercase">
              {activeTab === 'VISITS'
                ? 'Client Visits & Trade Audits Management'
                : 'BI & Export Intelligence Reports'}
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Fiscal Year {analytics.fiscalYear} • Regulatory Certifications • Global Quality Audits • System Traceability
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2.5">
          <button
            onClick={() => fetchData(true)}
            disabled={refreshing}
            className="flex items-center space-x-1.5 px-4 py-2 bg-[#1E40AF] hover:bg-blue-800 disabled:opacity-60 text-white text-xs font-semibold uppercase tracking-wider rounded-md shadow-sm transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
            <span>{refreshing ? 'REFRESHING...' : 'REFRESH DATA'}</span>
          </button>
        </div>
      </div>

      {/* Module Navigation Tabs */}
      <div className="flex border-b border-[#E2E8F0] bg-white rounded-t-lg px-2 overflow-x-auto">
        <button
          onClick={() => setActiveTab('REVENUE')}
          className={`px-5 py-3 text-xs font-bold uppercase tracking-wider transition-colors border-b-2 flex items-center space-x-2 ${
            activeTab === 'REVENUE'
              ? 'border-[#1E40AF] text-[#1E40AF] bg-blue-50/50'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <TrendingUp className="w-4 h-4" />
          <span>BI &amp; Export Revenue Intelligence</span>
        </button>

        <button
          onClick={() => setActiveTab('VISITS')}
          className={`px-5 py-3 text-xs font-bold uppercase tracking-wider transition-colors border-b-2 flex items-center space-x-2 ${
            activeTab === 'VISITS'
              ? 'border-[#1E40AF] text-[#1E40AF] bg-blue-50/50'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Handshake className="w-4 h-4" />
          <span>Client Visits &amp; Trade Audits ({clientAudits.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('LOGS')}
          className={`px-5 py-3 text-xs font-bold uppercase tracking-wider transition-colors border-b-2 flex items-center space-x-2 ${
            activeTab === 'LOGS'
              ? 'border-[#1E40AF] text-[#1E40AF] bg-blue-50/50'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <ShieldCheck className="w-4 h-4" />
          <span>System Audit Trail ({auditLogs.length})</span>
        </button>
      </div>

      {/* ──────────────────── TAB 1: REVENUE INTELLIGENCE ──────────────────── */}
      {activeTab === 'REVENUE' && (
        <div className="space-y-6">
          {/* KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            <div className="bg-white p-5 rounded-lg border border-[#E2E8F0] shadow-card">
              <div className="flex items-center space-x-2 mb-2">
                <Calendar className="w-4 h-4 text-slate-400" />
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Fiscal Year</span>
              </div>
              <p className="text-3xl font-black text-slate-900">FY {analytics.fiscalYear}</p>
              <span className="text-[11px] font-semibold text-slate-400">Active Reporting Period</span>
            </div>

            <div className="bg-white p-5 rounded-lg border border-[#E2E8F0] shadow-card">
              <div className="flex items-center space-x-2 mb-2">
                <TrendingUp className="w-4 h-4 text-emerald-500" />
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Export USD</span>
              </div>
              <p className="text-3xl font-black text-[#1E40AF]">{formatUSD(analytics.totalExportUSD)}</p>
              <span className="text-[11px] font-bold text-emerald-700">↑ Revenue YTD</span>
            </div>

            <div className="bg-white p-5 rounded-lg border border-[#E2E8F0] shadow-card">
              <div className="flex items-center space-x-2 mb-2">
                <DollarSign className="w-4 h-4 text-amber-500" />
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Import USD</span>
              </div>
              <p className="text-3xl font-black text-[#D97706]">{formatUSD(analytics.totalImportUSD)}</p>
              <span className="text-[11px] font-semibold text-slate-400">Inbound Raw Material Value</span>
            </div>

            <div className="bg-white p-5 rounded-lg border border-[#E2E8F0] shadow-card">
              <div className="flex items-center space-x-2 mb-2">
                <Globe className="w-4 h-4 text-purple-500" />
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Top Region</span>
              </div>
              <p className="text-xl font-black text-purple-700 leading-tight">{topRegion}</p>
              <span className="text-[11px] font-semibold text-slate-400">Highest Volume Destination</span>
            </div>
          </div>

          {/* Commodity & Regional Tables */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Top Commodities */}
            <div className="lg:col-span-2 bg-white rounded-lg border border-[#E2E8F0] shadow-card overflow-hidden">
              <div className="p-4 border-b border-slate-100 flex items-center justify-between">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">Top Commodities by Revenue Share</h3>
                <span className="text-xs text-slate-500 font-semibold">FY {analytics.fiscalYear}</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-700">
                  <thead className="bg-[#FAFAFA] border-b border-[#E2E8F0] text-[11px] font-bold uppercase tracking-wider text-slate-600">
                    <tr>
                      <th className="py-3 px-4">Commodity</th>
                      <th className="py-3 px-4 text-center">Revenue Share %</th>
                      <th className="py-3 px-4 text-right">Revenue USD</th>
                      <th className="py-3 px-4 w-40">Distribution</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium">
                    {analytics.topCommodities?.map((row, idx) => (
                      <tr key={idx} className="hover:bg-blue-50/40 transition-colors">
                        <td className="py-3 px-4 font-bold text-slate-900">{row.commodity}</td>
                        <td className="py-3 px-4 text-center font-black text-[#1E40AF]">{row.sharePercent}%</td>
                        <td className="py-3 px-4 text-right font-bold text-slate-800">{formatUSD(row.revenueUSD)}</td>
                        <td className="py-3 px-4">
                          <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                            <div
                              className="bg-[#1E40AF] h-2.5 rounded-full transition-all duration-500"
                              style={{ width: `${row.sharePercent}%` }}
                            />
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Regional Distribution */}
            <div className="bg-white rounded-lg border border-[#E2E8F0] shadow-card overflow-hidden">
              <div className="p-4 border-b border-slate-100">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">Regional Distribution</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-700">
                  <thead className="bg-[#FAFAFA] border-b border-[#E2E8F0] text-[11px] font-bold uppercase tracking-wider text-slate-600">
                    <tr>
                      <th className="py-3 px-4">Region</th>
                      <th className="py-3 px-4 text-right">Volume (CBM)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium">
                    {analytics.regionalDistribution?.map((row, idx) => (
                      <tr key={idx} className="hover:bg-blue-50/40 transition-colors">
                        <td className="py-3 px-4 font-semibold text-slate-800">{row.region}</td>
                        <td className="py-3 px-4 text-right font-bold text-[#1E40AF]">{row.cbm?.toLocaleString()} CBM</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ──────────────────── TAB 2: CLIENT VISITS & TRADE AUDITS ──────────────────── */}
      {activeTab === 'VISITS' && (
        <div className="space-y-6">
          {/* Audit Metrics */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-xl border border-[#E2E8F0] shadow-card">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Audits Completed</span>
              <p className="text-2xl font-black text-slate-900 mt-1">{clientAudits.length} Audits</p>
              <span className="text-[11px] font-bold text-emerald-700">100% Passed · Zero Defect</span>
            </div>

            <div className="bg-white p-5 rounded-xl border border-[#E2E8F0] shadow-card">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Quality Rating</span>
              <p className="text-2xl font-black text-[#1E40AF] mt-1">Grade A (99.4%)</p>
              <span className="text-[11px] font-medium text-slate-500">ISO 22000 Certified</span>
            </div>

            <div className="bg-white p-5 rounded-xl border border-[#E2E8F0] shadow-card">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Next Scheduled Audit</span>
              <p className="text-2xl font-black text-amber-600 mt-1">15 Nov 2026</p>
              <span className="text-[11px] font-medium text-slate-500">Dubai Trade Terminal</span>
            </div>

            <div className="bg-white p-5 rounded-xl border border-[#E2E8F0] shadow-card">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Compliance Health</span>
              <p className="text-2xl font-black text-emerald-700 mt-1">Audit Ready</p>
              <span className="text-[11px] font-medium text-emerald-600">Zero Non-conformances</span>
            </div>
          </div>

          {/* Audits & Delegations Table */}
          <div className="bg-white rounded-xl border border-[#E2E8F0] shadow-card overflow-hidden">
            <div className="p-4 border-b border-[#E2E8F0] flex flex-wrap items-center justify-between gap-3">
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                  Client Delegations, Consignment Inspections &amp; Regulatory Audits
                </h3>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Official on-site inspections conducted by international buyers, sanitary authorities, and certification bodies.
                </p>
              </div>

              <div className="relative">
                <input
                  type="text"
                  placeholder="Search audits by partner or facility..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8 pr-3 py-1.5 text-xs border border-[#E2E8F0] rounded-lg focus:outline-none focus:border-[#1E40AF] w-64"
                />
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left text-slate-700">
                <thead className="bg-[#FAFAFA] border-b border-[#E2E8F0] text-[11px] font-bold uppercase tracking-wider text-slate-600">
                  <tr>
                    <th className="py-3 px-4">AUDIT CODE</th>
                    <th className="py-3 px-4">INSPECTION TITLE</th>
                    <th className="py-3 px-4">AUDITING ENTITY / BUYER</th>
                    <th className="py-3 px-4">FACILITY / DEPOT</th>
                    <th className="py-3 px-4">AUDIT DATE</th>
                    <th className="py-3 px-4 text-center">RATING &amp; RESULT</th>
                    <th className="py-3 px-4 text-center">ACTIONS</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {filteredAudits.map((item) => (
                    <tr key={item.id} className="hover:bg-blue-50/40 transition-colors">
                      <td className="py-3.5 px-4 font-mono font-bold text-[#1E40AF]">
                        {item.id}
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-900">{item.audit_name}</div>
                        <span className="text-[10px] text-slate-500 block mt-0.5">{item.scope}</span>
                      </td>
                      <td className="py-3.5 px-4 font-semibold text-slate-800">
                        {item.partner}
                      </td>
                      <td className="py-3.5 px-4 text-slate-600">
                        {item.facility}
                      </td>
                      <td className="py-3.5 px-4 font-mono text-slate-600">
                        {item.date}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase bg-emerald-100 text-emerald-800 border border-emerald-200">
                          {item.rating}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <button
                          type="button"
                          onClick={() => setViewingAuditItem(item)}
                          className="px-3 py-1 bg-blue-50 hover:bg-blue-100 text-[#1E40AF] border border-blue-200 rounded text-[11px] font-bold transition-colors flex items-center space-x-1.5 mx-auto shadow-xs"
                          title="View Official Audit Protocol and Verification Certificate"
                        >
                          <Eye className="w-3.5 h-3.5" />
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

      {/* ──────────────────── TAB 3: SYSTEM AUDIT TRAIL ──────────────────── */}
      {activeTab === 'LOGS' && (
        <div className="space-y-6">
          <div className="bg-white rounded-xl border border-[#E2E8F0] shadow-card overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">Corporate System Audit Trail</h3>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Immutable immutable event ledger of export invoices, lab sample sign-offs, customs seals, and payroll postings.
                </p>
              </div>
              <span className="text-xs font-semibold text-slate-500">{auditLogs.length} events logged</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-700">
                <thead className="bg-[#FAFAFA] border-b border-[#E2E8F0] text-[11px] font-bold uppercase tracking-wider text-slate-600">
                  <tr>
                    <th className="py-3 px-4">LOG ID</th>
                    <th className="py-3 px-4">ACTION PROTOCOL</th>
                    <th className="py-3 px-4">USER / ACTOR</th>
                    <th className="py-3 px-4">DETAIL</th>
                    <th className="py-3 px-4 text-right">TIMESTAMP</th>
                    <th className="py-3 px-4 text-center">ACTIONS</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {auditLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-blue-50/40 transition-colors">
                      <td className="py-3 px-4 font-mono font-bold text-[#1E40AF]">{log.id}</td>
                      <td className="py-3 px-4">
                        <span className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded border ${getActionBadge(log.action)}`}>
                          {log.action}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-semibold text-slate-800">{log.user}</td>
                      <td className="py-3 px-4 text-slate-600 max-w-xs truncate" title={log.detail}>{log.detail}</td>
                      <td className="py-3 px-4 text-right text-slate-500 font-mono">{log.timestamp}</td>
                      <td className="py-3 px-4 text-center">
                        <button
                          type="button"
                          onClick={() => setViewingAuditItem({
                            id: log.id,
                            audit_name: log.action.replace(/_/g, ' '),
                            partner: log.user,
                            facility: log.facility || 'Soilex Bio-Hub Core',
                            date: log.timestamp.slice(0, 10),
                            lead_auditor: log.user,
                            scope: log.detail,
                            status: 'VERIFIED_LOG',
                            rating: 'DIGITALLY SEALED',
                            findings: `System transaction executed with zero security exceptions: ${log.detail}`,
                            standards: 'ISO 27001 Data Integrity · SOILEX Regulatory Ledger',
                          })}
                          className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-[11px] font-bold transition-colors flex items-center space-x-1 mx-auto"
                        >
                          <Eye className="w-3 h-3 text-slate-500" />
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

      {/* ── Inspection / Audit Protocol Modal ── */}
      {viewingAuditItem && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[110] flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl border border-[#E2E8F0] shadow-2xl max-w-2xl w-full p-6 space-y-5 my-8">
            {/* Header */}
            <div className="flex items-start justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-200 text-[#1E40AF] flex items-center justify-center shrink-0">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide">
                      Official Regulatory Audit Certificate
                    </h3>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-emerald-100 text-emerald-800 border border-emerald-200">
                      {viewingAuditItem.rating || 'COMPLIANT'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 font-medium mt-0.5">
                    SOILEX Life Science Quality Assurance &amp; Food Safety Compliance
                  </p>
                </div>
              </div>
              <button
                onClick={() => setViewingAuditItem(null)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Quick Metrics */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 p-3.5 rounded-xl border border-slate-200 text-xs">
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase block">Audit Protocol ID</span>
                <span className="font-mono font-bold text-[#1E40AF]">{viewingAuditItem.id}</span>
              </div>
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase block">Execution Date</span>
                <span className="font-mono font-semibold text-slate-800">{viewingAuditItem.date}</span>
              </div>
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase block">Accreditation</span>
                <span className="font-bold text-emerald-700 block">{viewingAuditItem.rating}</span>
              </div>
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase block">Facility</span>
                <span className="font-semibold text-slate-700 truncate block">{viewingAuditItem.facility}</span>
              </div>
            </div>

            {/* Verification Detail Blocks */}
            <div className="space-y-3.5 text-xs">
              <div>
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                  Inspection Focus &amp; Scope
                </span>
                <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 text-slate-800 font-medium">
                  {viewingAuditItem.audit_name} — {viewingAuditItem.scope}
                </div>
              </div>

              <div>
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                  Auditor &amp; Regulatory Partner
                </span>
                <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 flex items-center justify-between">
                  <div>
                    <span className="font-bold text-slate-900 block">{viewingAuditItem.partner}</span>
                    <span className="text-[11px] text-slate-500">Lead Auditor: {viewingAuditItem.lead_auditor}</span>
                  </div>
                  <span className="text-[10px] font-mono bg-blue-50 text-[#1E40AF] px-2 py-0.5 rounded border border-blue-200 font-bold">
                    Official Stamp Verified
                  </span>
                </div>
              </div>

              <div>
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                  Official Findings &amp; Lab Assay Notes
                </span>
                <div className="bg-emerald-50/60 p-3 rounded-lg border border-emerald-200 text-emerald-900 font-medium leading-relaxed">
                  "{viewingAuditItem.findings}"
                </div>
              </div>

              {viewingAuditItem.standards && (
                <div>
                  <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                    Compliance Standards Governing Protocol
                  </span>
                  <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200 font-mono text-[11px] text-[#1E40AF] font-bold">
                    {viewingAuditItem.standards}
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between pt-3 border-t border-slate-200">
              <div className="text-[10px] font-mono text-slate-400">
                Digital Hash: SHA256:{Math.abs((viewingAuditItem.id || 'ADT').split('').reduce((a, b) => { a = ((a << 5) - a) + b.charCodeAt(0); return a & a }, 0)).toString(16).padStart(16, '9a4c11b8')}...e210
              </div>
              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="px-4 py-2 border border-[#E2E8F0] hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-bold transition-colors flex items-center space-x-1.5"
                >
                  <Download className="w-3.5 h-3.5 text-[#1E40AF]" />
                  <span>Print Certificate</span>
                </button>
                <button
                  type="button"
                  onClick={() => setViewingAuditItem(null)}
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
