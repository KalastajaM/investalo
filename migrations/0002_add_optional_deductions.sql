ALTER TABLE "settings" ADD COLUMN IF NOT EXISTS "deduct_loan_interest" boolean NOT NULL DEFAULT true;
--> statement-breakpoint
ALTER TABLE "settings" ADD COLUMN IF NOT EXISTS "depreciation_deduction_enabled" boolean NOT NULL DEFAULT false;
--> statement-breakpoint
ALTER TABLE "settings" ADD COLUMN IF NOT EXISTS "depreciation_rate" numeric NOT NULL DEFAULT '2.5';
--> statement-breakpoint
ALTER TABLE "settings" ADD COLUMN IF NOT EXISTS "depreciable_value_percent" numeric NOT NULL DEFAULT '70';
