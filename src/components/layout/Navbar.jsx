import React, { useState, useEffect } from 'react';
import { 
  ChevronDown, 
  Clock, 
  Bell, 
  Grid, 
  Wheat,
  Phone,
  LogOut
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const DEMO_ACCOUNTS = [
  { label: 'Admin (Executive)', email: 'admin@soilexlifescience.com', pass: 'admin123', role: 'ADMIN' },
  { label: 'Priya Nair (HR Manager)', email: 'priya.n@soilexlifescience.com', pass: 'hr123', role: 'HR_MANAGER' },
  { label: 'Vũ Thị Hoan (Sales Emp)', email: 'hoan.vu@soilexlifescience.com', pass: 'emp123', role: 'EMPLOYEE' },
  { label: 'Rajesh Sharma (QA Director)', email: 'rajesh.s@soilexlifescience.com', pass: 'qa123', role: 'QUALITY_MANAGER' },
  { label: 'Nguyễn Văn Hùng (Ops Emp)', email: 'hung.nguyen@soilexlifescience.com', pass: 'emp123', role: 'EMPLOYEE' },
  { label: 'Trần Quốc Bảo (Finance Emp)', email: 'bao.tran@soilexlifescience.com', pass: 'emp123', role: 'EMPLOYEE' },
];

export default function Navbar({ currentModule, onSelectModule, isSidebarCollapsed }) {
  const { user, login, logout } = useAuth();
  const [timerRunning, setTimerRunning] = useState(true);
  const [seconds, setSeconds] = useState(0);
  const [selectedYear, setSelectedYear] = useState('2026');
  const displayName = user?.fullName?.toUpperCase() || user?.name?.toUpperCase() || user?.email?.split('@')[0]?.toUpperCase() || 'SOILEX HQ ADMIN';

  const handleSwitchAccount = async (e) => {
    const email = e.target.value;
    const target = DEMO_ACCOUNTS.find(a => a.email === email);
    if (target) {
      const res = await login(target.email, target.pass);
      if (res?.success) {
        if (target.role === 'EMPLOYEE') {
          onSelectModule('employee_portal');
        } else {
          onSelectModule('main');
        }
      }
    }
  };

  useEffect(() => {
    let interval = null;
    if (timerRunning) {
      interval = setInterval(() => {
        setSeconds((prev) => prev + 1);
      }, 1000);
    } else if (!timerRunning && seconds !== 0) {
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [timerRunning, seconds]);

  const formatTime = (totalSeconds) => {
    const hrs = Math.floor(totalSeconds / 3600).toString().padStart(2, '0');
    const mins = Math.floor((totalSeconds % 3600) / 60).toString().padStart(2, '0');
    const secs = (totalSeconds % 60).toString().padStart(2, '0');
    return `${hrs}:${mins}:${secs}`;
  };

  return (
    <header className="sticky top-0 z-40 h-[68px] bg-white border-b border-[#E2E8F0] px-6 flex items-center justify-between shadow-sm">
      {/* Left controls */}
      <div className="flex items-center space-x-3">
        {/* Module Switcher Pill (Royal Blue with Dark Yellow dot) */}
        <div className="relative group">
          <button className="flex items-center space-x-2 bg-[#1E40AF] hover:bg-blue-800 text-white text-xs font-semibold uppercase px-4 py-2 rounded-md shadow-sm transition-all">
            <span className="w-1.5 h-1.5 rounded-full bg-[#D97706]"></span>
            <span className="tracking-wide">{currentModule || 'SOILEX EXECUTIVE DASHBOARD'}</span>
            <ChevronDown className="w-3.5 h-3.5 text-blue-200" />
          </button>
        </div>

        {/* Product Category Dropdown (Spices & Agro Commodities) */}
        <div className="relative">
          <select 
            aria-label="Commodities & Spices Category"
            className="text-xs uppercase font-medium text-slate-700 bg-white border border-[#E2E8F0] rounded-md px-3 py-2 pr-8 focus:outline-none focus:border-[#1E40AF] focus:ring-1 focus:ring-[#1E40AF] cursor-pointer appearance-none shadow-sm"
          >
            <option>ALL COMMODITIES & SPICES</option>
            <option>WHOLE SPICES (IMPORTED & DOMESTIC)</option>
            <option>PERFUMED RICE & GRAINS (DT 8)</option>
            <option>INDIAN AROMATIC TEA (DOOARS / DARJEELING)</option>
            <option>FEED MEALS (RICE/CORN DDGS, SOYBEAN)</option>
            <option>GLOBAL CONTAINER EXPORTS</option>
          </select>
          <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
        </div>

        {/* Fiscal Year Selector */}
        <div className="relative">
          <select 
            value={selectedYear}
            onChange={(e) => setSelectedYear(e.target.value)}
            aria-label="Fiscal Year"
            className="text-xs font-bold text-slate-700 bg-white border border-[#E2E8F0] rounded-md px-3 py-2 pr-7 focus:outline-none focus:border-[#1E40AF] focus:ring-1 focus:ring-[#1E40AF] cursor-pointer appearance-none shadow-sm"
          >
            <option value="2026">FY 2026</option>
            <option value="2025">FY 2025</option>
            <option value="2024">FY 2024</option>
          </select>
          <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
        </div>
      </div>

      {/* Right controls */}
      <div className="flex items-center space-x-4">
        {/* Live session timer with toggle */}
        <div className="flex items-center space-x-2 bg-slate-50 border border-[#E2E8F0] rounded-full px-3 py-1">
          <button 
            onClick={() => setTimerRunning(!timerRunning)}
            className={`w-8 h-4 flex items-center rounded-full p-0.5 transition-colors ${timerRunning ? 'bg-[#1E40AF]' : 'bg-slate-300'}`}
          >
            <div className={`bg-white w-3 h-3 rounded-full shadow-md transform transition-transform ${timerRunning ? 'translate-x-4' : 'translate-x-0'}`} />
          </button>
          <span className="font-mono text-xs font-semibold text-slate-700">
            {formatTime(seconds)}
          </span>
        </div>

        {/* Quick Role / IAM Switcher Dropdown */}
        <div className="relative">
          <select
            value={user?.email || 'admin@soilexlifescience.com'}
            onChange={handleSwitchAccount}
            aria-label="Switch IAM Login Role"
            className="text-xs font-bold text-slate-800 bg-blue-50/80 hover:bg-blue-100/60 border border-blue-200 rounded-md px-2.5 py-1.5 pr-7 focus:outline-none focus:border-[#1E40AF] cursor-pointer appearance-none shadow-sm transition-colors"
          >
            {DEMO_ACCOUNTS.map(acc => (
              <option key={acc.email} value={acc.email}>
                Switch: {acc.label}
              </option>
            ))}
          </select>
          <ChevronDown className="w-3.5 h-3.5 text-[#1E40AF] absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
        </div>

        {/* Logged-in User */}
        <div className="flex items-center space-x-2 px-3 py-1.5 bg-slate-50 border border-[#E2E8F0] rounded-md">
          <span className="text-xs uppercase font-semibold text-slate-700 tracking-wide">{displayName}</span>
          {user?.role && (
            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${
              user.role === 'EMPLOYEE'
                ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                : 'text-[#D97706] bg-amber-50 border-amber-200'
            }`}>
              {user.role === 'EMPLOYEE' ? 'EMPLOYEE (MIN ACCESS)' : user.role}
            </span>
          )}
        </div>

        {/* Logout button */}
        <button
          onClick={logout}
          title="Sign Out"
          className="p-2 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
        >
          <LogOut className="w-4 h-4" />
        </button>

        {/* Support hotline button */}
        <a 
          href="tel:+918001482629" 
          title="Soilex Hotline (+91 8001482629)"
          className="p-2 text-slate-600 hover:text-[#1E40AF] hover:bg-blue-50 rounded-md transition-colors"
        >
          <Phone className="w-4 h-4" />
        </a>

        {/* Notification bell with dark yellow badge */}
        <button 
          title="System Notifications"
          className="relative p-2 text-slate-600 hover:text-[#1E40AF] hover:bg-blue-50 rounded-md transition-colors"
        >
          <Bell className="w-4 h-4" />
          <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-[#D97706] text-white text-[10px] font-bold rounded-full flex items-center justify-center shadow-sm">
            3
          </span>
        </button>

        {/* User profile avatar with favicon */}
        <div className="relative flex items-center cursor-pointer">
          <img 
            src="/favicon.png" 
            alt="User" 
            className="w-8 h-8 rounded-full object-contain border-2 border-[#1E40AF] bg-white p-0.5"
          />
          <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-[#D97706] border-2 border-white rounded-full"></span>
        </div>
      </div>
    </header>
  );
}
