import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";
import { requireRole } from "@/lib/apiAuth";

// ─── Shape mapper ─────────────────────────────────────────────
export function toProperty(row: Record<string, unknown>) {
  return {
    id:              row.id,
    blockNumber:     row.block_number,
    zone:            row.zone,
    status:          row.status,
    price:           Number(row.price),
    primaryPlots:    row.primary_plots,
    noOfPlots:       Number(row.no_of_plots),
    area:            Number(row.area),
    plotSize:        row.plot_size,
    bufferPlots:     row.buffer_plots,
    noOfBufferPlots: Number(row.no_of_buffer_plots),
    soldPlots:       Number(row.sold_plots),
    activePlots:     Number(row.active_plots),
    remark:          row.remark,
    description:     row.description,
    createdAt:       row.created_at,
    updatedAt:       row.updated_at,
  };
}

// ─── GET /api/properties ──────────────────────────────────────
export async function GET() {
  try {
    const result = await query(
      `SELECT * FROM properties ORDER BY block_number`
    );
    return NextResponse.json(result.rows.map(toProperty));
  } catch (err) {
    console.error("[API:properties] GET:", err);
    return NextResponse.json({ error: "Database error" }, { status: 500 });
  }
}

// ─── POST /api/properties ─────────────────────────────────────
export async function POST(req: NextRequest) {
  const auth = await requireRole(["admin", "super_admin"]);
  if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status ?? 401 });

  try {
    const body: Record<string, unknown> = await req.json();

    // Validate required fields
    if (!body.id || typeof body.id !== "string") {
      return NextResponse.json({ error: "id is required" }, { status: 400 });
    }
    if (!body.blockNumber || isNaN(Number(body.blockNumber))) {
      return NextResponse.json({ error: "blockNumber must be a number" }, { status: 400 });
    }

    const result = await query(
      `INSERT INTO properties
         (id, block_number, zone, status, price, primary_plots, no_of_plots,
          area, plot_size, buffer_plots, no_of_buffer_plots, sold_plots,
          active_plots, remark, description)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15)
       RETURNING *`,
      [
        body.id, body.blockNumber,
        body.zone         ?? "Zone I G+1",
        body.status       ?? "available",
        body.price        ?? 0,
        body.primaryPlots ?? "",
        body.noOfPlots    ?? 0,
        body.area         ?? 0,
        body.plotSize     ?? "",
        body.bufferPlots  ?? "0",
        body.noOfBufferPlots ?? 0,
        body.soldPlots    ?? 0,
        body.activePlots  ?? 0,
        body.remark       ?? "",
        body.description  ?? "",
      ]
    );

    return NextResponse.json(toProperty(result.rows[0]), { status: 201 });
  } catch (err: unknown) {
    console.error("[API:properties] POST:", err);
    // Duplicate ID
    if ((err as { code?: string }).code === "23505") {
      return NextResponse.json({ error: "A block with this ID already exists" }, { status: 409 });
    }
    return NextResponse.json({ error: "Database error" }, { status: 500 });
  }
}
