require("dotenv").config({ path: ".env.local" });
const { Client } = require('pg');

async function main() {
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();
  try {
    console.log("=== PROPERTIES TABLE AGGREGATES ===");
    const props = await client.query("SELECT SUM(no_of_plots) as sum_no, SUM(sold_plots) as sum_sold, SUM(active_plots) as sum_active, COUNT(*) as count FROM properties");
    console.log(props.rows[0]);

    console.log("\n=== PLOT_DETAILS TABLE ACTUAL COUNTS (MATCHING SEED LOGIC) ===");
    const totalCount = await client.query("SELECT COUNT(*) FROM plot_details");
    console.log(`Total Plots: ${totalCount.rows[0].count}`);

    const soldCount = await client.query(`
      SELECT COUNT(*) FROM plot_details 
      WHERE purchaser_name <> '' 
        AND purchaser_name IS NOT NULL 
        AND purchaser_name NOT ILIKE '%tulu dimtu%'
        AND purchaser_name NOT ILIKE '%under review%'
        AND purchaser_name NOT ILIKE '%???%'
        AND purchaser_name NOT ILIKE 'community center'
    `);
    console.log(`Sold Plots: ${soldCount.rows[0].count}`);

    const activeCount = await client.query(`
      SELECT COUNT(*) FROM plot_details 
      WHERE purchaser_name = '' 
        OR purchaser_name IS NULL 
        OR purchaser_name ILIKE '%tulu dimtu%'
        OR purchaser_name ILIKE '%under review%'
        OR purchaser_name ILIKE '%???%'
        OR purchaser_name ILIKE 'community center'
    `);
    console.log(`Available Plots: ${activeCount.rows[0].count}`);

  } finally {
    await client.end();
  }
}

main().catch(console.error);
