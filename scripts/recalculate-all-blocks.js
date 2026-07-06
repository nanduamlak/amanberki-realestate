require("dotenv").config({ path: ".env.local" });
const { Client } = require("pg");

async function main() {
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();
  console.log("Connected to database.");

  console.log("Recalculating all block aggregates (no_of_plots, sold_plots, active_plots, area) from plot_details...");
  
  await client.query(`
    UPDATE properties p SET
      no_of_plots  = (SELECT COUNT(*) FROM plot_details WHERE block_id = p.id),
      sold_plots   = (SELECT COUNT(*) FROM plot_details WHERE block_id = p.id
                      AND purchaser_name <> ''
                      AND UPPER(TRIM(purchaser_name)) NOT IN ('TULU DIMTU REAL ESTATE', 'TULU DIMTU REAL ESTATE (B*)')),
      active_plots = (SELECT COUNT(*) FROM plot_details WHERE block_id = p.id
                      AND (purchaser_name = '' OR UPPER(TRIM(purchaser_name)) IN ('TULU DIMTU REAL ESTATE', 'TULU DIMTU REAL ESTATE (B*)'))),
      area         = (
                       SELECT COALESCE(SUM(
                         CASE
                           WHEN SPLIT_PART(pd.plot_size, '+', 1) ~ '^[0-9]+(\.[0-9]+)?$'
                           THEN SPLIT_PART(pd.plot_size, '+', 1)::numeric
                           ELSE 0
                         END
                       ), 0)
                       FROM plot_details pd
                       WHERE pd.block_id = p.id
                     ),
      updated_at   = NOW()
  `);
  
  console.log("✅ All block aggregates synchronized successfully.");
  await client.end();
}

main().catch(err => {
  console.error("Error:", err);
  process.exit(1);
});
