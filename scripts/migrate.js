#!/usr/bin/env node
/**
 * Runs drizzle-orm migrations programmatically and exits cleanly.
 * The drizzle-kit CLI can hang after applying migrations because the
 * pg connection keeps the Node.js event loop alive indefinitely.
 */

import pg from "pg";
import { drizzle } from "drizzle-orm/node-postgres";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import { fileURLToPath } from "url";
import path from "path";

// Load .env for local use; variables already set in the environment take precedence.
try {
  process.loadEnvFile();
} catch (err) {
  if (err.code !== "ENOENT") throw err;
}

const { Client } = pg;
const __dirname = path.dirname(fileURLToPath(import.meta.url));

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  console.error("DATABASE_URL is not set. Skipping migrations.");
  process.exit(0);
}

const client = new Client({ connectionString: databaseUrl });

try {
  await client.connect();
  const db = drizzle(client);
  const migrationsFolder = path.resolve(__dirname, "../migrations");
  console.log(`Running migrations from ${migrationsFolder}...`);
  await migrate(db, { migrationsFolder });
  console.log("Migrations complete.");
} catch (err) {
  console.error("Migration failed:", err.message);
  process.exit(1);
} finally {
  await client.end();
}

process.exit(0);
