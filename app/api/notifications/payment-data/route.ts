import { NextResponse } from "next/server";
import { query } from "@/lib/db";

/**
 * GET /api/notifications/payment-data
 *
 * Returns all active (non-paid, non-waived) payment records that have a due_date,
 * joined with their plot and block data.
 * Used by useNotificationStore to scan for upcoming/overdue payments
 * without touching localStorage.
 */
export async function GET() {
  try {
    const result = await query(
      `SELECT
         pr.payment_ref   AS id,
         pr.description,
         pr.amount,
         pr.currency,
         pr.due_date      AS "dueDate",
         pr.paid_date     AS "paidDate",
         pr.status,
         pr.notified,
         pr.notes,
         pd.plot_number   AS "plotNumber",
         pd.purchaser_name AS "purchaserName",
         p.id             AS "blockId",
         p.block_number   AS "blockNumber"
       FROM payment_records pr
       JOIN plot_details pd ON pd.id = pr.plot_detail_id
       JOIN properties   p  ON p.id  = pd.block_id
       WHERE pr.status NOT IN ('paid', 'waived')
         AND pr.due_date IS NOT NULL
       ORDER BY pr.due_date ASC`
    );

    return NextResponse.json(result.rows);
  } catch (err) {
    console.error("[API:payment-data] GET:", err);
    return NextResponse.json({ error: "Database error" }, { status: 500 });
  }
}
