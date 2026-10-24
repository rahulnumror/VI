import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { LogIn, Mail, Lock, AlertCircle, Wheat } from 'lucide-react';

export default function LoginPage() {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please enter both email and password');
      return;
    }
    setError('');
    setLoading(true);

    const result = await login(email, password);
    if (!result.success) {
      setError(result.message || 'Login failed. Please check your credentials.');
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#1E3A8A] via-[#1E40AF] to-[#1D4ED8] flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        {/* Logo & Brand */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-white/10 backdrop-blur-sm rounded-2xl border border-white/20 mb-4">
            <Wheat className="w-8 h-8 text-[#FDE68A]" />
          </div>
          <h1 className="text-3xl font-black text-white tracking-tight">SOILEX Life Science</h1>
          <p className="text-sm text-blue-200 mt-1 font-medium">Enterprise Resource Planning System</p>
        </div>

        {/* Login Card */}
        <div className="bg-white rounded-2xl shadow-2xl p-8 border border-blue-100">
          <div className="text-center mb-6">
            <h2 className="text-lg font-bold text-slate-900">Welcome Back</h2>
            <p className="text-xs text-slate-500 mt-1">Sign in to access the ERP dashboard</p>
          </div>

          {error && (
            <div className="mb-4 flex items-center space-x-2 p-3 bg-red-50 border border-red-200 rounded-lg">
              <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
              <span className="text-xs text-red-700 font-medium">{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1.5">
                Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@soilexlifescience.com"
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-10 pr-4 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-[#1E40AF] focus:ring-2 focus:ring-blue-100 transition-all"
                  autoComplete="email"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1.5">
                Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-10 pr-4 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-[#1E40AF] focus:ring-2 focus:ring-blue-100 transition-all"
                  autoComplete="current-password"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center space-x-2 px-4 py-3 bg-[#1E40AF] hover:bg-blue-800 disabled:bg-blue-400 text-white text-sm font-bold rounded-lg shadow-md hover:shadow-lg transition-all uppercase tracking-wider"
            >
              {loading ? (
                <span className="animate-pulse">Authenticating...</span>
              ) : (
                <>
                  <LogIn className="w-4 h-4" />
                  <span>Sign In</span>
                </>
              )}
            </button>
          </form>

          {/* Demo Credentials */}
          <div className="mt-6 pt-5 border-t border-slate-100">
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider text-center mb-3">Demo Accounts</p>
            <div className="space-y-2">
              {[
                { email: 'admin@soilexlifescience.com', password: 'admin123', role: 'Admin' },
                { email: 'hoan.vu@soilexlifescience.com', password: 'trade123', role: 'Trade Officer' },
                { email: 'rajesh.s@soilexlifescience.com', password: 'qa123', role: 'QA Manager' },
              ].map((cred, idx) => (
                <button
                  key={idx}
                  onClick={() => { setEmail(cred.email); setPassword(cred.password); setError(''); }}
                  className="w-full text-left p-2.5 bg-slate-50 hover:bg-blue-50 rounded-lg border border-slate-200 hover:border-blue-200 transition-all group"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono text-slate-600 group-hover:text-[#1E40AF]">{cred.email}</span>
                    <span className="text-[10px] font-bold text-slate-400 uppercase">{cred.role}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        <p className="text-center text-xs text-blue-200/60 mt-6">
          © 2026 SOILEX Life Science (BR-HN) • The Essence of Authentic Spices
        </p>
      </div>
    </div>
  );
}
