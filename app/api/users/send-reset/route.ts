import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";
import { requireRole } from "@/lib/apiAuth";
import { Resend } from "resend";
import crypto from "crypto";

/**
 * POST /api/users/send-reset
 * Body: { userId }
 * Generates a password-reset token and emails it to the user.
 * Only super_admin and admin can trigger this.
 */
export async function POST(request: NextRequest) {
  const auth = await requireRole(["super_admin", "admin"]);
  if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status });

  try {
    const { userId } = await request.json();

    if (!userId) {
      return NextResponse.json({ error: "userId is required" }, { status: 400 });
    }

    const res = await query(
      "SELECT id, name, email, role, is_registered FROM users WHERE id = $1",
      [userId]
    );

    if (res.rows.length === 0) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const user = res.rows[0];

    // Admins cannot reset super_admin passwords
    if (user.role === "super_admin" && auth.role !== "super_admin") {
      return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 });
    }

    // Only send reset links to fully registered users
    if (!user.is_registered) {
      return NextResponse.json(
        { error: "User has not completed registration yet. Use 'Resend Invite' instead." },
        { status: 400 }
      );
    }

    // Generate a secure, single-use reset token (valid for 2 hours)
    const token = crypto.randomBytes(32).toString("hex");
    const expires = new Date(Date.now() + 2 * 60 * 60 * 1000); // 2 h

    await query(
      "UPDATE users SET reset_token = $1, reset_token_expires = $2 WHERE id = $3",
      [token, expires, userId]
    );

    if (!process.env.RESEND_API_KEY) {
      console.warn("[send-reset] RESEND_API_KEY not set — email skipped");
      return NextResponse.json({ error: "Email service not configured" }, { status: 500 });
    }

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
    const resetLink = `${baseUrl}/auth/reset-password?token=${token}`;

    const resend = new Resend(process.env.RESEND_API_KEY);
    const { error: emailError } = await resend.emails.send({
      from: "Aman Berki Estates <noreply@amanberkigroup.com>",
      to: user.email,
      subject: "Password Reset Request — Aman Berki Estates",
      html: `
        <!DOCTYPE html>
        <html lang="en">
        <body style="margin:0;padding:0;background:#f1f5f9;font-family:Arial,sans-serif;">
          <table width="100%" cellpadding="0" cellspacing="0" style="padding:48px 16px;">
            <tr><td align="center">
              <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
                <!-- Header -->
                <tr>
                  <td style="background:linear-gradient(135deg,#0086D1 0%,#005fa3 100%);padding:40px 40px 32px;text-align:center;">
                    <h1 style="color:#ffffff;margin:0;font-size:24px;font-weight:800;letter-spacing:-0.5px;">Aman Berki Estates</h1>
                    <p style="color:rgba(255,255,255,0.8);margin:8px 0 0;font-size:14px;">Property Management Platform</p>
                  </td>
                </tr>
                <!-- Body -->
                <tr>
                  <td style="padding:40px;">
                    <h2 style="color:#0f172a;margin:0 0 12px;font-size:20px;">Password Reset Request</h2>
                    <p style="color:#475569;font-size:15px;line-height:1.6;margin:0 0 8px;">Hi <strong>${user.name}</strong>,</p>
                    <p style="color:#475569;font-size:15px;line-height:1.6;margin:0 0 24px;">
                      An administrator has requested a password reset for your account.
                      Click the button below to choose a new password.
                    </p>
                    <!-- CTA -->
                    <table cellpadding="0" cellspacing="0" style="margin:0 auto 32px;">
                      <tr>
                        <td style="background:#0086D1;border-radius:10px;">
                          <a href="${resetLink}" style="display:inline-block;padding:14px 32px;color:#ffffff;font-size:15px;font-weight:700;text-decoration:none;letter-spacing:0.3px;">
                            Reset My Password →
                          </a>
                        </td>
                      </tr>
                    </table>
                    <!-- Warning box -->
                    <div style="background:#fff7ed;border:1px solid #fed7aa;border-radius:10px;padding:16px 20px;margin-bottom:24px;">
                      <p style="color:#92400e;font-size:13px;margin:0 0 4px;font-weight:700;">⏱ This link expires in 2 hours</p>
                      <p style="color:#b45309;font-size:13px;margin:0;line-height:1.5;">If you did not request this reset, you can safely ignore this email — your password will not change.</p>
                    </div>
                    <!-- Fallback -->
                    <p style="color:#94a3b8;font-size:12px;margin:0;line-height:1.6;">
                      If the button doesn't work, copy this link into your browser:<br>
                      <a href="${resetLink}" style="color:#0086D1;word-break:break-all;">${resetLink}</a>
                    </p>
                  </td>
                </tr>
                <!-- Footer -->
                <tr>
                  <td style="background:#f8fafc;padding:20px 40px;border-top:1px solid #e2e8f0;text-align:center;">
                    <p style="color:#94a3b8;font-size:12px;margin:0;">Aman Berki Estates · Property Management Platform</p>
                  </td>
                </tr>
              </table>
            </td></tr>
          </table>
        </body>
        </html>
      `,
    });

    if (emailError) {
      console.error("[send-reset] Email error:", emailError);
      return NextResponse.json({ error: "Failed to send reset email" }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[send-reset]", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
