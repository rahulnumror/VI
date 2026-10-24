import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';

const AuthContext = createContext(null);

// Demo credentials for offline / UT use (when backend is not running)
const DEMO_USERS = {
  'admin@soilexlifescience.com': {
    password: 'admin123',
    profile: { id: 'USR-001', name: 'System Admin', email: 'admin@soilexlifescience.com', role: 'ADMIN', department: 'Administration', status: 'ACTIVE' }
  },
  'priya.n@soilexlifescience.com': {
    password: 'hr123',
    profile: { id: 'USR-004', name: 'Priya Nair', email: 'priya.n@soilexlifescience.com', role: 'HR_MANAGER', department: 'Human Resources', employee_id: 'EMP-004', status: 'ACTIVE' }
  },
  'hoan.vu@soilexlifescience.com': {
    password: 'emp123',
    altPassword: 'trade123',
    profile: { id: 'USR-002', name: 'Vũ Thị Hoan', email: 'hoan.vu@soilexlifescience.com', role: 'EMPLOYEE', department: 'Sales & Export', employee_id: 'EMP-001', status: 'ACTIVE' }
  },
  'rajesh.s@soilexlifescience.com': {
    password: 'qa123',
    profile: { id: 'USR-003', name: 'Rajesh Sharma', email: 'rajesh.s@soilexlifescience.com', role: 'QUALITY_MANAGER', department: 'Quality Assurance', employee_id: 'EMP-002', status: 'ACTIVE' }
  },
  'hung.nguyen@soilexlifescience.com': {
    password: 'emp123',
    profile: { id: 'USR-005', name: 'Nguyễn Văn Hùng', email: 'hung.nguyen@soilexlifescience.com', role: 'EMPLOYEE', department: 'Operations & Supply', employee_id: 'EMP-003', status: 'ACTIVE' }
  },
  'bao.tran@soilexlifescience.com': {
    password: 'emp123',
    profile: { id: 'USR-006', name: 'Trần Quốc Bảo', email: 'bao.tran@soilexlifescience.com', role: 'EMPLOYEE', department: 'Finance & Accounts', employee_id: 'EMP-005', status: 'ACTIVE' }
  },
};

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(() => localStorage.getItem('soilex_token'));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (token) {
      api.setToken(token);

      // Try live backend first
      api.getProfile().then(profile => {
        if (profile) {
          setUser(profile);
        } else {
          // If backend is offline, try restoring user from localStorage
          const savedUser = localStorage.getItem('soilex_user');
          if (savedUser) {
            try {
              setUser(JSON.parse(savedUser));
            } catch {
              logout();
            }
          } else {
            logout();
          }
        }
        setLoading(false);
      });
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (email, password) => {
    // Try live backend first
    const result = await api.login(email, password);
    if (result && result.accessToken) {
      const newToken = result.accessToken;
      localStorage.setItem('soilex_token', newToken);
      localStorage.setItem('soilex_user', JSON.stringify(result.user));
      api.setToken(newToken);
      setToken(newToken);
      setUser(result.user);
      return { success: true };
    }

    // Fallback: offline / demo credential check
    const demo = DEMO_USERS[email.toLowerCase()];
    if (demo && (demo.password === password || demo.altPassword === password)) {
      const demoToken = 'DEMO_TOKEN_OFFLINE_' + Date.now();
      localStorage.setItem('soilex_token', demoToken);
      localStorage.setItem('soilex_user', JSON.stringify(demo.profile));
      api.setToken(demoToken);
      setToken(demoToken);
      setUser(demo.profile);
      return { success: true };
    }

    return { success: false, message: 'Invalid email or password. Check credentials or start the backend server.' };
  };

  const logout = () => {
    localStorage.removeItem('soilex_token');
    localStorage.removeItem('soilex_user');
    api.setToken(null);
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, logout, isAuthenticated: !!user }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}

export default AuthContext;
