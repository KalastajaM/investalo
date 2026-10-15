import { type Property, type Settings, type YearlySimulation } from "@shared/schema";
import { getMarketConfig } from "./market-configs";

export interface SimulationResult {
  propertyId: number;
  totalCashFlow: number;
  finalEquity: number;
  roiPercent: number;
  totalAltInvested: number;
  years: YearlySimulation[];
}

export function runSimulation(property: Property, settings: Settings): SimulationResult {
  const marketConfig = getMarketConfig(settings.market);
  const years = settings.simulationDurationYears;
  const yearlyData: YearlySimulation[] = [];

  const purchasePrice = parseFloat(property.purchasePrice);
  // When debtFreePrice feature is off, debtFreePrice equals purchasePrice
  const debtFreePrice = marketConfig.features.debtFreePrice
    ? parseFloat(property.debtFreePrice || property.purchasePrice)
    : purchasePrice;
  const downPayment = parseFloat(property.downPayment);
  const renovationCost = parseFloat(property.renovationCost || "0");

  const transferTaxRate = parseFloat(settings.transferTaxRate) / 100;
  // Finnish varainsiirtovero is levied on the full debt-free price (velaton hinta),
  // which includes the housing company loan share assumed by the buyer.
  const transferTax = debtFreePrice * transferTaxRate;
  const registrationCosts = parseFloat(settings.registrationCosts || "0");
  const initialCashInvested = downPayment + renovationCost + transferTax + registrationCosts;

  // Loan amount = myyntihinta (purchase price) minus own downpayment.
  // The housing company loan (yhtiölaina) is a separate debt not part of the personal bank loan.
  const initialLoanPrincipal = purchasePrice - downPayment;
  let personalLoanPrincipal = initialLoanPrincipal;
  // Housing company loan only applies in Finnish market (yhtiölaina)
  let housingCompanyLoanPrincipal = marketConfig.features.debtFreePrice
    ? debtFreePrice - purchasePrice
    : 0;

  let currentRent = parseFloat(property.rentPerMonth);
  let currentMaintenanceFee = parseFloat(property.maintenanceFeePerMonth);
  let currentFinanceFee = parseFloat(property.financeFeePerMonth || "0");
  let otherCosts = parseFloat(property.otherCostsPerMonth || "0");
  let waterFee = parseFloat(property.waterFeePerMonth || "20");
  let currentPropertyValue = debtFreePrice;

  let accumulatedCashFlow = 0;
  let cumulativeNegativeCashFlow = 0;

  const annualLoanRate = parseFloat(settings.loanInterestRate) / 100;
  const altInvReturnRate = parseFloat(settings.alternativeInvestmentReturn) / 100;
  const monthlyAltReturn = Math.pow(1 + altInvReturnRate, 1 / 12) - 1;
  const rentIncrease = parseFloat(settings.rentIncreaseRate || "1.5") / 100;
  const maintenanceIncrease = parseFloat(settings.maintenanceFeeIncreaseRate || "3.0") / 100;
  const valueAppreciation = parseFloat(settings.valueAppreciationRate || "1.5") / 100;
  const taxRate = parseFloat(settings.capitalGainsTaxRate) / 100;
  const taxRateHigh = parseFloat(settings.capitalGainsTaxRateHigh || "34.0") / 100;
  const brokerFeePercent = parseFloat(settings.brokerFeePercentage || "3.0") / 100;
  const minBrokerFee = parseFloat(settings.minBrokerFee || "4000");
  const monthlyLoanFee = parseFloat(settings.monthlyLoanFees || "2.50");
  const emptyMonthsPerYear = parseFloat(settings.emptyMonthsPerYear || "0.5");
  const landlordAssociationFee = parseFloat(settings.landlordAssociationFee || "98");
  const liabilityInsurance = parseFloat(settings.liabilityInsurance || "200");
  const capitalGainsThreshold = parseFloat(settings.capitalGainsThreshold || "30000");
  const yearlyExtraMaintenance = parseFloat(property.yearlyExtraMaintenance || "0");
  const yearlyLandlordCosts = landlordAssociationFee + liabilityInsurance + yearlyExtraMaintenance;

  const deductLoanInterest = settings.deductLoanInterest !== false; // default true
  const depreciationEnabled = settings.depreciationDeductionEnabled === true;
  const depreciationRate = parseFloat(settings.depreciationRate || "2.5") / 100;
  const depreciableValuePercent = parseFloat(settings.depreciableValuePercent || "70") / 100;
  // Monthly depreciation deduction: building portion of purchase price × annual rate / 12
  const monthlyDepreciation = depreciationEnabled
    ? (purchasePrice * depreciableValuePercent * depreciationRate) / 12
    : 0;

  // Finnish LKV broker VAT: 25.5% ALV (since 2024). The minBrokerFee is total incl. VAT,
  // so we divide to get the ex-VAT minimum for comparison, then add VAT to the result.
  const lkvVatRate = marketConfig.id === "fi" ? 0.255 : 0;

  // Acquisition cost for capital gains tax purposes (actual costs method):
  // myyntihinta (purchasePrice) + transfer tax + registration + renovations.
  // Note: debtFreePrice is NOT used here — the yhtiölaina is a separate entity's debt.
  const acquisitionCostForCG = purchasePrice + transferTax + renovationCost + registrationCosts;

  const loanDurationMonths = settings.loanDurationYears * 12;
  const r = annualLoanRate / 12;
  const annuityPayment = initialLoanPrincipal > 0
    ? (r === 0
      ? initialLoanPrincipal / loanDurationMonths
      : (initialLoanPrincipal * r * Math.pow(1 + r, loanDurationMonths)) / (Math.pow(1 + r, loanDurationMonths) - 1))
    : 0;

  const occupancyRate = (12 - emptyMonthsPerYear) / 12;

  let alternativeInvestmentValue = initialCashInvested;
  let totalAltInvested = initialCashInvested;

  // Finnish capital income loss carry-forward (pääomatulolajin tappio):
  // rental losses offset future taxable capital income, up to 10 years.
  let lossCarryForward = 0;

  for (let year = 1; year <= years; year++) {
    let yearCashFlow = 0;
    let yearTaxableIncome = 0;
    let yearTaxPaid = 0;
    let yearGrossRent = 0;
    let yearVacancyLoss = 0;
    let yearMaintenance = 0;
    let yearInterest = 0;
    let yearPrincipal = 0;
    let yearLoanFees = 0;

    for (let month = 1; month <= 12; month++) {
      const potentialRent = currentRent;
      const actualRent = currentRent * occupancyRate;
      const actualIncome = actualRent;

      yearGrossRent += potentialRent;
      yearVacancyLoss += potentialRent * (1 - occupancyRate);

      const expenses = currentMaintenanceFee + currentFinanceFee + waterFee + otherCosts;
      yearMaintenance += currentMaintenanceFee + currentFinanceFee + waterFee + otherCosts;

      let interestPayment = 0;
      let principalPayment = 0;
      let loanPayment = 0;
      const hadLoanThisMonth = personalLoanPrincipal > 0;

      if (hadLoanThisMonth) {
        interestPayment = personalLoanPrincipal * r;
        const scheduledPrincipal = annuityPayment - interestPayment;
        principalPayment = Math.min(scheduledPrincipal, personalLoanPrincipal);
        loanPayment = interestPayment + principalPayment;
        personalLoanPrincipal = Math.max(0, personalLoanPrincipal - principalPayment);
      }

      yearInterest += interestPayment;
      yearPrincipal += principalPayment;
      if (hadLoanThisMonth) {
        yearLoanFees += monthlyLoanFee;
      }

      let deductibleExpenses = currentMaintenanceFee + waterFee + otherCosts;
      // Loan interest deductibility — configurable (default true; nearly universal for rental income)
      if (deductLoanInterest) {
        deductibleExpenses += interestPayment;
      }
      // Loan management fees are deductible from rental income (vero.fi)
      if (hadLoanThisMonth) {
        deductibleExpenses += monthlyLoanFee;
      }
      // Finance fee deductibility is a Finnish-specific concept (tuloutettu rahoitusvastike)
      if (marketConfig.features.financeFee && property.isFinanceFeeDeductible) {
        deductibleExpenses += currentFinanceFee;
      }
      // Depreciation deduction — common in US, Australia, Germany; not applicable in Finland
      deductibleExpenses += monthlyDepreciation;

      const netRentalIncome = actualIncome - deductibleExpenses;

      const monthlyCashFlow = actualIncome - expenses - loanPayment - (hadLoanThisMonth ? monthlyLoanFee : 0);

      yearCashFlow += monthlyCashFlow;
      yearTaxableIncome += netRentalIncome;

      if (housingCompanyLoanPrincipal > 0) {
        housingCompanyLoanPrincipal -= (currentFinanceFee * 0.5);
        if (housingCompanyLoanPrincipal < 0) housingCompanyLoanPrincipal = 0;
      }

      alternativeInvestmentValue *= (1 + monthlyAltReturn);
    }

    yearCashFlow -= yearlyLandlordCosts;
    yearTaxableIncome -= yearlyLandlordCosts;
    yearMaintenance += yearlyLandlordCosts;

    // Apply capital income loss carry-forward (Finnish rental income losses reduce future tax)
    const taxableAfterCarryForward = Math.max(0, yearTaxableIncome - lossCarryForward);
    const newLoss = yearTaxableIncome - lossCarryForward < 0
      ? Math.abs(yearTaxableIncome - lossCarryForward)
      : 0;
    lossCarryForward = newLoss;

    if (taxableAfterCarryForward > 0) {
      if (marketConfig.features.tieredCapitalGains && capitalGainsThreshold > 0 && taxableAfterCarryForward > capitalGainsThreshold) {
        yearTaxPaid = capitalGainsThreshold * taxRate + (taxableAfterCarryForward - capitalGainsThreshold) * taxRateHigh;
      } else {
        yearTaxPaid = taxableAfterCarryForward * taxRate;
      }
    }
    yearCashFlow -= yearTaxPaid;

    if (yearCashFlow < 0) {
      const negativeCF = Math.abs(yearCashFlow);
      cumulativeNegativeCashFlow += negativeCF;
      // Mirror the shortfall into the alternative investment:
      // this is what the investor would have put into stocks instead.
      alternativeInvestmentValue += negativeCF;
      totalAltInvested += negativeCF;
    }

    accumulatedCashFlow += yearCashFlow;

    currentPropertyValue = currentPropertyValue * (1 + valueAppreciation);
    currentRent = currentRent * (1 + rentIncrease);
    currentMaintenanceFee = currentMaintenanceFee * (1 + maintenanceIncrease);
    // Rahoitusvastike (finance fee) is determined by the housing company's loan schedule — flat, no growth.
    // otherCosts grows with general cost inflation.
    otherCosts = otherCosts * (1 + maintenanceIncrease);

    const remainingTotalDebt = personalLoanPrincipal + housingCompanyLoanPrincipal;
    const equity = currentPropertyValue - remainingTotalDebt;

    const salesPrice = currentPropertyValue;

    // Broker fee: Finnish LKV commission + 25.5% ALV.
    // minBrokerFee is expressed as total incl. VAT, so divide by (1+VAT) for ex-VAT comparison.
    let brokerFee: number;
    if (lkvVatRate > 0) {
      const commissionExVat = Math.max(
        minBrokerFee / (1 + lkvVatRate),
        salesPrice * brokerFeePercent
      );
      brokerFee = commissionExVat * (1 + lkvVatRate);
    } else {
      brokerFee = Math.max(salesPrice * brokerFeePercent, minBrokerFee);
    }

    // Capital gain — actual costs method:
    // salePrice − (purchasePrice + transferTax + registration + renovations) − brokerFee
    // Broker fee (LKV costs) is deductible from the capital gain (vero.fi).
    const actualCostsCapitalGain = salesPrice - acquisitionCostForCG - brokerFee;

    // Hankintameno-olettama (deemed acquisition cost):
    // 20% of sale price if owned < 10 years, 40% if ≥ 10 years.
    // Use whichever method produces the lower capital gain (= less tax).
    const deemedCost20 = salesPrice * 0.20;
    const deemedCost40 = salesPrice * 0.40;
    let useDeemedCost = false;
    if (marketConfig.features.deemedAcquisitionCost) {
      const olettamaCG = year >= 10
        ? salesPrice - deemedCost40
        : salesPrice - deemedCost20;
      // Use deemed cost method if it results in a lower capital gain than actual costs
      useDeemedCost = olettamaCG < actualCostsCapitalGain;
    }
    const finalCapitalGain = useDeemedCost
      ? salesPrice - (year >= 10 ? deemedCost40 : deemedCost20)
      : actualCostsCapitalGain;

    // Remaining rental loss carry-forward (after offsetting this year's rental income)
    // reduces the taxable capital gain — both are pääomatulo in Finland.
    const lossCarryForwardUsed = Math.min(lossCarryForward, Math.max(0, finalCapitalGain));
    const taxableCapitalGain = Math.max(0, finalCapitalGain - lossCarryForwardUsed);

    let capitalGainsTaxLow = 0;
    let capitalGainsTaxHigh = 0;
    let capitalGainsTax = 0;
    if (taxableCapitalGain > 0) {
      if (marketConfig.features.tieredCapitalGains && capitalGainsThreshold > 0 && taxableCapitalGain > capitalGainsThreshold) {
        capitalGainsTaxLow = capitalGainsThreshold * taxRate;
        capitalGainsTaxHigh = (taxableCapitalGain - capitalGainsThreshold) * taxRateHigh;
      } else {
        capitalGainsTaxLow = taxableCapitalGain * taxRate;
      }
      capitalGainsTax = capitalGainsTaxLow + capitalGainsTaxHigh;
    }

    const cashInHandAfterSale = salesPrice - remainingTotalDebt - capitalGainsTax - brokerFee;
    const totalCashInvested = initialCashInvested + cumulativeNegativeCashFlow;
    const totalProfitIfSold = cashInHandAfterSale + accumulatedCashFlow - initialCashInvested;

    const deductionUsed = useDeemedCost
      ? (year >= 10 ? deemedCost40 : deemedCost20)
      : acquisitionCostForCG + brokerFee;

    // Capital gains tax on the alt investment if the portfolio were sold this year.
    // Uses the same tiered rates as property (cost base = totalAltInvested).
    const altGain = alternativeInvestmentValue - totalAltInvested;
    let altCapitalGainsTax = 0;
    if (altGain > 0) {
      if (marketConfig.features.tieredCapitalGains && capitalGainsThreshold > 0 && altGain > capitalGainsThreshold) {
        altCapitalGainsTax = capitalGainsThreshold * taxRate + (altGain - capitalGainsThreshold) * taxRateHigh;
      } else {
        altCapitalGainsTax = altGain * taxRate;
      }
    }

    yearlyData.push({
      year,
      propertyValue: currentPropertyValue,
      remainingLoan: remainingTotalDebt,
      equity,
      grossRent: yearGrossRent,
      vacancyLoss: yearVacancyLoss,
      maintenance: yearMaintenance,
      interest: yearInterest,
      principalRepaid: yearPrincipal,
      loanFees: yearLoanFees,
      cashFlow: yearCashFlow,
      taxableIncome: taxableAfterCarryForward,
      taxPaid: yearTaxPaid,
      alternativeInvestmentValue,
      altCapitalGainsTax,
      totalProfitIfSold,
      saleBreakdown: {
        salesPrice,
        acquisitionCost: acquisitionCostForCG,
        deemedCost20,
        deemedCost40,
        useDeemedCost,
        deductionUsed,
        capitalGain: finalCapitalGain,
        lossCarryForwardUsed,
        taxableCapitalGain,
        capitalGainsTaxLow,
        capitalGainsTaxHigh,
        capitalGainsTaxTotal: capitalGainsTax,
        brokerFee,
        remainingDebt: remainingTotalDebt,
        accumulatedCashFlow,
        initialCashInvested,
        cumulativeNegativeCashFlow,
        totalCashInvested,
        cashInHandAfterSale,
        netProfit: totalProfitIfSold,
      },
    });
  }

  const finalYear = yearlyData[yearlyData.length - 1];
  const totalCashInvestedFinal = finalYear.saleBreakdown.totalCashInvested;
  const roiPercent = totalCashInvestedFinal > 0
    ? (finalYear.totalProfitIfSold / totalCashInvestedFinal) * 100
    : 0;

  return {
    propertyId: property.id,
    totalCashFlow: accumulatedCashFlow,
    finalEquity: finalYear.equity,
    roiPercent,
    totalAltInvested,
    years: yearlyData,
  };
}
