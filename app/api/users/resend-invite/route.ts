import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";
import { requireRole } from "@/lib/apiAuth";
import { Resend } from "resend";
import crypto from "crypto";

/**
 * POST /api/users/resend-invite
 * Body: { userId }
 * Regenerates a registration token and re-sends the invitation email.
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

    if (user.is_registered) {
      return NextResponse.json({ error: "User has already completed registration" }, { status: 400 });
    }

    // Issue a fresh token (72 hours)
    const token = crypto.randomBytes(32).toString("hex");
    const expires = new Date(Date.now() + 72 * 60 * 60 * 1000);

    await query(
      "UPDATE users SET registration_token = $1, registration_token_expires = $2 WHERE id = $3",
      [token, expires, userId]
    );

    if (!process.env.RESEND_API_KEY) {
      return NextResponse.json({ error: "Email service not configured" }, { status: 500 });
    }

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
    const registrationLink = `${baseUrl}/auth/register?token=${token}`;

    const resend = new Resend(process.env.RESEND_API_KEY);
    const { error: emailError } = await resend.emails.send({
      from: "Aman Berki Estates <noreply@amanberkigroup.com>",
      to: user.email,
      subject: "Your Aman Berki Estates invitation (resent)",
      html: `
        <!DOCTYPE html>
        <html lang="en">
        <body style="margin:0;padding:0;background:#f1f5f9;font-family:Arial,sans-serif;">
          <table width="100%" cellpadding="0" cellspacing="0" style="padding:48px 16px;">
            <tr><td align="center">
              <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
                <tr>
                  <td style="background:linear-gradient(135deg,#0086D1 0%,#005fa3 100%);padding:40px 40px 32px;text-align:center;">
                    <h1 style="color:#ffffff;margin:0;font-size:24px;font-weight:800;">Aman Berki Estates</h1>
                    <p style="color:rgba(255,255,255,0.8);margin:8px 0 0;font-size:14px;">Property Management Platform</p>
                  </td>
                </tr>
                <tr>
                  <td style="padding:40px;">
                    <h2 style="color:#0f172a;margin:0 0 12px;font-size:20px;">New invitation link</h2>
                    <p style="color:#475569;font-size:15px;line-height:1.6;margin:0 0 24px;">
                      Hi <strong>${user.name}</strong>, here is your updated invitation link. The previous one has been invalidated.
                    </p>
                    <table cellpadding="0" cellspacing="0" style="margin:0 auto 32px;">
                      <tr>
                        <td style="background:#0086D1;border-radius:10px;">
                          <a href="${registrationLink}" style="display:inline-block;padding:14px 32px;color:#ffffff;font-size:15px;font-weight:700;text-decoration:none;">
                            Complete Registration →
                          </a>
                        </td>
                      </tr>
                    </table>
                    <p style="color:#94a3b8;font-size:12px;margin:0;line-height:1.6;">
                      This link expires in 72 hours.<br>
                      <a href="${registrationLink}" style="color:#0086D1;word-break:break-all;">${registrationLink}</a>
                    </p>
                  </td>
                </tr>
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
      console.error("[Resend Invite] Email error:", emailError);
      return NextResponse.json({ error: "Failed to send email" }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[Resend Invite]", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
