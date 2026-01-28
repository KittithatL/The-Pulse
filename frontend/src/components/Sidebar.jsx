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
    { icon: LayoutDashboard, label: 'PROJECTS', path: '/projects', active: true },
    { icon: LayoutDashboard, label: 'DASHBOARD', path: '/dashboard' },
    { icon: Calendar, label: 'MY DAY', path: '/my-day' },
    { icon: CheckSquare, label: 'TASKS', path: '/tasks' },
    { icon: GitBranch, label: 'PROJECT FLOW', path: '/project-flow' },
    { icon: BarChart3, label: 'RETRO BOARD', path: '/retro-board' },
    { icon: DollarSign, label: 'FINANCIAL HUB', path: '/financial-hub' },
    { icon: Users, label: 'PAYROLL', path: '/payroll' },
    { icon: MessageSquare, label: 'PROJECT CHAT', path: '/project-chat' },
    { icon: Target, label: 'DECISION HUB', path: '/decision-hub' },
    { icon: Shield, label: 'RISK SENTINEL', path: '/risk-sentinel' },
    { icon: BookOpen, label: 'SKILL MATRIX', path: '/skill-matrix' },
    { icon: Heart, label: 'CULTURE FEEDBACK', path: '/culture-feedback' },
    { icon: Box, label: 'ARCHITECTURE', path: '/architecture', highlighted: true },
    { icon: Shield, label: 'ADMIN', path: '/admin' },
  ];

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

        {/* Active Project */}
        {!isCollapsed && (
          <div className="mb-6 p-3 bg-dark-light rounded-lg">
            <p className="text-xs text-gray-400 mb-1">ACTIVE PROJECT</p>
            <p className="text-sm font-semibold">Phoenix Project</p>
          </div>
        )}

        {/* Menu Items - ซ่อน scrollbar */}
        <nav className="flex-1 space-y-2 overflow-y-auto scrollbar-hide">
          {menuItems.map((item, index) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path || (item.active && location.pathname.startsWith('/projects'));
            
            return (
              <Link
                key={index}
                to={item.path}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                  isActive
                    ? 'bg-primary text-white'
                    : item.highlighted
                    ? 'bg-primary/10 text-primary border border-primary'
                    : 'hover:bg-dark-light text-gray-300'
                } ${isCollapsed ? 'justify-center' : ''}`}
                title={isCollapsed ? item.label : ''}
              >
                <Icon className="w-5 h-5 flex-shrink-0" />
                {!isCollapsed && (
                  <>
                    <span className="text-sm font-medium">{item.label}</span>
                    {item.highlighted && (
                      <span className="ml-auto text-xs bg-primary px-2 py-1 rounded">
                        CLICK HERE
                      </span>
                    )}
                  </>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Cycle Progress */}
        {!isCollapsed && (
          <div className="mt-6 p-4 bg-dark-light rounded-lg">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-semibold">CYCLE 42</span>
              <span className="text-sm text-primary font-bold">78%</span>
            </div>
            <div className="w-full bg-dark-lighter rounded-full h-2">
              <div className="bg-gradient-to-r from-primary to-red-600 h-2 rounded-full" style={{ width: '78%' }}></div>
            </div>
          </div>
        )}

        {/* Toggle Button */}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="mt-4 p-2 bg-dark-light hover:bg-dark-lighter rounded-lg transition-colors flex items-center justify-center"
        >
          {isCollapsed ? <ChevronRight className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />}
        </button>
      </div>

      {/* Spacer to prevent content overlap */}
      <div className={`transition-all duration-300 ${isCollapsed ? 'w-20' : 'w-64'}`}></div>

      {/* CSS สำหรับซ่อน scrollbar */}
      <style>{`
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </>
  );
};

export default Sidebar;
