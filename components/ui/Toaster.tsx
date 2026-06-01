"use client";
import { useEffect, useState, useCallback, useRef } from "react";
import { CheckCircle2, XCircle, AlertTriangle, Info, X } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ToastPayload, ToastType } from "@/lib/toast";

/* ── Per-type styles ─────────────────────────────────────────────────────── */
const STYLES: Record<ToastType, { border: string; icon: string; progress: string; iconBg: string }> = {
  success: { border: "border-l-green-500",  icon: "text-green-600",   progress: "bg-green-500",  iconBg: "bg-green-50" },
  error:   { border: "border-l-red-500",    icon: "text-red-600",     progress: "bg-red-500",    iconBg: "bg-red-50"   },
  warning: { border: "border-l-amber-500",  icon: "text-amber-600",   progress: "bg-amber-500",  iconBg: "bg-amber-50" },
  info:    { border: "border-l-[#0086D1]",  icon: "text-[#0086D1]",   progress: "bg-[#0086D1]",  iconBg: "bg-sky-50"   },
};
const ICONS: Record<ToastType, React.ElementType> = {
  success: CheckCircle2,
  error:   XCircle,
  warning: AlertTriangle,
  info:    Info,
};

/* ── Single toast item ───────────────────────────────────────────────────── */
function ToastItem({ toast, onRemove }: { toast: ToastPayload; onRemove: (id: number) => void }) {
  const [visible, setVisible] = useState(false);
  const [progress, setProgress] = useState(100);
  const startRef = useRef<number>(0);
  const rafRef   = useRef<number>(0);
  const style = STYLES[toast.type];
  const Icon  = ICONS[toast.type];

  const dismiss = useCallback(() => {
    setVisible(false);
    cancelAnimationFrame(rafRef.current);
    setTimeout(() => onRemove(toast.id), 350);
  }, [toast.id, onRemove]);

  useEffect(() => {
    // Animate in on next frame
    const t = requestAnimationFrame(() => setVisible(true));

    // Progress bar countdown via rAF
    startRef.current = performance.now();
    const tick = (now: number) => {
      const elapsed = now - startRef.current;
      const pct = Math.max(0, 100 - (elapsed / toast.duration) * 100);
      setProgress(pct);
      if (elapsed < toast.duration) {
        rafRef.current = requestAnimationFrame(tick);
      } else {
        dismiss();
      }
    };
    rafRef.current = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(t);
      cancelAnimationFrame(rafRef.current);
    };
  }, [toast.duration, dismiss]);

  return (
    <div
      className={cn(
        "pointer-events-auto w-full max-w-sm bg-white rounded-2xl shadow-2xl shadow-black/10 overflow-hidden border border-slate-100 border-l-4 transition-all duration-350 ease-out",
        style.border,
        visible ? "translate-x-0 opacity-100 scale-100" : "translate-x-full opacity-0 scale-95"
      )}
    >
      <div className="flex items-start gap-3 p-4 pr-10 relative">
        {/* Icon */}
        <div className={cn("shrink-0 h-8 w-8 rounded-xl flex items-center justify-center mt-0.5", style.iconBg)}>
          <Icon className={cn("h-4 w-4", style.icon)} />
        </div>

        {/* Message */}
        <div className="flex-1 pt-1">
          <p className="text-sm font-semibold text-slate-800 leading-snug">{toast.message}</p>
        </div>

        {/* Dismiss */}
        <button
          onClick={dismiss}
          className="absolute top-3 right-3 p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* Progress bar */}
      <div className="h-0.5 bg-slate-100 mx-4 mb-3 rounded-full overflow-hidden">
        <div
          className={cn("h-full rounded-full transition-none", style.progress)}
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
}

/* ── Toaster (mount this once in root layout) ────────────────────────────── */
export function Toaster() {
  const [toasts, setToasts] = useState<ToastPayload[]>([]);

  const remove = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  useEffect(() => {
    const handler = (e: Event) => {
      const payload = (e as CustomEvent<ToastPayload>).detail;
      setToasts((prev) => [...prev.slice(-4), payload]); // max 5 visible
    };
    window.addEventListener("app:toast", handler);
    return () => window.removeEventListener("app:toast", handler);
  }, []);

  return (
    <div
      aria-live="polite"
      aria-label="Notifications"
      className="fixed bottom-6 right-6 z-[9999] flex flex-col-reverse gap-3 pointer-events-none"
    >
      {toasts.map((t) => (
        <ToastItem key={t.id} toast={t} onRemove={remove} />
      ))}
    </div>
  );
}
