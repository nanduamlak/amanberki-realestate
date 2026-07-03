require("dotenv").config({ path: ".env.local" });
const { Client } = require("pg");
const c = new Client({ connectionString: process.env.DATABASE_URL });

c.connect().then(async () => {
  console.log("[Migrate] Connected.\n");

  // Add buyer_group column to plot_details
  await c.query(`
    ALTER TABLE plot_details
    ADD COLUMN IF NOT EXISTS buyer_group TEXT DEFAULT NULL;
  `);
  console.log("[Migrate] ✅  buyer_group column added to plot_details.");

  // Add index for faster group filtering
  await c.query(`
    CREATE INDEX IF NOT EXISTS idx_plot_details_buyer_group
    ON plot_details (buyer_group)
    WHERE buyer_group IS NOT NULL;
  `);
  console.log("[Migrate] ✅  Index on buyer_group ready.");

  // Verify
  const r = await c.query(`
    SELECT column_name, data_type, column_default
    FROM information_schema.columns
    WHERE table_name = 'plot_details' AND column_name = 'buyer_group'
  `);
  console.log("[Verify] buyer_group column:", r.rows[0]);

  console.log("\n[Migrate] 🎉  buyer_group migration complete.\n");
  await c.end();
}).catch(e => { console.error("[Error]", e.message); c.end(); });
