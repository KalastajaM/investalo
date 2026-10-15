export interface MarketFeatures {
  /** Housing company finance fee (rahoitusvastike / yhtiölaina repayment) */
  financeFee: boolean;
  /** Debt-free price separate from purchase price (velaton hinta) */
  debtFreePrice: boolean;
  /** Deemed acquisition cost rule for capital gains (hankintameno-olettama) */
  deemedAcquisitionCost: boolean;
  /** Two-tier capital gains tax system with a threshold */
  tieredCapitalGains: boolean;
  /** Landlord association membership fee */
  landlordAssociation: boolean;
  /** Built-in city/area market data for price comparison */
  marketData: boolean;
}

export interface MarketConfig {
  id: string;
  name: string;
  currency: string;
  currencySymbol: string;
  locale: string;
  features: MarketFeatures;
  defaults: {
    loanInterestRate: string;
    loanDurationYears: number;
    transferTaxRate: string;
    capitalGainsTaxRate: string;
    capitalGainsTaxRateHigh: string;
    capitalGainsThreshold: string;
    registrationCosts: string;
    monthlyLoanFees: string;
    landlordAssociationFee: string;
    liabilityInsurance: string;
    brokerFeePercentage: string;
    minBrokerFee: string;
    rentIncreaseRate: string;
    maintenanceFeeIncreaseRate: string;
    valueAppreciationRate: string;
    emptyMonthsPerYear: string;
  };
}

export const MARKET_CONFIGS: Record<string, MarketConfig> = {
  fi: {
    id: "fi",
    name: "Finland",
    currency: "EUR",
    currencySymbol: "€",
    locale: "fi-FI",
    features: {
      financeFee: true,
      debtFreePrice: true,
      deemedAcquisitionCost: true,
      tieredCapitalGains: true,
      landlordAssociation: true,
      marketData: true,
    },
    defaults: {
      loanInterestRate: "3.5",
      loanDurationYears: 25,
      transferTaxRate: "1.5",
      capitalGainsTaxRate: "30.0",
      capitalGainsTaxRateHigh: "34.0",
      capitalGainsThreshold: "30000",
      registrationCosts: "450",
      monthlyLoanFees: "2.50",
      landlordAssociationFee: "98",
      liabilityInsurance: "200",
      brokerFeePercentage: "3.0",
      minBrokerFee: "4000",
      rentIncreaseRate: "1.5",
      maintenanceFeeIncreaseRate: "3.0",
      valueAppreciationRate: "1.5",
      emptyMonthsPerYear: "0.5",
    },
  },
  generic: {
    id: "generic",
    name: "Generic",
    currency: "EUR",
    currencySymbol: "€",
    locale: "en-US",
    features: {
      financeFee: false,
      debtFreePrice: false,
      deemedAcquisitionCost: false,
      tieredCapitalGains: false,
      landlordAssociation: false,
      marketData: false,
    },
    defaults: {
      loanInterestRate: "4.0",
      loanDurationYears: 25,
      transferTaxRate: "0",
      capitalGainsTaxRate: "25.0",
      capitalGainsTaxRateHigh: "25.0",
      capitalGainsThreshold: "0",
      registrationCosts: "0",
      monthlyLoanFees: "0",
      landlordAssociationFee: "0",
      liabilityInsurance: "0",
      brokerFeePercentage: "3.0",
      minBrokerFee: "0",
      rentIncreaseRate: "2.0",
      maintenanceFeeIncreaseRate: "2.0",
      valueAppreciationRate: "2.0",
      emptyMonthsPerYear: "0.5",
    },
  },
};

export function getMarketConfig(market: string | null | undefined): MarketConfig {
  return MARKET_CONFIGS[market ?? "fi"] ?? MARKET_CONFIGS["fi"];
}
