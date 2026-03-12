import React, { useEffect, useMemo, useRef, useState } from 'react';
import { 
  Search, Bell, X, LogOut, Folder, 
  ArrowRight, ShieldAlert, CheckCircle2, Clock,
  Filter, Trash2, Eye, AlertTriangle, CheckCheck,
  Users, Check, XCircle
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { dashboardAPI, pairingAPI } from '../services/api';
import toast from 'react-hot-toast';
import { io } from 'socket.io-client';

const socket = io(import.meta.env.VITE_API_URL || 'http://localhost:5000', {
  withCredentials: true,
  transports: ['websocket']
});

const FILTERS = [
  { key: 'all',     label: 'All' },
  { key: 'risk',    label: 'Risks' },
  { key: 'task',    label: 'Tasks' },
  { key: 'pairing', label: 'Pairing' },
];

const Navbar = ({ onSearch, projects = [] }) => {
  const navigate = useNavigate();
  const { logout, user } = useAuth();

  const [searchQuery, setSearchQuery]   = useState('');
  const [isSearching, setIsSearching]   = useState(false);
  const [openDropdown, setOpenDropdown] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [readIds, setReadIds] = useState(() => {
    try {
      const saved = localStorage.getItem('noti_read_ids');
      return saved ? new Set(JSON.parse(saved)) : new Set();
    } catch { return new Set(); }
  });

  const setReadIdsPersist = (updater) => {
    setReadIds(prev => {
      const next = typeof updater === 'function' ? updater(prev) : updater;
      try { localStorage.setItem('noti_read_ids', JSON.stringify([...next])); } catch {}
      return next;
    });
  };

  const [showNoti, setShowNoti]       = useState(false);
  const [notiFilter, setNotiFilter]   = useState('all');
  const [handlingIds, setHandlingIds] = useState(new Set());

  const notiRef = useRef(null);
  const wrapRef = useRef(null);
  const inputRef = useRef(null);

  const username = user?.username || 'USER';
  const initial  = (username?.[0] || 'U').toUpperCase();

  const fetchNotifications = async () => {
    try {
      const res = await dashboardAPI.getAllNotifications();
      const alerts = res.data?.data?.alerts || [];
      setNotifications(alerts);
    } catch (err) {
      console.error('Fetch notifications error:', err);
      setNotifications([]);
    }
  };

  useEffect(() => {
    fetchNotifications();
    if (user?.id) socket.emit('join_user_room', user.id);

    socket.on('new_notification', (data) => {
      setNotifications(prev => {
        if (prev.find(n => n.id === data.id && n.type === data.type)) return prev;
        return [data, ...prev];
      });
      const icon = data.type === 'task' ? '📅' : data.type === 'pairing' ? '🤝' : '🚨';
      toast.success(`${data.message}`, { icon, duration: 5000, position: 'top-right' });
    });

    socket.on('resolve_notification', (data) => {
      setNotifications(prev => prev.filter(n => !(n.id === data.id && n.type === data.type)));
    });

    socket.on('clear_all_notifications', () => setNotifications([]));

    return () => {
      socket.off('new_notification');
      socket.off('resolve_notification');
      socket.off('clear_all_notifications');
    };
  }, [user]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (notiRef.current && !notiRef.current.contains(e.target)) setShowNoti(false);
      if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpenDropdown(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const markAsRead = (noti) => {
    setReadIds(prev => new Set([...prev, `${noti.type}-${noti.id}`]));
  };

  const markAllAsRead = () => {
    setReadIds(new Set(notifications.map(n => `${n.type}-${n.id}`)));
  };

  const handleResolveAlert = async (e, alertId) => {
    e.stopPropagation();
    try {
      await dashboardAPI.resolveRisk(alertId);
      toast.success('Alert resolved');
      setNotifications(prev => prev.filter(n => !(n.id === alertId && n.type === 'risk')));
    } catch {
      toast.error('Failed to resolve alert');
    }
  };

  const handleAcceptPairing = async (e, noti) => {
    e.stopPropagation();
    if (handlingIds.has(noti.id)) return;
    setHandlingIds(prev => new Set([...prev, noti.id]));
    try {
      await pairingAPI.acceptRequest(noti.id);
      setNotifications(prev => prev.filter(n => !(n.id === noti.id && n.type === 'pairing')));
      toast.success('Pairing accepted! 🤝');
    } catch {
      toast.error('Failed to accept pairing');
    } finally {
      setHandlingIds(prev => { const s = new Set(prev); s.delete(noti.id); return s; });
    }
  };

  const handleDeclinePairing = async (e, noti) => {
    e.stopPropagation();
    if (handlingIds.has(noti.id)) return;
    setHandlingIds(prev => new Set([...prev, noti.id]));
    try {
      await pairingAPI.declineRequest(noti.id);
      setNotifications(prev => prev.filter(n => !(n.id === noti.id && n.type === 'pairing')));
      toast.success('Pairing declined');
    } catch {
      toast.error('Failed to decline pairing');
    } finally {
      setHandlingIds(prev => { const s = new Set(prev); s.delete(noti.id); return s; });
    }
  };

  const handleClearAll = async () => {
    try {
      await dashboardAPI.clearAllNotifications();
      setNotifications([]);
      setReadIds(new Set());
      toast.success('Tactical briefing cleared');
    } catch {
      toast.error('COMMUNICATION ERROR: Unable to clear uplink.');
    }
  };

  const filteredNotifications = useMemo(() => {
    if (notiFilter === 'all') return notifications;
    return notifications.filter(n => n.type === notiFilter);
  }, [notifications, notiFilter]);

  const unreadCount   = useMemo(
    () => notifications.filter(n => !readIds.has(`${n.type}-${n.id}`)).length,
    [notifications, readIds]
  );
  const riskCount    = notifications.filter(n => n.type === 'risk').length;
  const taskCount    = notifications.filter(n => n.type === 'task').length;
  const pairingCount = notifications.filter(n => n.type === 'pairing').length;

  const handleToggleNoti = () => setShowNoti(v => !v);

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
    return (projects || []).filter(p => (p.title || '').toLowerCase().includes(q)).slice(0, 6);
  }, [projects, searchQuery]);

  const selectSuggestion = (project) => {
    const pid = project.id || project.project_id;
    if (pid) {
      navigate(`/projects/${pid}`);
      setOpenDropdown(false);
      setSearchQuery('');
    }
  };

  const handleLogout = () => { logout(); navigate('/login'); };

  const getNotiIcon = (noti) => {
    if (noti.type === 'task')    return <Clock className="w-4 h-4" />;
    if (noti.type === 'pairing') return <Users className="w-4 h-4" />;
    return <ShieldAlert className="w-4 h-4" />;
  };

  const getNotiColor = (noti) => {
    if (noti.type === 'task')    return 'bg-blue-100 text-blue-600';
    if (noti.type === 'pairing') return 'bg-purple-100 text-purple-600';
    if (noti.severity === 'critical') return 'bg-red-100 text-red-600';
    return 'bg-amber-100 text-amber-600';
  };

  const getBorderColor = (noti) => {
    if (noti.type === 'task')    return 'border-l-blue-500';
    if (noti.type === 'pairing') return 'border-l-purple-500';
    return 'border-l-red-500';
  };

  return (
    <div className="bg-white border-b border-gray-200 px-6 py-4 sticky top-0 z-50">
      <div className="flex items-center justify-between">

        {/* ── Search ── */}
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
              {suggestions.length > 0 ? suggestions.map(p => (
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

          {/* ── 🔔 Notification Bell ── */}
          <div className="relative" ref={notiRef}>
            <button
              onClick={handleToggleNoti}
              className={`relative p-2 rounded-lg transition-all ${showNoti ? 'bg-gray-100' : 'hover:bg-gray-100'}`}
            >
              <Bell className={`w-5 h-5 ${unreadCount > 0 ? 'text-primary animate-bounce' : 'text-gray-600'}`} />
              {unreadCount > 0 && (
                <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-primary text-white text-[10px] font-black flex items-center justify-center rounded-full border-2 border-white shadow-sm">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>

            {showNoti && (
              <div className="absolute top-full right-0 mt-2 w-[360px] bg-white border border-gray-200 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 z-50">

                <div className="p-4 border-b border-gray-100 bg-gray-50/50">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-xs font-black uppercase tracking-widest text-gray-800">Tactical Briefing</h3>
                    <div className="flex items-center gap-2">
                      {unreadCount > 0 && (
                        <button onClick={markAllAsRead} className="text-[10px] font-bold text-blue-500 hover:text-blue-600 flex items-center gap-1 transition-colors uppercase">
                          <CheckCheck size={12} /> Read All
                        </button>
                      )}
                      {notifications.length > 0 && (
                        <button onClick={handleClearAll} className="text-[10px] font-bold text-gray-400 hover:text-red-500 flex items-center gap-1 transition-colors uppercase">
                          <Trash2 size={12} /> Clear
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="flex gap-1 bg-gray-100 rounded-xl p-1">
                    {FILTERS.map(f => {
                      const count = f.key === 'all' ? notifications.length
                        : f.key === 'risk'    ? riskCount
                        : f.key === 'task'    ? taskCount
                        : pairingCount;
                      return (
                        <button
                          key={f.key}
                          onClick={() => setNotiFilter(f.key)}
                          className={`flex-1 flex items-center justify-center gap-1 text-[10px] font-black uppercase tracking-wider py-1.5 rounded-lg transition-all ${
                            notiFilter === f.key ? 'bg-white text-gray-800 shadow-sm' : 'text-gray-400 hover:text-gray-600'
                          }`}
                        >
                          {f.label}
                          {count > 0 && (
                            <span className={`text-[9px] font-black px-1.5 py-0.5 rounded-full ${
                              notiFilter === f.key
                                ? f.key === 'risk'    ? 'bg-red-100 text-red-500'
                                : f.key === 'task'    ? 'bg-blue-100 text-blue-500'
                                : f.key === 'pairing' ? 'bg-purple-100 text-purple-500'
                                : 'bg-gray-100 text-gray-500'
                                : 'bg-gray-200 text-gray-400'
                            }`}>
                              {count}
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="max-h-[420px] overflow-y-auto scrollbar-hide">
                  {filteredNotifications.length > 0 ? filteredNotifications.map(noti => {
                    const key    = `${noti.type}-${noti.id}`;
                    const isRead = readIds.has(key);
                    return (
                      <div
                        key={key}
                        className={`p-4 border-b border-gray-50 hover:bg-gray-50 cursor-pointer transition-colors group relative border-l-4 ${getBorderColor(noti)} ${isRead ? 'opacity-60' : ''}`}
                        onClick={() => {
                          markAsRead(noti);
                          if (noti.type !== 'pairing') {
                            navigate(`/projects/${noti.project_id}`);
                            setShowNoti(false);
                          }
                        }}
                      >
                        <div className="flex gap-3">
                          <div className={`mt-1 w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${getNotiColor(noti)}`}>
                            {getNotiIcon(noti)}
                          </div>

                          <div className="space-y-1 flex-1">
                            <div className="flex items-start gap-2">
                              {!isRead && <div className="mt-1.5 w-1.5 h-1.5 rounded-full bg-primary shrink-0" />}
                              <p className="text-xs font-bold text-gray-800 leading-tight">
                                {noti.type === 'task'    ? `TASK: ${noti.message}`
                                : noti.type === 'pairing' ? `🤝 ${noti.user} wants to pair on "${noti.node}"`
                                : noti.message}
                              </p>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-[10px] text-gray-400 font-medium italic">{noti.project_name}</span>
                              <span className="text-gray-300">•</span>
                              <span className="text-[10px] text-gray-400">
                                {new Date(noti.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </span>
                              {noti.severity === 'critical' && (
                                <><span className="text-gray-300">•</span><span className="text-[9px] font-black text-red-500 uppercase">Critical</span></>
                              )}
                              {noti.type === 'pairing' && noti.weight === 'High' && (
                                <><span className="text-gray-300">•</span><span className="text-[9px] font-black text-purple-500 uppercase">High Priority</span></>
                              )}
                            </div>

                            {noti.type === 'pairing' && (
                              <div className="flex gap-2 mt-2" onClick={e => e.stopPropagation()}>
                                <button
                                  onClick={(e) => handleAcceptPairing(e, noti)}
                                  disabled={handlingIds.has(noti.id)}
                                  className="flex items-center gap-1 px-3 py-1 bg-purple-500 hover:bg-purple-600 text-white text-[10px] font-black rounded-lg transition-all disabled:opacity-50"
                                >
                                  <Check size={10} /> Accept
                                </button>
                                <button
                                  onClick={(e) => handleDeclinePairing(e, noti)}
                                  disabled={handlingIds.has(noti.id)}
                                  className="flex items-center gap-1 px-3 py-1 bg-gray-100 hover:bg-red-50 hover:text-red-500 text-gray-500 text-[10px] font-black rounded-lg transition-all disabled:opacity-50"
                                >
                                  <XCircle size={10} /> Decline
                                </button>
                              </div>
                            )}
                          </div>

                          {noti.type !== 'pairing' && (
                            <div className="absolute right-3 top-1/2 -translate-y-1/2 flex gap-1 opacity-0 group-hover:opacity-100 transition-all">
                              {!isRead && (
                                <button
                                  onClick={(e) => { e.stopPropagation(); markAsRead(noti); }}
                                  className="p-1.5 bg-blue-50 text-blue-500 rounded-lg hover:bg-blue-100 transition-all shadow-sm"
                                  title="Mark as read"
                                >
                                  <Eye size={12} />
                                </button>
                              )}
                              {noti.type === 'risk' && (
                                <button
                                  onClick={(e) => handleResolveAlert(e, noti.id)}
                                  className="p-1.5 bg-green-50 text-green-600 rounded-lg hover:bg-green-100 transition-all shadow-sm"
                                  title="Resolve"
                                >
                                  <CheckCircle2 size={12} />
                                </button>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  }) : (
                    <div className="p-10 text-center">
                      <CheckCircle2 className="w-10 h-10 text-gray-200 mx-auto mb-2" />
                      <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest italic">
                        {notiFilter === 'all'     ? 'All Quiet on the Sector'
                        : notiFilter === 'risk'    ? 'No Active Risks'
                        : notiFilter === 'task'    ? 'No Pending Tasks'
                        : 'No Pairing Requests'}
                      </p>
                    </div>
                  )}
                </div>

                {filteredNotifications.length > 0 && (
                  <div className="p-3 border-t border-gray-100 bg-gray-50/50 text-center">
                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">
                      {unreadCount > 0
                        ? `${unreadCount} unread · ${notifications.length} total`
                        : `${notifications.length} notification${notifications.length !== 1 ? 's' : ''} · All read`}
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* ── Logout ── */}
          <button onClick={handleLogout} className="p-2 hover:bg-red-50 rounded-lg text-red-600 flex items-center gap-2 font-bold transition-colors">
            <LogOut className="w-5 h-5" />
            <span className="hidden lg:block text-sm uppercase">Logout</span>
          </button>

          {/* ── User Avatar → navigate to /security ✅ ── */}
          <button
            onClick={() => navigate('/security')}
            className="flex items-center gap-3 pl-4 border-l border-gray-200"
          >
            <div className="text-right hidden sm:block">
              <p className="text-sm font-black text-gray-800 uppercase leading-none tracking-tighter">{username}</p>
              <p className="text-[9px] text-primary font-bold tracking-[0.2em] mt-1 italic">ACTIVE_UPLINK</p>
            </div>
            <div className="w-10 h-10 bg-gradient-to-br from-primary to-red-600 rounded-full flex items-center justify-center text-white font-black shadow-lg shadow-primary/20">
              {initial}
            </div>
          </button>

        </div>
      </div>
    </div>
  );
};

export default Navbar;