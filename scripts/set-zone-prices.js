require("dotenv").config({ path: ".env.local" });
const { Client } = require("pg");
const c = new Client({ connectionString: process.env.DATABASE_URL });

c.connect().then(async () => {
  console.log("[Migrate] Connected.\n");

  // 1. Add price_max column if it doesn't exist
  await c.query(`
    ALTER TABLE properties
    ADD COLUMN IF NOT EXISTS price_max NUMERIC(14,2) DEFAULT NULL;
  `);
  console.log("[Migrate] ✅  price_max column ready.");

  // 2. Zone I G+1 → 11,200,000 ETB (fixed price, no range)
  const r1 = await c.query(`
    UPDATE properties
    SET price = 11200000, price_max = NULL, updated_at = NOW()
    WHERE zone = 'Zone I G+1'
  `);
  console.log(`[Migrate] ✅  Zone I G+1: updated ${r1.rowCount} blocks → ETB 11,200,000`);

  // 3. Zone II G+0 → 7,000,000 – 7,500,000 ETB
  const r2 = await c.query(`
    UPDATE properties
    SET price = 7000000, price_max = 7500000, updated_at = NOW()
    WHERE zone = 'Zone II G+0'
  `);
  console.log(`[Migrate] ✅  Zone II G+0: updated ${r2.rowCount} blocks → ETB 7,000,000 – 7,500,000`);

  // 4. Verify
  const check = await c.query(`
    SELECT zone, COUNT(*) AS blocks, MIN(price) AS min_price, MAX(price_max) AS max_price
    FROM properties
    GROUP BY zone
    ORDER BY zone
  `);
  console.log("\n[Verify] Zone prices:");
  check.rows.forEach(r => {
    const max = r.max_price ? ` – ${Number(r.max_price).toLocaleString()}` : "";
    console.log(`  ${r.zone}: ${r.blocks} blocks | ETB ${Number(r.min_price).toLocaleString()}${max}`);
  });

  console.log("\n[Migrate] 🎉  Zone prices set successfully.\n");
  await c.end();
}).catch(e => { console.error("[Error]", e.message); c.end(); });
