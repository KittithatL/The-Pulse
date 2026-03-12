import React, { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { authAPI } from "../services/api";
import toast from "react-hot-toast";
import logoPImg from "../assets/Group 36.png";

export default function ResetPassword() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");

  const [form, setForm] = useState({ new_password: "", confirm: "" });
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (!token) {
      toast.error("Invalid reset link");
      navigate("/login");
    }
  }, [token, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.new_password !== form.confirm) {
      toast.error("Passwords do not match");
      return;
    }
    if (form.new_password.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }

    setLoading(true);
    try {
      await authAPI.resetPassword(token, form.new_password);
      setDone(true);
      toast.success("Password reset successfully!");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to reset password");
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen w-full bg-white flex items-center justify-center px-6">
      <div className="w-full max-w-md">
        <div className="mb-10 flex items-center gap-4">
          <img src={logoPImg} alt="Logo" className="w-[84px] h-[84px] object-contain" />
          <div>
            <div className="text-3xl font-extrabold italic tracking-tight text-black">The Pulse</div>
            <div className="mt-1 text-xs font-extrabold tracking-[0.22em] text-slate-400">SMARTER PROJECT DNA</div>
          </div>
        </div>

        {done ? (
          <div className="text-center">
            <div className="text-5xl mb-4">✅</div>
            <h1 className="text-3xl font-extrabold tracking-tight text-black mb-3">Password Updated</h1>
            <p className="text-slate-400 font-semibold mb-8">Your password has been reset. You can now log in with your new password.</p>
            <button onClick={() => navigate("/login")}
              className="flex w-full items-center justify-center rounded-full bg-red-600 py-5 text-xl font-extrabold text-white shadow-[0_18px_40px_rgba(255,0,0,0.35)] hover:brightness-110">
              Go to Login
            </button>
          </div>
        ) : (
          <>
            <h1 className="text-3xl font-extrabold tracking-tight text-black mb-2">Set New Password</h1>
            <p className="text-slate-400 font-semibold mb-8">Choose a strong password for your Pulse account.</p>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="text-sm font-extrabold tracking-[0.18em] text-slate-400">NEW PASSWORD</label>
                <div className="mt-2 flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-4 shadow-sm">
                  <div className="grid h-11 w-11 place-items-center rounded-lg bg-slate-100">
                    <svg viewBox="0 0 24 24" className="h-6 w-6 text-slate-400" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M7 11V8a5 5 0 0 1 10 0v3" /><path d="M6 11h12v10H6z" />
                    </svg>
                  </div>
                  <input type="password" value={form.new_password} onChange={e => setForm(p => ({ ...p, new_password: e.target.value }))}
                    placeholder="••••••••" required minLength={6}
                    className="w-full bg-transparent text-lg font-semibold text-slate-700 outline-none placeholder:text-slate-400" />
                </div>
                <p className="mt-1 text-xs font-semibold text-slate-400">Minimum 6 characters.</p>
              </div>

              <div>
                <label className="text-sm font-extrabold tracking-[0.18em] text-slate-400">CONFIRM PASSWORD</label>
                <div className={`mt-2 flex items-center gap-3 rounded-xl bg-white px-4 py-4 shadow-sm ${form.confirm && form.new_password !== form.confirm ? "border-2 border-red-300" : "border border-slate-200"}`}>
                  <div className="grid h-11 w-11 place-items-center rounded-lg bg-slate-100">
                    <svg viewBox="0 0 24 24" className="h-6 w-6 text-slate-400" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M20 6 9 17l-5-5" />
                    </svg>
                  </div>
                  <input type="password" value={form.confirm} onChange={e => setForm(p => ({ ...p, confirm: e.target.value }))}
                    placeholder="••••••••" required
                    className="w-full bg-transparent text-lg font-semibold text-slate-700 outline-none placeholder:text-slate-400" />
                </div>
              </div>

              <button type="submit" disabled={loading}
                className="flex w-full items-center justify-center rounded-full bg-red-600 py-5 text-xl font-extrabold text-white shadow-[0_18px_40px_rgba(255,0,0,0.35)] hover:brightness-110 disabled:opacity-60">
                {loading ? "Resetting..." : "Reset Password"}
              </button>

              <div className="text-center text-sm font-semibold text-slate-400">
                <button type="button" onClick={() => navigate("/login")} className="font-extrabold text-red-600 hover:opacity-80">
                  ← Back to Login
                </button>
              </div>
            </form>
          </>
        )}
      </div>
    </div>
  );
}