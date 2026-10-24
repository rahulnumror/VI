import React, { useState, useEffect, useCallback } from 'react';
import api from '../../services/api';

const FALLBACK_PARTNERS = [
  { id: 'P-001', name: 'Al Rawdah Trading LLC', type: 'BUYER', country: 'UAE', tier: 'TIER_1', kyc_status: 'VERIFIED', payment_terms: 'LC 90 Days', credit_limit: '$500,000', email: 'trade@alrawdah.ae', phone: '+971-4-3221100' },
  { id: 'P-002', name: 'Naturex GmbH', type: 'BUYER', country: 'Germany', tier: 'TIER_1', kyc_status: 'VERIFIED', payment_terms: 'TT 30 Days', credit_limit: '$750,000', email: 'procurement@naturex.de', phone: '+49-40-6789001' },
  { id: 'P-003', name: 'Kerala Spice Farm Consortium', type: 'SUPPLIER', country: 'India', tier: 'TIER_1', kyc_status: 'VERIFIED', payment_terms: 'TT Advance 50%', credit_limit: 'N/A', email: 'supply@keralaspice.in', phone: '+91-484-2334455' },
  { id: 'P-004', name: 'Mekong Delta Agro Farms', type: 'SUPPLIER', country: 'Vietnam', tier: 'TIER_2', kyc_status: 'VERIFIED', payment_terms: 'TT 15 Days', credit_limit: 'N/A', email: 'ops@mekongagro.vn', phone: '+84-292-3456789' },
  { id: 'P-005', name: 'Spice Route Brokers Pte Ltd', type: 'BROKER', country: 'Singapore', tier: 'TIER_1', kyc_status: 'VERIFIED', payment_terms: 'Commission 2%', credit_limit: 'N/A', email: 'deals@spiceroute.sg', phone: '+65-6234-5678' },
];

const TYPE_TABS = ['ALL', 'BUYER', 'SUPPLIER', 'BROKER'];

const typeBadge = (type) => {
  const map = {
    BUYER: 'bg-blue-100 text-blue-700 border border-blue-200',
    SUPPLIER: 'bg-amber-100 text-amber-700 border border-amber-200',
    BROKER: 'bg-emerald-100 text-emerald-700 border border-emerald-200',
  };
  return map[type] || 'bg-slate-100 text-slate-600';
};

const kycBadge = (status) => {
  const map = {
    VERIFIED: 'bg-emerald-100 text-emerald-700 border border-emerald-200',
    PENDING: 'bg-amber-100 text-amber-700 border border-amber-200',
    REJECTED: 'bg-red-100 text-red-700 border border-red-200',
  };
  return map[status] || 'bg-slate-100 text-slate-600';
};

const EMPTY_FORM = {
  name: '', type: 'BUYER', country: '', tier: 'TIER_1',
  kyc_status: 'VERIFIED', payment_terms: '', credit_limit: '', email: '', phone: '',
};

