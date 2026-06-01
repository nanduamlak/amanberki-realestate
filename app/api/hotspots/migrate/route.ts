import { NextResponse } from "next/server";
import { query } from "@/lib/db";

export async function GET() {
  try {
    // Create map_hotspots table — idempotent with IF NOT EXISTS
    await query(`
      CREATE TABLE IF NOT EXISTS map_hotspots (
        id        INTEGER PRIMARY KEY,          -- block number (1-based, matches property data)
        points    JSONB    NOT NULL,            -- array of {x, y} percentage coordinates
        label     TEXT,                         -- optional display label
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);

    await query(`
      CREATE INDEX IF NOT EXISTS idx_map_hotspots_id ON map_hotspots (id);
    `);

    return NextResponse.json({
      success: true,
      message: "map_hotspots table created (or already exists).",
    });
  } catch (error) {
    console.error("[Migrate] map_hotspots error:", error);
    return NextResponse.json({ error: "Migration failed" }, { status: 500 });
  }
}
