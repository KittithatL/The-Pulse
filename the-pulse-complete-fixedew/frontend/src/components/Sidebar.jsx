import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
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
} from 'lucide-react';

const Sidebar = () => {
  const location = useLocation();
  const [isCollapsed, setIsCollapsed] = useState(false);

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
    { icon: Shield, label: 'RISK SENTINEL', path: '/risk-sentinel' },
    { icon: BookOpen, label: 'SKILL MATRIX', path: '/skill-matrix' },
    { icon: Heart, label: 'CULTURE FEEDBACK', path: '/culture-feedback' },
    { icon: Box, label: 'ARCHITECTURE', path: '/architecture' },
    { icon: Shield, label: 'ADMIN', path: '/admin' },
  ];

  const isPathActive = (itemPath) => {
    if (itemPath === '/projects') {
      return location.pathname === '/projects' || location.pathname.startsWith('/projects/');
    }
    return location.pathname === itemPath;
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
            const active = isPathActive(item.path);

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
