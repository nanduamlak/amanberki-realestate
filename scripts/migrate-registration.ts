/**
 * Migration: Add invitation / registration token columns to the users table.
 * Run with:  npx tsx scripts/migrate-registration.ts
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
        ADD COLUMN IF NOT EXISTS registration_token         VARCHAR(64) UNIQUE,
        ADD COLUMN IF NOT EXISTS registration_token_expires TIMESTAMPTZ,
        ADD COLUMN IF NOT EXISTS is_registered             BOOLEAN NOT NULL DEFAULT TRUE;
    `);
    // Mark all existing users (who already have a password) as registered
    await client.query(`UPDATE users SET is_registered = TRUE WHERE is_registered IS NULL;`);
    console.log("✅  Migration complete.");
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch((e) => { console.error("❌  Migration failed:", e); process.exit(1); });
