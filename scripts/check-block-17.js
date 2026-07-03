require("dotenv").config({ path: ".env.local" });
const { Client } = require("pg");

async function main() {
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();
  try {
    const res = await client.query("SELECT plot_number, purchaser_name, construction_status FROM plot_details WHERE block_id='BLOCK-017' ORDER BY plot_number");
    console.log(res.rows);
  } finally {
    await client.end();
  }
}

main().catch(console.error);
