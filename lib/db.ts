import { Pool } from "pg";

// Fail LOUDLY at startup if DATABASE_URL is not configured.
// This prevents the app from running with hardcoded credentials.
if (!process.env.DATABASE_URL) {
  throw new Error(
    "[DB] FATAL: DATABASE_URL environment variable is not set. " +
    "Create a .env.local file with a valid DATABASE_URL."
  );
}

// SSL logic:
//  DATABASE_SSL=false  → always disable SSL (local / on-prem Postgres)
//  DATABASE_SSL=true   → enable SSL with cert verification
//  unset               → disable in dev, enable in production (cloud DBs)
function getSslConfig() {
  const explicit = process.env.DATABASE_SSL?.toLowerCase();
  if (explicit === "false" || explicit === "0" || explicit === "disable") return false;
  if (explicit === "true" || explicit === "1") return { rejectUnauthorized: true };
  // Fallback: cloud production uses SSL; local dev does not
  return process.env.NODE_ENV === "production" ? { rejectUnauthorized: false } : false;
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
  ssl: getSslConfig(),
});

export async function query(text: string, params?: unknown[]) {
  const client = await pool.connect();
  try {
    return await client.query(text, params);
  } finally {
    client.release();
  }
}
