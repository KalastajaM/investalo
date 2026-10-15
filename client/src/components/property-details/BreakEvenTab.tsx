import { Target, CheckCircle2 } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, ReferenceLine,
} from "recharts";
import type { Settings } from "@shared/schema";
import type { SimulationResults } from "@/hooks/use-simulation-results";

interface BreakEvenTabProps {
  simResults: SimulationResults;
  settings: Settings;
}

export function BreakEvenTab({ simResults, settings }: BreakEvenTabProps) {
  const {
    sim, yr1, yrLast, fmt,
    cashFlowBreakEvenYear, totalBreakEvenYear, cumulativeCashFlowData,
    totalCashInvested, totalProfit, propertyROI,
  } = simResults;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card data-testid="card-breakeven-cf">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-green-600" />
              Cash Flow Break-Even
            </CardTitle>
            <CardDescription>When does annual cash flow first turn positive?</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center py-4">
              {cashFlowBreakEvenYear ? (
                <>
                  <div className="flex items-center justify-center gap-2 mb-2">
                    <CheckCircle2 className="w-8 h-8 text-green-600" />
                    <span className="text-4xl font-bold" data-testid="text-breakeven-cf-year">Year {cashFlowBreakEvenYear}</span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Cash flow turns positive in year {cashFlowBreakEvenYear} with {fmt(sim.years[cashFlowBreakEvenYear - 1].cashFlow)} annual cash flow
                  </p>
                </>
              ) : (
                <>
                  <div className="text-4xl font-bold text-red-500 mb-2" data-testid="text-breakeven-cf-year">Never</div>
                  <p className="text-sm text-muted-foreground">
                    Cash flow does not turn positive within {settings.simulationDurationYears} years
                  </p>
                </>
              )}
            </div>
            <div className="space-y-2 text-sm border-t pt-4 mt-4">
              <div className="flex justify-between gap-2">
                <span className="text-muted-foreground">Year 1 Cash Flow</span>
                <span className={`font-medium ${yr1.cashFlow >= 0 ? "text-green-600" : "text-red-500"}`}>{fmt(yr1.cashFlow)}</span>
              </div>
              <div className="flex justify-between gap-2">
                <span className="text-muted-foreground">Final Year Cash Flow</span>
                <span className={`font-medium ${yrLast.cashFlow >= 0 ? "text-green-600" : "text-red-500"}`}>{fmt(yrLast.cashFlow)}</span>
              </div>
              <div className="flex justify-between gap-2">
                <span className="text-muted-foreground">Accumulated Cash Flow</span>
                <span className={`font-medium ${sim.totalCashFlow >= 0 ? "text-green-600" : "text-red-500"}`}>{fmt(sim.totalCashFlow)}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card data-testid="card-breakeven-total">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="w-5 h-5 text-blue-600" />
              Total Investment Break-Even
            </CardTitle>
            <CardDescription>When does net profit (if sold) first turn positive?</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center py-4">
              {totalBreakEvenYear ? (
                <>
                  <div className="flex items-center justify-center gap-2 mb-2">
                    <CheckCircle2 className="w-8 h-8 text-green-600" />
                    <span className="text-4xl font-bold" data-testid="text-breakeven-total-year">Year {totalBreakEvenYear}</span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Investment turns profitable in year {totalBreakEvenYear} with {fmt(sim.years[totalBreakEvenYear - 1].totalProfitIfSold)} net profit
                  </p>
                </>
              ) : (
                <>
                  <div className="text-4xl font-bold text-red-500 mb-2" data-testid="text-breakeven-total-year">Never</div>
                  <p className="text-sm text-muted-foreground">
                    Investment does not break even within {settings.simulationDurationYears} years
                  </p>
                </>
              )}
            </div>
            <div className="space-y-2 text-sm border-t pt-4 mt-4">
              <div className="flex justify-between gap-2">
                <span className="text-muted-foreground">Total Cash Invested</span>
                <span className="font-medium">{fmt(totalCashInvested)}</span>
              </div>
              <div className="flex justify-between gap-2">
                <span className="text-muted-foreground">Net Profit (Year {settings.simulationDurationYears})</span>
                <span className={`font-medium ${yrLast.totalProfitIfSold >= 0 ? "text-green-600" : "text-red-500"}`}>{fmt(yrLast.totalProfitIfSold)}</span>
              </div>
              <div className="flex justify-between gap-2">
                <span className="text-muted-foreground">Total ROI</span>
                <span className={`font-medium ${propertyROI >= 0 ? "text-green-600" : "text-red-500"}`}>{propertyROI.toFixed(1)}%</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card data-testid="chart-breakeven-timeline">
        <CardHeader>
          <CardTitle>Break-Even Timeline</CardTitle>
          <CardDescription>Cumulative cash flow and total profit over time — crossing zero marks the break-even point</CardDescription>
        </CardHeader>
        <CardContent className="h-[400px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={cumulativeCashFlowData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="colorCumCF" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(160, 60%, 45%)" stopOpacity={0.6} />
                  <stop offset="95%" stopColor="hsl(160, 60%, 45%)" stopOpacity={0.05} />
                </linearGradient>
                <linearGradient id="colorTotalProfit" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.6} />
                  <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0.05} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="year" label={{ value: "Year", position: "insideBottomRight", offset: -5 }} />
              <YAxis tickFormatter={v => `${(v / 1000).toFixed(0)}k`} />
              <Tooltip formatter={(value: number, name: string) => [fmt(value), name]} />
              <Legend />
              <ReferenceLine y={0} stroke="hsl(var(--destructive))" strokeDasharray="5 5"
                label={{ value: "Break-Even", position: "insideTopRight", fill: "hsl(var(--destructive))" }} />
              {cashFlowBreakEvenYear && <ReferenceLine x={cashFlowBreakEvenYear} stroke="hsl(160, 60%, 45%)" strokeDasharray="3 3" />}
              {totalBreakEvenYear && <ReferenceLine x={totalBreakEvenYear} stroke="hsl(var(--primary))" strokeDasharray="3 3" />}
              <Area type="monotone" dataKey="cumCashFlow" name="Cumulative Cash Flow" stroke="hsl(160, 60%, 45%)" fill="url(#colorCumCF)" strokeWidth={2} />
              <Area type="monotone" dataKey="totalProfit" name="Net Profit (if Sold)" stroke="hsl(var(--primary))" fill="url(#colorTotalProfit)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card data-testid="card-breakeven-progress">
        <CardHeader>
          <CardTitle>Year-by-Year Progress</CardTitle>
          <CardDescription>Tracking cash flow and profit milestones toward break-even</CardDescription>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[60px]">Year</TableHead>
                <TableHead>Annual CF</TableHead>
                <TableHead>Cumulative CF</TableHead>
                <TableHead>Net Profit (Sold)</TableHead>
                <TableHead className="text-right">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sim.years.map((yr, i) => {
                const cumCF = cumulativeCashFlowData[i].cumCashFlow;
                const isCFBreakEven = cashFlowBreakEvenYear === yr.year;
                const isTotalBreakEven = totalBreakEvenYear === yr.year;
                return (
                  <TableRow key={yr.year} className={isCFBreakEven || isTotalBreakEven ? "bg-green-50 dark:bg-green-950/20" : ""}>
                    <TableCell className="font-medium">{yr.year}</TableCell>
                    <TableCell className={yr.cashFlow >= 0 ? "text-green-600" : "text-red-500"}>{fmt(yr.cashFlow)}</TableCell>
                    <TableCell className={cumCF >= 0 ? "text-green-600" : "text-red-500"}>{fmt(cumCF)}</TableCell>
                    <TableCell className={yr.totalProfitIfSold >= 0 ? "text-green-600" : "text-red-500"}>{fmt(yr.totalProfitIfSold)}</TableCell>
                    <TableCell className="text-right">
                      {isCFBreakEven && <Badge variant="default" className="mr-1" data-testid="badge-cf-breakeven">CF Break-Even</Badge>}
                      {isTotalBreakEven && <Badge variant="default" data-testid="badge-total-breakeven">Profit Break-Even</Badge>}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
