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

import { AuthProvider, useAuth } from './context/AuthContext';

const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-14 h-14 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-gray-600">Checking session...</p>
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
  if (isAuthenticated) return <Navigate to="/dashboard" replace />;

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
            background: '#1E293B',
            color: '#fff',
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
        {/* Public */}
        <Route
          path="/login"
          element={
            <PublicOnlyRoute>
              <Login />
            </PublicOnlyRoute>
          }
        />
        <Route
          path="/register"
          element={
            <PublicOnlyRoute>
              <Register />
            </PublicOnlyRoute>
          }
        />

        {/* Protected */}
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

        {/* ✅ Project Tasks */}
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

        {/* ✅ Dashboard (Entry Point: จะ Auto-redirect ไปหา Project แรก) */}
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

        {/* ✅ Dashboard Specific Project (แสดงผลจริง) - ต้องเพิ่มอันนี้ครับ! */}
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
          path="/my-tasks"
          element={
            <ProtectedRoute>
              <Layout onSearch={handleSearch}>
                <MyTasks searchQuery={searchQuery} />
              </Layout>
            </ProtectedRoute>
          }
        />

        {/* --- Placeholders --- */}
        <Route
          path="/my-days"
          element={
            <ProtectedRoute>
              <Layout onSearch={handleSearch}>
                <div className="text-center py-20">
                  <h1 className="text-4xl font-bold text-gray-800">My Day</h1>
                  <p className="text-gray-600 mt-4">Coming soon...</p>
                </div>
              </Layout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/project-flow"
          element={
            <ProtectedRoute>
              <Layout onSearch={handleSearch}>
                <div className="text-center py-20">
                  <h1 className="text-4xl font-bold text-gray-800">Project Flow</h1>
                  <p className="text-gray-600 mt-4">Coming soon...</p>
                </div>
              </Layout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/retro-board"
          element={
            <ProtectedRoute>
              <Layout onSearch={handleSearch}>
                <div className="text-center py-20">
                  <h1 className="text-4xl font-bold text-gray-800">Retro Board</h1>
                  <p className="text-gray-600 mt-4">Coming soon...</p>
                </div>
              </Layout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/financial-hub"
          element={
            <ProtectedRoute>
              <Layout onSearch={handleSearch}>
                <div className="text-center py-20">
                  <h1 className="text-4xl font-bold text-gray-800">Financial Hub</h1>
                  <p className="text-gray-600 mt-4">Coming soon...</p>
                </div>
              </Layout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/payroll"
          element={
            <ProtectedRoute>
              <Layout onSearch={handleSearch}>
                <div className="text-center py-20">
                  <h1 className="text-4xl font-bold text-gray-800">Payroll</h1>
                  <p className="text-gray-600 mt-4">Coming soon...</p>
                </div>
              </Layout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/project-chat"
          element={
            <ProtectedRoute>
              <Layout onSearch={handleSearch}>
                <div className="text-center py-20">
                  <h1 className="text-4xl font-bold text-gray-800">Project Chat</h1>
                  <p className="text-gray-600 mt-4">Coming soon...</p>
                </div>
              </Layout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/decision-hub"
          element={
            <ProtectedRoute>
              <Layout onSearch={handleSearch}>
                <div className="text-center py-20">
                  <h1 className="text-4xl font-bold text-gray-800">Decision Hub</h1>
                  <p className="text-gray-600 mt-4">Coming soon...</p>
                </div>
              </Layout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/risk-sentinel"
          element={
            <ProtectedRoute>
              <Layout onSearch={handleSearch}>
                <div className="text-center py-20">
                  <h1 className="text-4xl font-bold text-gray-800">Risk Sentinel</h1>
                  <p className="text-gray-600 mt-4">Coming soon...</p>
                </div>
              </Layout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/skill-matrix"
          element={
            <ProtectedRoute>
              <Layout onSearch={handleSearch}>
                <div className="text-center py-20">
                  <h1 className="text-4xl font-bold text-gray-800">Skill Matrix</h1>
                  <p className="text-gray-600 mt-4">Coming soon...</p>
                </div>
              </Layout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/culture-feedback"
          element={
            <ProtectedRoute>
              <Layout onSearch={handleSearch}>
                <div className="text-center py-20">
                  <h1 className="text-4xl font-bold text-gray-800">Culture Feedback</h1>
                  <p className="text-gray-600 mt-4">Coming soon...</p>
                </div>
              </Layout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/architecture"
          element={
            <ProtectedRoute>
              <Layout onSearch={handleSearch}>
                <div className="text-center py-20">
                  <h1 className="text-4xl font-bold text-gray-800">Architecture</h1>
                  <p className="text-gray-600 mt-4">Coming soon...</p>
                </div>
              </Layout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin"
          element={
            <ProtectedRoute>
              <Layout onSearch={handleSearch}>
                <div className="text-center py-20">
                  <h1 className="text-4xl font-bold text-gray-800">Admin</h1>
                  <p className="text-gray-600 mt-4">Coming soon...</p>
                </div>
              </Layout>
            </ProtectedRoute>
          }
        />

        {/* Default */}
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
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