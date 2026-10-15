import { useMemo } from "react";
import type { Property, Settings, YearlySimulation, SaleBreakdown } from "@shared/schema";
import { runSimulation, type SimulationResult } from "@/lib/simulation";
import { getMarketConfig } from "@/lib/market-configs";
import { getCurrencySymbol } from "@/lib/formatting";

export interface SimulationResults {
  sim: SimulationResult;
  yr1: YearlySimulation;
  yrLast: YearlySimulation;
  sale: SaleBreakdown;
  // Purchase
  purchasePrice: number;
  debtFreePrice: number;
  downPayment: number;
  loanAmount: number;
  monthlyAnnuityPayment: number;
  transferTax: number;
  registrationCosts: number;
  totalInitial: number;
  // Monthly cash flow
  grossMonthlyRent: number;
  effectiveMonthlyRent: number;
  monthlyVacancyLoss: number;
  emptyMonthsPerYear: number;
  monthlyCosts: number;
  // Returns
  totalProfit: number;
  rentalProfit: number;
  saleOnlyProfit: number;
  totalCashInvested: number;
  propertyROI: number;
  rentalROI: number;
  saleROI: number;
  // Alternative investment comparison
  totalAltInvested: number;
  altPortfolioValue: number;
  altCapGainsTax: number;
  altAfterTaxValue: number;
  altProfit: number;
  altROI: number;
  propertyWins: boolean;
  // Break-even
  cashFlowBreakEvenYear: number | null;
  totalBreakEvenYear: number | null;
  cumulativeCashFlowData: { year: number; cumCashFlow: number; totalProfit: number }[];
  // LTV
  initialLTV: number;
  yr1LTV: number;
  lastLTV: number;
  ltvChartData: { year: number; ltv: number; propertyValue: number; remainingLoan: number }[];
  // Formatting helpers (derived from settings/market)
  fmt: (v: number) => string;
  fmtK: (v: number) => string;
  currencySymbol: string;
  marketConfig: ReturnType<typeof getMarketConfig>;
}

