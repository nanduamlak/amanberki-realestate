require("dotenv").config({ path: ".env.local" });
const { Client } = require('pg');
const bcrypt = require('bcryptjs');

// Validate required env vars before doing anything
if (!process.env.DATABASE_URL) {
  console.error("FATAL: DATABASE_URL is not set in .env.local");
  process.exit(1);
}

const client = new Client({ connectionString: process.env.DATABASE_URL });

async function seedUsers() {
  try {
    await client.connect();
    console.log("[Seed] Connected to database.");

    // Define the users to add
    const usersToCreate = [
      {
        name: "Jane Admin",
        email: "jane@greenfield.com",
        password: "AdminPassword123!",
        role: "admin"
      },
      {
        name: "John User",
        email: "john@greenfield.com",
        password: "UserPassword123!",
        role: "user"
      }
    ];

    for (const u of usersToCreate) {
      // Check if user already exists
      const checkRes = await client.query("SELECT id FROM users WHERE email = $1", [u.email]);
      if (checkRes.rows.length > 0) {
        console.log(`[Seed] User ${u.email} already exists. Skipping.`);
        continue;
      }

      // Hash password and insert
      const hash = await bcrypt.hash(u.password, 12);
      await client.query(
        "INSERT INTO users (name, email, password_hash, role) VALUES ($1, $2, $3, $4)",
        [u.name, u.email, hash, u.role]
      );
      
      console.log(`[Seed] ✅ Created ${u.role}:`);
      console.log(`       Email:    ${u.email}`);
      console.log(`       Password: ${u.password}`);
    }

    console.log("[Seed] User seeding complete.");
  } catch (error) {
    console.error("[Seed] Error:", error);
  } finally {
    await client.end();
  }
}

seedUsers();
