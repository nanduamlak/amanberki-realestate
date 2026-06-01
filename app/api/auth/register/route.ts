import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";
import bcrypt from "bcryptjs";

/**
 * GET /api/auth/register?token=...
 * Validates the registration token and returns the pre-filled user info
 * (name + email) so the front-end can pre-populate the form.
 */
export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get("token");

  if (!token) {
    return NextResponse.json({ error: "Registration token is required" }, { status: 400 });
  }

  try {
    const res = await query(
      `SELECT id, name, email, registration_token_expires
         FROM users
        WHERE registration_token = $1
          AND is_registered = FALSE`,
      [token]
    );

    if (res.rows.length === 0) {
      return NextResponse.json({ error: "Invalid or already-used registration link" }, { status: 404 });
    }

    const user = res.rows[0];

    if (new Date(user.registration_token_expires) < new Date()) {
      return NextResponse.json({ error: "This registration link has expired. Please ask an admin to resend it." }, { status: 410 });
    }

    return NextResponse.json({ name: user.name, email: user.email });
  } catch (error) {
    console.error("[Register GET]", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

/**
 * POST /api/auth/register
 * Body: { token, password, name }
 * Sets the user's password and marks the account as registered.
 */
export async function POST(request: NextRequest) {
  try {
    const { token, password, name } = await request.json();

    if (!token || !password || !name) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Basic password strength: minimum 8 chars
    if (password.length < 8) {
      return NextResponse.json({ error: "Password must be at least 8 characters" }, { status: 400 });
    }

    const res = await query(
      `SELECT id, registration_token_expires
         FROM users
        WHERE registration_token = $1
          AND is_registered = FALSE`,
      [token]
    );

    if (res.rows.length === 0) {
      return NextResponse.json({ error: "Invalid or already-used registration link" }, { status: 404 });
    }

    const user = res.rows[0];

    if (new Date(user.registration_token_expires) < new Date()) {
      return NextResponse.json({ error: "This registration link has expired" }, { status: 410 });
    }

    const hash = await bcrypt.hash(password, 12);

    await query(
      `UPDATE users
          SET password_hash              = $1,
              name                       = $2,
              is_registered              = TRUE,
              registration_token         = NULL,
              registration_token_expires = NULL,
              is_active                  = TRUE
        WHERE id = $3`,
      [hash, name, user.id]
    );

    return NextResponse.json({ success: true, message: "Account activated successfully" });
  } catch (error) {
    console.error("[Register POST]", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
