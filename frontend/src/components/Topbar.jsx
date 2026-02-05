// src/components/Topbar.jsx
import React, { useState, useEffect } from 'react';

export default function Topbar() {
    // State สำหรับเก็บข้อมูลจริงจาก Backend
    const [notifications, setNotifications] = useState([]); 
    const [unreadCount, setUnreadCount] = useState(0);
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);

    // --- ส่วนเชื่อมต่อ Backend (API Integration) ---
    useEffect(() => {
        // ฟังก์ชันดึงข้อมูลจาก API
        const fetchNotifications = async () => {
            try {
                // TODO: 1. เปลี่ยน URL นี้เป็น API ของคุณ เช่น 'http://localhost:3000/api/notifications'
                // const response = await fetch('/api/notifications');
                // const data = await response.json();
                
                // TODO: 2. อัปเดต State ด้วยข้อมูลจริง
                // setNotifications(data.alerts);
                // setUnreadCount(data.total_unread);

                // --- (ระหว่างรอก็ปล่อยว่างไว้ หรือจะเปิด comment ด้านล่างเพื่อเทส UI ก็ได้ครับ) ---
                /* setNotifications([
                    { id: 1, title: "Critical Blocker Flagged", desc: "Anusorn flagged a blocker on T-101", time: "2M AGO", isRead: false },
                    { id: 2, title: "New Task Assigned", desc: "You have been assigned to Project X", time: "1H AGO", isRead: false }
                ]);
                setUnreadCount(2);
                */
            } catch (error) {
                console.error("Failed to fetch notifications:", error);
            }
        };

        fetchNotifications();
        
        // Optional: ตั้ง Interval ให้ดึงข้อมูลใหม่ทุกๆ 1 นาที (Real-time polling)
        // const interval = setInterval(fetchNotifications, 60000);
        // return () => clearInterval(interval);
    }, []);

    // ฟังก์ชันสั่ง Mark as Read ไปที่ Backend
    const handleMarkAllRead = async () => {
        try {
            // await fetch('/api/notifications/mark-all-read', { method: 'POST' });
            setNotifications([]); // เคลียร์หน้าจอ
            setUnreadCount(0); // รีเซ็ตเลข
        } catch (error) {
            console.error("Error marking all as read:", error);
        }
    };

    const toggleDropdown = () => {
        setIsDropdownOpen(!isDropdownOpen);
    };

    return (
      <header className="h-[88px] bg-white rounded-tl-[40px] px-8 flex items-center justify-between sticky top-0 z-40 border-b border-gray-100">
        
        <style>{`
          @keyframes popIn {
            0% { opacity: 0; transform: translateY(-10px) scale(0.95); }
            100% { opacity: 1; transform: translateY(0) scale(1); }
          }
          .animate-dropdown {
            animation: popIn 0.2s ease-out forwards;
          }
        `}</style>

        {/* Left: Super Admin Pill */}
        <div className="flex items-center">
            <button className="flex items-center gap-3 bg-[#F4F5F7] hover:bg-gray-100 px-4 py-2.5 rounded-full transition-colors cursor-pointer">
                <div className="w-2 h-2 rounded-full bg-[#3B82F6]"></div>
                <span className="text-sm font-bold text-gray-700 tracking-tight">Super Admin</span>
                <svg className="w-4 h-4 text-gray-400 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
            </button>
        </div>
  
        {/* Center: Search Bar */}
        <div className="flex-1 max-w-xl px-8">
             <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <svg className="w-5 h-5 text-gray-400 group-focus-within:text-blue-500 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                </div>
                <input 
                    type="text" 
                    placeholder="Global System Search..." 
                    className="w-full pl-12 pr-4 py-3 rounded-full bg-[#F4F5F7] border-none text-sm font-medium text-gray-700 placeholder-gray-400 focus:bg-white focus:ring-2 focus:ring-blue-100 transition-all outline-none"
                />
            </div>
        </div>
  
        {/* Right: Actions */}
        <div className="flex items-center gap-5 relative">
            
            {/* EN Button */}
            <button className="flex items-center gap-2 px-4 py-2.5 bg-[#F4F5F7] rounded-full hover:bg-gray-200 transition-colors text-sm font-bold text-gray-600">
                <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" /></svg>
                EN
            </button>

            {/* Notification Bell Area */}
            <div className="relative">
                <button 
                    onClick={toggleDropdown}
                    className={`w-11 h-11 rounded-full bg-[#F4F5F7] hover:bg-gray-200 flex items-center justify-center text-gray-500 relative transition-colors ${isDropdownOpen ? 'bg-gray-200' : ''}`}
                >
                    {/* แสดง Badge เฉพาะเมื่อมี unreadCount > 0 */}
                    {unreadCount > 0 && (
                        <div className="w-4 h-4 bg-red-500 rounded-full absolute top-0 right-0 border-[2px] border-white flex items-center justify-center text-[9px] text-white font-bold shadow-md z-10">
                            {unreadCount}
                        </div>
                    )}
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                    </svg>
                </button>

                {/* --- NOTIFICATION DROPDOWN --- */}
                {isDropdownOpen && (
                    <div className="absolute top-14 right-[-80px] w-[400px] bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden animate-dropdown z-50">
                        {/* Header */}
                        <div className="px-6 py-5 bg-[#F8F9FC] border-b border-gray-100 flex justify-between items-start">
                            <div>
                                <h3 className="text-lg font-black text-gray-900 leading-tight">Notifications</h3>
                                <p className="text-xs font-medium text-gray-400 mt-0.5">
                                    {unreadCount} unread alerts
                                </p>
                            </div>
                            {unreadCount > 0 && (
                                <button 
                                    onClick={handleMarkAllRead}
                                    className="text-[10px] font-black text-[#FF2B2B] hover:text-red-700 uppercase tracking-wide mt-1"
                                >
                                    Mark all read
                                </button>
                            )}
                        </div>

                        {/* List Items (Dynamic Rendering) */}
                        <div className="max-h-[400px] overflow-y-auto">
                            {notifications.length === 0 ? (
                                // Empty State
                                <div className="p-8 text-center text-gray-400 text-sm">
                                    No new notifications
                                </div>
                            ) : (
                                // Render Real Data
                                notifications.map((item) => (
                                    <div key={item.id} className="relative flex items-start gap-4 p-5 border-b border-gray-50 hover:bg-gray-50 transition-colors cursor-pointer group">
                                        {/* Red Strip Indicator */}
                                        <div className="absolute left-0 top-0 bottom-0 w-[4px] bg-[#FF2B2B]"></div>
                                        
                                        {/* Icon Box */}
                                        <div className="w-10 h-10 rounded-xl bg-white border border-red-100 flex-shrink-0 flex items-center justify-center shadow-sm group-hover:shadow-md transition-shadow">
                                            <svg className="w-5 h-5 text-[#FF2B2B]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                            </svg>
                                        </div>

                                        {/* Content */}
                                        <div className="flex-1 min-w-0">
                                            <div className="flex justify-between items-start mb-0.5">
                                                <p className="text-sm font-bold text-gray-900 truncate">{item.title}</p>
                                                <span className="text-[10px] font-bold text-gray-400 whitespace-nowrap ml-2">{item.time}</span>
                                            </div>
                                            <p className="text-xs font-medium text-gray-500 leading-relaxed truncate">
                                                {item.desc}
                                            </p>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                        
                        {/* Footer */}
                         <div className="p-3 bg-gray-50 text-center border-t border-gray-100 hover:bg-gray-100 cursor-pointer transition-colors">
                            <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">View All Activity</span>
                        </div>
                    </div>
                )}
            </div>
            
            {/* Divider */}
            <div className="h-8 w-[1.5px] bg-gray-200 mx-1"></div>

            {/* Profile */}
            <div className="flex items-center gap-3">
                <div className="text-right hidden md:block">
                    <p className="text-sm font-black text-gray-900 leading-none">Name</p>
                    <p className="text-[11px] text-gray-500 font-bold uppercase tracking-wide mt-1">Super_Admin</p>
                </div>
                <button className="w-11 h-11 rounded-full bg-[#F4F5F7] hover:bg-red-50 hover:text-red-500 flex items-center justify-center text-gray-400 transition-colors group">
                     <svg className="w-5 h-5 group-hover:translate-x-0.5 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
                </button>
            </div>
        </div>
      </header>
    );
}