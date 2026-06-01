import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import { requireRole } from "@/lib/apiAuth";
import bcrypt from "bcryptjs";

export async function PUT(request: Request, props: { params: Promise<{ id: string }> }) {
  const auth = await requireRole(["super_admin", "admin"]);
  if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status });
  
  const params = await props.params;
  const id = params.id;

  try {
    const { name, email, role, is_active, password } = await request.json();

    // Verify target user exists and get their current role
    const target = await query("SELECT role FROM users WHERE id = $1", [id]);
    if (target.rows.length === 0) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }
    
    const targetRole = target.rows[0].role;

    // Privilege checks
    if (targetRole === "super_admin" && auth.role !== "super_admin") {
      return NextResponse.json({ error: "You cannot edit a super_admin" }, { status: 403 });
    }
    if (role === "super_admin" && auth.role !== "super_admin") {
      return NextResponse.json({ error: "You cannot promote to super_admin" }, { status: 403 });
    }
    
    // Build update query dynamically
    const updates = [];
    const values = [];
    let idx = 1;

    if (name !== undefined) { updates.push(`name = $${idx++}`); values.push(name); }
    if (email !== undefined) { updates.push(`email = $${idx++}`); values.push(email); }
    if (role !== undefined) { updates.push(`role = $${idx++}`); values.push(role); }
    if (is_active !== undefined) { updates.push(`is_active = $${idx++}`); values.push(is_active); }
    
    if (password) {
      const hash = await bcrypt.hash(password, 12);
      updates.push(`password_hash = $${idx++}`); 
      values.push(hash);
    }

    if (updates.length === 0) {
      return NextResponse.json({ success: true });
    }

    values.push(id);
    const res = await query(
      `UPDATE users SET ${updates.join(", ")} WHERE id = $${idx} RETURNING id, name, email, role, is_active`,
      values
    );

    return NextResponse.json({ user: res.rows[0] });
  } catch (error) {
    console.error("[User PUT]", error);
    return NextResponse.json({ error: "Failed to update user" }, { status: 500 });
  }
}

export async function DELETE(request: Request, props: { params: Promise<{ id: string }> }) {
  const auth = await requireRole(["super_admin", "admin"]);
  if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const params = await props.params;
  const id = params.id;

  try {
    // Prevent self-deletion
    if (id === auth.userId) {
      return NextResponse.json({ error: "You cannot delete yourself" }, { status: 400 });
    }

    const target = await query("SELECT role FROM users WHERE id = $1", [id]);
    if (target.rows.length === 0) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }
    
    if (target.rows[0].role === "super_admin" && auth.role !== "super_admin") {
      return NextResponse.json({ error: "You cannot delete a super_admin" }, { status: 403 });
    }

    await query("DELETE FROM users WHERE id = $1", [id]);
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[User DELETE]", error);
    return NextResponse.json({ error: "Failed to delete user" }, { status: 500 });
  }
}
