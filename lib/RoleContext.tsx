"use client";
import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { usePathname } from "next/navigation";
import { getPermissions, type AppRole, type RolePermissions } from "@/lib/roles";

interface UserInfo {
  name: string;
  email: string;
  role: AppRole;
}

interface RoleContextValue {
  user: UserInfo | null;
  role: AppRole | null;
  permissions: RolePermissions;
  isLoading: boolean;
  isSuperAdmin: boolean;
  isAdmin: boolean;
  isUser: boolean;
}

const defaultPerms = getPermissions(undefined);

const RoleContext = createContext<RoleContextValue>({
  user: null,
  role: null,
  permissions: defaultPerms,
  isLoading: true,
  isSuperAdmin: false,
  isAdmin: false,
  isUser: true,
});

export function RoleProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const pathname = usePathname();

  useEffect(() => {
    // Skip re-fetching on the login page — the user is not authenticated there
    if (pathname === "/login") {
      Promise.resolve().then(() => {
        setUser(null);
        setIsLoading(false);
      });
      return;
    }

    Promise.resolve().then(() => {
      setIsLoading(true);
      fetch("/api/auth/me")
        .then((r) => r.json())
        .then((d) => setUser(d.user ?? null))
        .catch(() => setUser(null))
        .finally(() => setIsLoading(false));
    });
  }, [pathname]); // Re-fetch whenever the route changes

  const role = user?.role ?? null;
  const permissions = getPermissions(role ?? undefined);

  return (
    <RoleContext.Provider value={{
      user,
      role,
      permissions,
      isLoading,
      isSuperAdmin: role === "super_admin",
      isAdmin:      role === "admin",
      isUser:       role === "user" || role === null,
    }}>
      {children}
    </RoleContext.Provider>
  );
}

export function useRole() {
  return useContext(RoleContext);
}
