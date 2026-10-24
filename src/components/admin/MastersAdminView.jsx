import React, { useState, useEffect, useCallback } from 'react';
import {
  Layers,
  ShieldCheck,
  Building2,
  Server,
  Database,
  UserPlus,
  RefreshCw,
  X,
  Pencil,
  Trash2,
  Key,
  Users,
  Check,
  AlertCircle,
  UserCheck,
  Briefcase
} from 'lucide-react';
import api from '../../services/api';

const FALLBACK_FACILITIES = [
  { id: 'FAC-01', code: 'BR-HN', name: 'Hanoi Agro Bio-Hub & HQ', type: 'CORPORATE_HQ_LOGISTICS', location: 'Hanoi, Vietnam', capacity_sqft: 120000, active_personnel: 85, status: 'OPERATIONAL' },
  { id: 'FAC-02', code: 'BR-KC', name: 'Kochi Spices Extraction & Terminal', type: 'PROCESSING_EXPORT_PLANT', location: 'Kerala, India', capacity_sqft: 95000, active_personnel: 140, status: 'OPERATIONAL' },
  { id: 'FAC-03', code: 'BR-HP', name: 'Hai Phong Port Logistics Depot', type: 'COLD_STORAGE_CONTAINER_DEPOT', location: 'Hai Phong, Vietnam', capacity_sqft: 65000, active_personnel: 42, status: 'OPERATIONAL' },
  { id: 'FAC-04', code: 'BR-DXB', name: 'Dubai Middle East Trade Hub', type: 'REGIONAL_SALES_OFFICE', location: 'Jebel Ali, Dubai, UAE', capacity_sqft: 25000, active_personnel: 18, status: 'OPERATIONAL' },
];

const FALLBACK_USERS = [
  { id: 'USR-001', name: 'System Admin', email: 'admin@soilexlifescience.com', role: 'ADMIN', department: 'Executive Management', employee_code: 'SLX-HQ01', branch: 'Hanoi HQ', status: 'ACTIVE' },
  { id: 'USR-002', name: 'Vũ Thị Hoan', email: 'hoan.vu@soilexlifescience.com', role: 'EMPLOYEE', department: 'Sales & Export', employee_code: 'SLX-E01', branch: 'Hanoi HQ', status: 'ACTIVE' },
  { id: 'USR-003', name: 'Rajesh Sharma', email: 'rajesh.s@soilexlifescience.com', role: 'QUALITY_MANAGER', department: 'Quality Assurance', employee_code: 'SLX-E02', branch: 'Kochi Terminal', status: 'ACTIVE' },
  { id: 'USR-004', name: 'Priya Nair', email: 'priya.n@soilexlifescience.com', role: 'HR_MANAGER', department: 'Human Resources', employee_code: 'SLX-E04', branch: 'Kochi Terminal', status: 'ACTIVE' },
  { id: 'USR-005', name: 'Nguyễn Văn Hùng', email: 'hung.nguyen@soilexlifescience.com', role: 'EMPLOYEE', department: 'Operations & Supply', employee_code: 'SLX-E03', branch: 'Hai Phong Hub', status: 'ACTIVE' },
  { id: 'USR-006', name: 'Trần Quốc Bảo', email: 'bao.tran@soilexlifescience.com', role: 'EMPLOYEE', department: 'Finance & Accounts', employee_code: 'SLX-E05', branch: 'Hanoi HQ', status: 'ACTIVE' },
];

const IAM_ROLES = [
  { id: 'EMPLOYEE', label: 'EMPLOYEE (Self-Service: Daily Hours, Clock-in, Overtime, Leave, Salary Slips)', color: 'bg-emerald-100 text-emerald-800 border-emerald-200' },
  { id: 'HR_MANAGER', label: 'HR_MANAGER (Workforce Directory, Recruitment, Leaves & Overtime Approval)', color: 'bg-purple-100 text-purple-800 border-purple-200' },
  { id: 'ADMIN', label: 'ADMIN (Full Enterprise System Access & IAM Control)', color: 'bg-blue-100 text-[#1E40AF] border-blue-200' },
  { id: 'TRADE_OFFICER', label: 'TRADE_OFFICER (Export/Import Logistics, BL Manifests, Trade Contracts)', color: 'bg-amber-100 text-amber-800 border-amber-200' },
  { id: 'QUALITY_MANAGER', label: 'QUALITY_MANAGER (QA Lab Directorship, FSSAI Testing, Phytosanitary)', color: 'bg-teal-100 text-teal-800 border-teal-200' },
];

