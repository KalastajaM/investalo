// Load .env for local development. Imported first by server/index.ts so the values
// exist before server/db.ts reads DATABASE_URL. Variables already set in the
// environment (Railway, Docker, CI) are not overridden, and a missing file is fine.
try {
  process.loadEnvFile();
} catch (err) {
  if ((err as NodeJS.ErrnoException).code !== "ENOENT") throw err;
}
