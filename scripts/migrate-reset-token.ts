/**
 * Migration: Add password-reset token columns to the users table.
 * Run with:  npx tsx scripts/migrate-reset-token.ts
 */
import { config } from "dotenv";
config({ path: ".env.local" });

import { Pool } from "pg";

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function main() {
  const client = await pool.connect();
  try {
    await client.query(`
      ALTER TABLE users
        ADD COLUMN IF NOT EXISTS reset_token         VARCHAR(64) UNIQUE,
        ADD COLUMN IF NOT EXISTS reset_token_expires TIMESTAMPTZ;
    `);
    console.log("✅  Migration complete: reset_token columns added.");
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch((e) => { console.error("❌  Migration failed:", e); process.exit(1); });