export function useSimulationResults(property: Property, settings: Settings): SimulationResults {
  return useMemo(() => {
    const marketConfig = getMarketConfig(settings.market);
    const currencySymbol = getCurrencySymbol(settings.currency ?? marketConfig.currency);
    const fmt = (v: number) => `${Math.round(v).toLocaleString(marketConfig.locale)} ${currencySymbol}`;
    const fmtK = (v: number) => `${(v / 1000).toFixed(0)}k${currencySymbol}`;

    const sim = runSimulation(property, settings);
    const yr1 = sim.years[0];
    const yrLast = sim.years[sim.years.length - 1];
    const sale = yrLast.saleBreakdown;

    const purchasePrice = parseFloat(property.purchasePrice);
    const debtFreePrice = parseFloat(property.debtFreePrice || property.purchasePrice);
    const downPayment = parseFloat(property.downPayment);
    const loanAmount = purchasePrice - downPayment;

    const annualRate = parseFloat(settings.loanInterestRate) / 100;
    const monthlyRate = annualRate / 12;
    const loanMonths = settings.loanDurationYears * 12;
    const monthlyAnnuityPayment = loanAmount > 0
      ? (monthlyRate === 0
        ? loanAmount / loanMonths
        : (loanAmount * monthlyRate * Math.pow(1 + monthlyRate, loanMonths)) / (Math.pow(1 + monthlyRate, loanMonths) - 1))
      : 0;

    const transferTax = purchasePrice * parseFloat(settings.transferTaxRate) / 100;
    const registrationCosts = parseFloat(settings.registrationCosts || "450");
    const totalInitial = downPayment + parseFloat(property.renovationCost || "0") + transferTax + registrationCosts;

    const emptyMonthsPerYear = parseFloat(settings.emptyMonthsPerYear || "0.5");
    const occupancyRate = (12 - emptyMonthsPerYear) / 12;
    const grossMonthlyRent = parseFloat(property.rentPerMonth);
    const monthlyVacancyLoss = grossMonthlyRent * (1 - occupancyRate);
    const effectiveMonthlyRent = grossMonthlyRent * occupancyRate;

    const monthlyCosts = parseFloat(property.maintenanceFeePerMonth)
      + parseFloat(property.financeFeePerMonth || "0")
      + parseFloat(property.waterFeePerMonth || "20")
      + parseFloat(property.otherCostsPerMonth || "0");

    const saleOnlyProfit = sale.cashInHandAfterSale - sale.initialCashInvested;
    const rentalProfit = sale.accumulatedCashFlow;
    const totalProfit = sale.netProfit;
    const totalCashInvested = sale.totalCashInvested;
    const propertyROI = totalCashInvested > 0 ? (totalProfit / totalCashInvested) * 100 : 0;
    const rentalROI = totalCashInvested > 0 ? (rentalProfit / totalCashInvested) * 100 : 0;
    const saleROI = totalCashInvested > 0 ? (saleOnlyProfit / totalCashInvested) * 100 : 0;

    const totalAltInvested = sim.totalAltInvested;
    const altPortfolioValue = yrLast.alternativeInvestmentValue;
    const altCapGainsTax = yrLast.altCapitalGainsTax;
    const altAfterTaxValue = altPortfolioValue - altCapGainsTax;
    const altProfit = altAfterTaxValue - totalAltInvested;
    const altROI = totalAltInvested > 0 ? (altProfit / totalAltInvested) * 100 : 0;
    const propertyWins = totalProfit > altProfit;

    const cashFlowBreakEvenYear = sim.years.findIndex(yr => yr.cashFlow > 0) + 1 || null;
    const totalBreakEvenYear = sim.years.findIndex(yr => yr.totalProfitIfSold > 0) + 1 || null;
    const cumulativeCashFlowData = sim.years.reduce<{ year: number; cumCashFlow: number; totalProfit: number }[]>(
      (acc, yr) => {
        const prev = acc.length > 0 ? acc[acc.length - 1].cumCashFlow : 0;
        acc.push({ year: yr.year, cumCashFlow: Math.round(prev + yr.cashFlow), totalProfit: Math.round(yr.totalProfitIfSold) });
        return acc;
      },
      []
    );

    const initialLTV = purchasePrice > 0 ? (loanAmount / purchasePrice) * 100 : 0;
    const yr1LTV = yr1.propertyValue > 0 ? (yr1.remainingLoan / yr1.propertyValue) * 100 : 0;
    const lastLTV = yrLast.propertyValue > 0 ? (yrLast.remainingLoan / yrLast.propertyValue) * 100 : 0;
    const ltvChartData = sim.years.map(yr => ({
      year: yr.year,
      ltv: yr.propertyValue > 0 ? parseFloat(((yr.remainingLoan / yr.propertyValue) * 100).toFixed(1)) : 0,
      propertyValue: Math.round(yr.propertyValue),
      remainingLoan: Math.round(yr.remainingLoan),
    }));

    return {
      sim, yr1, yrLast, sale,
      purchasePrice, debtFreePrice, downPayment, loanAmount,
      monthlyAnnuityPayment, transferTax, registrationCosts, totalInitial,
      grossMonthlyRent, effectiveMonthlyRent, monthlyVacancyLoss, emptyMonthsPerYear, monthlyCosts,
      totalProfit, rentalProfit, saleOnlyProfit, totalCashInvested, propertyROI, rentalROI, saleROI,
      totalAltInvested, altPortfolioValue, altCapGainsTax, altAfterTaxValue, altProfit, altROI, propertyWins,
      cashFlowBreakEvenYear, totalBreakEvenYear, cumulativeCashFlowData,
      initialLTV, yr1LTV, lastLTV, ltvChartData,
      fmt, fmtK, currencySymbol, marketConfig,
    };
  }, [property, settings]);
}
