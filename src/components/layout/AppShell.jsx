import React, { useState } from 'react';
import Sidebar from './Sidebar';
import Navbar from './Navbar';
import MainDashboard from '../dashboard/MainDashboard';
import HrDashboard from '../hr/HrDashboard';
import EmployeeList from '../employees/EmployeeList';
import TradeView from '../trade/TradeView';
import RealtimeCalendar from '../calendar/RealtimeCalendar';
import ProductCatalog from '../products/ProductCatalog';
import PartnersView from '../partners/PartnersView';
import AttendanceView from '../attendance/AttendanceView';
import PayrollView from '../payroll/PayrollView';
import TodoPlanner from '../workspace/TodoPlanner';
import ReportsView from '../analytics/ReportsView';
import MastersAdminView from '../admin/MastersAdminView';
import RecruitmentView from '../recruitment/RecruitmentView';
import PerformanceView from '../performance/PerformanceView';
import EmployeePortal from '../portal/EmployeePortal';
import { useAuth } from '../../context/AuthContext';
import ErrorBoundary from '../common/ErrorBoundary';

export default function AppShell() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState(() => {
    return user?.role === 'EMPLOYEE' ? 'employee_portal' : 'main';
  });
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  const getModuleTitle = (tab) => {
    switch (tab) {
      case 'employee_portal': return 'EMPLOYEE SELF SERVICE & DAILY HOURS PORTAL';
      case 'main': return 'SOILEX EXECUTIVE OVERVIEW';
      case 'hr_dashboard':
      case 'hr_dashboard_tab': return 'HR & WORKFORCE DASHBOARD';
      case 'employees': return 'SOLEX EMPLOYEE DIRECTORY';
      case 'export': return 'GLOBAL EXPORT OPERATIONS';
      case 'import': return 'RAW PROCUREMENT & SOURCING';
      case 'transactions': return 'COMMERCIAL TRADE TRANSACTIONS';
      case 'attendance': return 'ATTENDANCE & LEAVE MASTER';
      case 'payroll': return 'PAYROLL & SALARY SLIPS';
      case 'buyers': return 'GLOBAL BUYERS & CONSIGNEES';
      case 'suppliers': return 'CERTIFIED FARMS & SUPPLIERS';
      case 'brokers': return 'TRADE BROKERS NETWORK';
      case 'products': return 'SPICES & AGRO PRODUCT CATALOG';
      case 'masters': return 'SYSTEM MASTERS & BIO-HUBS';
      case 'reports': return 'BUSINESS INTELLIGENCE & REPORTS';
      case 'visits': return 'CLIENT VISITS & TRADE AUDITS';
      case 'todo': return 'TODO & OPERATIONS BOARD';
      case 'calendar': return 'REAL-TIME SCIENTIFIC CALENDAR';
      case 'my_day': return 'MY DAILY AGENDA';
      case 'workspace': return 'ENTERPRISE WORKSPACE';
      case 'user_mgmt': return 'USER ACCESS CONTROL';
      case 'recruitment': return 'TALENT ACQUISITION & RECRUITMENT';
      case 'performance': return 'PERFORMANCE & APPRAISALS';
      default: return 'SOILEX LIFE SCIENCE';
    }
  };

  const renderContent = () => {
    const isEmployeeRole = user?.role === 'EMPLOYEE';
    const allowedEmployeeTabs = ['employee_portal', 'employees', 'calendar', 'my_day', 'todo', 'workspace'];

    if (isEmployeeRole && !allowedEmployeeTabs.includes(activeTab)) {
      return (
        <div className="p-8 max-w-xl mx-auto my-12 bg-white rounded-xl border border-amber-200 shadow-sm text-center space-y-4">
          <div className="w-12 h-12 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center mx-auto text-xl font-bold">
            🔒
          </div>
          <h2 className="text-base font-bold text-slate-900 uppercase tracking-wide">
            Minimum Level Access Control Active
          </h2>
          <p className="text-xs text-slate-600 leading-relaxed">
            Your IAM Role (<strong>EMPLOYEE</strong>) is configured with least-privilege minimum access control. Administrative enterprise modules, executive trade logistics, and confidential compensation operations require elevated roles (<strong>HR_MANAGER</strong> or <strong>ADMIN</strong>).
          </p>
          <div className="flex items-center justify-center space-x-3 pt-2">
            <button
              onClick={() => setActiveTab('employee_portal')}
              className="px-4 py-2 bg-[#1E40AF] hover:bg-blue-800 text-white rounded-lg text-xs font-bold transition-colors shadow-sm"
            >
              Go to My Portal
            </button>
            <button
              onClick={() => setActiveTab('employees')}
              className="px-4 py-2 border border-[#E2E8F0] hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-semibold transition-colors"
            >
              Workforce Directory (Static)
            </button>
          </div>
        </div>
      );
    }

    switch (activeTab) {
      case 'employee_portal':
        return <EmployeePortal onNavigate={(tab) => setActiveTab(tab)} />;
      case 'calendar':
        return <RealtimeCalendar />;
      case 'main':
        return <MainDashboard onNavigate={(tab) => setActiveTab(tab)} />;
      case 'hr_dashboard':
      case 'hr_dashboard_tab':
        return <HrDashboard onNavigate={(tab) => setActiveTab(tab)} />;
      case 'employees':
        return <EmployeeList />;
      case 'export':
        return <TradeView type="export" />;
      case 'import':
        return <TradeView type="import" />;
      case 'transactions':
        return <TradeView type="transactions" />;
      case 'products':
        return <ProductCatalog />;
      case 'buyers':
        return <PartnersView defaultType="BUYER" />;
      case 'suppliers':
        return <PartnersView defaultType="SUPPLIER" />;
      case 'brokers':
        return <PartnersView defaultType="BROKER" />;
      case 'attendance':
        return <AttendanceView />;
      case 'payroll':
        return <PayrollView />;
      case 'todo':
      case 'workspace':
        return <TodoPlanner isMyDay={false} />;
      case 'my_day':
        return <TodoPlanner isMyDay={true} />;
      case 'reports':
        return <ReportsView isVisits={false} />;
      case 'visits':
        return <ReportsView isVisits={true} />;
      case 'masters':
        return <MastersAdminView viewType="masters" />;
      case 'user_mgmt':
        return <MastersAdminView viewType="users" />;
      case 'recruitment':
        return <RecruitmentView onNavigate={(tab) => setActiveTab(tab)} />;
      case 'performance':
        return <PerformanceView onNavigate={(tab) => setActiveTab(tab)} />;
      default:
        return <MainDashboard onNavigate={(tab) => setActiveTab(tab)} />;
    }
  };


  return (
    <div className="min-h-screen bg-[#F8FAFC] flex">
      {/* Sidebar Navigation */}
      <Sidebar 
        activeTab={activeTab}
        onSelectTab={(tab) => setActiveTab(tab)}
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
      />

      {/* Main Content Area */}
      <div 
        className={`flex-1 flex flex-col min-h-screen transition-all duration-300 ${
          isSidebarCollapsed ? 'ml-[72px]' : 'ml-[260px]'
        }`}
      >
        <Navbar 
          currentModule={getModuleTitle(activeTab)}
          onSelectModule={(tab) => setActiveTab(tab)}
          isSidebarCollapsed={isSidebarCollapsed}
        />

        <main className="flex-1">
          <ErrorBoundary
            key={activeTab}
            fallbackMessage={`An unexpected issue occurred while rendering this module. You can reload or navigate back to the home overview.`}
            onNavigateHome={() => setActiveTab(user?.role === 'EMPLOYEE' ? 'employee_portal' : 'main')}
          >
            {renderContent()}
          </ErrorBoundary>
        </main>
      </div>
    </div>
  );
}