function getStatusBadge(status) {
  const s = (status || '').toUpperCase();
  if (s === 'OPERATIONAL' || s === 'ACTIVE') return 'bg-emerald-100 text-emerald-800 border-emerald-200';
  if (s === 'OFFLINE' || s === 'SUSPENDED') return 'bg-red-100 text-red-700 border-red-200';
  if (s === 'MAINTENANCE') return 'bg-amber-100 text-amber-800 border-amber-200';
  return 'bg-slate-100 text-slate-700 border-slate-200';
}

function getRoleBadge(role) {
  const r = (role || '').toUpperCase();
  const found = IAM_ROLES.find(x => x.id === r);
  return found ? found.color : 'bg-slate-100 text-slate-700 border-slate-200';
}

export default function MastersAdminView({ viewType = 'masters' }) {
  const [activeTab, setActiveTab] = useState('masters');
  const [facilities, setFacilities] = useState(FALLBACK_FACILITIES);
  const [systemInfo, setSystemInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notification, setNotification] = useState(null);

  // IAM Users State
  const [users, setUsers] = useState(FALLBACK_USERS);
  const [employees, setEmployees] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [savingUser, setSavingUser] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);

  // New IAM User Form State
  const [newUser, setNewUser] = useState({
    name: '',
    email: '',
    password: 'emp' + Math.floor(100 + Math.random() * 900),
    role: 'EMPLOYEE',
    department: 'Sales & Export',
    employee_id: '',
    status: 'ACTIVE'
  });

  const notify = (type, msg) => {
    setNotification({ type, msg });
    setTimeout(() => setNotification(null), 3500);
  };

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [facData, sysData] = await Promise.all([
        api.getFacilities(),
        api.getSystemInfo(),
      ]);
      if (facData && facData.length > 0) setFacilities(facData);
      if (sysData) setSystemInfo(sysData);
    } catch {
      // fallback
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchUsers = useCallback(async () => {
    setLoadingUsers(true);
    try {
      const [userData, empData] = await Promise.all([
        api.getUsers(),
        api.getEmployees(),
      ]);
      if (userData && Array.isArray(userData) && userData.length > 0) {
        setUsers(userData);
      } else {
        setUsers(FALLBACK_USERS);
      }
      if (empData && Array.isArray(empData) && empData.length > 0) {
        setEmployees(empData);
      }
    } catch {
      setUsers(FALLBACK_USERS);
    } finally {
      setLoadingUsers(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    fetchUsers();
  }, [fetchData, fetchUsers]);

  // Sync active tab with viewType prop changes
  useEffect(() => {
    setActiveTab(viewType === 'users' ? 'users' : 'masters');
  }, [viewType]);

  // Handle Employee Link Selection in Create Form
  const handleSelectEmployee = (empId) => {
    const emp = employees.find(e => e.id === empId);
    if (emp) {
      setNewUser(prev => ({
        ...prev,
        employee_id: emp.id,
        name: emp.full_name || emp.name,
        email: emp.email || `${(emp.full_name || 'user').toLowerCase().replace(/\s+/g, '.')}@soilexlifescience.com`,
        department: emp.department || 'Operations',
      }));
    } else {
      setNewUser(prev => ({ ...prev, employee_id: '' }));
    }
  };

  // Submit Create IAM User
  const handleCreateUser = async (e) => {
    e.preventDefault();
    if (!newUser.name || !newUser.email || !newUser.password) {
      notify('error', 'Name, email, and password are required.');
      return;
    }
    setSavingUser(true);
    try {
      const res = await api.createUser(newUser);
      if (res) {
        notify('success', `IAM User role created for ${newUser.name} (${newUser.role})`);
        await fetchUsers();
      } else {
        // Fallback local insert
        setUsers(prev => [
          ...prev,
          {
            id: `USR-${Date.now().toString().slice(-4)}`,
            ...newUser,
            created_at: new Date().toISOString()
          }
        ]);
        notify('success', `IAM User created for ${newUser.name} (local session)`);
      }
      setShowCreateModal(false);
      setNewUser({
        name: '',
        email: '',
        password: 'emp' + Math.floor(100 + Math.random() * 900),
        role: 'EMPLOYEE',
        department: 'Sales & Export',
        employee_id: '',
        status: 'ACTIVE'
      });
    } catch (err) {
      notify('error', err?.message || 'Failed to create IAM user.');
    } finally {
      setSavingUser(false);
    }
  };

  // Submit Edit IAM User
  const handleEditUser = async (e) => {
    e.preventDefault();
    if (!editingUser) return;
    setSavingUser(true);
    try {
      const payload = {
        name: editingUser.name,
        email: editingUser.email,
        role: editingUser.role,
        department: editingUser.department,
        employee_id: editingUser.employee_id,
        status: editingUser.status,
      };
      if (editingUser.new_password) {
        payload.password = editingUser.new_password;
      }
      const res = await api.updateUser(editingUser.id, payload);
      if (res) {
        notify('success', `IAM User ${editingUser.name} updated.`);
        await fetchUsers();
      } else {
        setUsers(prev => prev.map(u => u.id === editingUser.id ? { ...u, ...payload } : u));
        notify('success', `IAM User ${editingUser.name} updated.`);
      }
      setShowEditModal(false);
      setEditingUser(null);
    } catch (err) {
      notify('error', err?.message || 'Failed to update user.');
    } finally {
      setSavingUser(false);
    }
  };

  // Delete IAM User
  const handleDeleteUser = async (id) => {
    setSavingUser(true);
    try {
      const res = await api.deleteUser(id);
      if (res) {
        notify('success', 'IAM user account removed.');
        await fetchUsers();
      } else {
        setUsers(prev => prev.filter(u => u.id !== id));
        notify('success', 'User removed from active roster.');
      }
    } catch (err) {
      notify('error', err?.message || 'Failed to delete user.');
    } finally {
      setSavingUser(false);
      setDeleteConfirmId(null);
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Notification Banner */}
      {notification && (
        <div className={`fixed top-4 right-4 z-[9999] flex items-center space-x-2 px-4 py-3 rounded-lg shadow-lg border text-xs font-bold transition-all ${notification.type === 'success' ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-red-50 border-red-200 text-red-700'}`}>
          <span>{notification.type === 'success' ? '✓' : '✕'}</span>
          <span>{notification.msg}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-lg border border-[#E2E8F0] shadow-card">
        <div className="flex items-center space-x-3.5">
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-[#1E40AF] flex items-center justify-center border border-blue-200">
            {activeTab === 'users' ? <ShieldCheck className="w-6 h-6" /> : <Building2 className="w-6 h-6" />}
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight uppercase">
              Bio-Hub Facilities & System Administration
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Facility Registry • System Diagnostics • Role-Based IAM Access Control
            </p>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setActiveTab('masters')}
            className={`px-3.5 py-2 rounded-md text-xs font-bold transition-all ${activeTab === 'masters' ? 'bg-[#1E40AF] text-white shadow-sm' : 'bg-white border border-[#E2E8F0] text-slate-700 hover:bg-slate-50'}`}
          >
            FACILITIES & SYSTEM
          </button>
          <button
            onClick={() => setActiveTab('users')}
            className={`px-3.5 py-2 rounded-md text-xs font-bold transition-all ${activeTab === 'users' ? 'bg-[#1E40AF] text-white shadow-sm' : 'bg-white border border-[#E2E8F0] text-slate-700 hover:bg-slate-50'}`}
          >
            USER & IAM MANAGEMENT
          </button>
        </div>
      </div>

      {/* ============================================================ */}
      {/* FACILITIES & SYSTEM TAB                                       */}
      {/* ============================================================ */}
      {activeTab === 'masters' && (
        <div className="space-y-6">
          {/* Facilities Table */}
          <div className="bg-white rounded-lg border border-[#E2E8F0] shadow-card overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                Registered Facilities & Operating Entities
              </h3>
              <span className="text-xs font-semibold text-slate-500">{facilities.length} Facilities</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-700">
                <thead className="bg-[#FAFAFA] border-b border-[#E2E8F0] text-[11px] font-bold uppercase tracking-wider text-slate-600">
                  <tr>
                    <th className="py-3 px-4">Code</th>
                    <th className="py-3 px-4">Name</th>
                    <th className="py-3 px-4">Type</th>
                    <th className="py-3 px-4">Location</th>
                    <th className="py-3 px-4 text-right">Capacity (sq ft)</th>
                    <th className="py-3 px-4 text-center">Personnel</th>
                    <th className="py-3 px-4 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {facilities.map((f) => (
                    <tr key={f.id} className="hover:bg-blue-50/40 transition-colors">
                      <td className="py-3 px-4 font-mono font-bold text-[#1E40AF]">{f.code}</td>
                      <td className="py-3 px-4 font-bold text-slate-900">{f.name}</td>
                      <td className="py-3 px-4 text-slate-600">{f.type.replace(/_/g, ' ')}</td>
                      <td className="py-3 px-4 text-slate-500">{f.location}</td>
                      <td className="py-3 px-4 text-right font-semibold text-slate-800">{(f.capacity_sqft || 0).toLocaleString()}</td>
                      <td className="py-3 px-4 text-center font-bold text-slate-700">{f.active_personnel}</td>
                      <td className="py-3 px-4 text-center">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${getStatusBadge(f.status)}`}>
                          {f.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* System Info & Health Card */}
          <div className="bg-white rounded-lg border border-[#E2E8F0] shadow-card p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center space-x-2">
                <Server className="w-4 h-4 text-[#1E40AF]" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                  DuckDB Engine & System Diagnostics
                </h3>
              </div>
              <button
                onClick={fetchData}
                className="text-xs text-[#1E40AF] hover:underline font-semibold flex items-center space-x-1"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Refresh Diagnostics</span>
              </button>
            </div>

            {systemInfo ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                  <span className="text-[10px] font-bold text-slate-400 uppercase block">Database Engine</span>
                  <span className="text-sm font-black text-slate-900">{systemInfo.databaseType || 'DuckDB 1.0 (OLAP)'}</span>
                </div>
                <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                  <span className="text-[10px] font-bold text-slate-400 uppercase block">Active Database Size</span>
                  <span className="text-sm font-black text-emerald-700">{systemInfo.databaseSizeMB || '1.8'} MB</span>
                </div>
                <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                  <span className="text-[10px] font-bold text-slate-400 uppercase block">Persistence Storage</span>
                  <span className="text-xs font-mono font-semibold text-slate-700 truncate block" title={systemInfo.databaseFile}>
                    backend/data/soilex.duckdb
                  </span>
                </div>
                <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                  <span className="text-[10px] font-bold text-slate-400 uppercase block">Enterprise Migration Targets</span>
                  <span className="text-xs font-bold text-[#1E40AF]">PostgreSQL 16 · MySQL 8.4</span>
                </div>
              </div>
            ) : (
              <div className="text-xs text-slate-400 italic">Connecting to DuckDB telemetry engine...</div>
            )}
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* USER & IAM MANAGEMENT TAB                                     */}
      {/* ============================================================ */}
      {activeTab === 'users' && (
        <div className="space-y-6">
          {/* Top Info Banner */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center space-x-3">
              <ShieldCheck className="w-5 h-5 text-[#1E40AF] shrink-0" />
              <div>
                <h4 className="text-xs font-bold text-slate-900 uppercase">Enterprise IAM & Employee Self-Service Roles</h4>
                <p className="text-[11px] text-slate-600">
                  Provision login accounts for staff. Employees can track daily hours, clock in/out, log overtime, submit leaves, and inspect static salary structures.
                </p>
              </div>
            </div>
            <button
              onClick={() => setShowCreateModal(true)}
              className="flex items-center space-x-1.5 px-3.5 py-2 bg-[#1E40AF] hover:bg-blue-800 text-white rounded-md text-xs font-bold transition-all shadow-sm shrink-0"
            >
              <UserPlus className="w-4 h-4 text-[#FDE68A]" />
              <span>+ CREATE IAM ROLE / USER</span>
            </button>
          </div>

          {/* IAM Users Table */}
          <div className="bg-white rounded-lg border border-[#E2E8F0] shadow-card overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Users className="w-4 h-4 text-[#1E40AF]" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                  Active IAM User Credentials ({users.length})
                </h3>
              </div>
              <button
                onClick={fetchUsers}
                className="text-xs text-slate-500 hover:text-slate-800 flex items-center space-x-1 font-semibold"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Refresh Accounts</span>
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-700">
                <thead className="bg-[#FAFAFA] border-b border-[#E2E8F0] text-[11px] font-bold uppercase tracking-wider text-slate-600">
                  <tr>
                    <th className="py-3 px-4">User Name</th>
                    <th className="py-3 px-4">Login Email</th>
                    <th className="py-3 px-4">Linked Employee</th>
                    <th className="py-3 px-4">IAM Role</th>
                    <th className="py-3 px-4">Department</th>
                    <th className="py-3 px-4 text-center">Status</th>
                    <th className="py-3 px-4 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {loadingUsers ? (
                    Array.from({ length: 4 }).map((_, i) => (
                      <tr key={i}>
                        {Array.from({ length: 7 }).map((__, j) => (
                          <td key={j} className="py-3 px-4">
                            <div className="animate-pulse bg-slate-100 rounded h-3 w-full" />
                          </td>
                        ))}
                      </tr>
                    ))
                  ) : users.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-slate-400 text-xs font-semibold">
                        No IAM users configured. Click "+ CREATE IAM ROLE / USER" to provision staff credentials.
                      </td>
                    </tr>
                  ) : (
                    users.map((u) => (
                      <tr key={u.id} className="hover:bg-blue-50/40 transition-colors">
                        <td className="py-3 px-4 font-bold text-slate-900 whitespace-nowrap">
                          {u.name}
                        </td>
                        <td className="py-3 px-4 text-slate-600 font-mono text-[11px] whitespace-nowrap">
                          {u.email}
                        </td>
                        <td className="py-3 px-4 whitespace-nowrap">
                          {u.employee_code ? (
                            <span className="font-mono text-[11px] font-bold text-[#1E40AF] bg-blue-50 border border-blue-200 px-2 py-0.5 rounded">
                              {u.employee_code} {u.branch ? `(${u.branch})` : ''}
                            </span>
                          ) : (
                            <span className="text-slate-400 italic text-[11px]">System Account</span>
                          )}
                        </td>
                        <td className="py-3 px-4 whitespace-nowrap">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded border uppercase ${getRoleBadge(u.role)}`}>
                            {u.role}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-slate-600 whitespace-nowrap">
                          {u.department || 'General'}
                        </td>
                        <td className="py-3 px-4 text-center whitespace-nowrap">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded border uppercase ${getStatusBadge(u.status)}`}>
                            {u.status || 'ACTIVE'}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-center whitespace-nowrap">
                          <div className="flex items-center justify-center space-x-1.5">
                            <button
                              onClick={() => {
                                setEditingUser({ ...u, new_password: '' });
                                setShowEditModal(true);
                              }}
                              className="px-2.5 py-1 border border-[#E2E8F0] hover:bg-slate-50 text-slate-700 rounded text-[11px] font-semibold transition-colors flex items-center space-x-1"
                            >
                              <Pencil className="w-3 h-3 text-[#D97706]" />
                              <span>Edit</span>
                            </button>

                            {deleteConfirmId === u.id ? (
                              <div className="flex items-center space-x-1">
                                <button
                                  onClick={() => handleDeleteUser(u.id)}
                                  disabled={savingUser}
                                  className="px-2 py-1 bg-red-600 hover:bg-red-700 text-white rounded text-[10px] font-bold disabled:opacity-50"
                                >
                                  Confirm
                                </button>
                                <button
                                  onClick={() => setDeleteConfirmId(null)}
                                  className="px-2 py-1 border border-slate-200 text-slate-600 rounded text-[10px] font-bold hover:bg-slate-50"
                                >
                                  ✕
                                </button>
                              </div>
                            ) : (
                              <button
                                onClick={() => setDeleteConfirmId(u.id)}
                                title="Deactivate user"
                                className="p-1 hover:bg-red-50 text-slate-400 hover:text-red-600 rounded transition-colors"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
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

      {/* ── CREATE IAM USER MODAL ── */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-[110] flex items-center justify-center p-4">
          <div className="bg-white rounded-xl border border-[#E2E8F0] shadow-2xl max-w-lg w-full p-6 space-y-4 max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center space-x-2">
                <UserPlus className="w-5 h-5 text-[#1E40AF]" />
                <h3 className="text-sm font-bold text-slate-900 uppercase">Create New IAM User / Role</h3>
              </div>
              <button onClick={() => setShowCreateModal(false)} className="text-slate-400 hover:text-slate-600 p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateUser} className="space-y-4 text-xs">
              {/* Option to Link to Existing Employee */}
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Link to Employee Directory (Auto-populates details)
                </label>
                <select
                  value={newUser.employee_id}
                  onChange={(e) => handleSelectEmployee(e.target.value)}
                  className="w-full bg-white border border-[#E2E8F0] rounded-md px-3 py-2 text-xs font-semibold text-slate-800 focus:outline-none focus:border-[#1E40AF]"
                >
                  <option value="">-- Standalone User (No Employee Link) --</option>
                  {employees.map(emp => (
                    <option key={emp.id} value={emp.id}>
                      {emp.full_name} ({emp.employee_code || emp.id} - {emp.department})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2">
                  <label className="text-xs font-bold text-slate-700 block mb-1">Full Name *</label>
                  <input
                    type="text"
                    required
                    value={newUser.name}
                    onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
                    placeholder="e.g. Vũ Thị Hoan"
                    className="w-full bg-white border border-[#E2E8F0] rounded-md px-3 py-2 text-xs font-medium focus:outline-none focus:border-[#1E40AF]"
                  />
                </div>

                <div className="col-span-2">
                  <label className="text-xs font-bold text-slate-700 block mb-1">Login Email *</label>
                  <input
                    type="email"
                    required
                    value={newUser.email}
                    onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                    placeholder="e.g. employee@soilexlifescience.com"
                    className="w-full bg-white border border-[#E2E8F0] rounded-md px-3 py-2 text-xs font-medium focus:outline-none focus:border-[#1E40AF]"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">IAM Role Assignment *</label>
                  <select
                    value={newUser.role}
                    onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}
                    className="w-full bg-white border border-[#E2E8F0] rounded-md px-3 py-2 text-xs font-bold text-[#1E40AF] focus:outline-none focus:border-[#1E40AF]"
                  >
                    <option value="EMPLOYEE">EMPLOYEE (Self-Service)</option>
                    <option value="HR_MANAGER">HR_MANAGER</option>
                    <option value="TRADE_OFFICER">TRADE_OFFICER</option>
                    <option value="QUALITY_MANAGER">QUALITY_MANAGER</option>
                    <option value="ADMIN">ADMIN (Full Access)</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Department</label>
                  <input
                    type="text"
                    value={newUser.department}
                    onChange={(e) => setNewUser({ ...newUser, department: e.target.value })}
                    placeholder="e.g. Sales & Export"
                    className="w-full bg-white border border-[#E2E8F0] rounded-md px-3 py-2 text-xs font-medium focus:outline-none focus:border-[#1E40AF]"
                  />
                </div>

                <div className="col-span-2">
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-bold text-slate-700">Initial Password *</label>
                    <span className="text-[10px] text-slate-400">Can be changed later</span>
                  </div>
                  <input
                    type="text"
                    required
                    value={newUser.password}
                    onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                    className="w-full bg-slate-50 border border-[#E2E8F0] rounded-md px-3 py-2 text-xs font-mono font-bold text-slate-800 focus:outline-none focus:border-[#1E40AF]"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end space-x-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 border border-[#E2E8F0] rounded-md text-xs font-semibold text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingUser}
                  className="px-4 py-2 bg-[#1E40AF] hover:bg-blue-800 text-white rounded-md text-xs font-bold shadow-sm transition-colors disabled:opacity-60"
                >
                  {savingUser ? 'Creating IAM User...' : 'Create & Provision IAM Role'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── EDIT IAM USER MODAL ── */}
      {showEditModal && editingUser && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-[110] flex items-center justify-center p-4">
          <div className="bg-white rounded-xl border border-[#E2E8F0] shadow-2xl max-w-lg w-full p-6 space-y-4 max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center space-x-2">
                <Pencil className="w-5 h-5 text-[#D97706]" />
                <h3 className="text-sm font-bold text-slate-900 uppercase">Edit IAM User Account</h3>
              </div>
              <button onClick={() => setShowEditModal(false)} className="text-slate-400 hover:text-slate-600 p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleEditUser} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2">
                  <label className="text-xs font-bold text-slate-700 block mb-1">User Name *</label>
                  <input
                    type="text"
                    required
                    value={editingUser.name}
                    onChange={(e) => setEditingUser({ ...editingUser, name: e.target.value })}
                    className="w-full bg-white border border-[#E2E8F0] rounded-md px-3 py-2 text-xs font-medium focus:outline-none focus:border-[#1E40AF]"
                  />
                </div>

                <div className="col-span-2">
                  <label className="text-xs font-bold text-slate-700 block mb-1">Login Email *</label>
                  <input
                    type="email"
                    required
                    value={editingUser.email}
                    onChange={(e) => setEditingUser({ ...editingUser, email: e.target.value })}
                    className="w-full bg-white border border-[#E2E8F0] rounded-md px-3 py-2 text-xs font-medium focus:outline-none focus:border-[#1E40AF]"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">IAM Role *</label>
                  <select
                    value={editingUser.role}
                    onChange={(e) => setEditingUser({ ...editingUser, role: e.target.value })}
                    className="w-full bg-white border border-[#E2E8F0] rounded-md px-3 py-2 text-xs font-bold text-[#1E40AF] focus:outline-none focus:border-[#1E40AF]"
                  >
                    <option value="EMPLOYEE">EMPLOYEE (Self-Service)</option>
                    <option value="HR_MANAGER">HR_MANAGER</option>
                    <option value="TRADE_OFFICER">TRADE_OFFICER</option>
                    <option value="QUALITY_MANAGER">QUALITY_MANAGER</option>
                    <option value="ADMIN">ADMIN (Full Access)</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Account Status</label>
                  <select
                    value={editingUser.status}
                    onChange={(e) => setEditingUser({ ...editingUser, status: e.target.value })}
                    className="w-full bg-white border border-[#E2E8F0] rounded-md px-3 py-2 text-xs font-bold text-slate-700 focus:outline-none focus:border-[#1E40AF]"
                  >
                    <option value="ACTIVE">ACTIVE</option>
                    <option value="SUSPENDED">SUSPENDED</option>
                  </select>
                </div>

                <div className="col-span-2">
                  <label className="text-xs font-bold text-slate-700 block mb-1">Reset Password (Leave blank to keep current)</label>
                  <input
                    type="text"
                    value={editingUser.new_password || ''}
                    onChange={(e) => setEditingUser({ ...editingUser, new_password: e.target.value })}
                    placeholder="Enter new password to overwrite"
                    className="w-full bg-white border border-[#E2E8F0] rounded-md px-3 py-2 text-xs font-mono focus:outline-none focus:border-[#1E40AF]"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end space-x-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="px-4 py-2 border border-[#E2E8F0] rounded-md text-xs font-semibold text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingUser}
                  className="px-4 py-2 bg-[#D97706] hover:bg-[#B45309] text-white rounded-md text-xs font-bold shadow-sm transition-colors disabled:opacity-60"
                >
                  {savingUser ? 'Saving Changes...' : 'Save User Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
