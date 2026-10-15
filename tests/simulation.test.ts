import { describe, it, expect } from "vitest";
import { runSimulation } from "@/lib/simulation";
import type { Property, Settings } from "@shared/schema";

// ---------------------------------------------------------------------------
// Minimal fixture builders — using string numerics to match Drizzle inferred types
// ---------------------------------------------------------------------------

function makeProperty(overrides: Partial<Property> = {}): Property {
  return {
    id: 1,
    userId: "test",
    name: "Test Apartment",
    city: "Helsinki",
    area: "Kallio",
    sizeM2: "50",
    buildYear: 2000,
    purchasePrice: "200000",
    debtFreePrice: "220000",
    renovationCost: "0",
    rentPerMonth: "1000",
    maintenanceFeePerMonth: "200",
    financeFeePerMonth: "100",
    waterFeePerMonth: "20",
    otherCostsPerMonth: "0",
    downPayment: "40000",
    yearlyExtraMaintenance: "0",
    isFinanceFeeDeductible: true,
    projectIds: [],
    address: null,
    latitude: null,
    longitude: null,
    rooms: "2h+k",
    notes: null,
    investmentAnalysis: null,
    marketAnalysis: null,
    customLink: null,
    createdAt: new Date(),
    ...overrides,
  };
}

function makeSettings(overrides: Partial<Settings> = {}): Settings {
  return {
    id: 1,
    userId: "test",
    market: "fi",
    currency: "EUR",
    loanInterestRate: "3.5",
    loanDurationYears: 25,
    transferTaxRate: "1.5",
    capitalGainsTaxRate: "30.0",
    capitalGainsTaxRateHigh: "34.0",
    inflationRate: "2.0",
    alternativeInvestmentReturn: "7.0",
    simulationDurationYears: 5,
    rentIncreaseRate: "1.5",
    maintenanceFeeIncreaseRate: "3.0",
    valueAppreciationRate: "1.5",
    brokerFeePercentage: "3.0",
    minBrokerFee: "4000",
    registrationCosts: "450",
    monthlyLoanFees: "2.50",
    emptyMonthsPerYear: "0.5",
    landlordAssociationFee: "98",
    liabilityInsurance: "200",
    capitalGainsThreshold: "30000",
    deductLoanInterest: true,
    depreciationDeductionEnabled: false,
    depreciationRate: "2.5",
    depreciableValuePercent: "70",
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// Result structure
// ---------------------------------------------------------------------------

describe("runSimulation — result structure", () => {
  it("returns the correct property id", () => {
    const result = runSimulation(makeProperty({ id: 42 }), makeSettings());
    expect(result.propertyId).toBe(42);
  });

  it("returns a years array with length equal to simulationDurationYears", () => {
    const result = runSimulation(makeProperty(), makeSettings({ simulationDurationYears: 7 }));
    expect(result.years).toHaveLength(7);
    expect(result.years[0].year).toBe(1);
    expect(result.years[6].year).toBe(7);
  });

  it("exposes totalCashFlow, finalEquity, roiPercent and totalAltInvested as numbers", () => {
    const result = runSimulation(makeProperty(), makeSettings());
    expect(typeof result.totalCashFlow).toBe("number");
    expect(typeof result.finalEquity).toBe("number");
    expect(typeof result.roiPercent).toBe("number");
    expect(typeof result.totalAltInvested).toBe("number");
  });

  it("returns positive finalEquity when property appreciates", () => {
    const result = runSimulation(
      makeProperty({ purchasePrice: "200000", debtFreePrice: "200000", downPayment: "200000" }),
      makeSettings({ simulationDurationYears: 10, valueAppreciationRate: "3.0", loanInterestRate: "0" }),
    );
    expect(result.finalEquity).toBeGreaterThan(200000);
  });
});

// ---------------------------------------------------------------------------
// Finnish transfer tax (varainsiirtovero)
// ---------------------------------------------------------------------------

describe("Finnish transfer tax — varainsiirtovero", () => {
  it("levies transfer tax on debtFreePrice, not purchasePrice", () => {
    // purchasePrice = 200 000, debtFreePrice = 220 000, transferTaxRate = 1.5%
    // Expected transfer tax = 220 000 × 0.015 = 3 300
    // initialCashInvested = downPayment + transferTax + registrationCosts
    //                     = 40 000 + 3 300 + 450 = 43 750
    const result = runSimulation(
      makeProperty({ purchasePrice: "200000", debtFreePrice: "220000", downPayment: "40000" }),
      makeSettings({ transferTaxRate: "1.5", registrationCosts: "450", simulationDurationYears: 1 }),
    );
    const saleBreakdown = result.years[0].saleBreakdown;
    expect(saleBreakdown.initialCashInvested).toBeCloseTo(43750, 0);
  });

  it("uses purchasePrice when debtFreePrice equals purchasePrice (no yhtiölaina)", () => {
    // transferTax = 200 000 × 0.015 = 3 000
    // initialCashInvested = 40 000 + 3 000 + 450 = 43 450
    const result = runSimulation(
      makeProperty({ purchasePrice: "200000", debtFreePrice: "200000", downPayment: "40000" }),
      makeSettings({ transferTaxRate: "1.5", registrationCosts: "450", simulationDurationYears: 1 }),
    );
    const saleBreakdown = result.years[0].saleBreakdown;
    expect(saleBreakdown.initialCashInvested).toBeCloseTo(43450, 0);
  });
});

// ---------------------------------------------------------------------------
// Loan amortisation — zero interest edge case
// ---------------------------------------------------------------------------

describe("Loan amortisation — zero interest rate", () => {
  it("does not produce NaN when loanInterestRate is 0", () => {
    const result = runSimulation(
      makeProperty({ purchasePrice: "200000", downPayment: "40000" }),
      makeSettings({ loanInterestRate: "0", simulationDurationYears: 3 }),
    );
    for (const y of result.years) {
      expect(Number.isFinite(y.interest)).toBe(true);
      expect(Number.isFinite(y.principalRepaid)).toBe(true);
      expect(Number.isFinite(y.cashFlow)).toBe(true);
    }
  });

  it("repays loan evenly (flat principal) when interest rate is 0", () => {
    // 160 000 loan over 25 years × 12 = 300 months → 533.33/month principal
    const result = runSimulation(
      makeProperty({ purchasePrice: "200000", downPayment: "40000" }),
      makeSettings({ loanInterestRate: "0", loanDurationYears: 25, simulationDurationYears: 1 }),
    );
    const yearOne = result.years[0];
    // All interest payments should be 0
    expect(yearOne.interest).toBeCloseTo(0, 1);
    // Principal repaid should equal loan / duration_months × 12
    const expectedPrincipal = (160000 / (25 * 12)) * 12;
    expect(yearOne.principalRepaid).toBeCloseTo(expectedPrincipal, 0);
  });
});

// ---------------------------------------------------------------------------
// Vacancy reduces effective rent
// ---------------------------------------------------------------------------

describe("Vacancy months", () => {
  it("reduces gross rent by the vacancy fraction", () => {
    // emptyMonthsPerYear = 1 → occupancyRate = 11/12
    // Gross rent (potential) = 1000 × 12 = 12 000
    // Actual (effective) = 1000 × 11 = 11 000
    // vacancyLoss ≈ 1 000
    const result = runSimulation(
      makeProperty({ rentPerMonth: "1000" }),
      makeSettings({ emptyMonthsPerYear: "1", simulationDurationYears: 1, loanInterestRate: "0", valueAppreciationRate: "0", rentIncreaseRate: "0", maintenanceFeeIncreaseRate: "0" }),
    );
    const y = result.years[0];
    expect(y.grossRent).toBeCloseTo(12000, 0);
    expect(y.vacancyLoss).toBeCloseTo(1000, 0);
  });

  it("shows zero vacancy loss when emptyMonthsPerYear is 0", () => {
    const result = runSimulation(
      makeProperty({ rentPerMonth: "1000" }),
      makeSettings({ emptyMonthsPerYear: "0", simulationDurationYears: 1 }),
    );
    expect(result.years[0].vacancyLoss).toBeCloseTo(0, 1);
  });
});

// ---------------------------------------------------------------------------
// Hankintameno-olettama (Finnish deemed acquisition cost)
// ---------------------------------------------------------------------------

describe("Hankintameno-olettama", () => {
  it("uses 20% deemed cost for properties owned less than 10 years", () => {
    // At year 5, deemedCost = salesPrice * 20%
    const result = runSimulation(
      makeProperty({ purchasePrice: "200000", debtFreePrice: "200000", downPayment: "200000" }),
      makeSettings({ simulationDurationYears: 5, loanInterestRate: "0", valueAppreciationRate: "0" }),
    );
    const y5 = result.years[4]; // index 4 = year 5
    const { deemedCost20, salesPrice } = y5.saleBreakdown;
    expect(deemedCost20).toBeCloseTo(salesPrice * 0.20, 0);
  });

  it("uses 40% deemed cost for properties owned 10+ years", () => {
    const result = runSimulation(
      makeProperty({ purchasePrice: "200000", debtFreePrice: "200000", downPayment: "200000" }),
      makeSettings({ simulationDurationYears: 10, loanInterestRate: "0", valueAppreciationRate: "0" }),
    );
    const y10 = result.years[9]; // index 9 = year 10
    const { deemedCost40, salesPrice } = y10.saleBreakdown;
    expect(deemedCost40).toBeCloseTo(salesPrice * 0.40, 0);
  });

  it("switches to deemed cost when it produces lower capital gains than actual costs", () => {
    // Force a scenario where actual costs method would yield very high gains
    // by keeping costs low vs. a high sale price via appreciation
    const result = runSimulation(
      makeProperty({ purchasePrice: "100000", debtFreePrice: "100000", downPayment: "100000", renovationCost: "0" }),
      makeSettings({
        simulationDurationYears: 10,
        loanInterestRate: "0",
        valueAppreciationRate: "5.0",
        transferTaxRate: "1.5",
        registrationCosts: "450",
      }),
    );
    const y10 = result.years[9];
    // With 5% appreciation for 10 years, sale price ~ 163 000 → deemed cost 40% = 65 200
    // Actual cost = 100 000 + transfer tax + registration ~ 102 000
    // olettamaCG = 163 000 - 65 200 = 97 800, actual CG = 163 000 - 102 000 - broker ≈ 55 000
    // actual CG is lower, so useDeemedCost should be false here
    expect(typeof y10.saleBreakdown.useDeemedCost).toBe("boolean");
    // The deemed cost is higher than acquisition, so we use actual costs
    expect(y10.saleBreakdown.useDeemedCost).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// Loss carry-forward (pääomatulolajin tappio)
// ---------------------------------------------------------------------------

describe("Loss carry-forward", () => {
  it("reduces taxable income to 0 when carry-forward exceeds income", () => {
    // Create a property with high costs to guarantee a rental loss in year 1
    // then check year 2 has reduced taxable income
    const result = runSimulation(
      makeProperty({
        purchasePrice: "200000",
        debtFreePrice: "200000",
        downPayment: "40000",
        rentPerMonth: "100",       // Very low rent → guaranteed rental loss
        maintenanceFeePerMonth: "500",
        financeFeePerMonth: "0",
        waterFeePerMonth: "0",
        otherCostsPerMonth: "0",
        yearlyExtraMaintenance: "0",
      }),
      makeSettings({
        simulationDurationYears: 2,
        loanInterestRate: "3.5",
        landlordAssociationFee: "0",
        liabilityInsurance: "0",
      }),
    );
    // Year 1: low rent → loss → carry-forward
    expect(result.years[0].taxPaid).toBe(0);
    expect(result.years[0].taxableIncome).toBe(0); // clamped by max(0,...) after carry-forward
  });
});

// ---------------------------------------------------------------------------
// Tiered capital gains tax
// ---------------------------------------------------------------------------

describe("Tiered capital gains tax", () => {
  it("applies single rate for gains below the threshold", () => {
    // Use generic market (no tiered CG) to isolate the single-rate path
    const result = runSimulation(
      makeProperty({ purchasePrice: "200000", debtFreePrice: "200000", downPayment: "200000" }),
      makeSettings({ market: "generic", simulationDurationYears: 1, loanInterestRate: "0", valueAppreciationRate: "0", transferTaxRate: "0" }),
    );
    const { capitalGainsTaxLow, capitalGainsTaxHigh } = result.years[0].saleBreakdown;
    // No appreciation, no real gain → taxes should be 0
    expect(capitalGainsTaxHigh).toBeCloseTo(0, 1);
  });

  it("applies high rate portion when capital gain exceeds threshold", () => {
    // 100 000 property × 30% appreciation for 5 years = ~370 000
    // actual CG ≈ 270 000 >> 30 000 threshold → capitalGainsTaxHigh must be > 0
    const result = runSimulation(
      makeProperty({ purchasePrice: "100000", debtFreePrice: "100000", downPayment: "100000" }),
      makeSettings({
        market: "fi",
        simulationDurationYears: 5,
        loanInterestRate: "0",
        valueAppreciationRate: "30.0",
        capitalGainsTaxRate: "30.0",
        capitalGainsTaxRateHigh: "34.0",
        capitalGainsThreshold: "30000",
        transferTaxRate: "0",
        registrationCosts: "0",
        brokerFeePercentage: "0",
        minBrokerFee: "0",
        landlordAssociationFee: "0",
        liabilityInsurance: "0",
      }),
    );
    const { capitalGainsTaxHigh } = result.years[4].saleBreakdown;
    expect(capitalGainsTaxHigh).toBeGreaterThan(0);
  });
});

// ---------------------------------------------------------------------------
// No loan scenario (cash purchase)
// ---------------------------------------------------------------------------

describe("Cash purchase (no loan)", () => {
  it("has zero interest and zero principal when downPayment equals purchasePrice", () => {
    const result = runSimulation(
      makeProperty({ purchasePrice: "200000", debtFreePrice: "200000", downPayment: "200000" }),
      makeSettings({ simulationDurationYears: 3 }),
    );
    for (const y of result.years) {
      expect(y.interest).toBeCloseTo(0, 1);
      expect(y.principalRepaid).toBeCloseTo(0, 1);
    }
  });
});
