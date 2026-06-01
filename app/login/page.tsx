"use client";
import { useState } from "react";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Lock, Mail, ArrowRight, Building2, Eye, EyeOff } from "lucide-react";

export default function LoginPage() {

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), password }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Authentication failed");
      }

      // Store a one-time welcome flag for the dashboard to consume
      sessionStorage.setItem("welcome_toast", `Welcome back, ${data.user?.name ?? ""}!`);
      // Use a hard navigation so RoleProvider re-mounts with the fresh auth cookie.
      // Client-side router.push keeps the provider alive with its stale null-user.
      window.location.href = "/dashboard";

    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Authentication failed";
      setError(msg);
      // Clear password on any failure
      setPassword("");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
      {/* Decorative background */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#0086D1]/5 via-slate-50 to-slate-100 pointer-events-none" />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-[#0086D1]/10 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md z-10 relative">
        {/* Logo + title */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-white shadow-lg shadow-[#0086D1]/10 border border-slate-200/60 text-[#0086D1] mb-6">
            <Building2 size={32} />
          </div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Aman Berki Estates</h1>
          <p className="text-slate-500 font-medium mt-2">Sign in to your account</p>
        </div>

        <Card className="border border-slate-200/60 shadow-2xl shadow-slate-200/60 rounded-3xl overflow-hidden bg-white/90 backdrop-blur-xl">
          <CardContent className="p-8">
            <form onSubmit={handleLogin} className="space-y-5" autoComplete="on">

              {/* Error message */}
              {error && (
                <div
                  role="alert"
                  aria-live="assertive"
                  className="p-3.5 bg-red-50 border border-red-100 text-red-600 text-sm font-semibold rounded-xl text-center animate-in slide-in-from-top-2 duration-200"
                >
                  {error}
                </div>
              )}

              {/* Email */}
              <div className="space-y-1.5">
                <label htmlFor="email" className="text-xs font-bold text-slate-500 uppercase tracking-widest pl-1">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={17} />
                  <input
                    id="email"
                    type="email"
                    name="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    autoComplete="email"
                    disabled={loading}
                    spellCheck={false}
                    maxLength={254}
                    className="w-full pl-11 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0086D1]/30 focus:border-[#0086D1] transition-all disabled:opacity-60"
                    placeholder="you@example.com"
                  />
                </div>
              </div>

              {/* Password */}
              <div className="space-y-1.5">
                <label htmlFor="password" className="text-xs font-bold text-slate-500 uppercase tracking-widest pl-1">
                  Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={17} />
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    name="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    autoComplete="current-password"
                    disabled={loading}
                    maxLength={128}
                    className="w-full pl-11 pr-12 py-3.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0086D1]/30 focus:border-[#0086D1] transition-all disabled:opacity-60"
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                  >
                    {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                  </button>
                </div>
              </div>

              {/* Submit */}
              <Button
                type="submit"
                disabled={loading || !email || !password}
                className="w-full py-6 rounded-xl font-bold text-sm flex items-center justify-center gap-2 mt-2 bg-[#0086D1] hover:bg-[#006daa] text-white transition-all shadow-lg shadow-[#0086D1]/20 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Verifying…
                  </>
                ) : (
                  <>Sign In <ArrowRight size={16} /></>
                )}
              </Button>

            </form>
          </CardContent>
        </Card>

        <p className="text-center text-xs font-semibold text-slate-400 mt-8">
          🔒 Secured with encrypted, httpOnly session cookies
        </p>
      </div>
    </div>
  );
}
