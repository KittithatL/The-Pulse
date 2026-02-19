import React, { useState, useEffect } from 'react';
import { Link, useLocation, useParams } from 'react-router-dom';
import {
  LayoutDashboard,
  Calendar,
  CheckSquare,
  GitBranch,
  BarChart3,
  DollarSign,
  Users,
  MessageSquare,
  Target,
  Shield,
  BookOpen,
  Heart,
  Box,
  ChevronLeft,
  ChevronRight,
  ShieldAlert
} from 'lucide-react';

const Sidebar = () => {
  const location = useLocation();
  const { projectId } = useParams();
  const [isCollapsed, setIsCollapsed] = useState(false);

  // ✅ ฟีเจอร์ใหม่: จำ Project ล่าสุดที่เข้าใช้งานไว้ใน LocalStorage
  useEffect(() => {
    if (projectId) {
      localStorage.setItem('lastVisitedProjectId', projectId);
    }
  }, [projectId]);

  // ดึง Project ล่าสุดออกมาใช้ (ถ้ามี)
  const savedProjectId = localStorage.getItem('lastVisitedProjectId');
  const activeProjectId = projectId || savedProjectId;

  // ✅ ถ้ามี Project ID ให้วิ่งไปหน้านั้นเลย ถ้าไม่เคยเข้าเลยค่อยให้ไปหน้า Projects
  const riskSentinelPath = activeProjectId ? `/dashboard/${activeProjectId}/risk-sentinel` : '/projects';

  const menuItems = [
    { icon: LayoutDashboard, label: 'DASHBOARD', path: '/dashboard' },
    { icon: LayoutDashboard, label: 'PROJECTS', path: '/projects' },
    { icon: CheckSquare, label: 'MY TASKS', path: '/my-tasks' },
    { icon: Calendar, label: 'MY DAY', path: '/my-days' },
    { icon: GitBranch, label: 'PROJECT FLOW', path: '/project-flow' },
    { icon: BarChart3, label: 'RETRO BOARD', path: '/retro-board' },
    { icon: DollarSign, label: 'FINANCIAL HUB', path: '/financial-hub' },
    { icon: Users, label: 'PAYROLL', path: '/payroll' },
    { icon: MessageSquare, label: 'PROJECT CHAT', path: '/project-chat' },
    { icon: Target, label: 'DECISION HUB', path: '/decision-hub' },
    { icon: ShieldAlert, label: 'RISK SENTINEL', path: riskSentinelPath }, // ใช้ Path แบบฉลาด
    { icon: BookOpen, label: 'SKILL MATRIX', path: '/skill-matrix' },
    { icon: Heart, label: 'CULTURE FEEDBACK', path: '/culture-feedback' },
    { icon: Box, label: 'ARCHITECTURE', path: '/architecture' },
    { icon: Shield, label: 'ADMIN', path: '/admin' },
  ];

  // ✅ แก้บัคปุ่มแดงซ้อนกัน โดยเช็คจาก "ชื่อเมนู" แทน
  const isPathActive = (item) => {
    if (item.label === 'PROJECTS') {
      return location.pathname === '/projects' || location.pathname.startsWith('/projects/');
    }
    if (item.label === 'RISK SENTINEL') {
      return location.pathname.includes('/risk-sentinel');
    }
    if (item.label === 'DASHBOARD') {
      return location.pathname.startsWith('/dashboard') && !location.pathname.includes('/risk-sentinel');
    }
    return location.pathname === item.path;
  };

  return (
    <>
      {/* Sidebar */}
      <div
        className={`bg-dark min-h-screen text-white p-6 flex flex-col transition-all duration-300 fixed left-0 top-0 bottom-0 z-40 ${
          isCollapsed ? 'w-20' : 'w-64'
        }`}
      >
        {/* Logo */}
        <div className={`flex items-center gap-3 mb-8 ${isCollapsed ? 'justify-center' : ''}`}>
          <div className="w-12 h-12 bg-primary rounded-lg flex items-center justify-center flex-shrink-0">
            <span className="text-white font-bold text-xl">P</span>
          </div>
          {!isCollapsed && (
            <div>
              <h1 className="font-bold text-xl italic">The Pulse</h1>
              <p className="text-xs text-gray-400">PROJECT ENGINE</p>
            </div>
          )}
        </div>

        {/* Menu Items */}
        <nav className="flex-1 space-y-2 overflow-y-auto scrollbar-hide">
          {menuItems.map((item, index) => {
            const Icon = item.icon;
            const active = isPathActive(item); // ส่งอ็อบเจกต์ไปเช็คแทน

            return (
              <Link
                key={index}
                to={item.path}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                  active
                    ? 'bg-primary text-white'
                    : 'hover:bg-dark-light text-gray-300'
                } ${isCollapsed ? 'justify-center' : ''}`}
                title={isCollapsed ? item.label : ''}
              >
                <Icon className="w-5 h-5 flex-shrink-0" />
                {!isCollapsed && (
                  <span className="text-sm font-medium">{item.label}</span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Toggle Button */}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="mt-4 p-2 bg-dark-light hover:bg-dark-lighter rounded-lg transition-colors flex items-center justify-center"
          type="button"
        >
          {isCollapsed ? (
            <ChevronRight className="w-5 h-5" />
          ) : (
            <ChevronLeft className="w-5 h-5" />
          )}
        </button>
      </div>

      {/* Spacer */}
      <div className={`transition-all duration-300 ${isCollapsed ? 'w-20' : 'w-64'}`} />

      {/* Hide scrollbar */}
      <style>{`
        .scrollbar-hide::-webkit-scrollbar { display: none; }
        .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </>
  );
};

export default Sidebar;