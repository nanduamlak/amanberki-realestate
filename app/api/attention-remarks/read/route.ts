import { NextResponse } from "next/server";
import { requireRole } from "@/lib/apiAuth";
import { query } from "@/lib/db";

/**
 * POST /api/attention-remarks/read
 * Updates (or inserts) the calling user's last_read_at timestamp to NOW().
 * Called when the user opens the Attention Remarks page.
 */
export async function POST() {
  try {
    const auth = await requireRole(["super_admin", "admin"]);
    if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status ?? 401 });

    await query(
      `INSERT INTO attention_remark_reads (user_id, last_read_at)
       VALUES ($1, NOW())
       ON CONFLICT (user_id) DO UPDATE SET last_read_at = NOW()`,
      [auth.userId]
    );

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[API:attention-remarks/read] POST:", err);
    return NextResponse.json({ error: "Database error" }, { status: 500 });
  }
}

/**
 * GET /api/attention-remarks/read
 * Returns the unread count for the calling user:
 *   count of messages posted by OTHER users AFTER this user's last_read_at.
 * Used by the sidebar badge.
 */
export async function GET() {
  try {
    const auth = await requireRole(["super_admin", "admin"]);
    if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status ?? 401 });

    const result = await query(
      `SELECT COUNT(*) AS count
       FROM attention_remarks ar
       LEFT JOIN attention_remark_reads arr ON arr.user_id = $1
       WHERE ar.is_deleted = FALSE
         AND ar.created_by <> $1
         AND (arr.last_read_at IS NULL OR ar.created_at > arr.last_read_at)`,
      [auth.userId]
    );

    return NextResponse.json({ count: parseInt(result.rows[0].count, 10) });
  } catch (err) {
    console.error("[API:attention-remarks/read] GET:", err);
    return NextResponse.json({ error: "Database error" }, { status: 500 });
  }
}
