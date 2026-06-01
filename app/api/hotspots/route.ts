import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import { requireRole } from "@/lib/apiAuth";

// ── Types ──────────────────────────────────────────────────────────────────────
interface Point { x: number; y: number; }
interface HotspotRow { shape_id: string; block_number: number; points: Point[]; label: string | null; }

// ── GET /api/hotspots ─ return all mapped blocks ───────────────────────────────
export async function GET() {
  try {
    const result = await query(
      "SELECT shape_id, block_number as id, points, label FROM map_hotspots ORDER BY block_number ASC"
    );
    const hotspots = result.rows.map((r) => ({
      shape_id: r.shape_id,
      id: r.id, // mapped block_number to 'id' for frontend compatibility
      points: r.points as Point[],
      label: r.label ?? null,
    }));
    return NextResponse.json({ hotspots });
  } catch (error) {
    console.error("[Hotspots GET] Error:", error);
    return NextResponse.json({ error: "Failed to load hotspots" }, { status: 500 });
  }
}

// ── POST /api/hotspots ─ upsert one or many hotspots (super_admin only) ────────
// Body: { hotspots: Array<{ shape_id?: string; id: number; points: Point[]; label?: string }> }
export async function POST(request: Request) {
  const auth = await requireRole(["super_admin"]);
  if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status });
  try {
    let body: { hotspots: { shape_id?: string; id: number; points: Point[]; label?: string }[] };
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    const { hotspots } = body;

    if (!Array.isArray(hotspots) || hotspots.length === 0) {
      return NextResponse.json({ error: "hotspots array is required" }, { status: 400 });
    }

    // Validate structure + clamp coordinates to [0, 100]
    for (const hs of hotspots) {
      if (
        typeof hs.id !== "number" ||
        !Array.isArray(hs.points) ||
        hs.points.length < 3
      ) {
        return NextResponse.json(
          { error: `Invalid hotspot: id=${hs.id}. Each hotspot needs id (number) and points (≥3 coords).` },
          { status: 400 }
        );
      }
      // Clamp instead of reject — floating-point edge clicks can produce tiny over/under values
      hs.points = hs.points.map((pt: { x: number; y: number }) => ({
        x: Math.min(100, Math.max(0, typeof pt.x === "number" ? pt.x : 0)),
        y: Math.min(100, Math.max(0, typeof pt.y === "number" ? pt.y : 0)),
      }));
    }

    // Batch upsert using INSERT ... ON CONFLICT DO UPDATE
    let upserted = 0;
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    for (const hs of hotspots) {
      const isValidUuid = hs.shape_id && uuidRegex.test(hs.shape_id);
      
      if (isValidUuid) {
        await query(
          `INSERT INTO map_hotspots (shape_id, block_number, points, label, updated_at)
           VALUES ($1, $2, $3::jsonb, $4, NOW())
           ON CONFLICT (shape_id) DO UPDATE
             SET block_number = EXCLUDED.block_number,
                 points       = EXCLUDED.points,
                 label        = EXCLUDED.label,
                 updated_at   = NOW()`,
          [hs.shape_id, hs.id, JSON.stringify(hs.points), hs.label ?? null]
        );
      } else {
        await query(
          `INSERT INTO map_hotspots (block_number, points, label, updated_at)
           VALUES ($1, $2::jsonb, $3, NOW())`,
          [hs.id, JSON.stringify(hs.points), hs.label ?? null]
        );
      }
      upserted++;
    }

    return NextResponse.json({ success: true, upserted });
  } catch (error) {
    console.error("[Hotspots POST] Error:", error);
    return NextResponse.json({ error: "Failed to save hotspots" }, { status: 500 });
  }
}

// ── DELETE /api/hotspots ─ remove a single block hotspot (super_admin only) ────
// Body: { shape_id: string }
export async function DELETE(request: Request) {
  const auth = await requireRole(["super_admin"]);
  if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status });
  try {
    const { shape_id } = await request.json();
    if (typeof shape_id !== "string") {
      return NextResponse.json({ error: "shape_id (string) is required" }, { status: 400 });
    }
    await query("DELETE FROM map_hotspots WHERE shape_id = $1", [shape_id]);
    return NextResponse.json({ success: true, deleted: shape_id });
  } catch (error) {
    console.error("[Hotspots DELETE] Error:", error);
    return NextResponse.json({ error: "Failed to delete hotspot" }, { status: 500 });
  }
}
