require("dotenv").config({ path: ".env.local" });
const { Client } = require("pg");
const c = new Client({ connectionString: process.env.DATABASE_URL });

c.connect().then(async () => {
  // Check blocks 461 and 462
  const r = await c.query(
    `SELECT id, block_number, zone, no_of_plots, sold_plots, status
     FROM properties
     WHERE block_number IN (461, 462, 46)
     OR id ILIKE '%46A%' OR id ILIKE '%46B%' OR id ILIKE '%461%' OR id ILIKE '%462%'
     ORDER BY block_number`
  );
  console.log("Found blocks:", JSON.stringify(r.rows, null, 2));
  await c.end();
}).catch(e => { console.error(e.message); c.end(); });
