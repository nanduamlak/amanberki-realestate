import { NextResponse } from "next/server";
import { query } from "@/lib/db";

export async function GET() {
  try {
    const result = await query(`
      SELECT 
        pd.id,
        pd.block_id,
        p.block_number,
        p.block_label,
        p.zone,
        pd.plot_number,
        pd.plot_size,
        pd.built_area,
        pd.purchaser_name,
        pd.title_deeds_status,
        pd.construction_status,
        pd.remark,
        pd.contractor_name,
        pd.buyer_group
      FROM plot_details pd
      JOIN properties p ON pd.block_id = p.id
      ORDER BY p.block_number, 
               CASE 
                 WHEN pd.plot_number ~ '^[0-9]+$' THEN pd.plot_number::integer 
                 ELSE 9999 
               END, 
               pd.plot_number
    `);
    return NextResponse.json(result.rows.map(r => ({
      id: r.id,
      blockId: r.block_id,
      blockNumber: r.block_number,
      blockLabel: r.block_label ?? null,   // "46A" / "46B" or null (use blockNumber)
      zone: r.zone,
      plotNumber: r.plot_number,
      plotSize: Number(r.plot_size),
      builtArea: r.built_area,
      purchaserName: r.purchaser_name,
      titleDeedsStatus: r.title_deeds_status,
      constructionStatus: r.construction_status,
      remark: r.remark,
      contractorName: r.contractor_name,
      buyerGroup: r.buyer_group ?? null,
    })));
  } catch (err) {
    console.error("[API:plots] GET:", err);
    return NextResponse.json({ error: "Database error" }, { status: 500 });
  }
}
