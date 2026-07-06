import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/lib/apiAuth";
import { query } from "@/lib/db";

type Params = { params: Promise<{ id: string }> };

/**
 * PUT /api/attention-remarks/[id]
 * Edit own message body. Only the original author can edit.
 */
export async function PUT(req: NextRequest, { params }: Params) {
  try {
    const auth = await requireRole(["super_admin", "admin"]);
    if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status ?? 401 });

    const { id } = await params;
    const { body } = await req.json();
    if (!body?.trim()) {
      return NextResponse.json({ error: "Message body cannot be empty" }, { status: 400 });
    }

    // Verify ownership
    const own = await query(
      `SELECT created_by FROM attention_remarks WHERE id = $1 AND is_deleted = FALSE`,
      [id]
    );
    if (own.rows.length === 0) {
      return NextResponse.json({ error: "Message not found" }, { status: 404 });
    }
    if (own.rows[0].created_by !== auth.userId) {
      return NextResponse.json({ error: "Forbidden: you can only edit your own messages" }, { status: 403 });
    }

    const result = await query(
      `UPDATE attention_remarks
       SET body = $1, updated_at = NOW()
       WHERE id = $2
       RETURNING id, body, created_by AS "createdBy", created_by_name AS "createdByName",
                 created_by_role AS "createdByRole", created_at AS "createdAt",
                 updated_at AS "updatedAt",
                 (updated_at > created_at + interval '1 second') AS "isEdited"`,
      [body.trim(), id]
    );

    return NextResponse.json({ ...result.rows[0], isMine: true });
  } catch (err) {
    console.error("[API:attention-remarks] PUT:", err);
    return NextResponse.json({ error: "Database error" }, { status: 500 });
  }
}

/**
 * DELETE /api/attention-remarks/[id]
 * Soft-delete own message. Only the author can delete their own message.
 * Admins/super_admins can delete any message.
 */
export async function DELETE(req: NextRequest, { params }: Params) {
  try {
    const auth = await requireRole(["super_admin", "admin"]);
    if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status ?? 401 });

    const { id } = await params;

    // Verify ownership (admins can delete any)
    const own = await query(
      `SELECT created_by FROM attention_remarks WHERE id = $1 AND is_deleted = FALSE`,
      [id]
    );
    if (own.rows.length === 0) {
      return NextResponse.json({ error: "Message not found" }, { status: 404 });
    }

    const isOwner = own.rows[0].created_by === auth.userId;
    const isAdminRole = auth.role === "super_admin" || auth.role === "admin";

    if (!isOwner && !isAdminRole) {
      return NextResponse.json({ error: "Forbidden: you can only delete your own messages" }, { status: 403 });
    }

    await query(
      `UPDATE attention_remarks SET is_deleted = TRUE, updated_at = NOW() WHERE id = $1`,
      [id]
    );

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[API:attention-remarks] DELETE:", err);
    return NextResponse.json({ error: "Database error" }, { status: 500 });
  }
}
