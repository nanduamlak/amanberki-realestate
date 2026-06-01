require("dotenv").config({ path: ".env.local" });
const { Client } = require('pg');

async function fixSchema() {
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  
  try {
    await client.connect();
    console.log("[Fix Schema] Connected.");

    await client.query(`
      ALTER TABLE users
        ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT TRUE,
        ADD COLUMN IF NOT EXISTS failed_attempts INTEGER NOT NULL DEFAULT 0,
        ADD COLUMN IF NOT EXISTS locked_until TIMESTAMPTZ,
        ADD COLUMN IF NOT EXISTS last_login TIMESTAMPTZ,
        ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();
    `);
    
    console.log("[Fix Schema] Missing columns added to 'users' table successfully.");
  } catch (error) {
    console.error("[Fix Schema] Error:", error);
  } finally {
    await client.end();
  }
}

fixSchema();
