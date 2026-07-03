require("dotenv").config({ path: ".env.local" });
const { Client } = require("pg");
const c = new Client({ connectionString: process.env.DATABASE_URL });

c.connect().then(async () => {
  const res = await c.query(`
    SELECT zone, COUNT(*) AS blocks
    FROM properties
    GROUP BY zone
    ORDER BY zone
  `);
  console.log("Zone counts:", res.rows);

  // Zone I G+1  -> 11,200,000 ETB
  // Zone II G+0 -> range: set to midpoint 7,250,000 or we can store 7,000,000 (low) and a separate high
  // Since price is a single numeric column, let's confirm what makes most sense
  // For Zone II, user said 7M-7.5M. We'll set 7,000,000 as the base and note the range in a comment.
  // Let's just print current prices first.
  const prices = await c.query(`SELECT id, block_number, zone, price FROM properties ORDER BY zone, block_number LIMIT 20`);
  console.log("\nSample current prices:");
  prices.rows.forEach(r => console.log(`  Block ${r.block_number} (${r.zone}): ETB ${Number(r.price).toLocaleString()}`));

  await c.end();
}).catch(e => { console.error(e.message); c.end(); });
