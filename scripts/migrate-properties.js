/**
 * migrate-properties.js
 * Creates all property-related tables in the real_estate_db.
 * Run with:  node scripts/migrate-properties.js
 *
 * Tables created:
 *   properties        — one row per block
 *   plot_details      — one row per plot within a block
 *   ownership_history — one row per ownership transfer record
 *   payment_records   — one row per scheduled payment
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

    // ─────────────────────────────────────────────────────────────
    // 1. PROPERTIES  (one row = one block)
    // ─────────────────────────────────────────────────────────────
    await client.query(`
      CREATE TABLE IF NOT EXISTS properties (
        id                VARCHAR(20)  PRIMARY KEY,        -- e.g. BLOCK-001
        block_number      INTEGER      NOT NULL UNIQUE,
        zone              VARCHAR(20)  NOT NULL CHECK (zone IN ('Zone I G+1', 'Zone II G+0')),
        status            VARCHAR(25)  NOT NULL CHECK (status IN ('available','sold','reserved','under-construction')),
        price             NUMERIC(14,2) NOT NULL DEFAULT 0,
        primary_plots     VARCHAR(100) NOT NULL DEFAULT '',
        no_of_plots       INTEGER      NOT NULL DEFAULT 0,
        area              NUMERIC(12,2) NOT NULL DEFAULT 0,
        plot_size         VARCHAR(50)  NOT NULL DEFAULT '',
        buffer_plots      VARCHAR(100) NOT NULL DEFAULT '0',
        no_of_buffer_plots INTEGER     NOT NULL DEFAULT 0,
        sold_plots        INTEGER      NOT NULL DEFAULT 0,
        active_plots      INTEGER      NOT NULL DEFAULT 0,
        remark            TEXT         NOT NULL DEFAULT '',
        description       TEXT         NOT NULL DEFAULT '',
        created_at        TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
        updated_at        TIMESTAMPTZ  NOT NULL DEFAULT NOW()
      );
    `);
    console.log("[Migrate] ✅  properties table ready.");

    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_properties_status ON properties (status);
    `);
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_properties_zone ON properties (zone);
    `);

    // ─────────────────────────────────────────────────────────────
    // 2. PLOT DETAILS  (one row = one plot inside a block)
    // ─────────────────────────────────────────────────────────────
    await client.query(`
      CREATE TABLE IF NOT EXISTS plot_details (
        id                  SERIAL       PRIMARY KEY,
        block_id            VARCHAR(20)  NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
        plot_number         VARCHAR(20)  NOT NULL,
        plot_size           NUMERIC(10,2) NOT NULL DEFAULT 0,
        built_area          VARCHAR(50)  NOT NULL DEFAULT '',
        purchaser_name      VARCHAR(255) NOT NULL DEFAULT '',
        title_deeds_status  VARCHAR(50)  NOT NULL DEFAULT '',
        construction_status VARCHAR(100) NOT NULL DEFAULT '',
        remark              TEXT         NOT NULL DEFAULT '',
        -- House / unit details
        house_type          VARCHAR(50),
        floors              SMALLINT,
        bedrooms            SMALLINT,
        bathrooms           SMALLINT,
        living_rooms        SMALLINT,
        kitchen             SMALLINT,
        dining              SMALLINT,
        garage              SMALLINT,
        balcony             BOOLEAN      NOT NULL DEFAULT FALSE,
        garden              BOOLEAN      NOT NULL DEFAULT FALSE,
        rooftop             BOOLEAN      NOT NULL DEFAULT FALSE,
        orientation         VARCHAR(100),
        year_built          SMALLINT,
        contractor_name     VARCHAR(255),
        reference_no        VARCHAR(100),
        created_at          TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
        updated_at          TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
        UNIQUE (block_id, plot_number)
      );
    `);
    console.log("[Migrate] ✅  plot_details table ready.");

    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_plot_details_block ON plot_details (block_id);
    `);

    // ─────────────────────────────────────────────────────────────
    // 3. OWNERSHIP HISTORY
    // ─────────────────────────────────────────────────────────────
    await client.query(`
      CREATE TABLE IF NOT EXISTS ownership_history (
        id              SERIAL      PRIMARY KEY,
        plot_detail_id  INTEGER     NOT NULL REFERENCES plot_details(id) ON DELETE CASCADE,
        owner_name      VARCHAR(255) NOT NULL,
        transfer_date   DATE,
        status          VARCHAR(20) NOT NULL CHECK (status IN ('Current','Previous')),
        notes           TEXT,
        created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);
    console.log("[Migrate] ✅  ownership_history table ready.");

    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_ownership_plot ON ownership_history (plot_detail_id);
    `);

    // ─────────────────────────────────────────────────────────────
    // 4. PAYMENT RECORDS
    // ─────────────────────────────────────────────────────────────
    await client.query(`
      CREATE TABLE IF NOT EXISTS payment_records (
        id              SERIAL       PRIMARY KEY,
        payment_ref     VARCHAR(50)  NOT NULL,             -- the app-level id e.g. "pay-001"
        plot_detail_id  INTEGER      NOT NULL REFERENCES plot_details(id) ON DELETE CASCADE,
        description     VARCHAR(255) NOT NULL DEFAULT '',
        amount          NUMERIC(14,2) NOT NULL DEFAULT 0,
        currency        VARCHAR(5)   NOT NULL DEFAULT 'ETB' CHECK (currency IN ('ETB','USD')),
        due_date        DATE,
        paid_date       DATE,
        status          VARCHAR(20)  NOT NULL DEFAULT 'pending'
                          CHECK (status IN ('pending','paid','overdue','waived')),
        notified        BOOLEAN      NOT NULL DEFAULT FALSE,
        notes           TEXT,
        created_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
        updated_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW()
      );
    `);
    console.log("[Migrate] ✅  payment_records table ready.");

    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_payment_plot ON payment_records (plot_detail_id);
    `);
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_payment_status ON payment_records (status);
    `);
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_payment_due ON payment_records (due_date);
    `);

    console.log("\n[Migrate] 🎉  All tables created successfully!");
    console.log("[Migrate] Next step: run  node scripts/seed-properties.js");
  } catch (err) {
    console.error("[Migrate] ❌  Error:", err.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

migrate();
