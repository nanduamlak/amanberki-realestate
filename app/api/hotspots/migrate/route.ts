import { NextResponse } from "next/server";
import { query } from "@/lib/db";

export async function GET() {
  try {
    // Enable pgcrypto for gen_random_uuid support
    await query(`CREATE EXTENSION IF NOT EXISTS pgcrypto;`);

    // Create map_hotspots table with correct columns matching the application queries
    await query(`
      CREATE TABLE IF NOT EXISTS map_hotspots (
        shape_id     UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        block_number INTEGER NOT NULL UNIQUE,
        points       JSONB NOT NULL,
        label        TEXT,
        created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);

    await query(`
      CREATE INDEX IF NOT EXISTS idx_map_hotspots_block ON map_hotspots (block_number);
    `);

    return NextResponse.json({
      success: true,
      message: "map_hotspots table created successfully with correct shape_id and block_number schema.",
    });
  } catch (error) {
    console.error("[Migrate] map_hotspots error:", error);
    return NextResponse.json({ error: "Migration failed" }, { status: 500 });
  }
}
