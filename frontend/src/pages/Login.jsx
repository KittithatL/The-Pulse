import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { authAPI } from "../services/api";
import toast from "react-hot-toast";

import rocketImg from "../assets/Group 35.png";
import logoPImg from "../assets/Group 36.png";

export default function Login() {
  const navigate = useNavigate();

  const [form, setForm] = useState({ emailOrUsername: "", password: "", totp_code: "" });
  const [loading, setLoading] = useState(false);
  const [requires2FA, setRequires2FA] = useState(false);
  const [retryAfter, setRetryAfter] = useState(0);
  const [view, setView] = useState("login");

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (retryAfter > 0) return;
    setLoading(true);

    try {
      const res = await authAPI.login(form);
      const body = res.data;

      if (body.requires_2fa) {
        setRequires2FA(true);
        toast("Enter your 2FA code from your authenticator app");
        setLoading(false);
        return;
      }

      if (body.success) {
        const { user, token } = body.data;
        localStorage.setItem("token", token);
        localStorage.setItem("user", JSON.stringify(user));
        window.location.href = "/projects";
      }
    } catch (err) {
      const data = err.response?.data || {};
      if (err.response?.status === 429) {
        const secs = data.retry_after || 60;
        setRetryAfter(secs);
        const t = setInterval(() => {
          setRetryAfter((s) => { if (s <= 1) { clearInterval(t); return 0; } return s - 1; });
        }, 1000);
        toast.error(data.message || "Too many attempts. Please wait.");
      } else {
        toast.error(data.message || "Login failed");
      }
    }
    setLoading(false);
  };

  const handleForgot = async (e) => {
    e.preventDefault();
    if (!form.emailOrUsername) { toast.error("Enter your email address first"); return; }
    setLoading(true);
    try {
      await authAPI.forgotPassword(form.emailOrUsername);
      setView("forgot_sent");
    } catch { toast.error("Failed to send reset email"); }
    setLoading(false);
  };

  if (view === "forgot" || view === "forgot_sent") {
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

          {view === "forgot_sent" ? (
            <div className="text-center">
              <div className="text-5xl mb-4">📬</div>
              <h1 className="text-3xl font-extrabold tracking-tight text-black mb-3">Check your inbox</h1>
              <p className="text-slate-400 font-semibold mb-8">
                If that email exists, a reset link has been sent. It expires in <b>1 hour</b>.
              </p>
              <button onClick={() => setView("login")} className="font-extrabold text-red-600 hover:opacity-80 text-sm">
                ← Back to Login
              </button>
            </div>
          ) : (
            <>
              <h1 className="text-3xl font-extrabold tracking-tight text-black mb-2">Reset Password</h1>
              <p className="text-slate-400 font-semibold mb-8">Enter your email and we'll send a reset link.</p>
              <form onSubmit={handleForgot} className="space-y-5">
                <div>
                  <label className="text-sm font-extrabold tracking-[0.18em] text-slate-400">EMAIL ADDRESS</label>
                  <div className="mt-2 flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-4 shadow-sm">
                    <div className="grid h-11 w-11 place-items-center rounded-lg bg-slate-100">
                      <svg viewBox="0 0 24 24" className="h-6 w-6 text-slate-400" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M4 6h16v12H4z" /><path d="m22 6-10 7L2 6" />
                      </svg>
                    </div>
                    <input type="text" name="emailOrUsername" value={form.emailOrUsername} onChange={handleChange}
                      placeholder="jira.pulse@nexus.com" required
                      className="w-full bg-transparent text-lg font-semibold text-slate-700 outline-none placeholder:text-slate-400" />
                  </div>
                </div>
                <button type="submit" disabled={loading}
                  className="flex w-full items-center justify-center rounded-full bg-red-600 py-5 text-xl font-extrabold text-white shadow-[0_18px_40px_rgba(255,0,0,0.35)] hover:brightness-110 disabled:opacity-60">
                  {loading ? "Sending..." : "Send Reset Link"}
                </button>
                <div className="text-center text-sm font-semibold text-slate-400">
                  <button type="button" onClick={() => setView("login")} className="font-extrabold text-red-600 hover:opacity-80">
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

  return (
    <div className="min-h-screen w-full bg-white">
      <div className="mx-auto grid min-h-screen w-full max-w-[1400px] grid-cols-1 lg:grid-cols-2">

        <div className="flex items-center justify-center px-6 py-10 sm:px-10 lg:px-14">
          <div className="w-full max-w-md">

            <div className="mb-10 flex items-center gap-4">
              <img src={logoPImg} alt="The Pulse Logo" className="w-[105px] h-[105px] object-contain" />
              <div className="pt-1">
                <div className="text-4xl font-extrabold italic tracking-tight text-black">The Pulse</div>
                <div className="mt-1 text-xs font-extrabold tracking-[0.22em] text-slate-400">SMARTER PROJECT DNA</div>
              </div>
            </div>

            <h1 className="text-4xl font-extrabold tracking-tight text-black sm:text-5xl">Login to The Pulse</h1>
            <p className="mt-2 text-base font-semibold text-slate-400">Measure the heartbeat of your projects.</p>

            {retryAfter > 0 && (
              <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
                🔒 Too many failed attempts. Try again in <b>{retryAfter}s</b>.
              </div>
            )}

            <form onSubmit={handleSubmit} className="mt-8 space-y-6">
              <div>
                <label className="text-sm font-extrabold tracking-[0.18em] text-slate-400">EMAIL OR USERNAME</label>
                <div className="mt-2 flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-4 shadow-sm">
                  <div className="grid h-11 w-11 place-items-center rounded-lg bg-slate-100">
                    <svg viewBox="0 0 24 24" className="h-6 w-6 text-slate-400" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M4 6h16v12H4z" /><path d="m22 6-10 7L2 6" />
                    </svg>
                  </div>
                  <input type="text" name="emailOrUsername" value={form.emailOrUsername} onChange={handleChange}
                    placeholder="jira.pulse@nexus.com" required
                    className="w-full bg-transparent text-lg font-semibold text-slate-700 outline-none placeholder:text-slate-400" />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between">
                  <label className="text-sm font-extrabold tracking-[0.18em] text-slate-400">PASSWORD</label>
                  <button type="button" onClick={() => setView("forgot")}
                    className="text-xs font-extrabold tracking-[0.18em] text-red-600 hover:opacity-80">
                    FORGOT PASSWORD?
                  </button>
                </div>
                <div className="mt-2 flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-4 shadow-sm">
                  <div className="grid h-11 w-11 place-items-center rounded-lg bg-slate-100">
                    <svg viewBox="0 0 24 24" className="h-6 w-6 text-slate-400" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M7 11V8a5 5 0 0 1 10 0v3" /><path d="M6 11h12v10H6z" />
                    </svg>
                  </div>
                  <input type="password" name="password" value={form.password} onChange={handleChange}
                    placeholder="••••••••" required
                    className="w-full bg-transparent text-lg font-semibold text-slate-700 outline-none placeholder:text-slate-400" />
                </div>
              </div>

              {requires2FA && (
                <div>
                  <label className="text-sm font-extrabold tracking-[0.18em] text-slate-400">2FA CODE</label>
                  <p className="mt-1 text-xs font-semibold text-slate-400">Enter the 6-digit code from your authenticator app.</p>
                  <div className="mt-2 flex items-center gap-3 rounded-xl border-2 border-red-300 bg-white px-4 py-4 shadow-sm">
                    <div className="grid h-11 w-11 place-items-center rounded-lg bg-red-50">
                      <span className="text-lg">🔐</span>
                    </div>
                    <input type="text" name="totp_code" value={form.totp_code} onChange={handleChange}
                      placeholder="000000" maxLength={6} inputMode="numeric"
                      className="w-full bg-transparent text-2xl font-bold tracking-[0.4em] text-slate-700 outline-none placeholder:text-slate-300" />
                  </div>
                </div>
              )}

              <button type="submit" disabled={loading || retryAfter > 0}
                className="mt-2 flex w-full items-center justify-center gap-3 rounded-full bg-red-600 py-5 text-xl font-extrabold text-white shadow-[0_18px_40px_rgba(255,0,0,0.35)] hover:brightness-110 active:scale-[0.99] disabled:opacity-60">
                {loading ? "Authenticating..." : requires2FA ? "Verify & Enter" : "Initialize Session"}
              </button>

              <div className="pt-2 text-center text-sm font-semibold text-slate-400">
                No system access?{" "}
                <button type="button" onClick={() => navigate("/register")} className="font-extrabold text-red-600 hover:opacity-80">
                  Sign up
                </button>
              </div>
            </form>
          </div>
        </div>

        <div className="relative hidden items-center justify-center overflow-hidden bg-[#070D18] lg:flex">
          <div className="absolute inset-0 bg-gradient-to-b from-[#0B1426] via-[#070D18] to-[#060A12]" />
          <div className="relative flex w-full max-w-xl flex-col items-center px-10 text-center">
            <div className="relative mb-10">
              <img src={rocketImg} alt="Rocket" className="w-[203px] h-[208px] object-contain" />
            </div>
            <h2 className="text-6xl font-extrabold leading-[1.05] tracking-tight text-white">
              Measure the <br /> heartbeat of your
            </h2>
            <div className="mt-6 text-6xl font-extrabold tracking-tight">
              <span className="text-red-600">Projects</span>
              <span className="text-white">.</span>
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