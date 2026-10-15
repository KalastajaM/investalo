#!/usr/bin/env node
/**
 * Creates the target database if it doesn't exist.
 * Railway provisions a PostgreSQL server but may not pre-create the database.
 * This script connects to the default 'postgres' database and creates the
 * target database from DATABASE_URL if it's missing.
 */

import pg from "pg";

const { Client } = pg;

async function main() {
  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) {
    console.error("DATABASE_URL is not set. Skipping database creation.");
    process.exit(0);
  }

  let url;
  try {
    url = new URL(databaseUrl);
  } catch (e) {
    console.error("Invalid DATABASE_URL format:", e.message);
    process.exit(1);
  }

  const dbName = url.pathname.replace(/^\//, "");

  if (!dbName) {
    console.log("No database name found in DATABASE_URL. Skipping.");
    process.exit(0);
  }

  // Connect to the default 'postgres' maintenance database to create the target db
  const adminUrl = new URL(databaseUrl);
  adminUrl.pathname = "/postgres";

  const client = new Client({ connectionString: adminUrl.toString() });

  try {
    await client.connect();

    const result = await client.query(
      "SELECT 1 FROM pg_database WHERE datname = $1",
      [dbName]
    );

    if (result.rows.length === 0) {
      console.log(`Database "${dbName}" not found — creating it...`);
      // Database names can't be parameterized in CREATE DATABASE
      await client.query(`CREATE DATABASE "${dbName.replace(/"/g, '""')}"`);
      console.log(`Database "${dbName}" created successfully.`);
    } else {
      console.log(`Database "${dbName}" already exists.`);
    }
  } catch (err) {
    // Log but don't hard-fail — the database may exist under a different role
    // or the user may not have CREATE DATABASE privileges.
    console.error("Warning: could not create database:", err.message);
    console.error(
      "Continuing anyway — if the database already exists this is fine."
    );
  } finally {
    await client.end();
  }
}

main().then(() => process.exit(0)).catch((err) => {
  console.error("setup-db failed:", err.message);
  process.exit(1);
});
