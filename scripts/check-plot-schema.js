require("dotenv").config({ path: ".env.local" });
const { Client } = require("pg");
const c = new Client({ connectionString: process.env.DATABASE_URL });
c.connect().then(() =>
  c.query("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'plot_details' ORDER BY ordinal_position")
).then(r => {
  console.log("plot_details columns:");
  r.rows.forEach(x => console.log(" ", x.column_name, "-", x.data_type));
  c.end();
}).catch(e => { console.error(e.message); c.end(); });
