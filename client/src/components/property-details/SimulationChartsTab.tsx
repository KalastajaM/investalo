import { Shield } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
  LineChart, Line, BarChart, Bar,
} from "recharts";
import type { Settings } from "@shared/schema";
import type { SimulationResults } from "@/hooks/use-simulation-results";

interface SimulationChartsTabProps {
  simResults: SimulationResults;
  settings: Settings;
}

export function SimulationChartsTab({ simResults, settings }: SimulationChartsTabProps) {
  const { sim, fmt, fmtK, initialLTV, lastLTV, ltvChartData } = simResults;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Property vs. Alternative Investment</CardTitle>
          <CardDescription>Property equity (incl. cash flow) vs. investing the same capital in stocks/ETFs</CardDescription>
        </CardHeader>
        <CardContent className="h-[400px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={sim.years} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="colorEquity" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.8} />
                  <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="colorAlt" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--muted-foreground))" stopOpacity={0.5} />
                  <stop offset="95%" stopColor="hsl(var(--muted-foreground))" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="year" label={{ value: "Year", position: "insideBottomRight", offset: -5 }} />
              <YAxis tickFormatter={fmtK} />
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <Tooltip formatter={(value: number) => fmt(value)} contentStyle={{ borderRadius: "8px" }} />
              <Legend verticalAlign="top" height={36} />
              <Area type="monotone" name="Property Equity" dataKey="equity" stroke="hsl(var(--primary))" fillOpacity={1} fill="url(#colorEquity)" strokeWidth={2} />
              <Area type="monotone" name="Alternative Investment" dataKey="alternativeInvestmentValue" stroke="hsl(var(--muted-foreground))" fillOpacity={1} fill="url(#colorAlt)" strokeWidth={2} strokeDasharray="4 4" />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Property Value vs Loan</CardTitle>
          </CardHeader>
          <CardContent className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={sim.years}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="year" />
                <YAxis tickFormatter={(val) => `${(val / 1000).toFixed(0)}k`} />
                <Tooltip formatter={(value: number) => fmt(value)} />
                <Legend />
                <Line type="monotone" dataKey="propertyValue" name="Property Value" stroke="#22c55e" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="remainingLoan" name="Remaining Debt" stroke="#ef4444" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Annual Cash Flow</CardTitle>
          </CardHeader>
          <CardContent className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={sim.years}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="year" />
                <YAxis tickFormatter={v => `${(v / 1000).toFixed(1)}k`} />
                <Tooltip formatter={(value: number) => fmt(value)} />
                <Legend />
                <Bar dataKey="cashFlow" name="Cash Flow" fill="hsl(160, 60%, 45%)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <Card data-testid="chart-ltv-detail">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-amber-600" />
            Loan-to-Value (LTV) Over Time
          </CardTitle>
          <CardDescription>
            LTV starts at {initialLTV.toFixed(0)}% and drops to {lastLTV.toFixed(0)}% by year {settings.simulationDurationYears} as the loan is repaid and property appreciates
          </CardDescription>
        </CardHeader>
        <CardContent className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={ltvChartData}>
              <defs>
                <linearGradient id="colorLTV" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(30, 80%, 55%)" stopOpacity={0.8} />
                  <stop offset="95%" stopColor="hsl(30, 80%, 55%)" stopOpacity={0.05} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="year" />
              <YAxis unit="%" domain={[0, 100]} />
              <Tooltip
                formatter={(value: number, name: string) => {
                  if (name === "LTV") return [`${value.toFixed(1)}%`, name];
                  return [fmt(value), name];
                }}
              />
              <Legend />
              <Area type="monotone" dataKey="ltv" name="LTV" stroke="hsl(30, 80%, 55%)" fill="url(#colorLTV)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}
