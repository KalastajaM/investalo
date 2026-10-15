
import { pgTable, text, serial, integer, numeric, boolean, timestamp, varchar, jsonb, index } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { sql } from "drizzle-orm";
import { users } from "./models/auth";

export * from "./models/auth";

// === TABLE DEFINITIONS ===

export const projects = pgTable("projects", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow(),
}, (t) => [index("projects_user_id_idx").on(t.userId)]);

export const settings = pgTable("settings", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  market: text("market").notNull().default("fi"),
  currency: text("currency").notNull().default("EUR"),
  loanInterestRate: numeric("loan_interest_rate").notNull().default("3.5"),
  loanDurationYears: integer("loan_duration_years").notNull().default(25),
  transferTaxRate: numeric("transfer_tax_rate").notNull().default("1.5"),
  capitalGainsTaxRate: numeric("capital_gains_tax_rate").notNull().default("30.0"),
  capitalGainsTaxRateHigh: numeric("capital_gains_tax_rate_high").notNull().default("34.0"),
  inflationRate: numeric("inflation_rate").notNull().default("2.0"),
  alternativeInvestmentReturn: numeric("alternative_investment_return").notNull().default("7.0"),
  simulationDurationYears: integer("simulation_duration_years").notNull().default(10),
  rentIncreaseRate: numeric("rent_increase_rate").notNull().default("1.5"),
  maintenanceFeeIncreaseRate: numeric("maintenance_fee_increase_rate").notNull().default("3.0"),
  valueAppreciationRate: numeric("value_appreciation_rate").notNull().default("1.5"),
  brokerFeePercentage: numeric("broker_fee_percentage").notNull().default("3.0"),
  minBrokerFee: numeric("min_broker_fee").notNull().default("4000"),
  registrationCosts: numeric("registration_costs").notNull().default("450"),
  monthlyLoanFees: numeric("monthly_loan_fees").notNull().default("2.50"),
  emptyMonthsPerYear: numeric("empty_months_per_year").notNull().default("0.5"),
  landlordAssociationFee: numeric("landlord_association_fee").notNull().default("98"),
  liabilityInsurance: numeric("liability_insurance").notNull().default("200"),
  capitalGainsThreshold: numeric("capital_gains_threshold").notNull().default("30000"),
  // Optional deductions — configurable per market/country
  deductLoanInterest: boolean("deduct_loan_interest").notNull().default(true),
  depreciationDeductionEnabled: boolean("depreciation_deduction_enabled").notNull().default(false),
  depreciationRate: numeric("depreciation_rate").notNull().default("2.5"),
  depreciableValuePercent: numeric("depreciable_value_percent").notNull().default("70"),
}, (t) => [index("settings_user_id_idx").on(t.userId)]);

export const properties = pgTable("properties", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  city: text("city").notNull(),
  area: text("area").notNull(),
  sizeM2: numeric("size_m2").notNull(),
  buildYear: integer("build_year"),
  purchasePrice: numeric("purchase_price").notNull(),
  debtFreePrice: numeric("debt_free_price"),
  renovationCost: numeric("renovation_cost").default("0"),
  rentPerMonth: numeric("rent_per_month").notNull(),
  maintenanceFeePerMonth: numeric("maintenance_fee_per_month").notNull(),
  financeFeePerMonth: numeric("finance_fee_per_month").default("0"),
  waterFeePerMonth: numeric("water_fee_per_month").default("20"),
  otherCostsPerMonth: numeric("other_costs_per_month").default("0"),
  downPayment: numeric("down_payment").notNull(),
  yearlyExtraMaintenance: numeric("yearly_extra_maintenance").default("0"),
  isFinanceFeeDeductible: boolean("is_finance_fee_deductible").default(true),
  projectIds: integer("project_ids").array().default(sql`'{}'::integer[]`),
  address: text("address"),
  latitude: numeric("latitude"),
  longitude: numeric("longitude"),
  rooms: text("rooms"),
  notes: text("notes"),
  investmentAnalysis: jsonb("investment_analysis").$type<InvestmentAnalysis>(),
  marketAnalysis: jsonb("market_analysis").$type<MarketAnalysis>(),
  customLink: text("custom_link"),
  createdAt: timestamp("created_at").defaultNow(),
}, (t) => [index("properties_user_id_idx").on(t.userId)]);

// === SCHEMAS ===

export const investmentAnalysisSchema = z.object({
  verdict: z.enum(["good", "caution", "poor"]),
  summary: z.string(),
  positives: z.array(z.string()),
  flags: z.array(z.string()),
  recommendation: z.string(),
});

export const marketAnalysisSchema = z.object({
  summary: z.string(),
  askingPriceAnalysis: z.string(),
  rentAnalysis: z.string(),
  offerPriceRange: z.object({ low: z.number(), mid: z.number(), high: z.number() }),
  marketRentEstimate: z.object({ low: z.number(), mid: z.number(), high: z.number() }),
  confidence: z.enum(["low", "medium", "high"]),
  analyzedAt: z.string(),
});

