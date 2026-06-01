/**
 * Role-Based Access Control — single source of truth.
 * Used by: middleware, API routes, Sidebar, page components.
 */

export type AppRole = "super_admin" | "admin" | "user";

// ── Permission flags ───────────────────────────────────────────────────────────
export interface RolePermissions {
  // Navigation
  canAccessDashboard: boolean;
  canAccessProperties: boolean;
  canAccessReports: boolean;
  canAccessUserManagement: boolean;
  canAccessSystemLogs: boolean;       // super_admin only
  canAccessPerformance: boolean;      // super_admin only

  // Site Map interactions
  canDrawBlocks: boolean;             // super_admin only (technical)
  canBulkUpdateStatus: boolean;       // super_admin + admin
  canExportPrint: boolean;            // super_admin + admin
  canUseAnalytics: boolean;           // super_admin + admin

  // Data mutations
  canEditHotspots: boolean;           // super_admin only
  canManageUsers: boolean;            // super_admin + admin
}

// ── Permission matrix ──────────────────────────────────────────────────────────
export const ROLE_PERMISSIONS: Record<AppRole, RolePermissions> = {
  super_admin: {
    canAccessDashboard: true,
    canAccessProperties: true,
    canAccessReports: true,
    canAccessUserManagement: true,
    canAccessSystemLogs: true,
    canAccessPerformance: true,
    canDrawBlocks: true,
    canBulkUpdateStatus: true,
    canExportPrint: true,
    canUseAnalytics: true,
    canEditHotspots: true,
    canManageUsers: true,
  },
  admin: {
    canAccessDashboard: true,
    canAccessProperties: true,
    canAccessReports: true,
    canAccessUserManagement: true,
    canAccessSystemLogs: false,       // ← excluded for admin
    canAccessPerformance: false,      // ← excluded for admin
    canDrawBlocks: false,             // ← technical operation, super_admin only
    canBulkUpdateStatus: true,
    canExportPrint: true,
    canUseAnalytics: true,
    canEditHotspots: false,
    canManageUsers: true,
  },
  user: {
    canAccessDashboard: true,
    canAccessProperties: true,
    canAccessReports: false,
    canAccessUserManagement: false,
    canAccessSystemLogs: false,
    canAccessPerformance: false,
    canDrawBlocks: false,
    canBulkUpdateStatus: false,
    canExportPrint: false,
    canUseAnalytics: false,
    canEditHotspots: false,
    canManageUsers: false,
  },
};

/** Safely resolve permissions — defaults to most-restrictive if role is unknown */
export function getPermissions(role: string | undefined): RolePermissions {
  if (role === "super_admin" || role === "admin" || role === "user") {
    return ROLE_PERMISSIONS[role];
  }
  // Legacy roles fall back to 'user' for safety
  return ROLE_PERMISSIONS["user"];
}

/** Route → minimum required role mapping for middleware enforcement */
export const PROTECTED_ROUTES: Record<string, AppRole[]> = {
  "/user-management": ["super_admin", "admin"],
  "/reports":         ["super_admin", "admin"],
  "/system-logs":     ["super_admin"],
  "/performance":     ["super_admin"],
};

/** API route protection map: method-level */
export const PROTECTED_API: Record<string, { methods: string[]; roles: AppRole[] }> = {
  "/api/hotspots": { methods: ["POST", "DELETE"], roles: ["super_admin"] },
  "/api/users":    { methods: ["POST", "PUT", "DELETE"], roles: ["super_admin", "admin"] },
};

export const ROLE_LABELS: Record<AppRole, string> = {
  super_admin: "Super Admin",
  admin:       "Admin",
  user:        "User",
};

export const ROLE_BADGE_COLORS: Record<AppRole, string> = {
  super_admin: "bg-purple-100 text-purple-700 border-purple-200",
  admin:       "bg-blue-100 text-blue-700 border-blue-200",
  user:        "bg-slate-100 text-slate-600 border-slate-200",
};
