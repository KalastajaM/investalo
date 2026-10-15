import crypto from "crypto";
import { db, pool } from "../db";
import { devAuthConfig } from "@shared/schema";
import { eq } from "drizzle-orm";

const SCRYPT_PARAMS = { N: 16384, r: 8, p: 1, dkLen: 64 };

/** Ensure the dev_auth_config table exists — belt-and-suspenders in case the
 *  Drizzle migration runner skips or fails migration 0005 silently. */
export async function ensureDevAuthConfigTable(): Promise<void> {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS "dev_auth_config" (
      "id" integer PRIMARY KEY DEFAULT 1,
      "password_hash" text NOT NULL,
      "updated_at" timestamp DEFAULT now()
    )
  `);
}

function hashPassword(plain: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const salt = crypto.randomBytes(16).toString("hex");
    crypto.scrypt(plain, salt, SCRYPT_PARAMS.dkLen, { N: SCRYPT_PARAMS.N, r: SCRYPT_PARAMS.r, p: SCRYPT_PARAMS.p }, (err, hash) => {
      if (err) return reject(err);
      resolve(`${salt}:${hash.toString("hex")}`);
    });
  });
}

export function verifyPassword(plain: string, stored: string): Promise<boolean> {
  return new Promise((resolve, reject) => {
    const [salt, hashHex] = stored.split(":");
    if (!salt || !hashHex) return resolve(false);
    const expected = Buffer.from(hashHex, "hex");
    crypto.scrypt(plain, salt, SCRYPT_PARAMS.dkLen, { N: SCRYPT_PARAMS.N, r: SCRYPT_PARAMS.r, p: SCRYPT_PARAMS.p }, (err, hash) => {
      if (err) return reject(err);
      try {
        resolve(crypto.timingSafeEqual(hash, expected));
      } catch {
        resolve(false);
      }
    });
  });
}

export async function getPasswordHash(): Promise<string | null> {
  const rows = await db.select().from(devAuthConfig).where(eq(devAuthConfig.id, 1)).limit(1);
  return rows[0]?.passwordHash ?? null;
}

export async function setPasswordHash(plain: string): Promise<void> {
  const hash = await hashPassword(plain);
  await db
    .insert(devAuthConfig)
    .values({ id: 1, passwordHash: hash })
    .onConflictDoUpdate({ target: devAuthConfig.id, set: { passwordHash: hash, updatedAt: new Date() } });
}

/** On first startup, seed the DB password from the DEV_PASSWORD env var if no row exists yet. */
export async function seedFromEnvIfNeeded(): Promise<void> {
  const envPassword = process.env.DEV_PASSWORD;
  if (!envPassword) return;
  const existing = await getPasswordHash();
  if (existing) return; // DB already has a password — env var is ignored
  await setPasswordHash(envPassword);
  console.log("[startup] DEV_PASSWORD seeded into database. The env var can now be removed.");
}
