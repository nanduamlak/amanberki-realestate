require("dotenv").config({ path: ".env.local" });
const { Client } = require("pg");
const c = new Client({ connectionString: process.env.DATABASE_URL });

c.connect().then(async () => {
  // Check column type of block_number
  const r = await c.query(
    `SELECT column_name, data_type, character_maximum_length
     FROM information_schema.columns
     WHERE table_name = 'properties' AND column_name IN ('block_number', 'id', 'zone')
     ORDER BY column_name`
  );
  console.log("Column types:", JSON.stringify(r.rows, null, 2));

  // Also check if there's a display_name or label column
  const cols = await c.query(
    `SELECT column_name, data_type FROM information_schema.columns
     WHERE table_name = 'properties' ORDER BY ordinal_position`
  );
  console.log("\nAll properties columns:");
  cols.rows.forEach(x => console.log(`  ${x.column_name} (${x.data_type})`));

  await c.end();
}).catch(e => { console.error(e.message); c.end(); });
