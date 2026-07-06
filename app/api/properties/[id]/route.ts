import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";
import { requireRole } from "@/lib/apiAuth";
import { toProperty } from "../route";

type Ctx = { params: Promise<{ id: string }> };

// ─── GET /api/properties/[id] ───────────────────────────────
export async function GET(_req: NextRequest, { params }: Ctx) {
  const { id } = await params;

  const result = await query(
    `SELECT
       p.id,
       p.block_number,
       p.block_label,
       p.zone,
       p.status,
       p.price,
       p.price_max,
       p.primary_plots,
       COUNT(pd.id) AS no_of_plots,
       COALESCE(SUM(
         CASE WHEN SPLIT_PART(pd.plot_size, '+', 1) ~ '^[0-9]+(\.[0-9]+)?$'
              THEN SPLIT_PART(pd.plot_size, '+', 1)::numeric
              ELSE 0 END
       ), 0) AS area,
       p.plot_size,
       p.buffer_plots,
       p.no_of_buffer_plots,
       COUNT(CASE WHEN pd.purchaser_name IS NOT NULL
                       AND TRIM(pd.purchaser_name) != ''
                       AND UPPER(TRIM(pd.purchaser_name)) NOT IN ('TULU DIMTU REAL ESTATE', 'TULU DIMTU REAL ESTATE (B*)')
                  THEN 1 END) AS sold_plots,
       COUNT(CASE WHEN pd.purchaser_name IS NULL
                    OR TRIM(pd.purchaser_name) = ''
                    OR UPPER(TRIM(pd.purchaser_name)) IN ('TULU DIMTU REAL ESTATE', 'TULU DIMTU REAL ESTATE (B*)')
                  THEN 1 END) AS active_plots,
       p.remark,
       p.description,
       p.created_at,
       p.updated_at
     FROM properties p
     LEFT JOIN plot_details pd ON pd.block_id = p.id
     WHERE p.id = $1
     GROUP BY p.id`,
    [id]
  );

  if (!result.rows.length) {
    return NextResponse.json({ error: "Property not found" }, { status: 404 });
  }

  return NextResponse.json(toProperty(result.rows[0]));
}

// ─── PUT /api/properties/[id] ───────────────────────────────
export async function PUT(req: NextRequest, { params }: Ctx) {
  const auth = await requireRole(["admin", "super_admin"]);
  if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status ?? 401 });

  const { id } = await params;
  const body = await req.json();

  const result = await query(
    `UPDATE properties SET
       zone               = COALESCE($1, zone),
       status             = COALESCE($2, status),
       price              = COALESCE($3, price),
       primary_plots      = COALESCE($4, primary_plots),
       no_of_plots        = COALESCE($5, no_of_plots),
       area               = COALESCE($6, area),
       plot_size          = COALESCE($7, plot_size),
       buffer_plots       = COALESCE($8, buffer_plots),
       no_of_buffer_plots = COALESCE($9, no_of_buffer_plots),
       sold_plots         = COALESCE($10, sold_plots),
       active_plots       = COALESCE($11, active_plots),
       remark             = COALESCE($12, remark),
       description        = COALESCE($13, description),
       updated_at         = NOW()
     WHERE id = $14
     RETURNING *`,
    [
      body.zone, body.status, body.price,
      body.primaryPlots, body.noOfPlots, body.area, body.plotSize,
      body.bufferPlots, body.noOfBufferPlots, body.soldPlots, body.activePlots,
      body.remark, body.description,
      id,
    ]
  );

  if (!result.rows.length) {
    return NextResponse.json({ error: "Property not found" }, { status: 404 });
  }

  return NextResponse.json(toProperty(result.rows[0]));
}

// ─── DELETE /api/properties/[id] ────────────────────────────
export async function DELETE(_req: NextRequest, { params }: Ctx) {
  const auth = await requireRole(["super_admin"]);
  if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status ?? 401 });

  const { id } = await params;

  await query(`DELETE FROM properties WHERE id = $1`, [id]);
  return NextResponse.json({ success: true });
}
