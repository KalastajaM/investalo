ALTER TABLE "settings" ADD COLUMN IF NOT EXISTS "market" text NOT NULL DEFAULT 'fi';
--> statement-breakpoint
ALTER TABLE "settings" ADD COLUMN IF NOT EXISTS "currency" text NOT NULL DEFAULT 'EUR';
