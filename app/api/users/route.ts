import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import { requireRole } from "@/lib/apiAuth";
import { Resend } from "resend";
import crypto from "crypto";

export async function GET() {
  const auth = await requireRole(["super_admin", "admin"]);
  if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status });

  try {
    const res = await query(
      "SELECT id, name, email, role, is_active, is_registered, created_at, last_login FROM users ORDER BY created_at DESC"
    );
    return NextResponse.json({ users: res.rows });
  } catch (error) {
    console.error("[Users GET]", error);
    return NextResponse.json({ error: "Failed to fetch users" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const auth = await requireRole(["super_admin", "admin"]);
  if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status });

  try {
    const { name, email, role } = await request.json();

    if (!name || !email || !role) {
      return NextResponse.json({ error: "Full Name, Email and Role are required" }, { status: 400 });
    }

    // Only super_admin can invite another super_admin
    if (role === "super_admin" && auth.role !== "super_admin") {
      return NextResponse.json({ error: "Only super_admin can create super_admin users" }, { status: 403 });
    }

    // Check existing
    const check = await query("SELECT id FROM users WHERE email = $1", [email]);
    if (check.rows.length > 0) {
      return NextResponse.json({ error: "Email already in use" }, { status: 400 });
    }

    // Generate a secure, single-use registration token (valid for 72 hours)
    const token = crypto.randomBytes(32).toString("hex");
    const expires = new Date(Date.now() + 72 * 60 * 60 * 1000); // 72 h

    const res = await query(
      `INSERT INTO users
         (name, email, password_hash, role, is_active, is_registered, registration_token, registration_token_expires)
       VALUES ($1, $2, $3, $4, TRUE, FALSE, $5, $6)
       RETURNING id, name, email, role, is_active, is_registered, created_at`,
      [name, email, "", role, token, expires]
    );

    const newUser = res.rows[0];

    // ── Send invitation email ───────────────────────────────────────────────
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
    const registrationLink = `${baseUrl}/auth/register?token=${token}`;

    if (!process.env.RESEND_API_KEY) {
      console.warn("[Users POST] RESEND_API_KEY not set — invitation email skipped");
    } else {
      const resend = new Resend(process.env.RESEND_API_KEY);
      const { error: emailError } = await resend.emails.send({
        from: "Aman Berki Estates <noreply@amanberkigroup.com>",
        to: email,
        subject: "You've been invited to Aman Berki Estates",
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
                      <h2 style="color:#0f172a;margin:0 0 12px;font-size:20px;">You've been invited! 🎉</h2>
                      <p style="color:#475569;font-size:15px;line-height:1.6;margin:0 0 8px;">Hi <strong>${name}</strong>,</p>
                      <p style="color:#475569;font-size:15px;line-height:1.6;margin:0 0 24px;">
                        An administrator has set up an account for you on the <strong>Aman Berki Estates</strong> platform 
                        with the role of <strong style="color:#0086D1;">${role.replace("_", " ").replace(/\b\w/g, (c: string) => c.toUpperCase())}</strong>.
                        Click the button below to complete your registration and set your password.
                      </p>
                      <!-- CTA Button -->
                      <table cellpadding="0" cellspacing="0" style="margin:0 auto 32px;">
                        <tr>
                          <td style="background:#0086D1;border-radius:10px;">
                            <a href="${registrationLink}" style="display:inline-block;padding:14px 32px;color:#ffffff;font-size:15px;font-weight:700;text-decoration:none;letter-spacing:0.3px;">
                              Complete Registration →
                            </a>
                          </td>
                        </tr>
                      </table>
                      <!-- Note -->
                      <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:10px;padding:16px 20px;margin-bottom:24px;">
                        <p style="color:#64748b;font-size:13px;margin:0 0 6px;font-weight:700;text-transform:uppercase;letter-spacing:0.05em;">⏱ Link expiry</p>
                        <p style="color:#475569;font-size:13px;margin:0;line-height:1.5;">This invitation link is valid for <strong>72 hours</strong>. After that, please contact your administrator for a new link.</p>
                      </div>
                      <!-- Fallback link -->
                      <p style="color:#94a3b8;font-size:12px;margin:0;line-height:1.6;">
                        If the button above doesn't work, copy and paste this link into your browser:<br>
                        <a href="${registrationLink}" style="color:#0086D1;word-break:break-all;">${registrationLink}</a>
                      </p>
                    </td>
                  </tr>
                  <!-- Footer -->
                  <tr>
                    <td style="background:#f8fafc;padding:20px 40px;border-top:1px solid #e2e8f0;text-align:center;">
                      <p style="color:#94a3b8;font-size:12px;margin:0;">
                        You received this email because an administrator invited you to Aman Berki Estates.<br>
                        If you weren't expecting this, you can safely ignore this email.
                      </p>
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
        console.error("[Users POST] Email send failed:", emailError);
        // Still return success — user was created; admin can resend later
      }
    }

    return NextResponse.json({ user: newUser, invited: true });
  } catch (error) {
    console.error("[Users POST]", error);
    return NextResponse.json({ error: "Failed to create user" }, { status: 500 });
  }
}
