"use client";
import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { Bell, X, CheckCheck, AlertTriangle, Clock, Info, ArrowRight, ExternalLink } from "lucide-react";
import Link from "next/link";
import { useNotificationStore, type PaymentNotification } from "@/lib/useNotificationStore";

const SEV_CONFIG = {
  overdue: {
    dot: "bg-red-500",
    ring: "ring-red-200",
    icon: <AlertTriangle size={14} className="text-red-500" />,
    label: "Overdue",
    bg: "bg-red-50 border-red-100",
    text: "text-red-700",
    badge: "bg-red-500",
  },
  critical: {
    dot: "bg-orange-500",
    ring: "ring-orange-200",
    icon: <AlertTriangle size={14} className="text-orange-500" />,
    label: "Critical",
    bg: "bg-orange-50 border-orange-100",
    text: "text-orange-700",
    badge: "bg-orange-500",
  },
  warning: {
    dot: "bg-amber-500",
    ring: "ring-amber-200",
    icon: <Clock size={14} className="text-amber-500" />,
    label: "Upcoming",
    bg: "bg-amber-50 border-amber-100",
    text: "text-amber-700",
    badge: "bg-amber-500",
  },
  info: {
    dot: "bg-blue-400",
    ring: "ring-blue-100",
    icon: <Info size={14} className="text-blue-400" />,
    label: "Info",
    bg: "bg-blue-50 border-blue-100",
    text: "text-blue-700",
    badge: "bg-blue-400",
  },
};

