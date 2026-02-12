import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';

import Layout from './components/Layout';
import Projects from './pages/Projects';
import Login from './pages/Login';
import Register from './pages/Register';
import ProjectTasks from './pages/ProjectTask';
import MyTasks from './pages/Mytasks';
// 🚩 เพิ่มการ Import Dashboard ของจริงตรงนี้!
import Dashboard from './pages/Dashboard'; 

import { AuthProvider, useAuth } from './context/AuthContext';

const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-14 h-14 border-4 border-red-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-gray-600 font-bold uppercase tracking-widest text-xs">Checking session...</p>
        </div>
      </div>
    );
  }
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return children;
};

const PublicOnlyRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  if (loading) return null;
  if (isAuthenticated) return <Navigate to="/projects" replace />;
  return children;
};

function AppRoutes() {
  const [searchQuery, setSearchQuery] = useState('');
  const handleSearch = (query) => setSearchQuery(query);

  return (
    <BrowserRouter 
      future={{ 
        v7_startTransition: true, 
        v7_relativeSplatPath: true 
      }}
    >
      <Toaster position="top-right" />

      <Routes>
        {/* Public */}
        <Route path="/login" element={<PublicOnlyRoute><Login /></PublicOnlyRoute>} />
        <Route path="/register" element={<PublicOnlyRoute><Register /></PublicOnlyRoute>} />

        {/* ✅ Dashboard Routes (แก้จาก Coming soon เป็น Component จริง) */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Layout onSearch={handleSearch}>
                <Dashboard />
              </Layout>
            </ProtectedRoute>
          }
        />
        {/* เพิ่ม Route สำหรับเข้า Dashboard รายโปรเจกต์ (UUID Support) */}
        <Route
          path="/dashboard/:projectId"
          element={
            <ProtectedRoute>
              <Layout onSearch={handleSearch}>
                <Dashboard />
              </Layout>
            </ProtectedRoute>
          }
        />

        {/* Projects & Tasks */}
        <Route
          path="/projects"
          element={
            <ProtectedRoute>
              <Layout onSearch={handleSearch}>
                <Projects searchQuery={searchQuery} />
              </Layout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/projects/:projectId/tasks"
          element={
            <ProtectedRoute>
              <Layout onSearch={handleSearch}>
                <ProjectTasks />
              </Layout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/my-tasks"
          element={
            <ProtectedRoute>
              <Layout onSearch={handleSearch}>
                <MyTasks searchQuery={searchQuery} />
              </Layout>
            </ProtectedRoute>
          }
        />

        {/* ⚠️ ตัวที่เหลือมึงยังไม่ได้ทำ UI ก็ให้มันเป็น Coming soon ไปก่อนได้ครับ */}
        <Route path="/risk-sentinel" element={<ProtectedRoute><Layout onSearch={handleSearch}><ComingSoon title="Risk Sentinel" /></Layout></ProtectedRoute>} />
        <Route path="/project-flow" element={<ProtectedRoute><Layout onSearch={handleSearch}><ComingSoon title="Project Flow" /></Layout></ProtectedRoute>} />

        {/* Default */}
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

// Component เสริมสำหรับหน้าที่ยังไม่ได้ทำ
const ComingSoon = ({ title }) => (
  <div className="text-center py-40 bg-white rounded-[3rem] shadow-xl border border-slate-100 m-6">
    <h1 className="text-6xl font-black italic text-slate-900 uppercase tracking-tighter">{title}</h1>
    <p className="text-red-600 font-black mt-4 uppercase tracking-[0.3em] text-xs">Tactical Module: Coming Soon</p>
  </div>
);

function App() {
  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  );
}

export default App;