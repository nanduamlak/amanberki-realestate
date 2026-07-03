/**
 * migrate-attention-remarks.js
 * Creates the group chat tables for the Attention Remarks feature.
 * Run with:  node scripts/migrate-attention-remarks.js
 *
 * Tables created:
 *   attention_remarks      — one row per chat message
 *   attention_remark_reads — tracks last-read timestamp per user (for unread badge)
 */

require("dotenv").config({ path: ".env.local" });
const { Client } = require("pg");

if (!process.env.DATABASE_URL) {
  console.error("FATAL: DATABASE_URL is not set in .env.local");
  process.exit(1);
}

async function migrate() {
  const client = new Client({ connectionString: process.env.DATABASE_URL });

  try {
    await client.connect();
    console.log("[Migrate] Connected to database.");

    // ──────────────────────────────────────────────────────────────
    // 1. ATTENTION_REMARKS  (one row per chat message)
    // ──────────────────────────────────────────────────────────────
    await client.query(`
      CREATE TABLE IF NOT EXISTS attention_remarks (
        id              SERIAL        PRIMARY KEY,
        body            TEXT          NOT NULL,
        created_by      TEXT          NOT NULL,   -- user id (from JWT sub)
        created_by_name TEXT          NOT NULL,   -- display name snapshot
        created_by_role TEXT          NOT NULL,   -- role snapshot
        is_deleted      BOOLEAN       NOT NULL DEFAULT FALSE,
        created_at      TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
        updated_at      TIMESTAMPTZ   NOT NULL DEFAULT NOW()
      );
    `);
    console.log("[Migrate] ✅  attention_remarks table ready.");

    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_attention_remarks_created_at
        ON attention_remarks (created_at ASC)
        WHERE is_deleted = FALSE;
    `);
    console.log("[Migrate] ✅  attention_remarks index ready.");

    // ──────────────────────────────────────────────────────────────
    // 2. ATTENTION_REMARK_READS  (last-seen timestamp per user)
    //    Unread count = remarks created AFTER last_read_at by OTHER users
    // ──────────────────────────────────────────────────────────────
    await client.query(`
      CREATE TABLE IF NOT EXISTS attention_remark_reads (
        user_id       TEXT          PRIMARY KEY,
        last_read_at  TIMESTAMPTZ   NOT NULL DEFAULT NOW()
      );
    `);
    console.log("[Migrate] ✅  attention_remark_reads table ready.");

    console.log("\n[Migrate] 🎉  All attention remarks tables created successfully.\n");
  } catch (err) {
    console.error("[Migrate] ❌  Error:", err.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

migrate();
