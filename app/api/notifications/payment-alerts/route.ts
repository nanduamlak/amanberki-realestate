import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/lib/apiAuth";
import { query } from "@/lib/db";
import { Resend } from "resend";

// Singleton — avoids opening a new TCP connection per call
const resend = new Resend(process.env.RESEND_API_KEY);

export interface PaymentAlertPayload {
  blockId: string;
  blockNumber: number;
  plotNumber: string;
  paymentDescription: string;
  amount: number;
  currency: string;
  dueDate: string;
  daysUntilDue: number;
  purchaserName: string;
}

function buildAlertHtml(alert: PaymentAlertPayload): string {
  const isOverdue = alert.daysUntilDue < 0;
  const urgencyLabel = isOverdue
    ? `OVERDUE by ${Math.abs(alert.daysUntilDue)} day(s)`
    : alert.daysUntilDue === 0
      ? "Due TODAY"
      : `Due in ${alert.daysUntilDue} day(s)`;

  const statusColor = isOverdue ? "#dc2626" : alert.daysUntilDue <= 7 ? "#ea580c" : "#d97706";
  const statusBg   = isOverdue ? "#fef2f2" : alert.daysUntilDue <= 7 ? "#fff7ed" : "#fffbeb";
  const plotUrl    = `${process.env.NEXT_PUBLIC_APP_URL}/property/${alert.blockId}?plot=${alert.plotNumber}`;

  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f8fafc;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <div style="max-width:580px;margin:32px auto;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,.08);">
    <div style="background:linear-gradient(135deg,#0086D1,#005fa3);padding:32px;text-align:center;">
      <div style="display:inline-block;width:56px;height:56px;background:rgba(255,255,255,.2);border-radius:14px;line-height:56px;font-size:28px;margin-bottom:12px;">🔔</div>
      <h1 style="color:#fff;margin:0;font-size:22px;font-weight:800;letter-spacing:-0.5px;">Payment ${isOverdue ? "Overdue" : "Deadline Alert"}</h1>
      <p style="color:rgba(255,255,255,.8);margin:8px 0 0;font-size:14px;">Aman Berki Group — Real Estate Management</p>
    </div>
    <div style="background:${statusBg};border-left:4px solid ${statusColor};margin:24px;padding:16px;border-radius:8px;">
      <p style="margin:0;color:${statusColor};font-weight:800;font-size:15px;">⚠ ${urgencyLabel}</p>
      <p style="margin:4px 0 0;color:#374151;font-size:13px;">Immediate attention required for the following payment.</p>
    </div>
    <div style="padding:0 24px 24px;">
      <h2 style="font-size:16px;font-weight:800;color:#0f172a;margin:0 0 16px;">Payment Details</h2>
      <table style="width:100%;border-collapse:collapse;">
        ${[
          ["Block",       `${alert.blockId} (Block ${alert.blockNumber})`],
          ["Plot",        `Plot #${alert.plotNumber}`],
          ["Purchaser",   alert.purchaserName || "—"],
          ["Payment",     alert.paymentDescription],
          ["Amount",      `${alert.currency} ${alert.amount.toLocaleString()}`],
          ["Due Date",    new Date(alert.dueDate).toLocaleDateString("en-GB", { day: "2-digit", month: "long", year: "numeric" })],
          ["Status",      urgencyLabel],
        ].map(([label, value]) => `
          <tr style="border-bottom:1px solid #f1f5f9;">
            <td style="padding:10px 0;font-size:13px;color:#64748b;font-weight:600;width:40%;">${label}</td>
            <td style="padding:10px 0;font-size:13px;color:#0f172a;font-weight:700;">${value}</td>
          </tr>`).join("")}
      </table>
      <div style="margin-top:24px;text-align:center;">
        <a href="${plotUrl}" style="display:inline-block;background:#0086D1;color:#fff;padding:12px 28px;border-radius:10px;font-weight:800;font-size:14px;text-decoration:none;">
          View Plot #${alert.plotNumber} →
        </a>
      </div>
    </div>
    <div style="background:#f8fafc;padding:16px 24px;text-align:center;border-top:1px solid #f1f5f9;">
      <p style="margin:0;font-size:12px;color:#94a3b8;">Aman Berki Group · Real Estate Management System</p>
      <p style="margin:4px 0 0;font-size:11px;color:#cbd5e1;">This is an automated notification. Do not reply to this email.</p>
    </div>
  </div>
</body>
</html>`;
}

export async function POST(req: NextRequest) {
  try {
    const auth = await requireRole(["admin", "super_admin"]);
    if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status ?? 401 });

    const alerts: PaymentAlertPayload[] = await req.json();
    if (!Array.isArray(alerts) || alerts.length === 0) {
      return NextResponse.json({ error: "No alerts provided" }, { status: 400 });
    }

    // Fetch all active admin & super_admin emails in one query
    const result = await query(
      `SELECT name, email FROM users WHERE role IN ('admin', 'super_admin') AND is_active = TRUE`
    );
    const admins = result.rows as { name: string; email: string }[];

    if (admins.length === 0) {
      return NextResponse.json({ sent: 0, message: "No admin emails found" });
    }

    const adminEmails = admins.map(a => a.email);

    // Send ONE email per alert addressed to ALL admins at once
    const results = await Promise.allSettled(
      alerts.map(alert => {
        const isOverdue = alert.daysUntilDue < 0;
        const urgencyLabel = isOverdue
          ? `OVERDUE by ${Math.abs(alert.daysUntilDue)} day(s)`
          : alert.daysUntilDue === 0 ? "Due TODAY" : `Due in ${alert.daysUntilDue} day(s)`;

        return resend.emails.send({
          from:    "Aman Berki Estates <noreply@amanberkigroup.com>",
          to:      adminEmails,
          subject: `${isOverdue ? "⛔ OVERDUE" : "⚠ Payment Deadline"}: ${alert.blockId} Plot #${alert.plotNumber} — ${urgencyLabel}`,
          html:    buildAlertHtml(alert),
        });
      })
    );

    const sent   = results.filter(r => r.status === "fulfilled").length;
    const failed = results
      .filter((r): r is PromiseRejectedResult => r.status === "rejected")
      .map(r => r.reason?.message ?? "unknown");

    if (failed.length) {
      console.error("[PaymentAlert] Some emails failed:", failed);
    }

    return NextResponse.json({ sent, admins: adminEmails.length, failed: failed.length || undefined });
  } catch (err) {
    console.error("[PaymentAlert] Handler error:", err);
    return NextResponse.json({ error: "Failed to send alerts" }, { status: 500 });
  }
}
