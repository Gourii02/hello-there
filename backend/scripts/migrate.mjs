import "dotenv/config";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { Pool } from "pg";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error(
    "DATABASE_URL is required. Configure backend/.env before running migrations.",
  );
}

const pool = new Pool({ connectionString });
const migrationPath = fileURLToPath(
  new URL("../sql/001_create_greeting_submissions.sql", import.meta.url),
);

try {
  const migration = await readFile(migrationPath, "utf8");
  await pool.query(migration);
  console.log("Database migration applied.");
} finally {
  await pool.end();
}
