import { NextResponse } from "next/server";
import { query } from "@/lib/db";

/**
 * GET /api/roles/migrate
 * Idempotent — safe to run multiple times.
 * Updates the users table to support super_admin / admin / user roles.
 */
export async function GET() {
  try {
    // 1. Drop the old CHECK constraint and add the new one
    await query(`
      ALTER TABLE users
        DROP CONSTRAINT IF EXISTS users_role_check;
    `);

    await query(`
      ALTER TABLE users
        ADD CONSTRAINT users_role_check
        CHECK (role IN ('super_admin', 'admin', 'user'));
    `);

    // 2. Migrate legacy role names
    await query(`UPDATE users SET role = 'super_admin' WHERE role = 'admin';`);
    await query(`UPDATE users SET role = 'user'        WHERE role IN ('agent', 'viewer');`);

    // 3. Update the column default to 'user'
    await query(`ALTER TABLE users ALTER COLUMN role SET DEFAULT 'user';`);

    const result = await query(`
      SELECT role, COUNT(*) AS count FROM users GROUP BY role ORDER BY role;
    `);

    return NextResponse.json({
      success: true,
      message: "Role schema migrated to super_admin / admin / user.",
      roleCounts: result.rows,
    });
  } catch (error) {
    console.error("[RoleMigrate] Error:", error);
    return NextResponse.json({ error: "Migration failed", detail: String(error) }, { status: 500 });
  }
}
