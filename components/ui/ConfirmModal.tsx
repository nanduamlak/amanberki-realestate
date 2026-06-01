"use client";
import { useEffect, useRef } from "react";
import { AlertTriangle, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: "danger" | "warning" | "info";
  onConfirm: () => void;
  onCancel: () => void;
}

const VARIANT_STYLES = {
  danger: {
    icon: "bg-red-100 text-red-600",
    confirm: "bg-red-600 hover:bg-red-700 text-white shadow-red-500/20",
    border: "border-red-100",
  },
  warning: {
    icon: "bg-amber-100 text-amber-600",
    confirm: "bg-amber-500 hover:bg-amber-600 text-white shadow-amber-400/20",
    border: "border-amber-100",
  },
  info: {
    icon: "bg-[#0086D1]/10 text-[#0086D1]",
    confirm: "bg-[#0086D1] hover:bg-[#0070b0] text-white shadow-sky-500/20",
    border: "border-sky-100",
  },
};

export function ConfirmModal({
  isOpen,
  title,
  message,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  variant = "danger",
  onConfirm,
  onCancel,
}: ConfirmModalProps) {
  const styles = VARIANT_STYLES[variant];
  const cancelRef = useRef<HTMLButtonElement>(null);

  // Focus cancel button when modal opens (safe default)
  useEffect(() => {
    if (isOpen) setTimeout(() => cancelRef.current?.focus(), 50);
  }, [isOpen]);

  // Close on Escape
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onCancel(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [isOpen, onCancel]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-150"
        onClick={onCancel}
      />

      {/* Panel */}
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden animate-in zoom-in-95 fade-in duration-200">
        {/* Header */}
        <div className={cn("px-6 pt-6 pb-4 border-b", styles.border)}>
          <div className="flex items-start gap-4">
            <div className={cn("shrink-0 h-11 w-11 rounded-2xl flex items-center justify-center", styles.icon)}>
              <AlertTriangle className="h-5 w-5" />
            </div>
            <div className="flex-1 min-w-0 pt-0.5">
              <h3 className="text-base font-black text-slate-900 leading-tight">{title}</h3>
              <p className="text-sm text-slate-500 font-medium mt-1 leading-relaxed">{message}</p>
            </div>
            <button
              onClick={onCancel}
              className="shrink-0 p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Actions */}
        <div className="px-6 py-4 flex gap-3">
          <button
            ref={cancelRef}
            onClick={onCancel}
            className="flex-1 bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 font-bold px-4 py-2.5 rounded-xl text-sm transition-colors"
          >
            {cancelLabel}
          </button>
          <button
            onClick={onConfirm}
            className={cn(
              "flex-1 font-bold px-4 py-2.5 rounded-xl text-sm transition-colors shadow-lg",
              styles.confirm
            )}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
