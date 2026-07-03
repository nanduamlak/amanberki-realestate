require("dotenv").config({ path: ".env.local" });
const { Client } = require("pg");

async function main() {
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();
  try {
    const props = await client.query("SELECT id, block_number, no_of_plots, no_of_buffer_plots, sold_plots, active_plots FROM properties ORDER BY block_number");
    let mismatchCount = 0;
    for (let p of props.rows) {
      const plots = await client.query("SELECT COUNT(*) FROM plot_details WHERE block_id=$1", [p.id]);
      const actual = parseInt(plots.rows[0].count, 10);
      const expected = parseInt(p.no_of_plots, 10) + parseInt(p.no_of_buffer_plots, 10);
      const sum_sold_active = parseInt(p.sold_plots, 10) + parseInt(p.active_plots, 10);
      
      if (actual !== expected || actual !== sum_sold_active || actual !== (parseInt(p.no_of_plots, 10) /* wait, if no_of_plots is supposed to be total plots */)) {
        console.log(`Block ${p.block_number} (${p.id}):`);
        console.log(`  no_of_plots (primary):  ${p.no_of_plots}`);
        console.log(`  no_of_buffer_plots:     ${p.no_of_buffer_plots}`);
        console.log(`  sold_plots:             ${p.sold_plots}`);
        console.log(`  active_plots:           ${p.active_plots}`);
        console.log(`  sum of sold + active:   ${sum_sold_active}`);
        console.log(`  actual rows in details: ${actual}`);
        mismatchCount++;
      }
    }
    console.log(`Total mismatching blocks: ${mismatchCount}`);
  } finally {
    await client.end();
  }
}

main().catch(console.error);
