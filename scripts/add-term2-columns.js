require("dotenv").config({ path: ".env.local" });
const { Client } = require("pg");

async function run() {
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  try {
    await client.connect();
    console.log("[Migration] Adding term type and second term fields to payment_records...");
    
    await client.query(`
      ALTER TABLE payment_records 
      ADD COLUMN IF NOT EXISTS term_type VARCHAR(15) NOT NULL DEFAULT 'one_term',
      ADD COLUMN IF NOT EXISTS amount_term2 NUMERIC(14,2) NOT NULL DEFAULT 0,
      ADD COLUMN IF NOT EXISTS due_date_term2 DATE,
      ADD COLUMN IF NOT EXISTS paid_date_term2 DATE,
      ADD COLUMN IF NOT EXISTS status_term2 VARCHAR(20) NOT NULL DEFAULT 'pending';
    `);
    
    console.log("[Migration] Column modifications complete!");
  } catch (err) {
    console.error("[Migration] Error altering database table:", err);
  } finally {
    await client.end();
  }
}

run();
