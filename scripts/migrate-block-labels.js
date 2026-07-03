require("dotenv").config({ path: ".env.local" });
const { Client } = require("pg");
const c = new Client({ connectionString: process.env.DATABASE_URL });

c.connect().then(async () => {
  console.log("[Migration] Connected.\n");

  // 1. Add block_label column (nullable text, defaults to NULL = use block_number)
  await c.query(`
    ALTER TABLE properties
    ADD COLUMN IF NOT EXISTS block_label VARCHAR(10) DEFAULT NULL;
  `);
  console.log("[Migration] ✅  block_label column added.");

  // 2. Set 46A label and keep Zone I G+1
  const r1 = await c.query(`
    UPDATE properties
    SET block_label = '46A', updated_at = NOW()
    WHERE id = 'BLOCK-046A'
    RETURNING id, block_number, block_label, zone
  `);
  console.log("[Migration] ✅  BLOCK-046A →", r1.rows[0]);

  // 3. Set 46B label AND fix zone to Zone II G+0
  const r2 = await c.query(`
    UPDATE properties
    SET block_label = '46B', zone = 'Zone II G+0', updated_at = NOW()
    WHERE id = 'BLOCK-046B'
    RETURNING id, block_number, block_label, zone
  `);
  console.log("[Migration] ✅  BLOCK-046B →", r2.rows[0]);

  // 4. Verify
  const check = await c.query(`
    SELECT id, block_number, block_label, zone
    FROM properties
    WHERE id IN ('BLOCK-046A', 'BLOCK-046B')
    ORDER BY id
  `);
  console.log("\n[Verify]", JSON.stringify(check.rows, null, 2));

  console.log("\n[Migration] 🎉  Block 46A/46B migration complete.");
  await c.end();
}).catch(e => { console.error("[Error]", e.message); c.end(); });
