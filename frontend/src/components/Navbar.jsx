import React, { useState } from 'react';
import { Search, Globe, Bell, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Navbar = ({ onSearch }) => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);

  const handleSearch = (e) => {
    const query = e.target.value;
    setSearchQuery(query);
    setIsSearching(query.length > 0);
    
    // ส่ง query ไปยัง parent component
    if (onSearch) {
      onSearch(query);
    }
  };

  const clearSearch = () => {
    setSearchQuery('');
    setIsSearching(false);
    if (onSearch) {
      onSearch('');
    }
  };

  return (
    <div className="bg-white border-b border-gray-200 px-6 py-4">
      <div className="flex items-center justify-between">
        {/* Search */}
        <div className="flex-1 max-w-xl">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search projects..."
              value={searchQuery}
              onChange={handleSearch}
              className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
            />
            {isSearching && (
              <button
                onClick={clearSearch}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>

        {/* Right Side */}
        <div className="flex items-center gap-4">
          {/* Language */}
          <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors flex items-center gap-2">
            <Globe className="w-5 h-5 text-gray-600" />
            <span className="text-sm text-gray-700">EN</span>
          </button>

          {/* Notifications */}
          <button className="relative p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <Bell className="w-5 h-5 text-gray-600" />
            <span className="absolute top-1 right-1 w-2 h-2 bg-primary rounded-full"></span>
          </button>

          {/* User Profile */}
          <div className="flex items-center gap-3 pl-4 border-l border-gray-200">
            <div className="text-right">
              <p className="text-sm font-semibold text-gray-800">JIRA PHOENIX</p>
              <p className="text-xs text-gray-500">SUPER_ADMIN</p>
            </div>
            <div className="w-10 h-10 bg-gradient-to-br from-primary to-red-600 rounded-full flex items-center justify-center text-white font-bold">
              J
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Navbar;
