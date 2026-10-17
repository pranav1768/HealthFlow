import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../services/api';
import { useQueryClient } from '@tanstack/react-query';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const stored = localStorage.getItem('healthflow_user');
    return stored ? JSON.parse(stored) : null;
  });
  const queryClient = useQueryClient();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('healthflow_token');
    if (!token) {
      setIsLoading(false);
      return;
    }

    api
      .get('/auth/me')
      .then((res) => {
        setUser(res.data.user);
        localStorage.setItem('healthflow_user', JSON.stringify(res.data.user));
      })
      .catch(() => {
        localStorage.removeItem('healthflow_token');
        localStorage.removeItem('healthflow_user');
        setUser(null);
      })
      .finally(() => setIsLoading(false));
  }, []);

  const login = useCallback(async (email, password) => {
    const res = await api.post('/auth/login', { email, password });
    localStorage.setItem('healthflow_token', res.data.token);
    localStorage.setItem('healthflow_user', JSON.stringify(res.data.user));
    setUser(res.data.user);
    return res.data.user;
  }, []);

  const register = useCallback(async (payload) => {
    const res = await api.post('/auth/register', payload);
    localStorage.setItem('healthflow_token', res.data.token);
    localStorage.setItem('healthflow_user', JSON.stringify(res.data.user));
    setUser(res.data.user);
    return res.data.user;
  }, []);

  const logout = useCallback(async () => {
    try {
      await api.post('/auth/logout');
    } finally {
      localStorage.removeItem('healthflow_token');
      localStorage.removeItem('healthflow_user');
      queryClient.clear();
      setUser(null);
    }
  }, [queryClient]);

  const value = {
    user,
    isAuthenticated: !!user,
    isLoading,
    role: user?.role || null,
    login,
    register,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
}
