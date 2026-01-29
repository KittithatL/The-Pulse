// src/components/RegisterForm.jsx
export default function RegisterForm() {
  const handleSubmit = (e) => {
    e.preventDefault();
    console.log("REGISTER SUBMIT OK");
  };

  return (
    <div className="w-full max-w-[420px] px-8">
      {/* BRAND */}
      <div className="flex items-center gap-4 mb-10">
        <div className="w-[52px] h-[52px] rounded-xl bg-[#FF2B2B] flex items-center justify-center text-white font-extrabold text-2xl shadow-[0_4px_20px_rgba(255,43,43,0.4)]">
          P
        </div>
        <div>
          <h1 className="text-2xl font-black italic tracking-tight text-gray-900">The Pulse</h1>
          <p className="text-[10px] font-bold tracking-[0.2em] text-gray-400 uppercase">
            Smarter Project DNA
          </p>
        </div>
      </div>

      {/* HEADER TEXT */}
      <h2 className="text-3xl font-extrabold text-gray-900 mb-2">Login to The Pulse</h2>
      <p className="text-gray-500 text-sm font-medium mb-4">
        Measure the heartbeat of your projects.
      </p>

      {/* BACK LINK */}
      <a href="#" className="flex items-center text-xs font-semibold text-gray-400 hover:text-gray-600 mb-8 transition-colors">
        <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M15 19l-7-7 7-7"></path></svg>
        Return to access
      </a>

      {/* FORM */}
      <form onSubmit={handleSubmit} className="space-y-5">
        
        {/* FULL LEGAL NAME */}
        <div>
          <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wide mb-2">
            Full Legal Name
          </label>
          <div className="relative group">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              {/* User Icon */}
              <svg className="h-5 w-5 text-gray-300 group-focus-within:text-[#FF2B2B] transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
            <input
              type="text"
              placeholder="Somchai Phoenix"
              className="w-full rounded-xl border border-gray-200 bg-gray-50/50 pl-11 pr-4 py-3.5 text-sm font-medium text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#FF2B2B] focus:bg-white transition-all shadow-sm"
            />
          </div>
        </div>

        {/* WORK EMAIL */}
        <div>
          <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wide mb-2">
            Work Email
          </label>
          <div className="relative group">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              {/* Mail Icon */}
              <svg className="h-5 w-5 text-gray-300 group-focus-within:text-[#FF2B2B] transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <input
              type="email"
              placeholder="somchai@pulse.com"
              className="w-full rounded-xl border border-gray-200 bg-gray-50/50 pl-11 pr-4 py-3.5 text-sm font-medium text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#FF2B2B] focus:bg-white transition-all shadow-sm"
            />
          </div>
        </div>

        {/* SYSTEM PASSWORD */}
        <div>
          <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wide mb-2">
            System Password
          </label>
          <div className="relative group">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
               {/* Lock Icon */}
               <svg className="h-5 w-5 text-gray-300 group-focus-within:text-[#FF2B2B] transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <input
              type="password"
              placeholder="••••••••••••"
              className="w-full rounded-xl border border-gray-200 bg-gray-50/50 pl-11 pr-4 py-3.5 text-sm font-medium text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#FF2B2B] focus:bg-white transition-all shadow-sm"
            />
          </div>
        </div>

        {/* BUTTON */}
        <button
          type="submit"
          className="w-full mt-4 rounded-full bg-[#FF2B2B] py-4 text-white font-bold text-sm hover:bg-red-600 transition-all shadow-[0_10px_30px_rgba(255,43,43,0.3)] hover:shadow-[0_10px_30px_rgba(255,43,43,0.5)] active:scale-[0.98] flex items-center justify-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
          </svg>
          Initialize Registration
        </button>
      </form>
    </div>
  );
}