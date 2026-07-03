require("dotenv").config({ path: ".env.local" });
const { Client } = require("pg");

async function main() {
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();
  try {
    const res = await client.query("SELECT COALESCE(NULLIF(TRIM(title_deeds_status), ''), 'Not Specified') as status, COUNT(*) FROM plot_details GROUP BY TRIM(title_deeds_status)");
    console.log(res.rows);
  } finally {
    await client.end();
  }
}

main().catch(console.error);
