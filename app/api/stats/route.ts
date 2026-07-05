import { NextResponse } from "next/server";
import { query } from "@/lib/db";

/**
 * GET /api/stats
 *
 * Returns plot-level inventory stats derived purely from plot_details rows.
 * Classification is based on title_deeds_status and purchaser_name:
 *
 *   sold      — title deed has been issued (title_deeds_status ILIKE 'issued')
 *   available — no buyer (purchaser_name is empty / null / 'Tulu Dimtu Real Estate%')
 *   reserved  — has a real buyer but deed not yet issued
 *   total     — total plot count
 */
export async function GET() {
  try {
    const result = await query(`
      SELECT
        COUNT(*)                                                        AS total,
        COUNT(*) FILTER (
          WHERE LOWER(TRIM(title_deeds_status)) = 'issued'
        )                                                               AS sold,
        COUNT(*) FILTER (
          WHERE (
            purchaser_name IS NULL OR
            TRIM(purchaser_name) = '' OR
            purchaser_name ILIKE 'Tulu Dimtu Real Estate%'
          )
          AND LOWER(TRIM(title_deeds_status)) != 'issued'
        )                                                               AS available,
        COUNT(*) FILTER (
          WHERE purchaser_name IS NOT NULL
            AND TRIM(purchaser_name) != ''
            AND purchaser_name NOT ILIKE 'Tulu Dimtu Real Estate%'
            AND LOWER(TRIM(title_deeds_status)) != 'issued'
        )                                                               AS reserved
      FROM plot_details
    `);

    const row = result.rows[0];
    return NextResponse.json({
      total:     Number(row.total),
      sold:      Number(row.sold),
      available: Number(row.available),
      reserved:  Number(row.reserved),
    });
  } catch (err) {
    console.error("[API:stats] GET:", err);
    return NextResponse.json({ error: "Database error" }, { status: 500 });
  }
}
