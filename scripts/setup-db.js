require("dotenv").config({ path: ".env.local" });
const { Client } = require('pg');
const bcrypt = require('bcryptjs');

// Validate required env vars before doing anything
if (!process.env.DATABASE_URL) {
  console.error("FATAL: DATABASE_URL is not set in .env.local");
  process.exit(1);
}

const DB_URL = process.env.DATABASE_URL;

// Derive the base URL (postgres DB) for creating the new DB
const url = new URL(DB_URL);
const TARGET_DB = url.pathname.slice(1); // e.g. "real_estate_db"
url.pathname = "/postgres";
const ADMIN_URL = url.toString();

async function setup() {
  console.log(`[Setup] Connecting to postgres to ensure "${TARGET_DB}" exists...`);
  const adminClient = new Client({ connectionString: ADMIN_URL });

  try {
    await adminClient.connect();
    const res = await adminClient.query(
      "SELECT datname FROM pg_database WHERE datname = $1",
      [TARGET_DB]
    );
    if (res.rows.length === 0) {
      await adminClient.query(`CREATE DATABASE "${TARGET_DB}"`);
      console.log(`[Setup] Database "${TARGET_DB}" created.`);
    } else {
      console.log(`[Setup] Database "${TARGET_DB}" already exists.`);
    }
  } finally {
    await adminClient.end();
  }

  console.log(`[Setup] Connecting to "${TARGET_DB}" to set up schema...`);
  const client = new Client({ connectionString: DB_URL });

  try {
    await client.connect();

    // Immutable users table with proper constraints
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(254) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        role VARCHAR(50) NOT NULL DEFAULT 'user' CHECK (role IN ('super_admin', 'admin', 'user')),
        is_active BOOLEAN NOT NULL DEFAULT TRUE,
        failed_attempts INTEGER NOT NULL DEFAULT 0,
        locked_until TIMESTAMPTZ,
        last_login TIMESTAMPTZ,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);
    console.log("[Setup] Users table verified.");

    // Ensure email index exists
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_users_email ON users (email);
    `);
    console.log("[Setup] Email index verified.");

    // Create default admin if not exists
    const checkAdmin = await client.query(
      "SELECT id FROM users WHERE email = $1",
      ["admin@greenfield.com"]
    );

    if (checkAdmin.rows.length === 0) {
      // bcrypt cost factor 12 — significantly harder to crack than 10
      const hash = await bcrypt.hash("Admin@GF2025!", 12);
      await client.query(
        "INSERT INTO users (name, email, password_hash, role) VALUES ($1, $2, $3, $4)",
        ["System Administrator", "admin@greenfield.com", hash, "super_admin"]
      );
      console.log("[Setup] Default admin user created.");
      console.log("[Setup] Email:    admin@greenfield.com");
      console.log("[Setup] Password: Admin@GF2025!");
      console.log("[Setup] ⚠️  Change this password immediately after first login!");
    } else {
      console.log("[Setup] Admin user already exists — skipping creation.");
    }

    console.log("[Setup] ✅ Database setup complete!");
  } finally {
    await client.end();
  }
}

setup().catch((err) => {
  console.error("[Setup] Fatal error:", err.message);
  process.exit(1);
});
