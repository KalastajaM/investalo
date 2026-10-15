-- Generated against the 0000 snapshot, so it repeats changes from 0001-0006.
-- Every statement is idempotent: on a fresh database it is a no-op for those
-- changes, and on databases where 0005/0006 were skipped (their journal
-- timestamps predate 0004's) it applies them.
CREATE TABLE IF NOT EXISTS "dev_auth_config" (
	"id" integer PRIMARY KEY DEFAULT 1 NOT NULL,
	"password_hash" text NOT NULL,
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "properties" ADD COLUMN IF NOT EXISTS "rooms" text;--> statement-breakpoint
ALTER TABLE "properties" ADD COLUMN IF NOT EXISTS "investment_analysis" jsonb;--> statement-breakpoint
ALTER TABLE "properties" ADD COLUMN IF NOT EXISTS "market_analysis" jsonb;--> statement-breakpoint
ALTER TABLE "settings" ADD COLUMN IF NOT EXISTS "market" text DEFAULT 'fi' NOT NULL;--> statement-breakpoint
ALTER TABLE "settings" ADD COLUMN IF NOT EXISTS "currency" text DEFAULT 'EUR' NOT NULL;--> statement-breakpoint
ALTER TABLE "settings" ADD COLUMN IF NOT EXISTS "deduct_loan_interest" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "settings" ADD COLUMN IF NOT EXISTS "depreciation_deduction_enabled" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "settings" ADD COLUMN IF NOT EXISTS "depreciation_rate" numeric DEFAULT '2.5' NOT NULL;--> statement-breakpoint
ALTER TABLE "settings" ADD COLUMN IF NOT EXISTS "depreciable_value_percent" numeric DEFAULT '70' NOT NULL;--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "projects_user_id_idx" ON "projects" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "properties_user_id_idx" ON "properties" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "settings_user_id_idx" ON "settings" USING btree ("user_id");