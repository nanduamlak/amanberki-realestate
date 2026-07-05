const { Client } = require('pg');
require('dotenv').config({ path: '.env.local' });

async function main() {
  const c = new Client({ connectionString: process.env.DATABASE_URL });
  await c.connect();

  // List all tables
  const tables = await c.query("SELECT tablename FROM pg_tables WHERE schemaname='public'");
  console.log('TABLES:', tables.rows.map(x => x.tablename).join(', '));

  // Try to find the plots table
  for (const t of tables.rows) {
    if (t.tablename.includes('plot') || t.tablename.includes('block')) {
      const cols = await c.query(`SELECT column_name FROM information_schema.columns WHERE table_name='${t.tablename}'`);
      console.log(`\nTABLE ${t.tablename} columns:`, cols.rows.map(x => x.column_name).join(', '));
    }
  }

  // Get sample data from plot-related table
  try {
    const r = await c.query('SELECT * FROM plot_details LIMIT 5');
    console.log('\nSAMPLE plot_details:');
    r.rows.forEach(row => {
      console.log(JSON.stringify({
        block_id: row.block_id,
        plot_number: row.plot_number,
        title_deeds_status: row.title_deeds_status,
        construction_status: row.construction_status,
        purchaser_name: row.purchaser_name,
      }));
    });
  } catch(e) {
    console.log('plot_details error:', e.message);
  }

  // Also check distinct values
  try {
    const r2 = await c.query('SELECT DISTINCT title_deeds_status FROM plot_details');
    console.log('\nDISTINCT title_deeds_status values:', r2.rows.map(x => JSON.stringify(x.title_deeds_status)));
    
    const r3 = await c.query('SELECT DISTINCT construction_status FROM plot_details');
    console.log('DISTINCT construction_status values:', r3.rows.map(x => JSON.stringify(x.construction_status)));
  } catch(e) {
    console.log('distinct query error:', e.message);
  }

  await c.end();
}

main().catch(console.error);
