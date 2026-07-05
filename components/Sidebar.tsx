"use client";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import {
  Map, LayoutDashboard, List, ChevronLeft, ChevronRight,
  FileText, Users, Shield, Activity, LogOut, User as UserIcon,
  MessageSquareWarning, Building2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ROLE_LABELS, ROLE_BADGE_COLORS, type AppRole } from "@/lib/roles";
import { useRole } from "@/lib/RoleContext";
import { ConfirmModal } from "@/components/ui/ConfirmModal";
import { useState, useEffect } from "react";
import { subscribeUnreadCount } from "@/lib/useAttentionStore";

interface SidebarProps { isOpen: boolean; onToggle: () => void; }

const NAV_ITEMS = [
  { href: "/dashboard",          label: "Dashboard",  subLabel: "Overview",   icon: LayoutDashboard,      permission: null },
  { href: "/",                   label: "Site Map",   subLabel: "Master Plan", icon: Map,                  permission: null },
  { href: "/properties",         label: "Properties", subLabel: "Directory",  icon: List,                 permission: null },
  { href: "/commercial-assets",  label: "Assets",     subLabel: "Commercial", icon: Building2,            permission: null },
  { href: "/reports",            label: "Reports",    subLabel: "Analytics",  icon: FileText,             permission: "canAccessReports" },
  { href: "/attention-remarks",  label: "Attention",  subLabel: "Notices",    icon: MessageSquareWarning, permission: null, badge: true },
  { href: "/user-management",    label: "Users",      subLabel: "Management", icon: Users,                permission: "canAccessUserManagement" },
  { href: "/system-logs",        label: "System Logs",subLabel: "Technical",  icon: Activity,             permission: "canAccessSystemLogs" },
] as const;

