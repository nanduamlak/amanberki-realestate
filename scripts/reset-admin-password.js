require("dotenv").config({ path: ".env.local" });
const { Client } = require('pg');
const bcrypt = require('bcryptjs');

async function resetPassword() {
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();

  const newPassword = "Admin@GF2025!";
  const hash = await bcrypt.hash(newPassword, 12);

  const res = await client.query(
    "UPDATE users SET password_hash = $1 WHERE email = $2 RETURNING id, email",
    [hash, "admin@greenfield.com"]
  );

  if (res.rows.length > 0) {
    console.log(`[Reset] ✅ Password updated for: ${res.rows[0].email}`);
    console.log(`[Reset] New password: ${newPassword}`);
  } else {
    console.log("[Reset] ❌ User not found. Run setup-db.js first.");
  }

  await client.end();
}

resetPassword().catch(console.error);
