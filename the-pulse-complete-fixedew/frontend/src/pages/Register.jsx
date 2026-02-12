import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

import rocketImg from "../assets/Group 35.png";
import logoPImg from "../assets/Group 36.png";

export default function RegisterPage() {
  const navigate = useNavigate();
  const { register } = useAuth();

  const [form, setForm] = useState({
    name: "",        // สำหรับ USERNAME (Backend รับผ่านคีย์ name)
    full_name: "",   // สำหรับ FULL NAME (Optional)
    email: "",
    password: "",
    confirmPassword: "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    // 1. Validation เบื้องต้น
    if (form.password !== form.confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if ((form.password || "").length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    setLoading(true);
    try {
      // 2. เตรียมข้อมูลส่งให้ Backend
      // เราส่งค่า Username จากช่อง 'name' ไป เพราะคอลัมน์ใน DB เราชื่อ name
      const payload = {
        name: form.name.trim(), 
        email: form.email.trim(),
        password: form.password,
      };

      const result = await register(payload);

      if (result?.success) {
        // ✅ สมัครสำเร็จ บังคับเปลี่ยนหน้าไปที่ /projects
        window.location.href = "/projects"; 
        return;
      }

      setError(result?.message || "Registration failed");
    } catch (err) {
      setError(err?.response?.data?.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-white">
      <div className="mx-auto grid min-h-screen w-full max-w-[1400px] grid-cols-1 lg:grid-cols-2">
        
        {/* ================= LEFT : FORM ================= */}
        <div className="flex items-center justify-center px-6 py-6 sm:px-10 sm:py-8 lg:px-14 lg:py-10">
          <div className="w-full max-w-md">
            
            {/* Brand Logo & Name */}
            <div className="mb-6 flex items-center gap-4">
              <img src={logoPImg} alt="Logo" className="h-[84px] w-[84px] object-contain" />
              <div className="pt-1">
                <div className="text-3xl font-extrabold italic text-black sm:text-4xl">The Pulse</div>
                <div className="mt-1 text-[11px] font-extrabold tracking-[0.22em] text-slate-400">SMARTER PROJECT DNA</div>
              </div>
            </div>

            <h1 className="text-3xl font-extrabold tracking-tight text-black sm:text-4xl">Request System Access</h1>
            <p className="mt-1 text-sm font-semibold text-slate-400 sm:text-base">Create your Pulse identity to enter the environment.</p>
            
            {/* Error Message Display */}
            {error && (
              <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="mt-5 space-y-4">
              
              {/* USERNAME (Mapped to 'name' for backend) */}
              <div>
                <label className="text-xs font-extrabold tracking-[0.18em] text-slate-400">USERNAME</label>
                <div className="mt-1 flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
                  <div className="grid h-9 w-9 place-items-center rounded-lg bg-slate-100">
                    <svg viewBox="0 0 24 24" className="h-5 w-5 text-slate-400" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" />
                    </svg>
                  </div>
                  <input
                    type="text"
                    name="name" 
                    value={form.name}
                    onChange={handleChange}
                    placeholder="jirayut011"
                    required
                    className="w-full bg-transparent text-base font-semibold text-slate-700 outline-none"
                  />
                </div>
              </div>

              {/* FULL NAME (OPTIONAL) */}
              <div>
                <label className="text-xs font-extrabold tracking-[0.18em] text-slate-400">FULL NAME (OPTIONAL)</label>
                <div className="mt-1 flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
                  <div className="grid h-9 w-9 place-items-center rounded-lg bg-slate-100">
                    <svg viewBox="0 0 24 24" className="h-5 w-5 text-slate-400" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M12 20h9" /><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z" />
                    </svg>
                  </div>
                  <input
                    type="text"
                    name="full_name"
                    value={form.full_name}
                    onChange={handleChange}
                    placeholder="Jirayut Miadkhong"
                    className="w-full bg-transparent text-base font-semibold text-slate-700 outline-none"
                  />
                </div>
              </div>

              {/* EMAIL */}
              <div>
                <label className="text-xs font-extrabold tracking-[0.18em] text-slate-400">EMAIL ADDRESS</label>
                <div className="mt-1 flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
                  <div className="grid h-9 w-9 place-items-center rounded-lg bg-slate-100">
                    <svg viewBox="0 0 24 24" className="h-5 w-5 text-slate-400" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M4 6h16v12H4z" /><path d="m22 6-10 7L2 6" />
                    </svg>
                  </div>
                  <input
                    type="email"
                    name="email"
                    value={form.email}
                    onChange={handleChange}
                    placeholder="jira.pulse@nexus.com"
                    required
                    className="w-full bg-transparent text-base font-semibold text-slate-700 outline-none"
                  />
                </div>
              </div>

              {/* PASSWORD */}
              <div>
                <label className="text-xs font-extrabold tracking-[0.18em] text-slate-400">PASSWORD</label>
                <div className="mt-1 flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
                  <div className="grid h-9 w-9 place-items-center rounded-lg bg-slate-100">
                    <svg viewBox="0 0 24 24" className="h-5 w-5 text-slate-400" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M7 11V8a5 5 0 0 1 10 0v3" /><path d="M6 11h12v10H6z" />
                    </svg>
                  </div>
                  <input
                    type="password"
                    name="password"
                    value={form.password}
                    onChange={handleChange}
                    placeholder="••••••••"
                    required
                    className="w-full bg-transparent text-base font-semibold text-slate-700 outline-none"
                  />
                </div>
              </div>

              {/* CONFIRM PASSWORD */}
              <div>
                <label className="text-xs font-extrabold tracking-[0.18em] text-slate-400">CONFIRM PASSWORD</label>
                <div className={`mt-1 flex items-center gap-3 rounded-xl border bg-white px-4 py-3 shadow-sm ${
                  form.confirmPassword && form.password !== form.confirmPassword ? "border-red-300" : "border-slate-200"
                }`}>
                  <div className="grid h-9 w-9 place-items-center rounded-lg bg-slate-100">
                    <svg viewBox="0 0 24 24" className="h-5 w-5 text-slate-400" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M20 6 9 17l-5-5" />
                    </svg>
                  </div>
                  <input
                    type="password"
                    name="confirmPassword"
                    value={form.confirmPassword}
                    onChange={handleChange}
                    placeholder="••••••••"
                    required
                    className="w-full bg-transparent text-base font-semibold text-slate-700 outline-none"
                  />
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="mt-2 flex w-full items-center justify-center gap-3 rounded-full bg-red-600 py-4 text-lg font-extrabold text-white shadow-[0_18px_40px_rgba(255,0,0,0.35)] hover:brightness-110 active:scale-[0.99] disabled:opacity-60"
              >
                {loading ? "Creating account..." : "Initialize Identity"}
              </button>

              {/* Back to Login Link */}
              <div className="pt-1 text-center text-sm font-semibold text-slate-400">
                Already have system access?{" "}
                <button type="button" onClick={() => navigate("/login")} className="font-extrabold text-red-600 hover:opacity-80">
                  Back to Login
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* ================= RIGHT : HERO SECTION ================= */}
        <div className="relative hidden items-center justify-center overflow-hidden bg-[#070D18] lg:flex">
          <div className="absolute inset-0 bg-gradient-to-b from-[#0B1426] via-[#070D18] to-[#060A12]" />
          <div className="relative flex w-full max-w-xl flex-col items-center px-10 text-center">
            <img src={rocketImg} alt="Rocket" className="w-[203px] h-[208px] object-contain mb-10" />
            <h2 className="text-6xl font-extrabold leading-[1.05] tracking-tight text-white">Measure the <br /> heartbeat of your</h2>
            <div className="mt-6 text-6xl font-extrabold tracking-tight">
              <span className="text-red-600">Projects</span><span className="text-white">.</span>
              <div className="mx-auto mt-2 h-[3px] w-44 bg-red-600" />
            </div>
            <p className="mt-10 max-w-md text-base font-semibold text-slate-400">
              The high-fidelity SaaS dashboard for teams that value transparency, ROT, and team pulse.
            </p>
          </div>
        </div>

      </div>
    </div>
  );
}