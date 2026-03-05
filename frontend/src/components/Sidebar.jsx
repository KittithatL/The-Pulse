import React, { useState, useEffect } from 'react';
import { Link, useLocation, useParams } from 'react-router-dom';
import {
  CheckSquare,
  DollarSign,
  Target,
  Shield,
  ChevronLeft,
  ChevronRight,
  ShieldAlert,
  FolderKanban,
  Layout,
  Calendar,
  Settings,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { rolesAPI } from '../services/api';

const Sidebar = () => {
  const location = useLocation();
  const { projectId } = useParams();
  const { user } = useAuth();
  const [isCollapsed, setIsCollapsed] = useState(false);

  // ── Project-level permissions ──────────────────────────────────────────────
  const [perms, setPerms] = useState({
    isOwner: false,
    can_view_tasks: true,
    can_view_finance: false,
    can_view_risk: false,
    can_view_decisions: false,
  });

  useEffect(() => {
    if (!projectId || !user) return;

    rolesAPI.getMyPermissions(projectId)
      .then(res => {
        const data = res?.data?.data ?? {};
        setPerms({
          isOwner:           !!data.is_owner,
          can_view_tasks:    data.is_owner || !!data.can_view_tasks,
          can_view_finance:  data.is_owner || !!data.can_view_finance,
          can_view_risk:     data.is_owner || !!data.can_view_risk,
          can_view_decisions:data.is_owner || !!data.can_view_decisions,
        });
      })
      .catch(() => {
        // ถ้า fetch ไม่ได้ (เช่นยังไม่มี API) ให้ fallback เป็น owner เห็นทุกอย่าง
        setPerms({
          isOwner: true,
          can_view_tasks: true,
          can_view_finance: true,
          can_view_risk: true,
          can_view_decisions: true,
        });
      });
  }, [projectId, user]);

  // ── Menu definitions ───────────────────────────────────────────────────────

  // 1. Core Navigator
  const coreItems = [
    { icon: FolderKanban, label: 'ALL PROJECTS', path: '/projects' },
    { icon: CheckSquare,  label: 'MY TASKS',     path: '/my-tasks' },
    { icon: Calendar,     label: 'MY DAY',        path: '/my-days' },
  ];

  // 2. Project-specific (ซ่อนตาม permissions)
  const projectSpecificItems = projectId ? [
    {
      icon: Layout,
      label: 'PROJECT OVERVIEW',
      path: `/dashboard/${projectId}`,
      show: true,
    },
    {
      icon: CheckSquare,
      label: 'TASKS KANBAN',
      path: `/projects/${projectId}/tasks`,
      show: perms.can_view_tasks,
    },
    {
      icon: DollarSign,
      label: 'FINANCIAL HUB',
      path: `/dashboard/${projectId}/finance`,
      show: perms.can_view_finance,
    },
    {
      icon: ShieldAlert,
      label: 'RISK SENTINEL',
      path: `/dashboard/${projectId}/risk-sentinel`,
      show: perms.can_view_risk,
    },
    {
      icon: Target,
      label: 'DECISION HUB',
      path: `/dashboard/${projectId}/decisions`,
      show: perms.can_view_decisions,
    },
    // Settings — เฉพาะ owner เท่านั้น
    {
      icon: Settings,
      label: 'SETTINGS',
      path: `/projects/${projectId}/settings`,
      show: perms.isOwner,
    },
  ].filter(item => item.show) : [];

  // 3. Admin (system-level)
  const isSystemAdmin = user?.role === 'admin';
  const adminItems = isSystemAdmin ? [
    { icon: Shield, label: 'ADMIN PANEL', path: '/admin' },
  ] : [];

  // ── Active path check ──────────────────────────────────────────────────────
  const isPathActive = (itemPath) => {
    const currentPath = location.pathname;
    if (currentPath === itemPath) return true;
    if (itemPath === '/projects') return currentPath === '/projects';
    if (
      itemPath.includes('/dashboard/') &&
      !itemPath.includes('risk-sentinel') &&
      !itemPath.includes('finance') &&
      !itemPath.includes('decisions')
    ) {
      return currentPath === itemPath || currentPath === `${itemPath}/overview`;
    }
    return currentPath.startsWith(itemPath);
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

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <>
      <div
        className={`bg-[#0f1115] min-h-screen text-white p-4 flex flex-col transition-all duration-300 fixed left-0 top-0 bottom-0 z-40 border-r border-white/5 ${
          isCollapsed ? 'w-20' : 'w-64'
        }`}
      >
        {/* LOGO */}
        <div className={`flex items-center gap-3 mb-10 px-2 ${isCollapsed ? 'justify-center' : ''}`}>
          <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg shadow-primary/30 text-white font-black text-xl">
            P
          </div>
          {!isCollapsed && (
            <div className="overflow-hidden">
              <h1 className="font-black text-lg italic leading-none tracking-tighter text-white uppercase">THE PULSE</h1>
              <p className="text-[10px] text-primary font-bold tracking-[0.2em] mt-1">CORE ENGINE</p>
            </div>
          )}
        </div>

        {/* MENU */}
        <div className="flex-1 space-y-8 overflow-y-auto scrollbar-hide px-2">

          {/* Core Navigator */}
          <nav className="space-y-1">
            {!isCollapsed && (
              <p className="text-[10px] font-black text-gray-600 mb-3 px-4 tracking-[0.2em] uppercase">Navigator</p>
            )}
            {coreItems.map(renderMenuItem)}
          </nav>

          {/* Active Project */}
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

          {/* Admin */}
          {adminItems.length > 0 && (
            <nav className="space-y-1 pt-4 border-t border-white/5">
              {adminItems.map(renderMenuItem)}
            </nav>
          )}
        </div>

        {/* Collapse button */}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="mt-4 p-3 bg-white/5 hover:bg-primary/10 hover:text-primary rounded-xl transition-all flex items-center justify-center text-gray-500"
        >
          {isCollapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
        </button>
      </div>

      {/* Spacer */}
      <div className={`transition-all duration-300 ${isCollapsed ? 'w-20' : 'w-64'}`} />

      <style>{`
        .scrollbar-hide::-webkit-scrollbar { display: none; }
        .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </>
  );
};

export default Sidebar;