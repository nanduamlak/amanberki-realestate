import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/lib/apiAuth";
import { query } from "@/lib/db";

/**
 * GET /api/attention-remarks
 * Returns all non-deleted messages, ordered oldest-first (chat scroll order).
 * Each message includes `is_mine` based on the calling user.
 */
export async function GET() {
  try {
    const auth = await requireRole(["super_admin", "admin", "user"]);
    if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status ?? 401 });

    const result = await query(
      `SELECT
         id,
         body,
         created_by      AS "createdBy",
         created_by_name AS "createdByName",
         created_by_role AS "createdByRole",
         created_at      AS "createdAt",
         updated_at      AS "updatedAt",
         (updated_at > created_at + interval '1 second') AS "isEdited"
       FROM attention_remarks
       WHERE is_deleted = FALSE
       ORDER BY created_at ASC`
    );

    const userId = auth.userId ?? "";
    const messages = result.rows.map(row => ({
      ...row,
      isMine: row.createdBy === userId,
    }));

    return NextResponse.json(messages);
  } catch (err) {
    console.error("[API:attention-remarks] GET:", err);
    return NextResponse.json({ error: "Database error" }, { status: 500 });
  }
}

/**
 * POST /api/attention-remarks
 * Creates a new chat message. All roles permitted.
 */
export async function POST(req: NextRequest) {
  try {
    const auth = await requireRole(["super_admin", "admin", "user"]);
    if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status ?? 401 });

    const { body } = await req.json();
    if (!body?.trim()) {
      return NextResponse.json({ error: "Message body is required" }, { status: 400 });
    }

    // Fetch the sender's name from the users table
    const userRes = await query(
      `SELECT name, role FROM users WHERE id = $1`,
      [auth.userId]
    );
    const sender = userRes.rows[0];

    const result = await query(
      `INSERT INTO attention_remarks (body, created_by, created_by_name, created_by_role)
       VALUES ($1, $2, $3, $4)
       RETURNING id, body, created_by AS "createdBy", created_by_name AS "createdByName",
                 created_by_role AS "createdByRole", created_at AS "createdAt",
                 updated_at AS "updatedAt", FALSE AS "isEdited"`,
      [body.trim(), auth.userId, sender?.name ?? "Unknown", sender?.role ?? auth.role ?? "user"]
    );

    return NextResponse.json({ ...result.rows[0], isMine: true }, { status: 201 });
  } catch (err) {
    console.error("[API:attention-remarks] POST:", err);
    return NextResponse.json({ error: "Database error" }, { status: 500 });
  }
}
