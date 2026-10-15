import { useMemo } from "react";
import { useLocation } from "wouter";
import { TrendingUp, DollarSign, Shield } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, LineChart, Line } from "recharts";
import type { Settings } from "@shared/schema";
import type { PropertySimulation, InsightMetricConfig } from "./types";
import { CHART_COLORS } from "./types";

interface ChartDataPoint {
  name: string;
  ROI: number;
  "Cash Flow": number;
  "Profit if Sold": number;
}

interface ChartsProps {
  chartData: ChartDataPoint[];
  equityChartData: Record<string, number | string>[];
  ltvChartData: Record<string, number | string>[];
  selectedSims: PropertySimulation[];
  fmt: (v: number) => string;
  fmtK: (v: number) => string;
  currencySymbol: string;
  settings: Settings;
}

export function ChartsSection({ chartData, equityChartData, ltvChartData, selectedSims, fmt, fmtK, currencySymbol, settings }: ChartsProps) {
  const [, navigate] = useLocation();

  const nameToId = useMemo(() =>
    new Map(selectedSims.map(s => [
      s.name.length > 20 ? s.name.substring(0, 18) + "..." : s.name,
      s.id,
    ])),
    [selectedSims]
  );

  const ClickableYTick = ({ x, y, payload }: any) => {
    const id = nameToId.get(payload.value);
    return (
      <g transform={`translate(${x},${y})`}>
        <text
          x={0} y={0} dy={4} textAnchor="end" fontSize={12}
          fill={id ? "hsl(var(--primary))" : "currentColor"}
          style={{ cursor: id ? "pointer" : "default", textDecoration: id ? "underline" : "none" }}
          onClick={() => id && navigate(`/property/${id}`)}
        >
          {payload.value}
        </text>
      </g>
    );
  };

  const handleLegendClick = (entry: any) => {
    const sim = selectedSims.find(s => s.name === entry.value || s.name.substring(0, 15) === entry.value);
    if (sim) navigate(`/property/${sim.id}`);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-primary" />
            ROI Comparison (%)
          </CardTitle>
          <CardDescription>Total return on initial cash over {settings.simulationDurationYears} years</CardDescription>
        </CardHeader>
        <CardContent className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} layout="vertical" margin={{ left: 20 }}>
              <CartesianGrid strokeDasharray="3 3" horizontal={false} />
              <XAxis type="number" unit="%" />
              <YAxis dataKey="name" type="category" width={120} tick={<ClickableYTick />} />
              <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
              <Bar dataKey="ROI" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} barSize={28} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-green-600" />
            Profit if Sold ({currencySymbol})
          </CardTitle>
          <CardDescription>Net profit after all taxes and fees</CardDescription>
        </CardHeader>
        <CardContent className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} layout="vertical" margin={{ left: 20 }}>
              <CartesianGrid strokeDasharray="3 3" horizontal={false} />
              <XAxis type="number" tickFormatter={v => `${(v / 1000).toFixed(0)}k`} />
              <YAxis dataKey="name" type="category" width={120} tick={<ClickableYTick />} />
              <Tooltip
                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                formatter={(value: number) => [fmt(value), 'Profit']}
              />
              <Bar dataKey="Profit if Sold" fill="hsl(160, 60%, 45%)" radius={[0, 4, 4, 0]} barSize={28} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {selectedSims.length >= 2 && (
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Equity Growth Over Time</CardTitle>
            <CardDescription>Compare how equity builds across selected properties</CardDescription>
          </CardHeader>
          <CardContent className="h-[350px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={equityChartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="year" label={{ value: 'Year', position: 'insideBottomRight', offset: -5 }} />
                <YAxis tickFormatter={v => fmtK(v)} />
                <Tooltip formatter={(value: number) => fmt(value)} />
                <Legend onClick={handleLegendClick} style={{ cursor: "pointer" }} />
                {selectedSims.map((sim, i) => (
                  <Line
                    key={sim.id}
                    type="monotone"
                    dataKey={sim.name.substring(0, 15)}
                    stroke={CHART_COLORS[i % CHART_COLORS.length]}
                    strokeWidth={2}
                    dot={false}
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      <Card className="lg:col-span-2" data-testid="chart-ltv">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-amber-600" />
            Loan-to-Value (LTV) Over Time
          </CardTitle>
          <CardDescription>LTV ratio decreases as loan is paid down and property appreciates</CardDescription>
        </CardHeader>
        <CardContent className="h-[350px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={ltvChartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="year" label={{ value: 'Year', position: 'insideBottomRight', offset: -5 }} />
              <YAxis unit="%" domain={[0, 100]} />
              <Tooltip formatter={(value: number) => `${value.toFixed(1)}%`} />
              <Legend onClick={handleLegendClick} style={{ cursor: "pointer" }} />
              {selectedSims.map((sim, i) => (
                <Line
                  key={sim.id}
                  type="monotone"
                  dataKey={sim.name.substring(0, 15)}
                  stroke={CHART_COLORS[i % CHART_COLORS.length]}
                  strokeWidth={2}
                  dot={false}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}