export default function Sidebar({ isOpen, onToggle }: SidebarProps) {
  const path = usePathname();
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [attentionCount, setAttentionCount]       = useState(0);

  // Single shared auth fetch via RoleContext — no duplicate /api/auth/me calls
  const { user, permissions, isLoading } = useRole();

  const role = user?.role as AppRole | null ?? null;
  const roleBadgeClass = role ? ROLE_BADGE_COLORS[role] : ROLE_BADGE_COLORS["user"];
  const roleLabel = role ? ROLE_LABELS[role] : "";

  // Subscribe to global unread count (updated by the chat page + polling)
  useEffect(() => {
    const unsub = subscribeUnreadCount(setAttentionCount);
    return () => { unsub(); };
  }, []);

  // Poll unread count when not on the attention page (every 30s)
  useEffect(() => {
    if (path === "/attention-remarks") return; // page handles this itself
    async function fetchCount() {
      try {
        const res = await fetch("/api/attention-remarks/read");
        if (res.ok) {
          const data = await res.json();
          setAttentionCount(data.count ?? 0);
        }
      } catch { /* silent */ }
    }
    fetchCount();
    const interval = setInterval(fetchCount, 30_000);
    return () => clearInterval(interval);
  }, [path]);

  // Hide role-gated links until we know the actual role to avoid flash
  const visibleLinks = isLoading
    ? NAV_ITEMS.filter((item) => !item.permission)           // show base links while loading
    : NAV_ITEMS.filter(
      (item) => !item.permission || permissions[item.permission as keyof typeof permissions]
    );

  return (
    <>
      <aside className={cn(
        "h-screen flex flex-col z-40 bg-white border-r border-gray-100 shadow-2xl shadow-gray-200/50 transition-all duration-300 ease-in-out shrink-0 relative",
        isOpen ? "w-[280px] p-5" : "w-[90px] p-4"
      )}>

        {/* Logo */}
        <div className="flex items-center justify-center mb-6 shrink-0 overflow-hidden">
          <Image
            src="/Logo.png" alt="Aman Berki Properties"
            width={isOpen ? 40 : 48} height={isOpen ? 30 : 48}
            className="object-contain" priority
          />
        </div>

        {/* Nav links */}
        <nav className="flex-1 space-y-1 overflow-y-auto overflow-x-hidden">
          {visibleLinks.map(({ href, label, subLabel, icon: Icon, ...rest }) => {
            const hasBadge = "badge" in rest && rest.badge;
            const isActive = href === "/"
              ? path === "/" || path.startsWith("/property/")
              : href === "/commercial-assets"
                ? path === href || path.startsWith("/commercial-assets/")
                : path === href;


            return (
              <Link key={href} href={href} title={!isOpen ? label : undefined}
                className={cn(
                  "group flex items-center gap-3 rounded-xl transition-all duration-300 relative overflow-hidden",
                  isOpen ? "px-3 py-2.5" : "px-0 py-2.5 justify-center",
                  isActive
                    ? "bg-[#0086D1] text-white shadow-lg shadow-[#0086D1]/20"
                    : "hover:bg-[#0086D1]/5 text-[#0086D1]"
                )}>
                {/* Icon container */}
                <div className={cn(
                  "h-9 w-9 shrink-0 rounded-lg flex items-center justify-center transition-all duration-300 relative",
                  isActive ? "bg-white/20" : "bg-gray-100 group-hover:bg-white group-hover:shadow-md"
                )}>
                  <Icon className={cn("h-4 w-4", isActive ? "text-white" : "text-[#0086D1]")} />

                  {/* Badge on icon (collapsed sidebar) */}
                  {hasBadge && !isOpen && attentionCount > 0 && (
                    <span className="absolute -top-1 -right-1 min-w-[16px] h-4 flex items-center justify-center text-[9px] font-black text-white bg-red-500 rounded-full px-1 ring-2 ring-white animate-pulse">
                      {attentionCount > 99 ? "99+" : attentionCount}
                    </span>
                  )}
                </div>

                {isOpen && (
                  <div className="flex flex-col flex-1 overflow-hidden animate-in fade-in slide-in-from-left-2 duration-300">
                    <span className="text-[13px] font-black uppercase tracking-widest leading-tight whitespace-nowrap">{label}</span>
                    <span className={cn("text-[10px] font-bold whitespace-nowrap", isActive ? "text-white/70" : "text-gray-400")}>
                      {subLabel}
                    </span>
                  </div>
                )}

                {/* Badge pill (expanded sidebar) */}
                {hasBadge && isOpen && attentionCount > 0 && (
                  <span className="ml-auto shrink-0 min-w-[20px] h-5 flex items-center justify-center text-[10px] font-black text-white bg-red-500 rounded-full px-1.5 shadow-sm">
                    {attentionCount > 99 ? "99+" : attentionCount}
                  </span>
                )}

                {isOpen && (
                  <ChevronRight className={cn(
                    "h-3 w-3 transition-all duration-300 shrink-0",
                    hasBadge && attentionCount > 0 ? "hidden" : "",
                    isActive ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-2"
                  )} />
                )}
              </Link>
            );
          })}

          {/* Loading skeleton for role-gated links */}
          {isLoading && isOpen && (
            <div className="space-y-1 pt-1">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-[52px] rounded-xl bg-gray-100 animate-pulse opacity-50" />
              ))}
            </div>
          )}
        </nav>

        {/* Bottom: role badge + user card */}
        <div className="mt-auto pt-4 border-t border-gray-100 space-y-2">

          {/* Role badge */}
          {isOpen && !isLoading && role && (
            <div className={cn(
              "flex items-center justify-center gap-1.5 py-1.5 rounded-xl border text-[10px] font-black tracking-wider uppercase",
              roleBadgeClass
            )}>
              <Shield className="h-3 w-3 shrink-0" />
              {roleLabel}
            </div>
          )}

          {/* User card */}
          <div className={cn(
            "bg-gray-50/80 rounded-2xl border border-gray-100 relative overflow-hidden group hover:bg-white transition-all duration-500 hover:shadow-xl hover:shadow-gray-200/50",
            isOpen ? "p-3" : "p-1.5"
          )}>
            <div className="absolute -top-12 -right-12 h-32 w-32 bg-[#0086D1]/5 rounded-full blur-2xl group-hover:bg-[#0086D1]/10 transition-colors pointer-events-none" />
            <div className={cn("flex items-center gap-2.5 relative z-10", !isOpen && "justify-center")}>
              {/* Avatar */}
              <div className="h-9 w-9 shrink-0 rounded-xl bg-[#0086D1] flex items-center justify-center text-white shadow-lg shadow-[#0086D1]/20">
                {isLoading
                  ? <span className="text-xs font-bold animate-pulse">…</span>
                  : user?.name
                    ? <span className="text-xs font-black">{user.name.slice(0, 1).toUpperCase()}</span>
                    : <UserIcon className="h-4 w-4" />
                }
              </div>

              {isOpen && (
                <>
                  <div className="flex flex-col overflow-hidden animate-in fade-in slide-in-from-left-2 duration-300 flex-1 min-w-0">
                    <span className="text-[11px] font-black text-[#0086D1] whitespace-nowrap leading-none mb-1 truncate">
                      {isLoading ? "Loading…" : (user?.name ?? "Unknown")}
                    </span>
                    <span className="text-[9px] font-bold text-gray-400 whitespace-nowrap leading-none truncate">
                      {user?.email ?? ""}
                    </span>
                  </div>
                  {/* Sign out button */}
                  <button
                    onClick={() => setShowLogoutConfirm(true)}
                    title="Sign out"
                    className="shrink-0 h-7 w-7 rounded-lg bg-gray-100 hover:bg-red-50 hover:text-red-500 flex items-center justify-center transition-colors"
                  >
                    <LogOut className="h-3.5 w-3.5" />
                  </button>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Collapse toggle */}
        <button onClick={onToggle} title={isOpen ? "Collapse" : "Expand"}
          className="absolute right-0 translate-x-1/2 bottom-24 h-9 w-9 rounded-full bg-[#0086D1] shadow-xl shadow-[#0086D1]/30 flex items-center justify-center text-white hover:bg-[#006daa] transition-all duration-300 group z-[60] border-4 border-white">
          {isOpen
            ? <ChevronLeft className="h-4 w-4 transition-transform group-hover:scale-110" />
            : <ChevronRight className="h-4 w-4 transition-transform group-hover:scale-110" />
          }
        </button>
      </aside>

      {/* Logout Confirm */}
      <ConfirmModal
        isOpen={showLogoutConfirm}
        title="Sign Out"
        message="Are you sure you want to sign out of Aman Berki Properties?"
        confirmLabel="Yes, Sign Out"
        cancelLabel="Stay Signed In"
        variant="warning"
        onConfirm={() => {
          setShowLogoutConfirm(false);
          fetch("/api/auth/logout", { method: "POST" }).then(() => { window.location.href = "/login"; });
        }}
        onCancel={() => setShowLogoutConfirm(false)}
      />
    </>
  );
}
