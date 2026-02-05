// src/components/Sidebar.jsx
import React from 'react';

export default function Sidebar({ cycle = 1, progress = 0 }) {
    
    // LOGIC คำนวณ Progress
    let currentProgress = progress ?? 0;
    if (currentProgress < 0) currentProgress = 0;
    if (currentProgress > 100) currentProgress = 100;

    const activePage = "DASHBOARD"; 

    const menuItems = [
      // 1. DASHBOARD (แบบเส้นโปร่ง มุมมน ตามที่แก้ล่าสุด)
     { 
        name: "DASHBOARD", 
        // ซ้ายบน(ใหญ่), ซ้ายล่าง(เล็ก), ขวาบน(เล็ก), ขวาล่าง(ใหญ่)
        icon: "M4 5a2 2 0 012-2h3a2 2 0 012 2v7a2 2 0 01-2 2H6a2 2 0 01-2-2V5z M4 18a2 2 0 012-2h3a2 2 0 012 2v1a2 2 0 01-2 2H6a2 2 0 01-2-2v-1z M13 5a2 2 0 012-2h3a2 2 0 012 2v1a2 2 0 01-2 2h-3a2 2 0 01-2-2V5z M13 12a2 2 0 012-2h3a2 2 0 012 2v7a2 2 0 01-2 2h-3a2 2 0 01-2-2v-7z", 
        isSolid: false // เส้นโปร่ง
      },
      { 
        name: "MY DAY", 
        // Path: กรอบปฏิทิน + เส้นคั่น + ห่วงด้านบน 2 อัน + จุด 6 จุด
        icon: "M8 2v4M16 2v4M3 10h18M5 4h14a2 2 0 012 2v14a2 2 0 01-2 2H5a2 2 0 01-2-2V6a2 2 0 012-2z M8 14h.01M12 14h.01M16 14h.01M8 18h.01M12 18h.01M16 18h.01",
        isSolid: false // เส้นโปร่ง
      },
     // 3. TASKS: แก้ไขความยาวเส้น (เพิ่มความยาวจาก h4 เป็น h6)
      { 
        name: "TASKS", 
        // แก้ตรง M16 ... h6 (เพิ่มความยาวไปทางขวา)
        icon: "M5 5a2 2 0 012-2h4a2 2 0 012 2v4a2 2 0 01-2 2H7a2 2 0 01-2-2V5z M17 6h6 M17 12h6 M17 18h6 M5 18l2 2 4-4",
        isSolid: false 
      },
    // 4. PROJECT FLOW: แก้ไขใหม่ (กล่องบนขวา + กล่องล่างซ้าย + เส้นเชื่อมโค้ง)
      { 
        name: "PROJECT FLOW", 
        icon: "M14 5a2 2 0 012-2h3a2 2 0 012 2v3a2 2 0 01-2 2h-3a2 2 0 01-2-2V5z M3 16a2 2 0 012-2h3a2 2 0 012 2v3a2 2 0 01-2 2H5a2 2 0 01-2-2v-3z M17.5 10v4a3.5 3.5 0 01-3.5 3.5H10",
        isSolid: false 
      },
 // 5. RETROSPECTIVE BOARD: แก้ไขเป็นรูปกระเป๋าสตางค์มีสายคาดและปุ่มแบบเป๊ะๆ
      { 
        name: "RETROSPECTIVE BOARD", 
        // Path นี้วาดกระเป๋าสตางค์ที่มีฝาพับด้านหลัง และมีสายคาดที่มีปุ่มอยู่ด้านขวา
        icon: "M20 7V5a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v2 M20 7a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2h14z M18 11h2a2 2 0 0 1 2 2v0a2 2 0 0 1-2 2h-2a2 2 0 0 1-2-2v0a2 2 0 0 1 2-2z",
        isSolid: false
      },

      { name: "BUDGET & ROI", icon: "M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" },
    { 
        name: "PAYROLL SYSTEM", 
        // Path ละเอียด:
        // 1. วงกลมบนซ้าย (Center ที่ 8,8) + เลข 1 ตรงกลาง (x=8)
        // 2. วงกลมล่างขวา (Center ที่ 16,16) ตัดส่วนทับ + เลข 1 เอียงขวา (Diagonal)
        icon: "M14 8a6 6 0 1 1-12 0 6 6 0 0 1 12 0 M8 5v6 M6 7l2-2 M21.5 16a6 6 0 1 1-4-5 M18 14l-3 5 M16 15l2-1",
        isSolid: false 
      },
      { type: "separator" },
      { name: "DECISION HUB", icon: "M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" },
      { 
        name: "RISK SENTINEL", 
        // Path: รูปโล่ (Shield) + เครื่องหมายตกใจ (!) ตรงกลาง
        icon: "M12 3l8 4v6c0 5.5-8 10-8 10S4 18.5 4 13V7l8-4z M12 8v4 M12 16h.01",
        isSolid: false 
      },
     // 10. SKILL MATRIX: แก้ไขใหม่เป็นรูปเป้า (Concentric Circles) ตามรูป
      { 
        name: "SKILL MATRIX",
        // Path: วงนอก (r=9) + วงกลาง (r=5) + วงใน (r=1.5)
        icon: "M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0 M17 12a5 5 0 1 1-10 0 5 5 0 0 1 10 0 M13.5 12a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0",
        isSolid: false 
      },
      { name: "CULTURE & FEEDBACK", icon: "M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" },
      { 
        name: "SUPER ADMIN", 
        // Path: รูปโล่เปล่า (Shield Outline)
        icon: "M12 3l8 4v6c0 5.5-8 10-8 10S4 18.5 4 13V7l8-4z",
        isSolid: false 
      },
      ];
  
    return (
      <aside className="w-72 bg-[#0B1221] text-gray-400 flex flex-col h-screen fixed left-0 top-0 z-50 font-sans border-r border-white/5">
        
        {/* Logo Area */}
        <div className="p-8 pb-6 flex items-center gap-4 flex-shrink-0">
          <div className="relative group">
              <div className="absolute inset-0 bg-red-600 blur-[25px] opacity-40 rounded-full"></div>
              <div className="relative w-[52px] h-[52px] bg-[#FF2B2B] flex items-center justify-center z-10 
                rounded-none rounded-tr-[20px] rounded-none rounded-none shadow-[0_0_20px_rgba(255,43,43,0.6)]">
                {/* --- แก้ไขตรงนี้: เปลี่ยน text-[#8B0000] เป็น text-white --- */}
                <span className="text-white font-bold text-2xl">P</span>
              </div>
          </div>
          <div className="flex flex-col justify-center">
            <h1 className="text-white font-black text-[28px] italic tracking-tighter leading-none">
              The Pulse
            </h1>
            <span className="text-[10px] font-bold text-gray-500 tracking-[0.25em] uppercase mt-1.5 ml-0.5">
              PROJECT ENGINE
            </span>
          </div>
        </div>
        
        {/* Menu Items */}
        <nav className="flex-1 px-4 space-y-2 mt-2 overflow-y-auto pb-6 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
          {menuItems.map((item) => {
            if (item.type === "separator") {
                return (
                    <button key="project-chat" className="w-full flex items-center justify-between px-5 py-3.5 my-2 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all bg-[#151B2B] hover:bg-[#1E2538] border border-transparent hover:border-white/5 text-gray-400 hover:text-white">
                        <div className="flex items-center gap-6">
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                            </svg>
                            <span>PROJECT CHAT</span>
                        </div>
                       
                    </button>
                );
            }

            const isActive = item.name === activePage;

            return (
                <button
                key={item.name}
                className={`w-full flex items-center justify-between px-5 py-3.5 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all mb-1 border
                    ${isActive 
                        ? "bg-gradient-to-r from-[#FF2B2B] to-[#C71D1D] text-white shadow-md shadow-red-500/30 border-transparent" 
                        : "bg-[#151B2B] text-gray-400 hover:bg-[#1E2538] hover:text-white border-transparent hover:border-white/5"
                    }
                `}
                >
                <div className="flex items-center gap-6">
                    <svg
  className="w-5 h-5"
  fill="none"
  viewBox="0 0 24 24"
  stroke="currentColor"
  strokeWidth="2"
>
  <path
    strokeLinecap="round"
    strokeLinejoin="round"
    d={item.icon}
  />
</svg>

                    {item.name}
                </div>
                {isActive && (
                    <div className="w-1.5 h-1.5 bg-white rounded-full shadow-sm"></div>
                )}
                </button>
            )
          })}
        </nav>
  
        {/* Bottom Status */}
        <div className="p-6 mt-auto flex-shrink-0">
          <div className="bg-gradient-to-br from-[#151B2B] to-[#0F131F] rounded-2xl p-5 border border-white/5 relative overflow-hidden group">
             <div className={`absolute top-0 right-0 w-32 h-32 rounded-full blur-3xl transition-all duration-700 pointer-events-none
                ${currentProgress > 0 ? "bg-[#3B82F6] opacity-30" : "bg-[#3B82F6] opacity-10 group-hover:opacity-20"}
             `}></div>
             
             <div className="flex justify-between items-end mb-3 relative z-10">
                <span className="text-[11px] font-bold text-white uppercase tracking-wider">
                    Cycle {cycle}
                </span>
                <span className={`text-xs font-bold transition-colors duration-500 ${currentProgress > 0 ? "text-[#00C46B]" : "text-gray-600"}`}>
                    {currentProgress}%
                </span>
             </div>
             
             <div className="w-full bg-gray-800 rounded-full h-1.5 overflow-hidden relative z-10">
                <div 
                    className="bg-[#FF2B2B] h-1.5 rounded-full shadow-[0_0_10px_#FF2B2B] transition-all duration-1000 ease-out"
                    style={{ width: `${currentProgress}%` }}
                ></div>
             </div>
          </div>
        </div>
      </aside>
    );
}