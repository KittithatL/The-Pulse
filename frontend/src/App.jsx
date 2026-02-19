import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';

import Layout from './components/Layout';
import Projects from './pages/Projects';
import Login from './pages/Login';
import Register from './pages/Register';
import ProjectTasks from './pages/ProjectTask';
import MyTasks from './pages/Mytasks';
import Dashboard from './pages/Dashboard';
import RiskSentinel from './pages/RiskSentinel'; 
import MyDays from './pages/MyDays'; 
import FinancialHub from './pages/FinancialHub';

import { AuthProvider, useAuth } from './context/AuthContext';

const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0a0c0f]">
        <div className="text-center">
          <div className="w-14 h-14 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-gray-400 font-bold uppercase tracking-widest">Initialising Uplink...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

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

  const handleSearch = (query) => {
    setSearchQuery(query);
  };

  return (
    <BrowserRouter 
      future={{ 
        v7_startTransition: true, 
        v7_relativeSplatPath: true 
      }}
    >
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 3000,
          style: {
            background: '#1a1d20',
            color: '#fff',
            border: '1px solid rgba(255,255,255,0.05)'
          },
          success: {
            iconTheme: {
              primary: '#EF4444',
              secondary: '#fff',
            },
          },
        }}
      />

      <Routes>
        <Route path="/login" element={<PublicOnlyRoute><Login /></PublicOnlyRoute>} />
        <Route path="/register" element={<PublicOnlyRoute><Register /></PublicOnlyRoute>} />

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
          path="/dashboard/:projectId"
          element={
            <ProtectedRoute>
              <Layout onSearch={handleSearch}>
                <Dashboard />
              </Layout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/dashboard/:projectId/risk-sentinel"
          element={
            <ProtectedRoute>
              <Layout onSearch={handleSearch}>
                <RiskSentinel />
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

        <Route
          path="/my-days"
          element={
            <ProtectedRoute>
              <Layout onSearch={handleSearch}>
                <MyDays />
              </Layout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/dashboard/:projectId/finance"
          element={
            <ProtectedRoute>
              <Layout onSearch={handleSearch}>
                <FinancialHub />
              </Layout>
            </ProtectedRoute>
          }
        />

        <Route path="/admin" element={<ProtectedRoute><Layout><div className="text-center py-20 text-gray-500">Admin Panel Under Construction</div></Layout></ProtectedRoute>} />
        
        <Route path="/" element={<Navigate to="/my-days" replace />} />
        <Route path="/dashboard" element={<Navigate to="/projects" replace />} />
        <Route path="*" element={<Navigate to="/my-days" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  );
}

export default App;