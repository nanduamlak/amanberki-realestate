import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/lib/apiAuth";
import { query } from "@/lib/db";

/**
 * GET /api/properties/zone-prices
 * Returns the current price and price_max for each zone.
 * Uses the first block per zone as the zone-representative price.
 */
export async function GET() {
  try {
    const result = await query(
      `SELECT
         zone,
         MIN(price)     AS price,
         MAX(price_max) AS price_max,
         COUNT(*)       AS block_count,
         MAX(updated_at) AS last_updated
       FROM properties
       GROUP BY zone
       ORDER BY zone`
    );

    return NextResponse.json(result.rows.map(r => ({
      zone:       r.zone,
      price:      Number(r.price),
      priceMax:   r.price_max ? Number(r.price_max) : null,
      blockCount: Number(r.block_count),
      lastUpdated: r.last_updated,
    })));
  } catch (err) {
    console.error("[API:zone-prices] GET:", err);
    return NextResponse.json({ error: "Database error" }, { status: 500 });
  }
}

/**
 * PUT /api/properties/zone-prices
 * Updates price (and optionally price_max) for ALL blocks in a given zone.
 * Admin / super_admin only.
 * Body: { zone: string, price: number, priceMax?: number | null }
 */
export async function PUT(req: NextRequest) {
  try {
    const auth = await requireRole(["admin", "super_admin"]);
    if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status ?? 401 });

    const body = await req.json();
    const { zone, price, priceMax } = body as {
      zone: string;
      price: number;
      priceMax?: number | null;
    };

    if (!zone || typeof zone !== "string") {
      return NextResponse.json({ error: "zone is required" }, { status: 400 });
    }
    if (typeof price !== "number" || price < 0) {
      return NextResponse.json({ error: "price must be a non-negative number" }, { status: 400 });
    }

    const result = await query(
      `UPDATE properties
       SET price      = $1,
           price_max  = $2,
           updated_at = NOW()
       WHERE zone = $3`,
      [price, priceMax ?? null, zone]
    );

    // Log the price change for audit trail
    console.log(
      `[ZonePrices] ${auth.email ?? auth.userId} updated ${zone}: ` +
      `ETB ${price.toLocaleString()}${priceMax ? ` – ${priceMax.toLocaleString()}` : ""} ` +
      `(${result.rowCount} blocks)`
    );

    return NextResponse.json({
      zone,
      price,
      priceMax: priceMax ?? null,
      blocksUpdated: result.rowCount,
    });
  } catch (err) {
    console.error("[API:zone-prices] PUT:", err);
    return NextResponse.json({ error: "Database error" }, { status: 500 });
  }
}
