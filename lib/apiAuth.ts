/**
 * Shared server-side auth helper for API route handlers.
 * Usage:
 *   const { error, status, role } = await requireRole(request, ["super_admin", "admin"]);
 *   if (error) return NextResponse.json({ error }, { status });
 */
import { jwtVerify } from "jose";
import { cookies } from "next/headers";
import type { AppRole } from "@/lib/roles";

if (!process.env.JWT_SECRET) {
  throw new Error("[apiAuth] FATAL: JWT_SECRET environment variable is not set.");
}
const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET);

export interface AuthResult {
  error?: string;
  status?: number;
  role?: AppRole;
  userId?: string;
  email?: string;
}

export async function requireRole(
  allowedRoles: AppRole[]
): Promise<AuthResult> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("auth_token")?.value;
    if (!token) return { error: "Unauthorized", status: 401 };

    const { payload } = await jwtVerify(token, JWT_SECRET);
    const role = payload.role as AppRole | undefined;

    if (!role || !allowedRoles.includes(role)) {
      return { error: "Forbidden: insufficient role", status: 403 };
    }

    return {
      role,
      userId: payload.sub as string,
      email:  payload.email as string,
    };
  } catch {
    return { error: "Invalid or expired session", status: 401 };
  }
}
