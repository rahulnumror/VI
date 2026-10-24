import React from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import AppShell from './components/layout/AppShell';
import LoginPage from './components/auth/LoginPage';
import ErrorBoundary from './components/common/ErrorBoundary';

function AuthenticatedApp() {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-[#1E40AF] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-sm font-semibold text-slate-500 uppercase tracking-wider">Loading SOILEX ERP...</p>
        </div>
      </div>
    );
  }

  return (
    <ErrorBoundary fallbackMessage="The application encountered an unexpected error. Please click retry to recover.">
      {isAuthenticated ? <AppShell /> : <LoginPage />}
    </ErrorBoundary>
  );
}

function App() {
  return (
    <AuthProvider>
      <AuthenticatedApp />
    </AuthProvider>
  );
}

export default App;
