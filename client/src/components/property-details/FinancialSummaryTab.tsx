import { Shield } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { Property, Settings } from "@shared/schema";
import type { SimulationResults } from "@/hooks/use-simulation-results";

interface FinancialSummaryTabProps {
  simResults: SimulationResults;
  property: Property;
  settings: Settings;
}

export function FinancialSummaryTab({ simResults, property, settings }: FinancialSummaryTabProps) {
  const {
    yr1, sale, fmt,
    purchasePrice, debtFreePrice, downPayment, loanAmount,
    monthlyAnnuityPayment, transferTax, registrationCosts, totalInitial,
    grossMonthlyRent, effectiveMonthlyRent, monthlyVacancyLoss, emptyMonthsPerYear, monthlyCosts,
    totalProfit, rentalProfit, saleOnlyProfit, totalCashInvested, propertyROI, rentalROI, saleROI,
    totalAltInvested, altPortfolioValue, altCapGainsTax, altAfterTaxValue, altProfit, altROI, propertyWins,
    initialLTV, yr1LTV, lastLTV,
  } = simResults;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Purchase Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <dl className="space-y-3 text-sm">
            <div className="flex justify-between"><dt className="text-muted-foreground">Purchase Price (Myyntihinta)</dt><dd className="font-medium">{fmt(purchasePrice)}</dd></div>
            <div className="flex justify-between"><dt className="text-muted-foreground">Debt Free Price (Velaton)</dt><dd className="font-medium">{fmt(debtFreePrice)}</dd></div>
            <div className="flex justify-between"><dt className="text-muted-foreground">Yhtiölaina Share</dt><dd className="font-medium">{fmt(debtFreePrice - purchasePrice)}</dd></div>
            <div className="flex justify-between border-t pt-2"><dt className="text-muted-foreground">Down Payment</dt><dd className="font-medium">{fmt(downPayment)}</dd></div>
            <div className="flex justify-between"><dt className="text-muted-foreground">Personal Loan</dt><dd className="font-medium">{fmt(loanAmount)}</dd></div>
            <div className="flex justify-between"><dt className="text-muted-foreground">Transfer Tax ({settings.transferTaxRate}%)</dt><dd className="font-medium">{fmt(transferTax)}</dd></div>
            <div className="flex justify-between"><dt className="text-muted-foreground">Registration Costs</dt><dd className="font-medium">{fmt(registrationCosts)}</dd></div>
            <div className="flex justify-between"><dt className="text-muted-foreground">Renovation</dt><dd className="font-medium">{fmt(parseFloat(property.renovationCost || "0"))}</dd></div>
            <div className="flex justify-between border-t pt-2 font-bold"><dt>Total Cash Needed</dt><dd>{fmt(totalInitial)}</dd></div>
          </dl>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Monthly Cash Flow (Year 1)</CardTitle>
        </CardHeader>
        <CardContent>
          <dl className="space-y-3 text-sm">
            <div className="flex justify-between text-green-600"><dt>Rental Income (gross)</dt><dd className="font-medium">+{fmt(grossMonthlyRent)}</dd></div>
            {emptyMonthsPerYear > 0 && (
              <div className="flex justify-between text-xs pl-4"><dt className="text-muted-foreground">Vacancy ({emptyMonthsPerYear} mo/yr)</dt><dd className="text-red-500">−{fmt(monthlyVacancyLoss)}</dd></div>
            )}
            <div className="flex justify-between text-green-600"><dt>Effective Rental Income</dt><dd className="font-medium">+{fmt(effectiveMonthlyRent)}</dd></div>
            <div className="flex justify-between border-t pt-2"><dt className="text-muted-foreground">Hoitovastike</dt><dd className="font-medium text-red-500">-{fmt(parseFloat(property.maintenanceFeePerMonth))}</dd></div>
            <div className="flex justify-between"><dt className="text-muted-foreground">Rahoitusvastike</dt><dd className="font-medium text-red-500">-{fmt(parseFloat(property.financeFeePerMonth || "0"))}</dd></div>
            <div className="flex justify-between"><dt className="text-muted-foreground">Water Fee</dt><dd className="font-medium text-red-500">-{fmt(parseFloat(property.waterFeePerMonth || "20"))}</dd></div>
            <div className="flex justify-between"><dt className="text-muted-foreground">Other Costs</dt><dd className="font-medium text-red-500">-{fmt(parseFloat(property.otherCostsPerMonth || "0"))}</dd></div>
            <div className="flex justify-between border-t pt-2"><dt className="text-muted-foreground">Total Monthly Costs</dt><dd className="font-medium text-red-500">-{fmt(monthlyCosts)}</dd></div>
            <div className="flex justify-between"><dt className="text-muted-foreground">Loan Payment</dt><dd className="font-medium text-red-500">-{fmt(monthlyAnnuityPayment)}</dd></div>
            <div className="flex justify-between"><dt className="text-muted-foreground">Loan Fee</dt><dd className="font-medium text-red-500">-{settings.monthlyLoanFees}</dd></div>
            <div className="flex justify-between border-t pt-2"><dt className="text-muted-foreground">Vuokranantajat (yearly)</dt><dd className="font-medium text-red-500">-{fmt(parseFloat(settings.landlordAssociationFee || "98"))}</dd></div>
            <div className="flex justify-between"><dt className="text-muted-foreground">Vastuuvakuutus (yearly)</dt><dd className="font-medium text-red-500">-{fmt(parseFloat(settings.liabilityInsurance || "200"))}</dd></div>
            {parseFloat(property.yearlyExtraMaintenance || "0") > 0 && (
              <div className="flex justify-between"><dt className="text-muted-foreground">Extra Maintenance (yearly)</dt><dd className="font-medium text-red-500">-{fmt(parseFloat(property.yearlyExtraMaintenance || "0"))}</dd></div>
            )}
            <div className="flex justify-between border-t pt-2 font-bold">
              <dt>Net Monthly (avg)</dt>
              <dd className={yr1.cashFlow / 12 >= 0 ? "text-green-600" : "text-red-500"}>{(yr1.cashFlow / 12).toFixed(0)}</dd>
            </div>
          </dl>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Sale Scenario (Year {settings.simulationDurationYears})</CardTitle>
          <CardDescription>Estimated sale price, costs, and proceeds if sold after {settings.simulationDurationYears} years</CardDescription>
        </CardHeader>
        <CardContent>
          <dl className="space-y-3 text-sm">
            <div className="flex justify-between gap-2"><dt className="text-muted-foreground">Estimated Sale Price</dt><dd className="font-medium" data-testid="text-sale-price">{fmt(sale.salesPrice)}</dd></div>
            <div className="flex justify-between gap-2"><dt className="text-muted-foreground">Remaining Debt</dt><dd className="font-medium text-red-500" data-testid="text-remaining-debt">-{fmt(sale.remainingDebt)}</dd></div>
            <div className="flex justify-between gap-2"><dt className="text-muted-foreground">Broker Fee ({settings.brokerFeePercentage}%)</dt><dd className="font-medium text-red-500" data-testid="text-broker-fee">-{fmt(sale.brokerFee)}</dd></div>
            <div className="flex justify-between gap-2"><dt className="text-muted-foreground">Capital Gains Tax</dt><dd className="font-medium text-red-500" data-testid="text-cgt-total">-{fmt(sale.capitalGainsTaxTotal)}</dd></div>
            <div className="flex justify-between gap-2 border-t pt-2"><dt className="text-muted-foreground">Cash in Hand After Sale</dt><dd className="font-medium" data-testid="text-cash-after-sale">{fmt(sale.cashInHandAfterSale)}</dd></div>
            <div className="flex justify-between gap-2"><dt className="text-muted-foreground">Accumulated Cash Flow ({settings.simulationDurationYears}y)</dt><dd className={`font-medium ${sale.accumulatedCashFlow >= 0 ? "text-green-600" : "text-red-500"}`} data-testid="text-accumulated-cf">{sale.accumulatedCashFlow >= 0 ? "+" : ""}{fmt(sale.accumulatedCashFlow)}</dd></div>
            <div className="flex justify-between gap-2"><dt className="text-muted-foreground">Initial Cash Invested</dt><dd className="font-medium text-red-500" data-testid="text-initial-invested">-{fmt(sale.initialCashInvested)}</dd></div>
            {sale.cumulativeNegativeCashFlow > 0 && (
              <div className="flex justify-between gap-2"><dt className="text-muted-foreground">Additional Cash from Neg. CF</dt><dd className="font-medium text-red-500" data-testid="text-neg-cf-invested">-{fmt(sale.cumulativeNegativeCashFlow)}</dd></div>
            )}
            <div className="flex justify-between gap-2"><dt className="text-muted-foreground font-medium">Total Cash Invested</dt><dd className="font-medium text-red-500" data-testid="text-total-invested">-{fmt(sale.totalCashInvested)}</dd></div>
            <div className="flex justify-between gap-2 border-t pt-2 font-bold text-lg">
              <dt>Net Profit</dt>
              <dd className={sale.netProfit >= 0 ? "text-green-600" : "text-red-500"} data-testid="text-net-profit">{fmt(sale.netProfit)}</dd>
            </div>
          </dl>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Capital Gains Tax Calculation</CardTitle>
          <CardDescription>Luovutusvoittovero — Step-by-step breakdown for year {settings.simulationDurationYears}</CardDescription>
        </CardHeader>
        <CardContent>
          <dl className="space-y-3 text-sm">
            <div className="flex justify-between gap-2"><dt className="text-muted-foreground">Sale Price (Luovutushinta)</dt><dd className="font-medium" data-testid="text-cgt-sale-price">{fmt(sale.salesPrice)}</dd></div>
            <div className="border-t pt-2">
              <p className="text-xs text-muted-foreground mb-2 uppercase tracking-wide">Deduction Method Comparison</p>
            </div>
            <div className="flex justify-between gap-2">
              <dt className="text-muted-foreground">Actual Acquisition Cost (Hankintameno)</dt>
              <dd className="font-medium" data-testid="text-acquisition-cost">{fmt(sale.acquisitionCost)}</dd>
            </div>
            <div className="pl-4 space-y-1 text-xs text-muted-foreground">
              <div className="flex justify-between gap-2"><span>Debt-free price</span><span>{fmt(debtFreePrice)}</span></div>
              <div className="flex justify-between gap-2"><span>+ Transfer tax ({settings.transferTaxRate}%)</span><span>{fmt(transferTax)}</span></div>
              <div className="flex justify-between gap-2"><span>+ Renovation costs</span><span>{fmt(parseFloat(property.renovationCost || "0"))}</span></div>
              <div className="flex justify-between gap-2"><span>+ Registration costs</span><span>{fmt(registrationCosts)}</span></div>
            </div>
            <div className="flex justify-between gap-2">
              <dt className="text-muted-foreground">Deemed Cost 20% (Hankintameno-olettama, &lt;10y)</dt>
              <dd className="font-medium" data-testid="text-deemed-cost-20">{fmt(sale.deemedCost20)}</dd>
            </div>
            <div className="flex justify-between gap-2">
              <dt className="text-muted-foreground">Deemed Cost 40% (Hankintameno-olettama, &gt;10y)</dt>
              <dd className="font-medium" data-testid="text-deemed-cost-40">{fmt(sale.deemedCost40)}</dd>
            </div>
            <div className="flex justify-between gap-2 border-t pt-2">
              <dt className="font-medium">
                Deduction Used
                <Badge variant="secondary" className="ml-2">
                  {sale.useDeemedCost
                    ? (settings.simulationDurationYears > 10 ? "Deemed 40%" : "Deemed 20%")
                    : "Actual Cost"}
                </Badge>
              </dt>
              <dd className="font-medium" data-testid="text-deduction-used">{fmt(sale.deductionUsed)}</dd>
            </div>
            <div className="flex justify-between gap-2 border-t pt-2">
              <dt className="text-muted-foreground">Capital Gain (Luovutusvoitto)</dt>
              <dd className={`font-medium ${sale.capitalGain > 0 ? "text-red-500" : "text-green-600"}`} data-testid="text-capital-gain">{fmt(sale.capitalGain)}</dd>
            </div>
            {sale.lossCarryForwardUsed > 0 && (
              <>
                <div className="flex justify-between gap-2">
                  <dt className="text-muted-foreground">Loss Carry-Forward Applied</dt>
                  <dd className="font-medium text-green-600" data-testid="text-loss-carry-forward-used">-{fmt(sale.lossCarryForwardUsed)}</dd>
                </div>
                <div className="flex justify-between gap-2">
                  <dt className="text-muted-foreground">Taxable Capital Gain</dt>
                  <dd className={`font-medium ${sale.taxableCapitalGain > 0 ? "text-red-500" : "text-green-600"}`} data-testid="text-taxable-capital-gain">{fmt(sale.taxableCapitalGain)}</dd>
                </div>
              </>
            )}
            {sale.taxableCapitalGain > 0 && (
              <>
                <div className="border-t pt-2">
                  <p className="text-xs text-muted-foreground mb-2 uppercase tracking-wide">Tax Calculation (Pääomatulovero)</p>
                </div>
                <div className="flex justify-between gap-2">
                  <dt className="text-muted-foreground">{settings.capitalGainsTaxRate}% on first {fmt(parseFloat(settings.capitalGainsThreshold || "30000"))}</dt>
                  <dd className="font-medium text-red-500" data-testid="text-tax-low">{fmt(sale.capitalGainsTaxLow)}</dd>
                </div>
                {sale.capitalGainsTaxHigh > 0 && (
                  <div className="flex justify-between gap-2">
                    <dt className="text-muted-foreground">{settings.capitalGainsTaxRateHigh || "34"}% on remaining</dt>
                    <dd className="font-medium text-red-500" data-testid="text-tax-high">{fmt(sale.capitalGainsTaxHigh)}</dd>
                  </div>
                )}
              </>
            )}
            <div className="flex justify-between gap-2 border-t pt-2 font-bold">
              <dt>Total Capital Gains Tax</dt>
              <dd className="text-red-500" data-testid="text-total-cgt">{fmt(sale.capitalGainsTaxTotal)}</dd>
            </div>
          </dl>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Total Return Breakdown</CardTitle>
          <CardDescription>How rental income and sale profit combine into your total return over {settings.simulationDurationYears} years</CardDescription>
        </CardHeader>
        <CardContent>
          <dl className="space-y-3 text-sm">
            <div className="flex justify-between gap-2"><dt className="text-muted-foreground">Initial Cash Invested</dt><dd className="font-medium" data-testid="text-roi-initial">{fmt(sale.initialCashInvested)}</dd></div>
            {sale.cumulativeNegativeCashFlow > 0 && (
              <div className="flex justify-between gap-2"><dt className="text-muted-foreground">+ Negative Cash Flow Top-ups</dt><dd className="font-medium" data-testid="text-roi-neg-cf">{fmt(sale.cumulativeNegativeCashFlow)}</dd></div>
            )}
            <div className="flex justify-between gap-2 font-medium"><dt>Total Cash Invested</dt><dd data-testid="text-roi-total-invested">{fmt(totalCashInvested)}</dd></div>
            <div className="border-t pt-2">
              <p className="text-xs text-muted-foreground mb-2 uppercase tracking-wide">Profit from Rental Income</p>
            </div>
            <div className="flex justify-between gap-2">
              <dt className="text-muted-foreground">Accumulated Cash Flow ({settings.simulationDurationYears}y)</dt>
              <dd className={`font-medium ${rentalProfit >= 0 ? "text-green-600" : "text-red-500"}`} data-testid="text-roi-rental-profit">
                {rentalProfit >= 0 ? "+" : ""}{fmt(rentalProfit)}
              </dd>
            </div>
            <div className="flex justify-between gap-2 text-xs text-muted-foreground pl-4">
              <span>ROI from rental alone</span><span>{rentalROI.toFixed(1)}%</span>
            </div>
            <div className="border-t pt-2">
              <p className="text-xs text-muted-foreground mb-2 uppercase tracking-wide">Profit from Sale</p>
            </div>
            <div className="flex justify-between gap-2">
              <dt className="text-muted-foreground">Sale Proceeds minus Investment</dt>
              <dd className={`font-medium ${saleOnlyProfit >= 0 ? "text-green-600" : "text-red-500"}`} data-testid="text-roi-sale-profit">
                {saleOnlyProfit >= 0 ? "+" : ""}{fmt(saleOnlyProfit)}
              </dd>
            </div>
            <div className="flex justify-between gap-2 text-xs text-muted-foreground pl-4">
              <span>After debt, CGT, broker fee</span><span>{saleROI.toFixed(1)}%</span>
            </div>
            <div className="flex justify-between gap-2 border-t pt-2 font-bold text-lg">
              <dt>Total Profit</dt>
              <dd className={totalProfit >= 0 ? "text-green-600" : "text-red-500"} data-testid="text-roi-total-profit">{fmt(totalProfit)}</dd>
            </div>
            <div className="flex justify-between gap-2 font-bold">
              <dt>Total ROI</dt>
              <dd className={propertyROI >= 0 ? "text-green-600" : "text-red-500"} data-testid="text-roi-total-pct">{propertyROI.toFixed(1)}%</dd>
            </div>
          </dl>
        </CardContent>
      </Card>

      <Card data-testid="card-ltv-analysis">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-amber-600" />
            Loan-to-Value (LTV) Analysis
          </CardTitle>
          <CardDescription>Risk assessment based on leverage ratio over time</CardDescription>
        </CardHeader>
        <CardContent>
          <dl className="space-y-3 text-sm">
            <div className="flex justify-between gap-2"><dt className="text-muted-foreground">Purchase Price</dt><dd className="font-medium">{fmt(purchasePrice)}</dd></div>
            <div className="flex justify-between gap-2"><dt className="text-muted-foreground">Down Payment</dt><dd className="font-medium">{fmt(downPayment)}</dd></div>
            <div className="flex justify-between gap-2"><dt className="text-muted-foreground">Loan Amount</dt><dd className="font-medium">{fmt(loanAmount)}</dd></div>
            <div className="flex justify-between gap-2 border-t pt-2 font-bold"><dt>Initial LTV</dt><dd data-testid="text-ltv-initial">{initialLTV.toFixed(1)}%</dd></div>
            <div className="flex justify-between gap-2"><dt className="text-muted-foreground">LTV After Year 1</dt><dd className="font-medium" data-testid="text-ltv-yr1">{yr1LTV.toFixed(1)}%</dd></div>
            <div className="flex justify-between gap-2"><dt className="text-muted-foreground">LTV After Year {settings.simulationDurationYears}</dt><dd className="font-medium" data-testid="text-ltv-last">{lastLTV.toFixed(1)}%</dd></div>
            <div className="flex justify-between gap-2"><dt className="text-muted-foreground">LTV Reduction</dt><dd className="font-medium text-green-600" data-testid="text-ltv-reduction">-{(initialLTV - lastLTV).toFixed(1)} pp</dd></div>
            <div className="border-t pt-2">
              <p className="text-xs text-muted-foreground mb-2 uppercase tracking-wide">Risk Level</p>
            </div>
            <div className="flex justify-between gap-2">
              <dt className="text-muted-foreground">Initial Risk</dt>
              <dd>
                <Badge variant={initialLTV > 80 ? "destructive" : initialLTV > 60 ? "secondary" : "default"} data-testid="badge-ltv-risk-initial">
                  {initialLTV > 80 ? "High" : initialLTV > 60 ? "Medium" : "Low"}
                </Badge>
              </dd>
            </div>
            <div className="flex justify-between gap-2">
              <dt className="text-muted-foreground">Final Risk (Year {settings.simulationDurationYears})</dt>
              <dd>
                <Badge variant={lastLTV > 80 ? "destructive" : lastLTV > 60 ? "secondary" : "default"} data-testid="badge-ltv-risk-final">
                  {lastLTV > 80 ? "High" : lastLTV > 60 ? "Medium" : "Low"}
                </Badge>
              </dd>
            </div>
            <div className="border-t pt-2 text-xs text-muted-foreground">
              <p>LTV above 80% is considered high risk. Below 60% is generally considered low risk.</p>
            </div>
          </dl>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Property vs. Stock Market</CardTitle>
          <CardDescription>
            Comparing total property return against investing the same capital into ETFs/funds at {settings.alternativeInvestmentReturn}% /year
          </CardDescription>
        </CardHeader>
        <CardContent>
          <dl className="space-y-3 text-sm">
            <div className="border-b pb-2">
              <p className="text-xs text-muted-foreground mb-2 uppercase tracking-wide">Property Investment</p>
            </div>
            <div className="flex justify-between gap-2"><dt className="text-muted-foreground">Total Cash Invested</dt><dd className="font-medium">{fmt(totalCashInvested)}</dd></div>
            {sale.cumulativeNegativeCashFlow > 0 && (
              <div className="flex justify-between gap-2 text-xs text-muted-foreground pl-4">
                <span>Incl. {fmt(sale.cumulativeNegativeCashFlow)} from negative CF years</span>
              </div>
            )}
            <div className="flex justify-between gap-2"><dt className="text-muted-foreground">Rental Profit</dt><dd className={`font-medium ${rentalProfit >= 0 ? "text-green-600" : "text-red-500"}`}>{rentalProfit >= 0 ? "+" : ""}{fmt(rentalProfit)}</dd></div>
            <div className="flex justify-between gap-2"><dt className="text-muted-foreground">Sale Profit</dt><dd className={`font-medium ${saleOnlyProfit >= 0 ? "text-green-600" : "text-red-500"}`}>{saleOnlyProfit >= 0 ? "+" : ""}{fmt(saleOnlyProfit)}</dd></div>
            <div className="flex justify-between gap-2 font-bold"><dt>Total Profit</dt><dd className={totalProfit >= 0 ? "text-green-600" : "text-red-500"} data-testid="text-compare-property-profit">{fmt(totalProfit)}</dd></div>
            <div className="flex justify-between gap-2 font-bold"><dt>ROI</dt><dd className={propertyROI >= 0 ? "text-green-600" : "text-red-500"} data-testid="text-compare-property-roi">{propertyROI.toFixed(1)}%</dd></div>
            <div className="border-b pb-2 pt-2">
              <p className="text-xs text-muted-foreground mb-2 uppercase tracking-wide">Alternative: Stock Market / ETF</p>
            </div>
            <div className="flex justify-between gap-2"><dt className="text-muted-foreground">Total Invested</dt><dd className="font-medium">{fmt(totalAltInvested)}</dd></div>
            {(totalAltInvested - sale.initialCashInvested) > 0 && (
              <div className="flex justify-between gap-2 text-xs text-muted-foreground pl-4">
                <span>Incl. {fmt(totalAltInvested - sale.initialCashInvested)} from negative CF top-ups</span>
              </div>
            )}
            <div className="flex justify-between gap-2"><dt className="text-muted-foreground">Portfolio Value (gross)</dt><dd className="font-medium">{fmt(altPortfolioValue)}</dd></div>
            <div className="flex justify-between gap-2"><dt className="text-muted-foreground">Capital Gains Tax</dt><dd className="font-medium text-red-500">−{fmt(altCapGainsTax)}</dd></div>
            <div className="flex justify-between gap-2"><dt className="text-muted-foreground">After-Tax Value</dt><dd className="font-medium">{fmt(altAfterTaxValue)}</dd></div>
            <div className="flex justify-between gap-2 font-bold"><dt>Profit</dt><dd data-testid="text-compare-alt-profit">{fmt(altProfit)}</dd></div>
            <div className="flex justify-between gap-2 font-bold"><dt>ROI</dt><dd data-testid="text-compare-alt-roi">{altROI.toFixed(1)}%</dd></div>
            <div className="flex justify-between gap-2 border-t pt-3 font-bold text-lg">
              <dt>Winner</dt>
              <dd>
                <Badge variant={propertyWins ? "default" : "secondary"} data-testid="text-compare-winner">
                  {propertyWins ? "Property Investment" : "Stock Market"}
                </Badge>
              </dd>
            </div>
            <div className="flex justify-between gap-2">
              <dt className="text-muted-foreground">Difference</dt>
              <dd className={`font-medium ${propertyWins ? "text-green-600" : "text-red-500"}`} data-testid="text-compare-diff">
                {propertyWins ? "+" : ""}{fmt(totalProfit - altProfit)}
              </dd>
            </div>
          </dl>
        </CardContent>
      </Card>
    </div>
  );
}