export default function PartnersView() {
  const [partners, setPartners] = useState(FALLBACK_PARTNERS);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('ALL');
  const [search, setSearch] = useState('');
  const [notification, setNotification] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [editTarget, setEditTarget] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const notify = (type, msg) => {
    setNotification({ type, msg });
    setTimeout(() => setNotification(null), 3500);
  };

  const loadPartners = useCallback(async () => {
    setLoading(true);
    try {
      const typeParam = activeTab === 'ALL' ? undefined : activeTab;
      const data = await api.getPartners(typeParam);
      if (data && Array.isArray(data)) {
        setPartners(data);
      } else {
        const fb = activeTab === 'ALL' ? FALLBACK_PARTNERS : FALLBACK_PARTNERS.filter(p => p.type === activeTab);
        setPartners(fb);
      }
    } catch {
      const fb = activeTab === 'ALL' ? FALLBACK_PARTNERS : FALLBACK_PARTNERS.filter(p => p.type === activeTab);
      setPartners(fb);
    } finally {
      setLoading(false);
    }
  }, [activeTab]);

  useEffect(() => { loadPartners(); }, [loadPartners]);

  const filtered = partners.filter(p => {
    const q = search.toLowerCase();
    return !q || p.name?.toLowerCase().includes(q) || p.country?.toLowerCase().includes(q);
  });

  const totalPartners = partners.length;
  const verifiedBuyers = partners.filter(p => p.type === 'BUYER' && p.kyc_status === 'VERIFIED').length;
  const activeSuppliers = partners.filter(p => p.type === 'SUPPLIER').length;

  const openAddModal = () => {
    setEditTarget(null);
    setForm(EMPTY_FORM);
    setShowModal(true);
  };

  const openEditModal = (partner) => {
    setEditTarget(partner);
    setForm({
      name: partner.name || '',
      type: partner.type || 'BUYER',
      country: partner.country || '',
      tier: partner.tier || 'TIER_1',
      kyc_status: partner.kyc_status || 'VERIFIED',
      payment_terms: partner.payment_terms || '',
      credit_limit: partner.credit_limit || '',
      email: partner.email || '',
      phone: partner.phone || '',
    });
    setShowModal(true);
  };

  const closeModal = () => { setShowModal(false); setEditTarget(null); setForm(EMPTY_FORM); };

  const handleFormChange = (e) => setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.type || !form.country || !form.payment_terms) {
      notify('error', 'Please fill all required fields.');
      return;
    }
    setSaving(true);
    try {
      if (editTarget) {
        const res = await api._request('PUT', `/partners/${editTarget.id}`, form);
        if (res !== null) { notify('success', 'Partner updated successfully.'); }
        else { notify('error', 'Failed to update partner.'); }
      } else {
        const res = await api.createPartner(form);
        if (res !== null) { notify('success', 'Partner created successfully.'); }
        else { notify('error', 'Failed to create partner.'); }
      }
      closeModal();
      await loadPartners();
    } catch {
      notify('error', 'An error occurred. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const res = await api._request('DELETE', `/partners/${deleteTarget.id}`);
      if (res !== null) { notify('success', `Partner "${deleteTarget.name}" deleted.`); }
      else { notify('error', 'Failed to delete partner.'); }
      setDeleteTarget(null);
      await loadPartners();
    } catch {
      notify('error', 'An error occurred during deletion.');
    } finally {
      setDeleting(false);
    }
  };

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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Partners</h1>
          <p className="text-xs text-slate-500 mt-0.5">Manage buyers, suppliers, and brokers</p>
        </div>
        <button
          onClick={openAddModal}
          className="px-4 py-2 bg-[#1E40AF] text-white rounded-md text-xs font-semibold uppercase tracking-wider hover:bg-blue-800 shadow-sm flex items-center gap-2"
        >
          <span>+</span> Add Partner
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-[#E2E8F0] shadow-card p-5">
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Partners</p>
          <p className="text-3xl font-black text-slate-900 mt-1">{loading ? <span className="animate-pulse bg-slate-100 rounded h-8 w-16 inline-block" /> : totalPartners}</p>
          <p className="text-xs text-slate-400 mt-1">All registered partners</p>
        </div>
        <div className="bg-white rounded-xl border border-[#E2E8F0] shadow-card p-5">
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Verified Buyers</p>
          <p className="text-3xl font-black text-blue-700 mt-1">{loading ? <span className="animate-pulse bg-slate-100 rounded h-8 w-16 inline-block" /> : verifiedBuyers}</p>
          <p className="text-xs text-slate-400 mt-1">KYC-verified buyer accounts</p>
        </div>
        <div className="bg-white rounded-xl border border-[#E2E8F0] shadow-card p-5">
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Active Suppliers</p>
          <p className="text-3xl font-black text-amber-600 mt-1">{loading ? <span className="animate-pulse bg-slate-100 rounded h-8 w-16 inline-block" /> : activeSuppliers}</p>
          <p className="text-xs text-slate-400 mt-1">Active supplier accounts</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-[#E2E8F0] shadow-card p-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          {/* Type Tabs */}
          <div className="flex gap-1">
            {TYPE_TABS.map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-1.5 rounded-md text-xs font-semibold uppercase tracking-wider transition-colors ${activeTab === tab ? 'bg-[#1E40AF] text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100'}`}
              >
                {tab}
              </button>
            ))}
          </div>
          {/* Search */}
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs">🔍</span>
            <input
              type="text"
              placeholder="Search by name or country..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-8 pr-3 py-2 border border-[#E2E8F0] rounded-md text-xs focus:outline-none focus:border-[#1E40AF] w-64 font-medium"
            />
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-[#E2E8F0] shadow-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="bg-[#FAFAFA] border-b border-[#E2E8F0]">
                {['ID', 'Name', 'Type', 'Country', 'Tier', 'KYC Status', 'Payment Terms', 'Credit Limit', 'Email', 'Actions'].map(col => (
                  <th key={col} className="px-4 py-3 text-left text-[11px] font-bold uppercase tracking-wider text-slate-600 whitespace-nowrap">{col}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <tr key={i} className="border-b border-[#E2E8F0]">
                    {Array.from({ length: 10 }).map((_, j) => (
                      <td key={j} className="px-4 py-3">
                        <div className="animate-pulse bg-slate-100 rounded h-4 w-full" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={10} className="px-4 py-12 text-center text-slate-400 font-medium">
                    No partners found.
                  </td>
                </tr>
              ) : filtered.map(partner => (
                <tr key={partner.id} className="border-b border-[#E2E8F0] hover:bg-blue-50/40 transition-colors">
                  <td className="px-4 py-3 font-mono text-slate-500">{partner.id}</td>
                  <td className="px-4 py-3 font-semibold text-slate-900 whitespace-nowrap">{partner.name}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${typeBadge(partner.type)}`}>{partner.type}</span>
                  </td>
                  <td className="px-4 py-3 text-slate-700">{partner.country}</td>
                  <td className="px-4 py-3 text-slate-600">{partner.tier}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${kycBadge(partner.kyc_status)}`}>{partner.kyc_status}</span>
                  </td>
                  <td className="px-4 py-3 text-slate-600 whitespace-nowrap">{partner.payment_terms}</td>
                  <td className="px-4 py-3 font-semibold text-slate-700">{partner.credit_limit}</td>
                  <td className="px-4 py-3 text-slate-600">{partner.email}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => openEditModal(partner)}
                        className="px-3 py-1 bg-[#EFF6FF] text-[#1E40AF] border border-[#BFDBFE] rounded-md text-[10px] font-semibold hover:bg-blue-100 transition-colors"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => setDeleteTarget(partner)}
                        className="px-3 py-1 bg-red-50 text-red-600 border border-red-200 rounded-md text-[10px] font-semibold hover:bg-red-100 transition-colors"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="px-4 py-2 bg-[#FAFAFA] border-t border-[#E2E8F0] text-xs text-slate-400 font-medium">
          Showing {filtered.length} of {partners.length} partners
        </div>
      </div>

      {/* Add / Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl border border-[#E2E8F0] shadow-2xl max-w-lg w-full p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-slate-900">{editTarget ? 'Edit Partner' : 'Add New Partner'}</h2>
              <button onClick={closeModal} className="text-slate-400 hover:text-slate-600 text-lg font-bold">×</button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2">
                  <label className="text-xs font-bold text-slate-700 block mb-1">Partner Name <span className="text-red-500">*</span></label>
                  <input name="name" value={form.name} onChange={handleFormChange} required
                    placeholder="e.g. Al Rawdah Trading LLC"
                    className="w-full bg-white border border-[#E2E8F0] rounded-md px-3 py-2 text-xs focus:outline-none focus:border-[#1E40AF] font-medium" />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Type <span className="text-red-500">*</span></label>
                  <select name="type" value={form.type} onChange={handleFormChange} required
                    className="w-full bg-white border border-[#E2E8F0] rounded-md px-3 py-2 text-xs focus:outline-none focus:border-[#1E40AF] font-medium">
                    <option value="BUYER">BUYER</option>
                    <option value="SUPPLIER">SUPPLIER</option>
                    <option value="BROKER">BROKER</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Country <span className="text-red-500">*</span></label>
                  <input name="country" value={form.country} onChange={handleFormChange} required
                    placeholder="e.g. UAE"
                    className="w-full bg-white border border-[#E2E8F0] rounded-md px-3 py-2 text-xs focus:outline-none focus:border-[#1E40AF] font-medium" />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Tier</label>
                  <select name="tier" value={form.tier} onChange={handleFormChange}
                    className="w-full bg-white border border-[#E2E8F0] rounded-md px-3 py-2 text-xs focus:outline-none focus:border-[#1E40AF] font-medium">
                    <option value="TIER_1">TIER_1</option>
                    <option value="TIER_2">TIER_2</option>
                    <option value="TIER_3">TIER_3</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">KYC Status</label>
                  <select name="kyc_status" value={form.kyc_status} onChange={handleFormChange}
                    className="w-full bg-white border border-[#E2E8F0] rounded-md px-3 py-2 text-xs focus:outline-none focus:border-[#1E40AF] font-medium">
                    <option value="VERIFIED">VERIFIED</option>
                    <option value="PENDING">PENDING</option>
                    <option value="REJECTED">REJECTED</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Payment Terms <span className="text-red-500">*</span></label>
                  <input name="payment_terms" value={form.payment_terms} onChange={handleFormChange} required
                    placeholder="e.g. TT 30 Days"
                    className="w-full bg-white border border-[#E2E8F0] rounded-md px-3 py-2 text-xs focus:outline-none focus:border-[#1E40AF] font-medium" />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Credit Limit</label>
                  <input name="credit_limit" value={form.credit_limit} onChange={handleFormChange}
                    placeholder="e.g. $500,000"
                    className="w-full bg-white border border-[#E2E8F0] rounded-md px-3 py-2 text-xs focus:outline-none focus:border-[#1E40AF] font-medium" />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Email</label>
                  <input name="email" type="email" value={form.email} onChange={handleFormChange}
                    placeholder="partner@company.com"
                    className="w-full bg-white border border-[#E2E8F0] rounded-md px-3 py-2 text-xs focus:outline-none focus:border-[#1E40AF] font-medium" />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Phone</label>
                  <input name="phone" value={form.phone} onChange={handleFormChange}
                    placeholder="+1-555-0000"
                    className="w-full bg-white border border-[#E2E8F0] rounded-md px-3 py-2 text-xs focus:outline-none focus:border-[#1E40AF] font-medium" />
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={closeModal}
                  className="px-4 py-2 border border-[#E2E8F0] rounded-md text-xs font-semibold text-slate-600 hover:bg-slate-50">
                  Cancel
                </button>
                <button type="submit" disabled={saving}
                  className="px-4 py-2 bg-[#1E40AF] text-white rounded-md text-xs font-semibold hover:bg-blue-800 shadow-sm disabled:opacity-60 flex items-center gap-2">
                  {saving && <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />}
                  {saving ? 'Saving...' : editTarget ? 'Update Partner' : 'Create Partner'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirm Modal */}
      {deleteTarget && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl border border-[#E2E8F0] shadow-2xl max-w-sm w-full p-6 space-y-4">
            <h2 className="text-base font-bold text-slate-900">Confirm Delete</h2>
            <p className="text-xs text-slate-600">
              Are you sure you want to delete <span className="font-bold text-slate-900">"{deleteTarget.name}"</span>? This action cannot be undone.
            </p>
            <div className="flex justify-end gap-3 pt-2">
              <button onClick={() => setDeleteTarget(null)}
                className="px-4 py-2 border border-[#E2E8F0] rounded-md text-xs font-semibold text-slate-600 hover:bg-slate-50">
                Cancel
              </button>
              <button onClick={handleDelete} disabled={deleting}
                className="px-4 py-2 bg-red-600 text-white rounded-md text-xs font-semibold hover:bg-red-700 shadow-sm disabled:opacity-60 flex items-center gap-2">
                {deleting && <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />}
                {deleting ? 'Deleting...' : 'Delete Partner'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
