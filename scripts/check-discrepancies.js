require("dotenv").config({ path: ".env.local" });
const { Client } = require("pg");

async function main() {
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();
  try {
    const props = await client.query("SELECT id, block_number, sold_plots, active_plots FROM properties ORDER BY block_number");
    for (let p of props.rows) {
      const soldRes = await client.query(`
        SELECT COUNT(*) FROM plot_details 
        WHERE block_id=$1 
          AND purchaser_name <> '' 
          AND purchaser_name IS NOT NULL 
          AND purchaser_name NOT ILIKE '%tulu dimtu%'
          AND purchaser_name NOT ILIKE '%under review%'
          AND purchaser_name NOT ILIKE '%???%'
          AND purchaser_name <> 'community center'
      `, [p.id]);
      const activeRes = await client.query(`
        SELECT COUNT(*) FROM plot_details 
        WHERE block_id=$1 
          AND (purchaser_name = '' 
            OR purchaser_name IS NULL 
            OR purchaser_name ILIKE '%tulu dimtu%'
            OR purchaser_name ILIKE '%under review%'
            OR purchaser_name ILIKE '%???%'
            OR purchaser_name = 'community center')
      `, [p.id]);

      const actualSold = parseInt(soldRes.rows[0].count, 10);
      const actualActive = parseInt(activeRes.rows[0].count, 10);

      if (p.sold_plots !== actualSold || p.active_plots !== actualActive) {
        console.log(`Mismatch for Block ${p.block_number} (${p.id}):`);
        console.log(`  properties table: sold_plots=${p.sold_plots}, active_plots=${p.active_plots}`);
        console.log(`  plot_details:     actualSold=${actualSold}, actualActive=${actualActive}`);
      }
    }
  } finally {
    await client.end();
  }
}

main().catch(console.error);
