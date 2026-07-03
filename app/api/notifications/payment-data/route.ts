import { NextResponse } from "next/server";
import { query } from "@/lib/db";

/**
 * GET /api/notifications/payment-data
 *
 * Returns all active (non-paid, non-waived) payment records that have a due_date,
 * joined with their plot and block data.
 *
 * For two-term payments, BOTH terms are returned as separate rows so each
 * term generates its own alert/email notification independently.
 *
 * Used by useNotificationStore to scan for upcoming/overdue payments.
 */
export async function GET() {
  try {
    const result = await query(
      `-- Term 1 rows (always present when due_date is set)
       SELECT
         pr.payment_ref          AS id,
         pr.description,
         pr.amount,
         pr.currency,
         pr.due_date             AS "dueDate",
         pr.paid_date            AS "paidDate",
         pr.status,
         pr.notified,
         pr.notes,
         pr.term_type            AS "termType",
         'term1'                 AS "termLabel",
         pd.plot_number          AS "plotNumber",
         pd.purchaser_name       AS "purchaserName",
         p.id                    AS "blockId",
         p.block_number          AS "blockNumber"
       FROM payment_records pr
       JOIN plot_details pd ON pd.id = pr.plot_detail_id
       JOIN properties   p  ON p.id  = pd.block_id
       WHERE pr.status NOT IN ('paid', 'waived')
         AND pr.due_date IS NOT NULL

       UNION ALL

       -- Term 2 rows (only for two-term payments where term2 is not yet paid/waived)
       SELECT
         (pr.payment_ref || '_t2')  AS id,
         pr.description,
         pr.amount_term2            AS amount,
         pr.currency,
         pr.due_date_term2          AS "dueDate",
         pr.paid_date_term2         AS "paidDate",
         pr.status_term2            AS status,
         pr.notified,
         pr.notes,
         pr.term_type               AS "termType",
         'term2'                    AS "termLabel",
         pd.plot_number             AS "plotNumber",
         pd.purchaser_name          AS "purchaserName",
         p.id                       AS "blockId",
         p.block_number             AS "blockNumber"
       FROM payment_records pr
       JOIN plot_details pd ON pd.id = pr.plot_detail_id
       JOIN properties   p  ON p.id  = pd.block_id
       WHERE pr.term_type = 'two_term'
         AND pr.status_term2 NOT IN ('paid', 'waived')
         AND pr.due_date_term2 IS NOT NULL
         AND pr.amount_term2 IS NOT NULL

       ORDER BY "dueDate" ASC`
    );

    return NextResponse.json(result.rows);
  } catch (err) {
    console.error("[API:payment-data] GET:", err);
    return NextResponse.json({ error: "Database error" }, { status: 500 });
  }
}
