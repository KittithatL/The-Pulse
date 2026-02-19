import React, { useEffect, useMemo, useRef, useState } from 'react';
import { 
  Search, Globe, Bell, X, LogOut, Folder, 
  ArrowRight, ShieldAlert, CheckCircle2, Clock 
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { dashboardAPI } from '../services/api';
import toast from 'react-hot-toast';
import { io } from 'socket.io-client';

const socket = io(import.meta.env.VITE_API_URL || 'http://localhost:5000', {
  withCredentials: true,
  transports: ['websocket']
});

const Navbar = ({ onSearch, projects = [] }) => {
  const navigate = useNavigate();
  const { logout, user } = useAuth();

  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [openDropdown, setOpenDropdown] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [showNoti, setShowNoti] = useState(false);
  
  const notiRef = useRef(null);
  const wrapRef = useRef(null);
  const inputRef = useRef(null);

  const username = user?.username || 'USER';
  const initial = (username?.[0] || 'U').toUpperCase();

  const fetchNotifications = async () => {
    try {
      const res = await dashboardAPI.getRisks('all');
      const alerts = res.data?.data?.alerts || []; 
      setNotifications(alerts);
    } catch (err) {
      console.error("Fetch Error:", err);
    }
  };

  // ✅ ฟังก์ชันล้างการแจ้งเตือนทั้งหมด
  const handleClearAll = async () => {
    try {
      // เรียก API ไปที่ Backend เพื่อ Mark as resolved ทั้งหมด
      await dashboardAPI.clearAllNotifications(); 
      setNotifications([]);
      toast.success("All tactical alerts cleared");
    } catch (err) {
      console.error("Clear error:", err);
      toast.error("Failed to clear notifications");
    }
  };

  useEffect(() => {
    fetchNotifications();

    if (user?.id) {
      socket.emit('join_user_room', user.id);
    }

    socket.on('new_notification', (data) => {
      setNotifications(prev => [data, ...prev]);
      toast.success(`${data.type.toUpperCase()}: ${data.message}`, {
        icon: data.type === 'task' ? '📅' : '🚨',
        duration: 5000,
        position: 'top-right'
      });
    });

    socket.on('resolve_notification', (data) => {
      setNotifications(prev => prev.filter(n => !(n.id === data.id && n.type === data.type)));
    });

    // ฟังคำสั่ง Clear All จาก Socket (กรณีเคลียร์จากเครื่องอื่น)
    socket.on('clear_all_notifications', () => {
      setNotifications([]);
    });

    return () => {
      socket.off('new_notification');
      socket.off('resolve_notification');
      socket.off('clear_all_notifications');
    };
  }, [user]);

  const handleResolveAlert = async (e, alertId) => {
    e.stopPropagation(); 
    try {
      await dashboardAPI.resolveRisk(alertId);
      toast.success("Alert resolved");
      setNotifications(prev => prev.filter(n => !(n.id === alertId && n.type === 'risk')));
    } catch (err) {
      toast.error("Failed to resolve alert");
    }
  };

  const unreadCount = notifications.length;

  // --- Search & Handlers ---
  const handleSearch = (e) => {
    const query = e.target.value;
    setSearchQuery(query);
    setIsSearching(query.length > 0);
    setOpenDropdown(query.trim().length > 0);
    onSearch?.(query);
  };

  const clearSearch = () => {
    setSearchQuery('');
    setIsSearching(false);
    setOpenDropdown(false);
    onSearch?.('');
    inputRef.current?.focus();
  };

  const suggestions = useMemo(() => {
    const q = (searchQuery || '').trim().toLowerCase();
    if (!q) return [];
    return (projects || []).filter((p) => (p.title || '').toLowerCase().includes(q)).slice(0, 6);
  }, [projects, searchQuery]);

  const selectSuggestion = (project) => {
    const pid = project.id || project.project_id;
    if (pid) {
      // ✅ นำทางไปยังหน้า Kanban ของโปรเจกต์
      navigate(`/projects/${pid}`); 
      setOpenDropdown(false);
      setSearchQuery('');
    }
  };

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (notiRef.current && !notiRef.current.contains(e.target)) setShowNoti(false);
      if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpenDropdown(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="bg-white border-b border-gray-200 px-6 py-4 sticky top-0 z-50">
      <div className="flex items-center justify-between">
        
        {/* Search Container */}
        <div className="flex-1 max-w-xl relative" ref={wrapRef}>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              ref={inputRef}
              type="text"
              placeholder="Search tactical projects..."
              value={searchQuery}
              onChange={handleSearch}
              className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary transition-all"
            />
            {isSearching && (
              <button onClick={clearSearch} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            )}
          </div>

          {openDropdown && (
            <div className="absolute top-full left-0 w-full mt-2 bg-white border border-gray-200 rounded-xl shadow-xl overflow-hidden animate-in fade-in slide-in-from-top-2 z-50">
              <div className="p-2 border-b border-gray-50 bg-gray-50/50 text-[10px] font-bold text-gray-400 uppercase tracking-widest px-4">Matching Units</div>
              {suggestions.length > 0 ? suggestions.map((p) => (
                <button key={p.id} onClick={() => selectSuggestion(p)} className="w-full flex items-center justify-between p-4 hover:bg-primary/5 transition-colors group">
                  <div className="flex items-center gap-3">
                    <Folder className="w-4 h-4 text-gray-400" />
                    <span className="text-sm font-bold text-gray-800">{p.title}</span>
                  </div>
                  <ArrowRight className="w-4 h-4 text-gray-300 opacity-0 group-hover:opacity-100 transition-all" />
                </button>
              )) : (
                <div className="p-8 text-center text-sm text-gray-400 italic">No matches found.</div>
              )}
            </div>
          )}
        </div>

        <div className="flex items-center gap-4">
          
          {/* 🔔 Notifications Section */}
          <div className="relative" ref={notiRef}>
            <button 
              onClick={() => setShowNoti(!showNoti)}
              className={`relative p-2 rounded-lg transition-all ${showNoti ? 'bg-gray-100' : 'hover:bg-gray-100'}`}
            >
              <Bell className={`w-5 h-5 ${unreadCount > 0 ? 'text-primary animate-bounce' : 'text-gray-600'}`} />
              {unreadCount > 0 && (
                <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-primary text-white text-[10px] font-black flex items-center justify-center rounded-full border-2 border-white shadow-sm">
                  {unreadCount}
                </span>
              )}
            </button>

            {showNoti && (
              <div className="absolute top-full right-0 mt-2 w-80 bg-white border border-gray-200 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 z-50">
                <div className="p-4 border-b border-gray-100 bg-gray-50/50 flex justify-between items-center">
                  <h3 className="text-xs font-black uppercase tracking-widest text-gray-800">Tactical Briefing</h3>
                  
                  {/* ✅ ปุ่ม Clear All */}
                  {notifications.length > 0 && (
                    <button 
                      onClick={handleClearAll}
                      className="text-[10px] font-bold text-gray-400 hover:text-red-500 transition-colors uppercase tracking-widest"
                    >
                      Clear All
                    </button>
                  )}
                </div>

                <div className="max-h-[400px] overflow-y-auto scrollbar-hide">
                  {notifications.length > 0 ? notifications.map((noti) => (
                    <div 
                      key={`${noti.type}-${noti.id}`} 
                      className={`p-4 border-b border-gray-50 hover:bg-gray-50 cursor-pointer transition-colors group relative ${noti.type === 'task' ? 'border-l-4 border-l-blue-500' : 'border-l-4 border-l-red-500'}`}
                      onClick={() => { 
                        // ✅ Link ไปหน้า Kanban ของโปรเจกต์นั้น
                        navigate(`/projects/${noti.project_id}`); 
                        setShowNoti(false); 
                      }}
                    >
                      <div className="flex gap-3">
                        <div className={`mt-1 w-8 h-8 rounded-full flex items-center justify-center shrink-0 
                          ${noti.type === 'task' ? 'bg-blue-100 text-blue-600' : 
                            noti.severity === 'critical' ? 'bg-red-100 text-red-600' : 'bg-amber-100 text-amber-600'}`}>
                          {noti.type === 'task' ? <Clock className="w-4 h-4" /> : <ShieldAlert className="w-4 h-4" />}
                        </div>
                        
                        <div className="space-y-1 flex-1 pr-6">
                          <div className="flex items-center gap-2">
                            <span className={`text-[9px] font-black uppercase px-1.5 py-0.5 rounded ${
                              noti.type === 'task' ? 'bg-blue-50 text-blue-500' : 'bg-red-50 text-red-500'
                            }`}>
                              {noti.type}
                            </span>
                          </div>
                          <p className="text-xs font-bold text-gray-800 leading-tight italic">
                            {noti.type === 'task' ? `TASK: ${noti.message}` : noti.message}
                          </p>
                          <div className="flex items-center gap-2 text-[10px] font-medium text-gray-400">
                            <span className="text-primary font-bold">{noti.project_name}</span> • {new Date(noti.created_at).toLocaleTimeString()}
                          </div>
                        </div>
                        
                        {noti.type === 'risk' && (
                          <button 
                            onClick={(e) => handleResolveAlert(e, noti.id)}
                            className="absolute right-4 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 p-1.5 bg-green-50 text-green-600 rounded-lg hover:bg-green-100 transition-all shadow-sm"
                            title="Mark as resolved"
                          >
                            <CheckCircle2 size={14} />
                          </button>
                        )}
                      </div>
                    </div>
                  )) : (
                    <div className="p-10 text-center">
                      <CheckCircle2 className="w-10 h-10 text-gray-200 mx-auto mb-3" />
                      <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Sky is clear</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          <button onClick={handleLogout} className="p-2 hover:bg-red-50 rounded-lg text-red-600 flex items-center gap-2 font-bold transition-colors">
            <LogOut className="w-5 h-5" />
            <span className="hidden lg:block text-sm">Logout</span>
          </button>

          <div className="flex items-center gap-3 pl-4 border-l border-gray-200">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-black text-gray-800 uppercase leading-none">{username}</p>
              <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1 italic">Uplink Active</p>
            </div>
            <div className="w-10 h-10 bg-gradient-to-br from-primary to-red-600 rounded-full flex items-center justify-center text-white font-black shadow-lg shadow-primary/20">
              {initial}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Navbar;