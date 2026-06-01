"use client";
import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { User, LogOut, ShieldCheck, Database, Building2 } from "lucide-react";
import { useRole } from "@/lib/RoleContext";
import Link from "next/link";
import NotificationBell from "@/components/NotificationBell";

function getRoleLabel(role: string): string {
  const labels: Record<string, string> = {
    super_admin: "Super Administrator",
    admin: "Administrator",
    user: "User",
    agent: "Sales Agent",
    viewer: "Viewer",
  };
  return labels[role] ?? role.replace(/_/g, " ").toUpperCase();
}

function getInitials(name: string): string {
  return name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
}

export default function Navbar() {
  const { user, isSuperAdmin, isAdmin } = useRole();
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    function onOutsideClick(e: MouseEvent) {
      const target = e.target as Node;
      if (
        triggerRef.current && !triggerRef.current.contains(target) &&
        dropdownRef.current && !dropdownRef.current.contains(target)
      ) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onOutsideClick);
    return () => document.removeEventListener("mousedown", onOutsideClick);
  }, []);

  // Close on Escape
  useEffect(() => {
    function onKey(e: KeyboardEvent) { if (e.key === "Escape") setOpen(false); }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    window.location.href = "/login";
  };

  // Portal dropdown — rendered at <body> level, escapes all CSS stacking contexts
  const dropdown = open ? (
    <div
      ref={dropdownRef}
      className="fixed top-[68px] right-4 w-64 bg-white border border-slate-100 rounded-xl shadow-2xl shadow-black/10 z-[9999] overflow-hidden"
    >
      <div className="px-4 py-4 border-b border-slate-100">
        <div className="flex items-center gap-3">
          <div className="h-11 w-11 shrink-0 rounded-full bg-gradient-to-br from-[#0086D1] to-[#005fa3] flex items-center justify-center text-white font-bold text-base">
            {user ? getInitials(user.name) : <User className="h-5 w-5" />}
          </div>
          <div className="flex flex-col min-w-0">
            <p className="text-sm font-bold text-gray-900 truncate">{user?.name ?? "—"}</p>
            <p className="text-xs text-slate-500 font-medium truncate">{user?.email ?? "—"}</p>
            <div className="flex items-center gap-1 mt-1">
              <ShieldCheck size={11} className="text-[#0086D1] shrink-0" />
              <span className="text-[10px] font-bold text-[#0086D1] uppercase tracking-wider truncate">
                {user ? getRoleLabel(user.role) : "—"}
              </span>
            </div>
          </div>
        </div>
      </div>
      <div className="p-2">
        {/* <Link
          href="/properties"
          onClick={() => setOpen(false)}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-slate-700 hover:bg-slate-50 font-bold text-sm transition-colors"
        >
          <Building2 size={16} className="text-[#0086D1]" />
          Properties
          {(isSuperAdmin || isAdmin) && (
            <span className="ml-auto text-[9px] font-black uppercase tracking-wider bg-[#0086D1]/10 text-[#0086D1] px-1.5 py-0.5 rounded-full">Admin</span>
          )}
        </Link> */}
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-red-600 hover:bg-red-50 font-bold text-sm transition-colors"
        >
          <LogOut size={16} />
          Sign Out
        </button>
      </div>
    </div>
  ) : null;

  return (
    <header className="w-full border-b relative z-20 shadow-sm shrink-0" style={{ backgroundColor: '#ffffff' }}>
      <div className="flex h-16 items-center px-6 justify-between">

        {/* Company name */}
        <span className="text-xl font-black">
          Aman Berki Group
        </span>

        {/* Right: name + role pill + avatar */}
        <div className="flex items-center gap-4">
          {user && (
            <div className="hidden md:flex flex-col items-end">
              <span className="text-sm font-bold text-gray-900 leading-tight">{user.name}</span>
              <span className="mt-0.5 text-[10px] font-semibold text-[#0086D1] bg-[#0086D1]/10 px-2 py-0.5 rounded-full uppercase tracking-tight leading-tight">
                {getRoleLabel(user.role)} • Aman Berki Estates
              </span>
            </div>
          )}

          {/* Notification Bell */}
          <NotificationBell />

          {/* Avatar trigger */}
          <div
            ref={triggerRef}
            role="button"
            tabIndex={0}
            aria-expanded={open}
            aria-haspopup="true"
            onClick={() => setOpen((v) => !v)}
            onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") setOpen((v) => !v); }}
            className="cursor-pointer select-none"
          >
            <div className={`h-10 w-10 rounded-full border-2 p-0.5 transition-all ${open ? "border-[#0086D1]" : "border-[#0086D1]/30 hover:border-[#0086D1]"}`}>
              <div className="h-full w-full rounded-full bg-gradient-to-br from-[#0086D1] to-[#005fa3] flex items-center justify-center text-white shadow-inner">
                <User className="h-5 w-5" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Portal: rendered at document.body — immune to any parent CSS containment */}
      {typeof window !== "undefined" && createPortal(dropdown, document.body)}
    </header>
  );
}
