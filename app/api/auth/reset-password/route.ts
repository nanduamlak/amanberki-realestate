import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";
import bcrypt from "bcryptjs";

/**
 * GET /api/auth/reset-password?token=...
 * Validates the reset token and returns the user's name + email for the form.
 */
export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get("token");

  if (!token) {
    return NextResponse.json({ error: "Reset token is required" }, { status: 400 });
  }

  try {
    const res = await query(
      `SELECT id, name, email, reset_token_expires
         FROM users
        WHERE reset_token = $1`,
      [token]
    );

    if (res.rows.length === 0) {
      return NextResponse.json({ error: "Invalid or already-used reset link" }, { status: 404 });
    }

    const user = res.rows[0];

    if (new Date(user.reset_token_expires) < new Date()) {
      return NextResponse.json(
        { error: "This reset link has expired. Please ask an admin to send a new one." },
        { status: 410 }
      );
    }

    return NextResponse.json({ name: user.name, email: user.email });
  } catch (error) {
    console.error("[Reset GET]", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

/**
 * POST /api/auth/reset-password
 * Body: { token, password }
 * Sets a new password and clears the reset token.
 */
export async function POST(request: NextRequest) {
  try {
    const { token, password } = await request.json();

    if (!token || !password) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    if (password.length < 8) {
      return NextResponse.json({ error: "Password must be at least 8 characters" }, { status: 400 });
    }

    const res = await query(
      `SELECT id, reset_token_expires
         FROM users
        WHERE reset_token = $1`,
      [token]
    );

    if (res.rows.length === 0) {
      return NextResponse.json({ error: "Invalid or already-used reset link" }, { status: 404 });
    }

    const user = res.rows[0];

    if (new Date(user.reset_token_expires) < new Date()) {
      return NextResponse.json({ error: "This reset link has expired" }, { status: 410 });
    }

    const hash = await bcrypt.hash(password, 12);

    await query(
      `UPDATE users
          SET password_hash        = $1,
              reset_token          = NULL,
              reset_token_expires  = NULL
        WHERE id = $2`,
      [hash, user.id]
    );

    return NextResponse.json({ success: true, message: "Password updated successfully" });
  } catch (error) {
    console.error("[Reset POST]", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
