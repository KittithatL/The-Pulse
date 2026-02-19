import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Search, Globe, Bell, X, LogOut, Folder, ArrowRight } from 'lucide-react'; // เพิ่ม Icon
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Navbar = ({ onSearch, projects = [] }) => {
  const navigate = useNavigate();
  const { logout, user } = useAuth();

  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [openDropdown, setOpenDropdown] = useState(false);

  const wrapRef = useRef(null);
  const inputRef = useRef(null);

  const username = user?.username || 'USER';
  const initial = (username?.[0] || 'U').toUpperCase();

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

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const suggestions = useMemo(() => {
    const q = (searchQuery || '').trim().toLowerCase();
    if (!q) return [];

    const list = (projects || []).filter((p) => {
      const title = (p.title || '').toLowerCase();
      const desc = (p.description || '').toLowerCase();
      const creator = (p.creator_username || '').toLowerCase();
      return title.includes(q) || desc.includes(q) || creator.includes(q);
    });

    return list.slice(0, 6);
  }, [projects, searchQuery]);


  const selectSuggestion = (project) => {

    const pid = project.id || project.project_id;
    
    if (pid) {

      navigate(`/projects/${pid}/tasks`);


      setSearchQuery(''); 
      setIsSearching(false); 
      setOpenDropdown(false);
      onSearch?.('');  
      

      inputRef.current?.blur(); 
    }
  };

  useEffect(() => {
    const onDown = (e) => {
      if (!wrapRef.current) return;
      if (!wrapRef.current.contains(e.target)) {
        setOpenDropdown(false);
      }
    };
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, []);

  const handleKeyDown = (e) => {
    if (e.key === 'Escape') {
      setOpenDropdown(false);
      inputRef.current?.blur();
    }
  };

  return (
    <div className="bg-white border-b border-gray-200 px-6 py-4 sticky top-0 z-50">
      <div className="flex items-center justify-between">
        
        {/* Search & Dropdown Container */}
        <div className="flex-1 max-w-xl relative" ref={wrapRef}>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              ref={inputRef}
              type="text"
              placeholder="Search projects..."
              value={searchQuery}
              onChange={handleSearch}
              onFocus={() => setOpenDropdown((searchQuery || '').trim().length > 0)}
              onKeyDown={handleKeyDown}
              className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
            />
            {isSearching && (
              <button
                onClick={clearSearch}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                type="button"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>

          {/* ✅ Dropdown Menu */}
          {openDropdown && (
            <div className="absolute top-full left-0 w-full mt-2 bg-white border border-gray-200 rounded-xl shadow-xl overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
              <div className="p-2 border-b border-gray-50 bg-gray-50/50">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-2">
                  Matching Projects
                </span>
              </div>
              
              <div className="max-h-[360px] overflow-y-auto">
                {suggestions.length > 0 ? (
                  suggestions.map((p) => (
                    <button
                      key={p.id}
                      onClick={() => selectSuggestion(p)}
                      className="w-full flex items-center justify-between p-3 hover:bg-primary/5 transition-colors group text-left border-b border-gray-50 last:border-0"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                          <Folder className="w-4 h-4 text-gray-500 group-hover:text-primary" />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-gray-800 group-hover:text-primary transition-colors">
                            {p.title}
                          </p>
                          <p className="text-[10px] text-gray-400 uppercase font-medium">
                             Created by {p.creator_username || 'System'}
                          </p>
                        </div>
                      </div>
                      <ArrowRight className="w-4 h-4 text-gray-300 -translate-x-2 opacity-0 group-hover:translate-x-0 group-hover:opacity-100 transition-all" />
                    </button>
                  ))
                ) : (
                  <div className="p-8 text-center">
                    <p className="text-sm text-gray-400 italic">No project matches your search.</p>
                  </div>
                )}
              </div>

              {suggestions.length > 0 && (
                <button 
                  onClick={() => { navigate('/projects'); onSearch?.(searchQuery); setOpenDropdown(false); }}
                  className="w-full p-3 bg-gray-50 text-center text-xs font-bold text-primary hover:bg-gray-100 transition-colors border-t border-gray-100"
                >
                  VIEW ALL RESULTS
                </button>
              )}
            </div>
          )}
        </div>

        {/* Right Side - Same as before */}
        <div className="flex items-center gap-4">
          <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors flex items-center gap-2">
            <Globe className="w-5 h-5 text-gray-600" />
            <span className="text-sm text-gray-700 font-bold">EN</span>
          </button>

          <button className="relative p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <Bell className="w-5 h-5 text-gray-600" />
            <span className="absolute top-1 right-1 w-2 h-2 bg-primary rounded-full"></span>
          </button>

          <button
            onClick={handleLogout}
            className="p-2 hover:bg-red-50 rounded-lg transition-colors flex items-center gap-2 text-red-600 font-semibold"
          >
            <LogOut className="w-5 h-5" />
            <span className="hidden md:block text-sm">Logout</span>
          </button>

          <div className="flex items-center gap-3 pl-4 border-l border-gray-200">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-black text-gray-800 tracking-tighter uppercase">
                {username}
              </p>
              <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Signed In</p>
            </div>
            <div className="w-10 h-10 bg-gradient-to-br from-primary to-red-600 rounded-full flex items-center justify-center text-white font-bold shadow-sm shadow-primary/20">
              {initial}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Navbar;