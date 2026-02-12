import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // ✅ แก้ไขให้ใช้ import.meta.env สำหรับ Vite เพื่อหายจากหน้าขาว
  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

  // ✅ สร้างตัวแปรเช็คสถานะการเข้าสู่ระบบ เพื่อให้ ProtectedRoute ใน App.jsx ยอมให้ผ่าน
  const isAuthenticated = !!user;

  useEffect(() => {
    const checkLoggedIn = async () => {
      const token = localStorage.getItem('token');
      if (token) {
        try {
          axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
          const res = await axios.get(`${API_URL}/auth/me`);
          if (res.data.success) {
            setUser(res.data.data.user);
          }
        } catch (err) {
          localStorage.removeItem('token');
          delete axios.defaults.headers.common['Authorization'];
          setUser(null);
        }
      }
      setLoading(false);
    };
    checkLoggedIn();
  }, [API_URL]);

  // 1. ฟังก์ชัน Login
  const login = async (formData) => {
    try {
      // ✅ มั่นใจว่า formData ส่งค่าเป็น emailOrName
      const res = await axios.post(`${API_URL}/auth/login`, formData);
      if (res.data.success) {
        const { token, user } = res.data.data;
        localStorage.setItem('token', token);
        axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        setUser(user); // อัปเดตสถานะทันที
        return { success: true };
      }
    } catch (err) {
      return { 
        success: false, 
        message: err.response?.data?.message || 'Login failed' 
      };
    }
  };

  // 2. ฟังก์ชัน Register
  const register = async (formData) => {
    try {
      const res = await axios.post(`${API_URL}/auth/register`, formData);
      if (res.data.success) {
        const { token, user } = res.data.data;
        localStorage.setItem('token', token);
        axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        setUser(user);
        return { success: true };
      }
    } catch (err) {
      return { 
        success: false, 
        message: err.response?.data?.message || 'Registration failed' 
      };
    }
  };

  const logout = () => {
    localStorage.setItem('token', null);
    localStorage.removeItem('token');
    delete axios.defaults.headers.common['Authorization'];
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, isAuthenticated, login, register, logout, loading }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);