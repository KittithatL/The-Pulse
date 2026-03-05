import React, { createContext, useState, useContext, useEffect } from 'react';
import { authAPI } from '../services/api';
import toast from 'react-hot-toast';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuth();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const clearAuth = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
  };

  const checkAuth = async () => {
  const token = localStorage.getItem('token');

  // ✅ ลบ setUser(cachedUser) ออก — ให้รอ API จริงแทน
  // เพราะ cachedUser อาจไม่มี role หรือข้อมูลเก่า

  if (!token) {
    setLoading(false);
    return;
  }

  try {
    const response = await authAPI.getCurrentUser();
    const currentUser = response?.data?.data?.user ?? null;

    if (!currentUser) {
      clearAuth();
    } else {
      setUser(currentUser);
      localStorage.setItem('user', JSON.stringify(currentUser));
    }
  } catch (error) {
    clearAuth();
  } finally {
    setLoading(false); // ✅ loading = false หลัง API ตอบกลับเท่านั้น
  }
};

  const register = async (data) => {
    try {
      const response = await authAPI.register(data);
      const { user: newUser, token } = response.data.data;

      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(newUser));
      setUser(newUser);

      toast.success('Registration successful!');
      return { success: true };
    } catch (error) {
      const message = error.response?.data?.message || 'Registration failed';
      toast.error(message);
      return { success: false, message };
    }
  };

  const login = async (data) => {
    try {
      const response = await authAPI.login(data);
      const { token } = response.data.data;

      localStorage.setItem('token', token);

      // ✅ ดึง user พร้อม role จาก /auth/me แทนที่จะใช้จาก login response
      const meResponse = await authAPI.getCurrentUser();
      const currentUser = meResponse?.data?.data?.user ?? null;

      localStorage.setItem('user', JSON.stringify(currentUser));
      setUser(currentUser);

      toast.success('Login successful!');
      return { success: true };
    } catch (error) {
      const message = error.response?.data?.message || 'Login failed';
      toast.error(message);
      return { success: false, message };
    }
  };
  const logout = () => {
    clearAuth();
    toast.success('Logged out successfully');
  };

  const value = {
    user,
    loading,
    register,
    login,
    logout,
    isAuthenticated: !!user,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
