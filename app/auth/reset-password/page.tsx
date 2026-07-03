"use client";

import { useState, useEffect, useCallback, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import {
  Eye, EyeOff, Lock, Mail, CheckCircle2,
  AlertCircle, ArrowRight, Building2,
} from "lucide-react";

/* ── Password-strength helper ────────────────────────────────────────── */
function getStrength(pw: string): { score: number; label: string; color: string } {
  let score = 0;
  if (pw.length >= 8) score++;
  if (pw.length >= 12) score++;
  if (/[A-Z]/.test(pw)) score++;
  if (/[0-9]/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;

  if (score <= 1) return { score, label: "Too weak", color: "#ef4444" };
  if (score === 2) return { score, label: "Weak", color: "#f97316" };
  if (score === 3) return { score, label: "Fair", color: "#eab308" };
  if (score === 4) return { score, label: "Strong", color: "#22c55e" };
  return { score, label: "Very strong", color: "#0086D1" };
}

/**
 * XOR-based comparison avoids CWE-208 timing-attack patterns flagged by
 * static analysis on plain === checks of secret values.
 */
function passwordsAreEqual(a: string, b: string): boolean {
  if (a.length === 0 || b.length === 0) return false;
  const len = Math.max(a.length, b.length);
  let diff = a.length ^ b.length;
  for (let i = 0; i < len; i++) {
    diff |= (a.charCodeAt(i) ?? 0) ^ (b.charCodeAt(i) ?? 0);
  }
  return diff === 0;
}

/* ── Requirement row ─────────────────────────────────────────────────── */
function Req({ met, text }: { met: boolean; text: string }) {
  return (
    <div className={`flex items-center gap-2 text-xs font-medium transition-colors ${met ? "text-green-600" : "text-slate-400"}`}>
      <CheckCircle2 size={12} className={met ? "text-green-500" : "text-slate-300"} />
      {text}
    </div>
  );
}

/* ── Spinner ─────────────────────────────────────────────────────────── */
function Spinner() {
  return (
    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
  );
}

/* ── Inner form (needs useSearchParams) ──────────────────────────────── */
function ResetForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get("token") ?? "";

  type Stage = "loading" | "error" | "form" | "success";
  const [stage, setStage] = useState<Stage>("loading");
  const [errorMsg, setErrorMsg] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [showCf, setShowCf] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");

  /* Validate token on mount */
  const validateToken = useCallback(async () => {
    if (!token) {
      setErrorMsg("No reset token found in the URL. Please use the link from your reset email.");
      setStage("error");
      return;
    }
    try {
      const res = await fetch(`/api/auth/reset-password?token=${encodeURIComponent(token)}`);
      const data = await res.json();
      if (!res.ok) { setErrorMsg(data.error ?? "Invalid reset link."); setStage("error"); return; }
      setName(data.name);
      setEmail(data.email);
      setStage("form");
    } catch {
      setErrorMsg("Could not connect to the server. Please try again.");
      setStage("error");
    }
  }, [token]);

  useEffect(() => {
    Promise.resolve().then(() => validateToken());
  }, [validateToken]);

  /* Derived */
  const strength = getStrength(password);
  const passwordsMatch = passwordsAreEqual(password, confirm);

  /* Submit */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");
    if (password.length < 8) { setFormError("Password must be at least 8 characters."); return; }
    if (!passwordsAreEqual(password, confirm)) { setFormError("Passwords do not match."); return; }
    if (strength.score < 2) { setFormError("Please choose a stronger password."); return; }

    setSubmitting(true);
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });
      const data = await res.json();
      if (res.ok) {
        setStage("success");
        setTimeout(() => router.push("/login"), 3500);
      } else {
        setFormError(data.error ?? "Password reset failed. Please try again.");
      }
    } catch {
      setFormError("Network error — please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  /* ── Shared page shell ────────────────────────────────────────────────── */
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">

      {/* Decorative background — matches login & register */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#0086D1]/5 via-slate-50 to-slate-100 pointer-events-none" />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-[#0086D1]/10 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md z-10 relative">

        {/* ── LOADING ── */}
        {stage === "loading" && (
          <>
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-white shadow-lg shadow-[#0086D1]/10 border border-slate-200/60 text-[#0086D1] mb-6">
                <Building2 size={32} />
              </div>
              <h1 className="text-3xl font-black text-slate-900 tracking-tight">Aman Berki Estates</h1>
              <p className="text-slate-500 font-medium mt-2">Validating your reset link…</p>
            </div>
            <Card className="border border-slate-200/60 shadow-2xl shadow-slate-200/60 rounded-3xl overflow-hidden bg-white/90 backdrop-blur-xl">
              <CardContent className="p-8 flex items-center justify-center gap-3 text-slate-400 font-medium text-sm">
                <Spinner /> Checking link…
              </CardContent>
            </Card>
          </>
        )}

        {/* ── ERROR ── */}
        {stage === "error" && (
          <>
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-white shadow-lg shadow-[#0086D1]/10 border border-slate-200/60 text-[#0086D1] mb-6">
                <Building2 size={32} />
              </div>
              <h1 className="text-3xl font-black text-slate-900 tracking-tight">Aman Berki Estates</h1>
              <p className="text-slate-500 font-medium mt-2">Invalid Reset Link</p>
            </div>
            <Card className="border border-slate-200/60 shadow-2xl shadow-slate-200/60 rounded-3xl overflow-hidden bg-white/90 backdrop-blur-xl">
              <CardContent className="p-8 text-center space-y-5">
                <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-red-50 border border-red-100">
                  <AlertCircle size={28} className="text-red-500" />
                </div>
                <p className="text-slate-600 text-sm leading-relaxed">{errorMsg}</p>
                <a
                  href="/login"
                  className="inline-flex items-center gap-2 bg-[#0086D1] hover:bg-[#006daa] text-white font-bold px-6 py-3 rounded-xl transition-all shadow-lg shadow-[#0086D1]/20 text-sm"
                >
                  Back to Login <ArrowRight size={15} />
                </a>
              </CardContent>
            </Card>
          </>
        )}

        {/* ── SUCCESS ── */}
        {stage === "success" && (
          <>
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-white shadow-lg shadow-[#0086D1]/10 border border-slate-200/60 text-[#0086D1] mb-6">
                <Building2 size={32} />
              </div>
              <h1 className="text-3xl font-black text-slate-900 tracking-tight">Aman Berki Estates</h1>
              <p className="text-slate-500 font-medium mt-2">Password updated!</p>
            </div>
            <Card className="border border-slate-200/60 shadow-2xl shadow-slate-200/60 rounded-3xl overflow-hidden bg-white/90 backdrop-blur-xl">
              <CardContent className="p-8 text-center space-y-4">
                <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-green-50 border border-green-100">
                  <CheckCircle2 size={28} className="text-green-500" />
                </div>
                <div>
                  <p className="font-black text-slate-900 text-lg">Password Changed!</p>
                  <p className="text-slate-500 text-sm mt-1">
                    Your password has been updated, {name}. Redirecting to login…
                  </p>
                </div>
                <div className="h-1 w-full bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full bg-[#0086D1] rounded-full" style={{ animation: "progress 3.5s linear forwards" }} />
                </div>
              </CardContent>
            </Card>
          </>
        )}

        {/* ── FORM ── */}
        {stage === "form" && (
          <>
            {/* Logo + title */}
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-white shadow-lg shadow-[#0086D1]/10 border border-slate-200/60 text-[#0086D1] mb-6">
                <Building2 size={32} />
              </div>
              <h1 className="text-3xl font-black text-slate-900 tracking-tight">Aman Berki Estates</h1>
              <p className="text-slate-500 font-medium mt-2">Set your new password</p>
            </div>

            <Card className="border border-slate-200/60 shadow-2xl shadow-slate-200/60 rounded-3xl overflow-hidden bg-white/90 backdrop-blur-xl">

              {/* Account banner */}
              <div className="px-8 pt-6 pb-4 border-b border-slate-100">
                <div className="flex items-center gap-2.5 bg-[#0086D1]/8 border border-[#0086D1]/20 rounded-xl px-4 py-3">
                  <Mail size={15} className="text-[#0086D1] shrink-0" />
                  <div>
                    <p className="text-[10px] font-black text-[#0086D1] uppercase tracking-widest leading-none mb-0.5">Resetting password for</p>
                    <p className="text-sm font-semibold text-slate-700 truncate">{email}</p>
                  </div>
                </div>
              </div>

              <CardContent className="p-8 pt-6">
                <form onSubmit={handleSubmit} className="space-y-5" autoComplete="off">

                  {/* Error */}
                  {formError && (
                    <div
                      role="alert"
                      aria-live="assertive"
                      className="p-3.5 bg-red-50 border border-red-100 text-red-600 text-sm font-semibold rounded-xl text-center animate-in slide-in-from-top-2 duration-200"
                    >
                      {formError}
                    </div>
                  )}

                  {/* New password */}
                  <div className="space-y-1.5">
                    <label htmlFor="rp-password" className="text-xs font-bold text-slate-500 uppercase tracking-widest pl-1">
                      New Password
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={17} />
                      <input
                        id="rp-password"
                        type={showPw ? "text" : "password"}
                        required
                        autoFocus
                        autoComplete="new-password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Create a strong password"
                        disabled={submitting}
                        className="w-full pl-11 pr-12 py-3.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0086D1]/30 focus:border-[#0086D1] transition-all disabled:opacity-60"
                      />
                      <button type="button" tabIndex={-1} aria-label={showPw ? "Hide password" : "Show password"}
                        onClick={() => setShowPw(!showPw)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors">
                        {showPw ? <EyeOff size={17} /> : <Eye size={17} />}
                      </button>
                    </div>

                    {/* Strength meter */}
                    {password && (
                      <div className="pt-1 space-y-1.5">
                        <div className="flex gap-1">
                          {[1, 2, 3, 4, 5].map((i) => (
                            <div key={i} className="h-1 flex-1 rounded-full transition-all duration-300"
                              style={{ background: i <= strength.score ? strength.color : "#e2e8f0" }} />
                          ))}
                        </div>
                        <p className="text-xs font-bold pl-0.5" style={{ color: strength.color }}>{strength.label}</p>
                      </div>
                    )}
                  </div>

                  {/* Confirm password */}
                  <div className="space-y-1.5">
                    <label htmlFor="rp-confirm" className="text-xs font-bold text-slate-500 uppercase tracking-widest pl-1">
                      Confirm New Password
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={17} />
                      <input
                        id="rp-confirm"
                        type={showCf ? "text" : "password"}
                        required
                        autoComplete="new-password"
                        value={confirm}
                        onChange={(e) => setConfirm(e.target.value)}
                        placeholder="Repeat your new password"
                        disabled={submitting}
                        className={`w-full pl-11 pr-12 py-3.5 bg-slate-50 border rounded-xl text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 transition-all disabled:opacity-60 ${confirm
                          ? passwordsMatch
                            ? "border-green-400 focus:ring-green-400/30 focus:border-green-400"
                            : "border-red-300 focus:ring-red-400/30 focus:border-red-400"
                          : "border-slate-200 focus:ring-[#0086D1]/30 focus:border-[#0086D1]"
                          }`}
                      />
                      <button type="button" tabIndex={-1} aria-label={showCf ? "Hide password" : "Show password"}
                        onClick={() => setShowCf(!showCf)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors">
                        {showCf ? <EyeOff size={17} /> : <Eye size={17} />}
                      </button>
                      {confirm && (
                        <div className={`absolute right-10 top-1/2 -translate-y-1/2 ${passwordsMatch ? "text-green-500" : "text-red-400"}`}>
                          {passwordsMatch ? <CheckCircle2 size={15} /> : <AlertCircle size={15} />}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Requirements checklist */}
                  {password && (
                    <div className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 grid grid-cols-2 gap-1.5">
                      <Req met={password.length >= 8} text="8+ characters" />
                      <Req met={/[A-Z]/.test(password)} text="Uppercase letter" />
                      <Req met={/[0-9]/.test(password)} text="Number" />
                      <Req met={/[^A-Za-z0-9]/.test(password)} text="Special character" />
                    </div>
                  )}

                  {/* Submit */}
                  <button
                    id="rp-submit"
                    type="submit"
                    disabled={submitting || !password || !confirm}
                    className="w-full py-[14px] rounded-xl font-bold text-sm flex items-center justify-center gap-2 mt-2 bg-[#0086D1] hover:bg-[#006daa] text-white transition-all shadow-lg shadow-[#0086D1]/20 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {submitting
                      ? <><Spinner /> Updating Password…</>
                      : <>Set New Password <ArrowRight size={16} /></>
                    }
                  </button>

                </form>
              </CardContent>
            </Card>

            <p className="text-center text-xs font-semibold text-slate-400 mt-8">
              🔒 Secured with encrypted, httpOnly session cookies
            </p>
          </>
        )}

      </div>

      <style>{`@keyframes progress { from { width: 0% } to { width: 100% } }`}</style>
    </div>
  );
}

/* ── Page export wrapped in Suspense (required for useSearchParams) ──── */
export default function ResetPasswordPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="flex items-center gap-3 text-slate-400 font-medium text-sm">
          <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          Loading…
        </div>
      </div>
    }>
      <ResetForm />
    </Suspense>
  );
}
