import React, { useState } from 'react';
import { Link, useLocation, useParams } from 'react-router-dom';
import {
  CheckSquare,
  GitBranch,
  BarChart3,
  DollarSign,
  MessageSquare,
  Target,
  Shield,
  ChevronLeft,
  ChevronRight,
  ShieldAlert,
  FolderKanban,
  Layout,
  Settings,
  Calendar
} from 'lucide-react';

const Sidebar = () => {
  const location = useLocation();
  const { projectId } = useParams(); 
  const [isCollapsed, setIsCollapsed] = useState(false);

  // 1. เมนูหลัก (แสดงตลอดเวลา - ตัด Global Overview ออกแล้ว)
  const coreItems = [
    { icon: FolderKanban, label: 'ALL PROJECTS', path: '/projects' },
    { icon: CheckSquare, label: 'MY TASKS', path: '/my-tasks' },
    { icon: Calendar, label: 'MY DAY', path: '/my-days' },
  ];

  // 2. เมนูเฉพาะโปรเจกต์ (แสดงเมื่อเลือกโปรเจกต์แล้วเท่านั้น)
  const projectSpecificItems = projectId ? [
    { icon: Layout, label: 'PROJECT OVERVIEW', path: `/dashboard/${projectId}` },
    { icon: CheckSquare, label: 'TASKS KANBAN', path: `/projects/${projectId}/tasks` },
    { icon: GitBranch, label: 'PROJECT FLOW', path: `/dashboard/${projectId}/flow` },
    { icon: DollarSign, label: 'FINANCIAL HUB', path: `/dashboard/${projectId}/finance` },
    { icon: ShieldAlert, label: 'RISK SENTINEL', path: `/dashboard/${projectId}/risk-sentinel` },
    { icon: Target, label: 'DECISION HUB', path: `/dashboard/${projectId}/decisions` },
    { icon: MessageSquare, label: 'PROJECT CHAT', path: `/dashboard/${projectId}/chat` },
    { icon: BarChart3, label: 'RETRO BOARD', path: `/dashboard/${projectId}/retro` },
  ] : [];

  // 3. เมนูจัดการระบบ
  const systemItems = [
    { icon: Shield, label: 'ADMIN PANEL', path: '/admin' },
    { icon: Settings, label: 'SETTINGS', path: '/settings' },
  ];

  const isPathActive = (path) => {
    return location.pathname === path || (path !== '/' && location.pathname.startsWith(path));
  };

  const renderMenuItem = (item, index) => {
    const Icon = item.icon;
    const active = isPathActive(item.path);

    return (
      <Link
        key={index}
        to={item.path}
        className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group ${
          active
            ? 'bg-primary text-white shadow-lg shadow-primary/20'
            : 'hover:bg-white/5 text-gray-400 hover:text-white'
        } ${isCollapsed ? 'justify-center' : ''}`}
        title={isCollapsed ? item.label : ''}
      >
        <Icon className={`w-5 h-5 flex-shrink-0 ${active ? 'text-white' : 'group-hover:text-primary'}`} />
        {!isCollapsed && (
          <span className="text-sm font-bold tracking-wide uppercase">{item.label}</span>
        )}
      </Link>
    );
  };

  return (
    <>
      <div
        className={`bg-[#0f1115] min-h-screen text-white p-4 flex flex-col transition-all duration-300 fixed left-0 top-0 bottom-0 z-40 border-r border-white/5 ${
          isCollapsed ? 'w-20' : 'w-64'
        }`}
      >
        {/* LOGO SECTION */}
        <div className={`flex items-center gap-3 mb-10 px-2 ${isCollapsed ? 'justify-center' : ''}`}>
          <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg shadow-primary/30">
            <span className="text-white font-black text-xl">P</span>
          </div>
          {!isCollapsed && (
            <div className="overflow-hidden">
              <h1 className="font-black text-lg italic leading-none tracking-tighter text-white uppercase">THE PULSE</h1>
              <p className="text-[10px] text-primary font-bold tracking-[0.2em] mt-1">CORE ENGINE</p>
            </div>
          )}
        </div>

        {/* MENU CONTENT */}
        <div className="flex-1 space-y-8 overflow-y-auto scrollbar-hide px-2">
          
          {/* CORE SYSTEM MENU */}
          <nav className="space-y-1">
            {!isCollapsed && (
              <p className="text-[10px] font-black text-gray-600 mb-3 px-4 tracking-[0.2em] uppercase">Navigator</p>
            )}
            {coreItems.map(renderMenuItem)}
          </nav>

          {/* ACTIVE PROJECT MENU - แสดงเมื่อเข้าโปรเจกต์ใดโปรเจกต์หนึ่ง */}
          {projectId && (
            <nav className="space-y-1 pt-4 border-t border-white/5 animate-in fade-in slide-in-from-left-4 duration-500">
              {!isCollapsed && (
                <div className="mb-4 px-4">
                  <p className="text-[10px] font-black text-primary tracking-[0.2em] uppercase mb-1">Active Project</p>
                  <p className="text-[11px] text-gray-500 font-bold truncate italic">ID: #{projectId}</p>
                </div>
              )}
              {projectSpecificItems.map(renderMenuItem)}
            </nav>
          )}

          {/* SETTINGS & ADMIN */}
          <nav className="space-y-1 pt-4 border-t border-white/5">
            {!isCollapsed && (
              <p className="text-[10px] font-black text-gray-600 mb-3 px-4 tracking-[0.2em] uppercase">Management</p>
            )}
            {systemItems.map(renderMenuItem)}
          </nav>
        </div>

        {/* COLLAPSE BUTTON */}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="mt-4 p-3 bg-white/5 hover:bg-primary/10 hover:text-primary rounded-xl transition-all flex items-center justify-center text-gray-500"
        >
          {isCollapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
        </button>
      </div>

      <div className={`transition-all duration-300 ${isCollapsed ? 'w-20' : 'w-64'}`} />

      <style>{`
        .scrollbar-hide::-webkit-scrollbar { display: none; }
        .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </>
  );
};

export default Sidebar;