import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import Layout from './components/Layout';
import Projects from './pages/Projects';

function App() {
  const [searchQuery, setSearchQuery] = useState('');

  const handleSearch = (query) => {
    setSearchQuery(query);
  };

  return (
    <BrowserRouter>
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
        <Route
          path="/projects"
          element={
            <Layout onSearch={handleSearch}>
              <Projects searchQuery={searchQuery} />
            </Layout>
          }
        />
        
        <Route
          path="/dashboard"
          element={
            <Layout onSearch={handleSearch}>
              <div className="text-center py-20">
                <h1 className="text-4xl font-bold text-gray-800">Dashboard</h1>
                <p className="text-gray-600 mt-4">Coming soon...</p>
              </div>
            </Layout>
          }
        />
        
        <Route
          path="/my-day"
          element={
            <Layout onSearch={handleSearch}>
              <div className="text-center py-20">
                <h1 className="text-4xl font-bold text-gray-800">My Day</h1>
                <p className="text-gray-600 mt-4">Coming soon...</p>
              </div>
            </Layout>
          }
        />
        
        <Route
          path="/tasks"
          element={
            <Layout onSearch={handleSearch}>
              <div className="text-center py-20">
                <h1 className="text-4xl font-bold text-gray-800">Tasks</h1>
                <p className="text-gray-600 mt-4">Coming soon...</p>
              </div>
            </Layout>
          }
        />
        
        <Route
          path="/project-flow"
          element={
            <Layout onSearch={handleSearch}>
              <div className="text-center py-20">
                <h1 className="text-4xl font-bold text-gray-800">Project Flow</h1>
                <p className="text-gray-600 mt-4">Coming soon...</p>
              </div>
            </Layout>
          }
        />
        
        <Route
          path="/retro-board"
          element={
            <Layout onSearch={handleSearch}>
              <div className="text-center py-20">
                <h1 className="text-4xl font-bold text-gray-800">Retro Board</h1>
                <p className="text-gray-600 mt-4">Coming soon...</p>
              </div>
            </Layout>
          }
        />
        
        <Route
          path="/financial-hub"
          element={
            <Layout onSearch={handleSearch}>
              <div className="text-center py-20">
                <h1 className="text-4xl font-bold text-gray-800">Financial Hub</h1>
                <p className="text-gray-600 mt-4">Coming soon...</p>
              </div>
            </Layout>
          }
        />
        
        <Route
          path="/payroll"
          element={
            <Layout onSearch={handleSearch}>
              <div className="text-center py-20">
                <h1 className="text-4xl font-bold text-gray-800">Payroll</h1>
                <p className="text-gray-600 mt-4">Coming soon...</p>
              </div>
            </Layout>
          }
        />
        
        <Route
          path="/project-chat"
          element={
            <Layout onSearch={handleSearch}>
              <div className="text-center py-20">
                <h1 className="text-4xl font-bold text-gray-800">Project Chat</h1>
                <p className="text-gray-600 mt-4">Coming soon...</p>
              </div>
            </Layout>
          }
        />
        
        <Route
          path="/decision-hub"
          element={
            <Layout onSearch={handleSearch}>
              <div className="text-center py-20">
                <h1 className="text-4xl font-bold text-gray-800">Decision Hub</h1>
                <p className="text-gray-600 mt-4">Coming soon...</p>
              </div>
            </Layout>
          }
        />
        
        <Route
          path="/risk-sentinel"
          element={
            <Layout onSearch={handleSearch}>
              <div className="text-center py-20">
                <h1 className="text-4xl font-bold text-gray-800">Risk Sentinel</h1>
                <p className="text-gray-600 mt-4">Coming soon...</p>
              </div>
            </Layout>
          }
        />
        
        <Route
          path="/skill-matrix"
          element={
            <Layout onSearch={handleSearch}>
              <div className="text-center py-20">
                <h1 className="text-4xl font-bold text-gray-800">Skill Matrix</h1>
                <p className="text-gray-600 mt-4">Coming soon...</p>
              </div>
            </Layout>
          }
        />
        
        <Route
          path="/culture-feedback"
          element={
            <Layout onSearch={handleSearch}>
              <div className="text-center py-20">
                <h1 className="text-4xl font-bold text-gray-800">Culture Feedback</h1>
                <p className="text-gray-600 mt-4">Coming soon...</p>
              </div>
            </Layout>
          }
        />
        
        <Route
          path="/architecture"
          element={
            <Layout onSearch={handleSearch}>
              <div className="text-center py-20">
                <h1 className="text-4xl font-bold text-gray-800">Architecture</h1>
                <p className="text-gray-600 mt-4">Coming soon...</p>
              </div>
            </Layout>
          }
        />
        
        <Route
          path="/admin"
          element={
            <Layout onSearch={handleSearch}>
              <div className="text-center py-20">
                <h1 className="text-4xl font-bold text-gray-800">Admin</h1>
                <p className="text-gray-600 mt-4">Coming soon...</p>
              </div>
            </Layout>
          }
        />
        
        <Route path="/" element={<Navigate to="/projects" replace />} />
        <Route path="*" element={<Navigate to="/projects" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
