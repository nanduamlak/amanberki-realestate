import { NextResponse } from "next/server";
import { query } from "@/lib/db";

/**
 * GET /api/properties/plot-analytics
 * Returns aggregated plot-level stats for dashboards and reports:
 * - title_deeds breakdown
 * - construction_status breakdown
 * - zone-level plot counts
 * - grand-total summary (totalBlocks, totalPlots, soldPlots, activePlots, totalArea)
 */
export async function GET() {
  try {
    // ── Grand-total summary (live from DB) ────────────────────
    const summaryResult = await query(`
      SELECT
        COUNT(DISTINCT p.id)  AS total_blocks,
        COUNT(pd.id)          AS total_plots,
        COUNT(CASE WHEN pd.purchaser_name IS NOT NULL
                        AND TRIM(pd.purchaser_name) != ''
                        AND UPPER(TRIM(pd.purchaser_name)) != 'TULU DIMTU REAL ESTATE'
                   THEN 1 END) AS sold_plots,
        COUNT(CASE WHEN pd.purchaser_name IS NULL
                     OR TRIM(pd.purchaser_name) = ''
                     OR UPPER(TRIM(pd.purchaser_name)) = 'TULU DIMTU REAL ESTATE'
                   THEN 1 END) AS active_plots,
        COALESCE(SUM(
          CASE WHEN SPLIT_PART(pd.plot_size, '+', 1) ~ '^[0-9]+(\.[0-9]+)?$'
               THEN SPLIT_PART(pd.plot_size, '+', 1)::numeric
               ELSE 0 END
        ), 0) AS total_area
      FROM properties p
      LEFT JOIN plot_details pd ON pd.block_id = p.id
    `);

    // Title Deeds Status distribution
    const titleDeedsResult = await query(`
      SELECT
        COALESCE(NULLIF(TRIM(title_deeds_status), ''), 'Not Specified') AS status,
        COUNT(*) AS count
      FROM plot_details
      GROUP BY TRIM(title_deeds_status)
      ORDER BY count DESC
    `);

    // Construction Status (simplified buckets)
    const constructionResult = await query(`
      SELECT
        CASE
          WHEN LOWER(TRIM(construction_status)) LIKE '%completed%' OR LOWER(TRIM(construction_status)) LIKE '%occupied%' THEN 'Completed / Occupied'
          WHEN LOWER(TRIM(construction_status)) LIKE '%plastering%' OR LOWER(TRIM(construction_status)) LIKE '%finishing%' THEN 'Plastering / Finishing'
          WHEN LOWER(TRIM(construction_status)) LIKE '%block work%' OR LOWER(TRIM(construction_status)) LIKE '%roof%' THEN 'Block Work + Roofing'
          WHEN LOWER(TRIM(construction_status)) LIKE '%slab%' OR LOWER(TRIM(construction_status)) LIKE '%foundation%' OR LOWER(TRIM(construction_status)) LIKE '%column%' OR LOWER(TRIM(construction_status)) LIKE '%stonemason%' OR LOWER(TRIM(construction_status)) LIKE '%grade beam%' THEN 'Foundation / Structure'
          WHEN LOWER(TRIM(construction_status)) LIKE '%bare land%' OR TRIM(construction_status) = '' OR construction_status IS NULL THEN 'Bare Land / Not Started'
          ELSE 'Other'
        END AS bucket,
        COUNT(*) AS count
      FROM plot_details
      GROUP BY 1
      ORDER BY count DESC
    `);

    // Zone-level plot counts (primary vs buffer)
    const zonePlotsResult = await query(`
      SELECT
        p.zone,
        COUNT(pd.id) AS total_plots,
        COUNT(CASE WHEN pd.purchaser_name IS NOT NULL
                        AND TRIM(pd.purchaser_name) != ''
                        AND UPPER(TRIM(pd.purchaser_name)) != 'TULU DIMTU REAL ESTATE' THEN 1 END) AS sold_plots,
        COUNT(CASE WHEN pd.purchaser_name IS NULL
                     OR TRIM(pd.purchaser_name) = ''
                     OR UPPER(TRIM(pd.purchaser_name)) = 'TULU DIMTU REAL ESTATE' THEN 1 END) AS available_plots,
        COUNT(CASE WHEN UPPER(TRIM(pd.title_deeds_status)) = 'ISSUED' THEN 1 END) AS deeds_issued,
        COUNT(CASE WHEN UPPER(TRIM(pd.title_deeds_status)) = 'NOT ISSUED' THEN 1 END) AS deeds_not_issued,
        COUNT(CASE WHEN UPPER(TRIM(pd.title_deeds_status)) = 'PENDING' THEN 1 END) AS deeds_pending
      FROM plot_details pd
      JOIN properties p ON pd.block_id = p.id
      GROUP BY p.zone
      ORDER BY p.zone
    `);

    // Top blocks by plot count
    const topBlocksResult = await query(`
      SELECT
        p.id,
        p.block_number,
        p.zone,
        p.status,
        COUNT(pd.id) AS total_plots,
        COUNT(CASE WHEN pd.purchaser_name IS NOT NULL
                        AND TRIM(pd.purchaser_name) != ''
                        AND UPPER(TRIM(pd.purchaser_name)) != 'TULU DIMTU REAL ESTATE' THEN 1 END) AS sold_plots,
        SUM(CASE WHEN SPLIT_PART(pd.plot_size, '+', 1) ~ '^[0-9]+(\.[0-9]+)?$' THEN SPLIT_PART(pd.plot_size, '+', 1)::numeric ELSE 0 END) AS total_area,
        COUNT(CASE WHEN UPPER(TRIM(pd.title_deeds_status)) = 'ISSUED' THEN 1 END) AS deeds_issued
      FROM properties p
      LEFT JOIN plot_details pd ON pd.block_id = p.id
      GROUP BY p.id, p.block_number, p.zone, p.status
      ORDER BY total_plots DESC
      LIMIT 15
    `);

    const s = summaryResult.rows[0];
    return NextResponse.json({
      summary: {
        totalBlocks:  Number(s.total_blocks),
        totalPlots:   Number(s.total_plots),
        soldPlots:    Number(s.sold_plots),
        activePlots:  Number(s.active_plots),
        totalArea:    Number(s.total_area),
      },
      titleDeeds: titleDeedsResult.rows.map(r => ({
        status: r.status,
        count: Number(r.count),
      })),
      constructionStatus: constructionResult.rows.map(r => ({
        bucket: r.bucket,
        count: Number(r.count),
      })),
      zonePlots: zonePlotsResult.rows.map(r => ({
        zone: r.zone,
        totalPlots: Number(r.total_plots),
        soldPlots: Number(r.sold_plots),
        availablePlots: Number(r.available_plots),
        deedsIssued: Number(r.deeds_issued),
        deedsNotIssued: Number(r.deeds_not_issued),
        deedsPending: Number(r.deeds_pending),
      })),
      topBlocks: topBlocksResult.rows.map(r => ({
        id: r.id,
        blockNumber: Number(r.block_number),
        zone: r.zone,
        status: r.status,
        totalPlots: Number(r.total_plots),
        soldPlots: Number(r.sold_plots),
        totalArea: Number(r.total_area) || 0,
        deedsIssued: Number(r.deeds_issued),
      })),
    });
  } catch (err) {
    console.error("[API:plot-analytics] GET:", err);
    return NextResponse.json({ error: "Database error" }, { status: 500 });
  }
}
