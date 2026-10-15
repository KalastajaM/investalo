CREATE TABLE IF NOT EXISTS "sessions" (
	"sid" varchar PRIMARY KEY NOT NULL,
	"sess" jsonb NOT NULL,
	"expire" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "users" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" varchar,
	"first_name" varchar,
	"last_name" varchar,
	"profile_image_url" varchar,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "projects" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" varchar NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "settings" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" varchar NOT NULL,
	"loan_interest_rate" numeric NOT NULL DEFAULT '3.5',
	"loan_duration_years" integer NOT NULL DEFAULT 25,
	"transfer_tax_rate" numeric NOT NULL DEFAULT '1.5',
	"capital_gains_tax_rate" numeric NOT NULL DEFAULT '30.0',
	"capital_gains_tax_rate_high" numeric NOT NULL DEFAULT '34.0',
	"inflation_rate" numeric NOT NULL DEFAULT '2.0',
	"alternative_investment_return" numeric NOT NULL DEFAULT '7.0',
	"simulation_duration_years" integer NOT NULL DEFAULT 10,
	"rent_increase_rate" numeric NOT NULL DEFAULT '1.5',
	"maintenance_fee_increase_rate" numeric NOT NULL DEFAULT '3.0',
	"value_appreciation_rate" numeric NOT NULL DEFAULT '1.5',
	"broker_fee_percentage" numeric NOT NULL DEFAULT '3.0',
	"min_broker_fee" numeric NOT NULL DEFAULT '4000',
	"registration_costs" numeric NOT NULL DEFAULT '450',
	"monthly_loan_fees" numeric NOT NULL DEFAULT '2.50',
	"empty_months_per_year" numeric NOT NULL DEFAULT '0.5',
	"landlord_association_fee" numeric NOT NULL DEFAULT '98',
	"liability_insurance" numeric NOT NULL DEFAULT '200',
	"capital_gains_threshold" numeric NOT NULL DEFAULT '30000'
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "properties" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" varchar NOT NULL,
	"name" text NOT NULL,
	"city" text NOT NULL,
	"area" text NOT NULL,
	"size_m2" numeric NOT NULL,
	"build_year" integer,
	"purchase_price" numeric NOT NULL,
	"debt_free_price" numeric,
	"renovation_cost" numeric DEFAULT '0',
	"rent_per_month" numeric NOT NULL,
	"maintenance_fee_per_month" numeric NOT NULL,
	"finance_fee_per_month" numeric DEFAULT '0',
	"water_fee_per_month" numeric DEFAULT '20',
	"other_costs_per_month" numeric DEFAULT '0',
	"down_payment" numeric NOT NULL,
	"yearly_extra_maintenance" numeric DEFAULT '0',
	"is_finance_fee_deductible" boolean DEFAULT true,
	"project_ids" integer[] DEFAULT '{}'::integer[],
	"address" text,
	"latitude" numeric,
	"longitude" numeric,
	"notes" text,
	"custom_link" text,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "IDX_session_expire" ON "sessions" USING btree ("expire");
