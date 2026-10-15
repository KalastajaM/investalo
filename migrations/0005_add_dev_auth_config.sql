CREATE TABLE IF NOT EXISTS "dev_auth_config" (
  "id" integer PRIMARY KEY DEFAULT 1,
  "password_hash" text NOT NULL,
  "updated_at" timestamp DEFAULT now()
);
