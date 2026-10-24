import React, { useState } from 'react';
import { 
  Home, 
  ShoppingCart, 
  FileText, 
  DollarSign, 
  BarChart2, 
  Handshake, 
  Users, 
  Fingerprint, 
  Receipt, 
  ChevronLeft, 
  ChevronRight, 
  Layers, 
  Box, 
  Truck, 
  Briefcase, 
  UserCheck, 
  Calendar, 
  Sun, 
  CheckSquare, 
  ShieldCheck,
  Building2,
  Wheat,
  Container,
  TrendingUp
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export default function Sidebar({ activeTab, onSelectTab, isCollapsed, onToggleCollapse }) {
  const [imgError, setImgError] = useState(false);
  const { user } = useAuth();
  const isEmployeeRole = user?.role === 'EMPLOYEE';

  const employeeMenuGroups = [
    {
      label: 'SELF-SERVICE & MY DESK',
      items: [
        { id: 'employee_portal', label: 'MY HOURS & PORTAL', icon: UserCheck },
        { id: 'todo', label: 'TODO DASHBOARD', icon: CheckSquare },
        { id: 'calendar', label: 'MY CALENDAR', icon: Calendar },
        { id: 'my_day', label: 'MY DAY PLANNER', icon: Sun },
      ]
    },
    {
      label: 'WORKFORCE DIRECTORY',
      items: [
        { id: 'employees', label: 'EMPLOYEE DIRECTORY', icon: Users },
      ]
    }
  ];

  const menuGroups = [
    {
      label: 'DASHBOARDS & SELF-SERVICE',
      items: [
        { id: 'employee_portal', label: 'MY HOURS & PORTAL', icon: UserCheck },
        { id: 'main', label: 'EXECUTIVE OVERVIEW', icon: Home },
        { id: 'hr_dashboard', label: 'HR DASHBOARD', icon: Users },
      ]
    },
    {
      label: 'GLOBAL TRADE & LOGISTICS',
      items: [
        { id: 'export', label: 'EXPORT OPERATIONS', icon: FileText, hasSubmenu: true },
        { id: 'import', label: 'RAW PROCUREMENT', icon: ShoppingCart, hasSubmenu: true },
        { id: 'transactions', label: 'TRADE TRANSACTIONS', icon: DollarSign, hasSubmenu: true },
      ]
    },
    {
      label: 'COMMODITIES & PARTNERS',
      items: [
        { id: 'products', label: 'SPICES & COMMODITIES', icon: Wheat },
        { id: 'buyers', label: 'BUYERS & CLIENTS', icon: Briefcase },
        { id: 'suppliers', label: 'FARMS & SUPPLIERS', icon: Truck },
        { id: 'brokers', label: 'BROKERS NETWORK', icon: UserCheck },
        { id: 'masters', label: 'SYSTEM MASTERS', icon: Layers },
      ]
    },
    {
      label: 'HR & WORKFORCE',
      items: [
        { id: 'hr_dashboard_tab', label: 'HR OVERVIEW', icon: Building2 },
        { id: 'employees', label: 'EMPLOYEE DIRECTORY', icon: Users, hasSubmenu: true },
        { id: 'attendance', label: 'ATTENDANCE & LEAVES', icon: Fingerprint, hasSubmenu: true },
        { id: 'payroll', label: 'PAYROLL & SALARY SLIPS', icon: Receipt, hasSubmenu: true },
        { id: 'recruitment', label: 'RECRUITMENT', icon: Briefcase },
        { id: 'performance', label: 'PERFORMANCE & OKRs', icon: TrendingUp },
        { id: 'user_mgmt', label: 'IAM ROLES & ACCOUNTS', icon: ShieldCheck },
      ]
    },
    {
      label: 'REPORTS & INTELLIGENCE',
      items: [
        { id: 'reports', label: 'BI & EXPORT REPORTS', icon: BarChart2, hasSubmenu: true },
        { id: 'visits', label: 'CLIENT VISITS & AUDITS', icon: Handshake, hasSubmenu: true },
      ]
    },
    {
      label: 'PERSONAL & TASKS',
      items: [
        { id: 'todo', label: 'TODO DASHBOARD', icon: CheckSquare },
        { id: 'calendar', label: 'MY CALENDAR', icon: Calendar },
        { id: 'my_day', label: 'MY DAY PLANNER', icon: Sun },
      ]
    }
  ];

  return (
    <aside 
      className={`fixed top-0 left-0 h-screen bg-white border-r border-[#E2E8F0] z-50 flex flex-col transition-all duration-300 shadow-sm ${
        isCollapsed ? 'w-[72px]' : 'w-[260px]'
      }`}
    >
      {/* Top Header & Official Soilex Brand Logo */}
      <div className="h-[68px] flex items-center justify-between px-3 border-b border-[#E2E8F0] relative bg-white">
        <div 
          onClick={() => onSelectTab('main')}
          className="flex items-center space-x-2.5 cursor-pointer overflow-hidden max-w-[200px]"
        >
          {/* Logo container */}
          {!imgError ? (
            <img 
              src="/soilex-logo.png" 
              alt="SOILEX Life Science" 
              onError={() => setImgError(true)}
              className="h-10 object-contain max-w-[190px]"
            />
          ) : (
            <div className="flex items-center space-x-2">
              <div className="w-9 h-9 rounded bg-[#1E40AF] text-white flex items-center justify-center font-black text-sm shadow">
                SX
              </div>
              {!isCollapsed && (
                <div className="flex flex-col">
                  <span className="text-base font-black text-[#1E40AF] tracking-tight leading-none">SOILEX</span>
                  <span className="text-[9px] font-bold text-[#D97706] tracking-wider uppercase mt-0.5">LIFE SCIENCE</span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Sidebar Toggle Chevron */}
        <button 
          onClick={onToggleCollapse}
          title={isCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
          className="absolute -right-3 top-6 w-6 h-6 bg-[#1E40AF] text-white rounded-full flex items-center justify-center shadow-md hover:bg-blue-800 transition-transform z-10"
        >
          {isCollapsed ? <ChevronRight className="w-3.5 h-3.5" /> : <ChevronLeft className="w-3.5 h-3.5" />}
        </button>
      </div>

      {/* Navigation Links with Scroll */}
      <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-4">
        {(isEmployeeRole ? employeeMenuGroups : menuGroups).map((group, groupIdx) => (
          <div key={groupIdx} className="space-y-1">
            {!isCollapsed && (
              <p className="px-3 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                {group.label}
              </p>
            )}
            {group.items.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => onSelectTab(item.id)}
                  title={isCollapsed ? item.label : undefined}
                  className={`w-full flex items-center px-3 py-2 rounded-lg text-xs font-semibold transition-all ${
                    isActive
                      ? 'bg-[#1E40AF] text-white shadow-sm ring-1 ring-blue-700'
                      : 'text-slate-600 hover:bg-blue-50 hover:text-[#1E40AF]'
                  } ${isCollapsed ? 'justify-center' : 'justify-between'}`}
                >
                  <div className="flex items-center space-x-3 truncate">
                    <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-[#FDE68A]' : 'text-slate-400 group-hover:text-[#1E40AF]'}`} />
                    {!isCollapsed && (
                      <span className="truncate">{item.label}</span>
                    )}
                  </div>
                  {!isCollapsed && item.hasSubmenu && (
                    <ChevronRight className={`w-3.5 h-3.5 opacity-60 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                  )}
                </button>
              );
            })}
          </div>
        ))}
      </nav>

      {/* Footer / Status Info */}
      {!isCollapsed && (
        <div className="p-3 border-t border-[#E2E8F0] bg-slate-50 space-y-2">
          {isEmployeeRole && (
            <div className="px-2.5 py-1.5 bg-emerald-50 border border-emerald-200 rounded text-[10px] text-emerald-800 font-bold flex items-center justify-between">
              <span>🔒 IAM: EMPLOYEE</span>
              <span className="uppercase text-[9px] bg-emerald-200/60 px-1.5 py-0.5 rounded font-mono">Min Access</span>
            </div>
          )}
          <div className="flex items-center justify-between text-[11px] text-slate-500 font-medium">
            <span className="font-semibold text-slate-700">soilexlifescience.com</span>
            <span className="flex items-center space-x-1.5 text-[#1E40AF]">
              <span className="w-2 h-2 rounded-full bg-[#D97706] animate-pulse"></span>
              <span className="font-semibold text-xs text-[#1E40AF]">ISO/FSSAI</span>
            </span>
          </div>
        </div>
      )}
    </aside>
  );
}
