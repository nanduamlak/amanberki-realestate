import { NextResponse } from "next/server";
import { jwtVerify } from "jose";
import { cookies } from "next/headers";
import { query } from "@/lib/db";

// Always prefer the env var; fall back to the same default as middleware
const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET ?? "super-secret-jwt-key-change-me-in-production"
);

export async function GET() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("auth_token")?.value;

    if (!token) {
      return NextResponse.json({ user: null }, { status: 401 });
    }

    const { payload } = await jwtVerify(token, JWT_SECRET);

    const userId = payload.sub as string;
    if (!userId) {
      return NextResponse.json({ user: null }, { status: 401 });
    }

    // Always fetch the CURRENT role from the DB, not the stale JWT claim.
    // This ensures migrated roles (admin → super_admin) are reflected immediately
    // without requiring the user to log out and back in.
    const result = await query(
      "SELECT name, email, role FROM users WHERE id = $1",
      [userId]
    );

    if (result.rows.length === 0) {
      return NextResponse.json({ user: null }, { status: 401 });
    }

    const dbUser = result.rows[0];

    return NextResponse.json({
      user: {
        name:  dbUser.name  as string,
        email: dbUser.email as string,
        role:  dbUser.role  as string,   // ← live DB value, always current
      },
    });
  } catch {
    return NextResponse.json({ user: null }, { status: 401 });
  }
}