export const insertProjectSchema = createInsertSchema(projects).omit({ id: true, userId: true, createdAt: true });


export const insertSettingsSchema = createInsertSchema(settings).omit({ id: true, userId: true }).extend({
  market: z.string().default("fi"),
  currency: z.string().default("EUR"),
  loanInterestRate: z.coerce.string(),
  transferTaxRate: z.coerce.string(),
  capitalGainsTaxRate: z.coerce.string(),
  capitalGainsTaxRateHigh: z.coerce.string(),
  inflationRate: z.coerce.string(),
  alternativeInvestmentReturn: z.coerce.string(),
  rentIncreaseRate: z.coerce.string(),
  maintenanceFeeIncreaseRate: z.coerce.string(),
  valueAppreciationRate: z.coerce.string(),
  brokerFeePercentage: z.coerce.string(),
  minBrokerFee: z.coerce.string(),
  registrationCosts: z.coerce.string(),
  monthlyLoanFees: z.coerce.string(),
  emptyMonthsPerYear: z.coerce.string(),
  landlordAssociationFee: z.coerce.string(),
  liabilityInsurance: z.coerce.string(),
  capitalGainsThreshold: z.coerce.string(),
  deductLoanInterest: z.boolean().default(true),
  depreciationDeductionEnabled: z.boolean().default(false),
  depreciationRate: z.coerce.string(),
  depreciableValuePercent: z.coerce.string(),
});

export const insertPropertySchema = createInsertSchema(properties).omit({ id: true, userId: true, createdAt: true }).extend({
  sizeM2: z.coerce.string(),
  buildYear: z.coerce.number().int().min(1800).max(2100).optional().nullable(),
  purchasePrice: z.coerce.string(),
  debtFreePrice: z.coerce.string().optional(),
  renovationCost: z.coerce.string().default("0"),
  rentPerMonth: z.coerce.string(),
  maintenanceFeePerMonth: z.coerce.string(),
  financeFeePerMonth: z.coerce.string().default("0"),
  waterFeePerMonth: z.coerce.string().default("20"),
  otherCostsPerMonth: z.coerce.string().default("0"),
  downPayment: z.coerce.string(),
  yearlyExtraMaintenance: z.coerce.string().default("0"),
  address: z.string().optional().nullable(),
  latitude: z.coerce.string().optional().nullable(),
  longitude: z.coerce.string().optional().nullable(),
  rooms: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
  investmentAnalysis: investmentAnalysisSchema.optional().nullable(),
  marketAnalysis: marketAnalysisSchema.optional().nullable(),
  customLink: z.string().optional().nullable(),
  projectIds: z.array(z.number().int()).default([]),
});

// Single-row table storing the hashed dev gate password (only used when DEV_MODE=true)
export const devAuthConfig = pgTable("dev_auth_config", {
  id: integer("id").primaryKey().default(1),
  passwordHash: text("password_hash").notNull(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export type Project = typeof projects.$inferSelect;
export type InsertProject = z.infer<typeof insertProjectSchema>;
export type Settings = typeof settings.$inferSelect;
export type InsertSettings = z.infer<typeof insertSettingsSchema>;
export type Property = typeof properties.$inferSelect;
export type InsertProperty = z.infer<typeof insertPropertySchema>;

export type InvestmentAnalysis = z.infer<typeof investmentAnalysisSchema>;
export type MarketAnalysis = z.infer<typeof marketAnalysisSchema>;

export interface SaleBreakdown {
  salesPrice: number;
  acquisitionCost: number;
  deemedCost20: number;
  deemedCost40: number;
  useDeemedCost: boolean;
  deductionUsed: number;
  capitalGain: number;
  lossCarryForwardUsed: number;
  taxableCapitalGain: number;
  capitalGainsTaxLow: number;
  capitalGainsTaxHigh: number;
  capitalGainsTaxTotal: number;
  brokerFee: number;
  remainingDebt: number;
  accumulatedCashFlow: number;
  initialCashInvested: number;
  cumulativeNegativeCashFlow: number;
  totalCashInvested: number;
  cashInHandAfterSale: number;
  netProfit: number;
}

export interface YearlySimulation {
  year: number;
  propertyValue: number;
  remainingLoan: number;
  equity: number;
  grossRent: number;
  vacancyLoss: number;
  maintenance: number;
  interest: number;
  principalRepaid: number;
  loanFees: number;
  cashFlow: number;
  taxableIncome: number;
  taxPaid: number;
  alternativeInvestmentValue: number;
  altCapitalGainsTax: number;
  totalProfitIfSold: number;
  saleBreakdown: SaleBreakdown;
}