function NotifCard({ n, onDismiss, onClose }: { n: PaymentNotification; onDismiss: (id: string) => void; onClose: () => void }) {
  const cfg = SEV_CONFIG[n.severity];
  const isOverdue = n.daysUntilDue < 0;
  const dayLabel = isOverdue
    ? `${Math.abs(n.daysUntilDue)}d overdue`
    : n.daysUntilDue === 0
      ? "Due today"
      : `Due in ${n.daysUntilDue}d`;

  return (
    <div className={`relative p-3.5 rounded-xl border ${cfg.bg} mb-2 last:mb-0 group`}>
      <button
        onClick={() => onDismiss(n.id)}
        className="absolute top-2 right-2 w-5 h-5 rounded-full hover:bg-black/10 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
      >
        <X size={11} className="text-slate-500" />
      </button>

      <div className="flex items-start gap-2.5 pr-5">
        <div className="shrink-0 mt-0.5">{cfg.icon}</div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-black text-slate-900 truncate">
              {n.blockId} · Plot #{n.plotNumber}
            </span>
            <span className={`text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded-full text-white ${cfg.badge}`}>
              {dayLabel}
            </span>
          </div>
          <p className="text-xs font-semibold text-slate-700 mt-0.5 truncate">
            {n.payment.description}
            {n.termLabel && n.termLabel !== "Term 1" && (
              <span className="ml-1.5 text-[9px] font-black bg-slate-200 text-slate-600 px-1.5 py-0.5 rounded-full uppercase tracking-wide">
                {n.termLabel}
              </span>
            )}
          </p>
          <div className="flex items-center justify-between mt-1.5">
            <span className={`text-xs font-black ${cfg.text}`}>
              {n.payment.currency} {n.payment.amount.toLocaleString()}
            </span>
            <Link
              href={`/property/${n.blockId}?plot=${n.plotNumber}`}
              onClick={onClose}
              className="flex items-center gap-0.5 text-[10px] font-bold text-[#0086D1] hover:underline"
            >
              View <ExternalLink size={9} />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function NotificationBell() {
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const { active, overdueCount, criticalCount, totalCount, dismiss, dismissAll, refresh } = useNotificationStore();

  // Close on outside click
  useEffect(() => {
    function handler(e: MouseEvent) {
      const t = e.target as Node;
      if (triggerRef.current?.contains(t) || panelRef.current?.contains(t)) return;
      setOpen(false);
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Auto-refresh on open
  useEffect(() => { if (open) refresh(); }, [open, refresh]);

  const badgeCount = totalCount;
  const badgeColor = overdueCount > 0 ? "bg-red-500" : criticalCount > 0 ? "bg-orange-500" : "bg-amber-400";

  const panel = open ? (
    <div
      ref={panelRef}
      className="fixed top-[68px] right-16 w-[360px] bg-white border border-slate-100 rounded-2xl shadow-2xl shadow-black/10 z-[9998] flex flex-col overflow-hidden"
      style={{ animation: "notifIn .18s cubic-bezier(.4,0,.2,1)", maxHeight: "calc(100vh - 88px)" }}
    >
      <style>{`@keyframes notifIn{from{opacity:0;transform:translateY(-8px) scale(.97)}to{opacity:1;transform:none}}`}</style>

      {/* Header */}
      <div className="px-4 py-3.5 border-b border-slate-100 flex items-center justify-between bg-slate-50 shrink-0">
        <div className="flex items-center gap-2">
          <Bell size={16} className="text-slate-700" />
          <h3 className="font-extrabold text-slate-900 text-sm">Payment Alerts</h3>
          {badgeCount > 0 && (
            <span className={`text-[10px] font-black text-white px-1.5 py-0.5 rounded-full ${badgeColor}`}>
              {badgeCount}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {badgeCount > 0 && (
            <button
              onClick={dismissAll}
              className="text-[10px] font-bold text-slate-400 hover:text-slate-700 flex items-center gap-1 transition-colors"
            >
              <CheckCheck size={12} /> Dismiss all
            </button>
          )}
          <button onClick={() => setOpen(false)} className="w-6 h-6 rounded-lg hover:bg-slate-200 flex items-center justify-center transition-colors">
            <X size={13} className="text-slate-500" />
          </button>
        </div>
      </div>

      {/* Summary pills */}
      {active.length > 0 && (
        <div className="px-4 py-2.5 flex gap-2 flex-wrap border-b border-slate-50 shrink-0">
          {overdueCount > 0 && (
            <span className="flex items-center gap-1 text-[10px] font-black text-red-700 bg-red-50 px-2 py-1 rounded-full border border-red-100">
              <span className="w-1.5 h-1.5 rounded-full bg-red-500 inline-block" />
              {overdueCount} Overdue
            </span>
          )}
          {criticalCount > 0 && (
            <span className="flex items-center gap-1 text-[10px] font-black text-orange-700 bg-orange-50 px-2 py-1 rounded-full border border-orange-100">
              <span className="w-1.5 h-1.5 rounded-full bg-orange-500 inline-block" />
              {criticalCount} Due within 7 days
            </span>
          )}
        </div>
      )}

      {/* Notification list */}
      <div className="flex-1 overflow-y-auto p-3">
        {active.length === 0 ? (
          <div className="py-12 text-center">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 flex items-center justify-center mx-auto mb-3">
              <CheckCheck size={22} className="text-emerald-500" />
            </div>
            <p className="font-bold text-slate-700 text-sm">All clear!</p>
            <p className="text-xs text-slate-400 mt-1">No overdue or upcoming payment alerts.</p>
          </div>
        ) : (
          active.map(n => <NotifCard key={n.id} n={n} onDismiss={dismiss} onClose={() => setOpen(false)} />)
        )}
      </div>

      {/* Footer */}
      <div className="px-4 py-3 border-t border-slate-100 bg-slate-50 shrink-0 flex items-center justify-between gap-2">
        <Link
          href="/properties"
          className="text-xs font-bold text-[#0086D1] flex items-center gap-1 hover:underline"
        >
          All Properties <ArrowRight size={11} />
        </Link>
        <span className="text-[10px] text-slate-400 font-medium italic">Overdue alerts emailed automatically</span>
      </div>
    </div>
  ) : null;

  return (
    <>
      <button
        ref={triggerRef}
        onClick={() => setOpen(v => !v)}
        className="relative w-10 h-10 rounded-full hover:bg-slate-100 flex items-center justify-center transition-all"
        aria-label="Payment notifications"
      >
        <Bell size={20} className={badgeCount > 0 && overdueCount > 0 ? "text-red-500" : "text-slate-600"} />
        {badgeCount > 0 && (
          <span className={`absolute top-1 right-1 min-w-[18px] h-[18px] flex items-center justify-center text-[10px] font-black text-white rounded-full px-1 ${badgeColor} ring-2 ring-white`}>
            {badgeCount > 99 ? "99+" : badgeCount}
          </span>
        )}
        {/* Pulse ring when overdue */}
        {overdueCount > 0 && (
          <span className="absolute top-1 right-1 w-[18px] h-[18px] rounded-full bg-red-400 opacity-40 animate-ping" />
        )}
      </button>
      {typeof window !== "undefined" && createPortal(panel, document.body)}
    </>
  );
}
