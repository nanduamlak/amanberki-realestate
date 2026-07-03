require("dotenv").config({ path: ".env.local" });
const { Client } = require("pg");

async function run() {
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  try {
    await client.connect();
    console.log("[Migration] Adding new fields to payment_records...");
    
    await client.query(`
      ALTER TABLE payment_records 
      ADD COLUMN IF NOT EXISTS total_amount NUMERIC(14,2) NOT NULL DEFAULT 0,
      ADD COLUMN IF NOT EXISTS paid_amount NUMERIC(14,2) NOT NULL DEFAULT 0,
      ADD COLUMN IF NOT EXISTS remaining_amount NUMERIC(14,2) NOT NULL DEFAULT 0;
    `);
    
    console.log("[Migration] Column modifications complete!");
  } catch (err) {
    console.error("[Migration] Error altering database table:", err);
  } finally {
    await client.end();
  }
}

run();
