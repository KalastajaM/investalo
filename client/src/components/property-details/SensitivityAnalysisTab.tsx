import { useState, useMemo } from "react";
import { Activity } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  ComposedChart, BarChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
  ReferenceLine,
} from "recharts";
import type { Property, Settings } from "@shared/schema";
import { runSimulation } from "@/lib/simulation";
import type { SimulationResults } from "@/hooks/use-simulation-results";

interface SensitivityAnalysisTabProps {
  property: Property;
  settings: Settings;
  simResults: SimulationResults;
}

const SENSITIVITY_VARIABLES = [
  { key: "interestRate",   label: "Loan Interest Rate",         settingsField: "loanInterestRate",              unit: "%",  min: 0.5, max: 8,  step: 0.5 },
  { key: "vacancyRate",    label: "Vacancy (Empty Months/Year)", settingsField: "emptyMonthsPerYear",            unit: "mo", min: 0,   max: 3,  step: 0.25 },
  { key: "appreciation",  label: "Value Appreciation Rate",     settingsField: "valueAppreciationRate",         unit: "%",  min: -1,  max: 5,  step: 0.5 },
  { key: "rentalIncome",  label: "Rental Income",               settingsField: null,                            unit: "%",  min: -30, max: 30, step: 5 },
  { key: "debtFreePrice", label: "Debt Free Price",             settingsField: null,                            unit: "%",  min: -30, max: 30, step: 5 },
  { key: "duration",      label: "Simulation Duration",         settingsField: "simulationDurationYears",       unit: "yr", min: 3,   max: 30, step: 1 },
  { key: "altReturn",     label: "Alt. Investment Return",      settingsField: "alternativeInvestmentReturn",   unit: "%",  min: 3,   max: 12, step: 0.5 },
] as const;

type SensitivityKey = typeof SENSITIVITY_VARIABLES[number]["key"];
type Metric2D = "roi" | "cashflow" | "profit" | "vsMarket";

function heatColor(value: number, min: number, max: number): string {
  if (max === min) return "hsl(45, 70%, 55%)";
  const t = Math.max(0, Math.min(1, (value - min) / (max - min)));
  const hue = Math.round(t * 120);
  const lightness = 45 + Math.round(t * 10);
  return `hsl(${hue}, 70%, ${lightness}%)`;
}

function compactValue(value: number, metric: Metric2D): string {
  if (metric === "roi") return `${value.toFixed(1)}%`;
  const k = value / 1000;
  const prefix = metric === "vsMarket" && value > 0 ? "+" : "";
  return Math.abs(k) >= 10 ? `${prefix}${k.toFixed(0)}k`
       : Math.abs(k) >= 1  ? `${prefix}${k.toFixed(1)}k`
       : `${prefix}${value}`;
}

function applyVar(
  key: string, settingsField: string | null, val: number,
  property: Property, settings: Settings
): [Property, Settings] {
  if (key === "rentalIncome") {
    const base = parseFloat(String(property.rentPerMonth));
    return [{ ...property, rentPerMonth: String(Math.round(base * (1 + val / 100))) }, settings];
  } else if (key === "debtFreePrice") {
    const base = parseFloat(String(property.debtFreePrice || property.purchasePrice));
    const adj = String(Math.round(base * (1 + val / 100)));
    return [{ ...property, debtFreePrice: adj, purchasePrice: adj }, settings];
  } else {
    const settVal = settingsField === "simulationDurationYears" ? val : String(val);
    return [property, { ...settings, [settingsField!]: settVal } as Settings];
  }
}

export function SensitivityAnalysisTab({ property, settings, simResults }: SensitivityAnalysisTabProps) {
  const [selectedVariable, setSelectedVariable] = useState<SensitivityKey>("interestRate");
  const [selectedVariable2, setSelectedVariable2] = useState<SensitivityKey | "none">("none");
  const [selectedMetric2D, setSelectedMetric2D] = useState<Metric2D>("roi");
  const { fmt } = simResults;

  const sensitivityData = useMemo(() => {
    const variable = SENSITIVITY_VARIABLES.find(v => v.key === selectedVariable);
    if (!variable) return [];

    const isPropertyPercent = variable.settingsField === null;
    const currentValue = isPropertyPercent
      ? 0
      : parseFloat(String(settings[variable.settingsField!] ?? "0"));

    const points: {
      value: number; label: string; roi: number; altROI: number; altProfit: number;
      yearlyCashFlow: number; totalProfit: number; isCurrent: boolean;
    }[] = [];

    for (let val = variable.min; val <= variable.max + 0.001; val += variable.step) {
      const roundedVal = parseFloat(val.toFixed(2));

      let modifiedSettings = settings;
      let modifiedProperty = property;

      if (variable.key === "rentalIncome") {
        const baseRent = parseFloat(String(property.rentPerMonth));
        modifiedProperty = { ...property, rentPerMonth: String(Math.round(baseRent * (1 + roundedVal / 100))) };
      } else if (variable.key === "debtFreePrice") {
        const basePrice = parseFloat(String(property.debtFreePrice || property.purchasePrice));
        const adjustedPrice = String(Math.round(basePrice * (1 + roundedVal / 100)));
        modifiedProperty = { ...property, debtFreePrice: adjustedPrice, purchasePrice: adjustedPrice };
      } else {
        const settingValue = variable.settingsField === "simulationDurationYears" ? roundedVal : String(roundedVal);
        modifiedSettings = { ...settings, [variable.settingsField!]: settingValue } as Settings;
      }

      const result = runSimulation(modifiedProperty, modifiedSettings);
      const lastYear = result.years[result.years.length - 1];
      const altRawProfit = lastYear.alternativeInvestmentValue - lastYear.altCapitalGainsTax - result.totalAltInvested;
      const altROI = result.totalAltInvested > 0 ? (altRawProfit / result.totalAltInvested) * 100 : 0;

      points.push({
        value: roundedVal,
        label: isPropertyPercent ? `${roundedVal >= 0 ? "+" : ""}${roundedVal}%` : `${roundedVal}${variable.unit}`,
        roi: parseFloat(result.roiPercent.toFixed(1)),
        altROI: parseFloat(altROI.toFixed(1)),
        altProfit: Math.round(altRawProfit),
        yearlyCashFlow: selectedVariable === "duration"
          ? Math.round(result.totalCashFlow / result.years.length)
          : Math.round(result.years[0].cashFlow),
        totalProfit: Math.round(lastYear.totalProfitIfSold),
        isCurrent: Math.abs(roundedVal - currentValue) < 0.01,
      });
    }
    return points;
  }, [property, settings, selectedVariable]);

  const sensitivity2DData = useMemo(() => {
    if (selectedVariable2 === "none") return null;
    const var1 = SENSITIVITY_VARIABLES.find(v => v.key === selectedVariable);
    const var2 = SENSITIVITY_VARIABLES.find(v => v.key === selectedVariable2);
    if (!var1 || !var2) return null;

    const genValues = (v: typeof var1) => {
      const vals: number[] = [];
      for (let x = v.min; x <= v.max + 0.001; x += v.step) vals.push(parseFloat(x.toFixed(2)));
      return vals;
    };
    const isPercent = (v: typeof var1) => v.settingsField === null;
    const labelFor = (v: typeof var1, val: number) =>
      isPercent(v) ? `${val >= 0 ? "+" : ""}${val}%` : `${val}${v.unit}`;

    const values1 = genValues(var1);
    const values2 = genValues(var2);

    const cur1 = isPercent(var1) ? 0 : parseFloat((settings as any)[var1.settingsField!] || "0");
    const cur2 = isPercent(var2) ? 0 : parseFloat((settings as any)[var2.settingsField!] || "0");

    const useAvgCF = selectedVariable === "duration" || selectedVariable2 === "duration";

    const cells = values1.map(v1 =>
      values2.map(v2 => {
        const [p1, s1] = applyVar(var1.key, var1.settingsField, v1, property, settings);
        const [p2, s2] = applyVar(var2.key, var2.settingsField, v2, p1, s1);
        const result = runSimulation(p2, s2);
        const lastYr = result.years[result.years.length - 1];
        const altRawProfit = lastYr.alternativeInvestmentValue - lastYr.altCapitalGainsTax - result.totalAltInvested;
        return {
          roi: parseFloat(result.roiPercent.toFixed(1)),
          cashflow: useAvgCF
            ? Math.round(result.totalCashFlow / result.years.length)
            : Math.round(result.years[0].cashFlow),
          profit: Math.round(lastYr.totalProfitIfSold),
          vsMarket: Math.round(lastYr.totalProfitIfSold - altRawProfit),
          isCurrent: Math.abs(v1 - cur1) < 0.01 && Math.abs(v2 - cur2) < 0.01,
        };
      })
    );

    const allRoi = cells.flat().map(c => c.roi);
    const allCf  = cells.flat().map(c => c.cashflow);
    const allPr  = cells.flat().map(c => c.profit);
    const allVs  = cells.flat().map(c => c.vsMarket);
    const vsAbsMax = Math.max(Math.abs(Math.min(...allVs)), Math.abs(Math.max(...allVs)));

    return {
      cells,
      labels1: values1.map(v => labelFor(var1, v)),
      labels2: values2.map(v => labelFor(var2, v)),
      var1Label: var1.label,
      var2Label: var2.label,
      useAvgCF,
      ranges: {
        roi:      { min: Math.min(...allRoi), max: Math.max(...allRoi) },
        cashflow: { min: Math.min(...allCf),  max: Math.max(...allCf)  },
        profit:   { min: Math.min(...allPr),  max: Math.max(...allPr)  },
        vsMarket: { min: -vsAbsMax,           max: vsAbsMax            },
      },
    };
  }, [property, settings, selectedVariable, selectedVariable2]);

  const currentLabel = SENSITIVITY_VARIABLES.find(v => v.key === selectedVariable)?.label ?? "";

  const metric2DLabels: Record<Metric2D, string> = {
    roi: "ROI",
    cashflow: sensitivity2DData?.useAvgCF ? "Avg. Annual CF" : "Cash Flow (Yr 1)",
    profit: "Net Profit",
    vsMarket: "vs Stock Market",
  };

  return (
    <div className="space-y-6" data-testid="content-sensitivity">
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Activity className="w-5 h-5 text-blue-600" />
                Sensitivity Analysis
              </CardTitle>
              <CardDescription className="mt-1">
                {sensitivity2DData
                  ? "See how two variables together affect your investment returns"
                  : "See how changing a single variable affects your investment returns"}
              </CardDescription>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <Select value={selectedVariable} onValueChange={v => {
                setSelectedVariable(v as SensitivityKey);
                if (selectedVariable2 === v) setSelectedVariable2("none");
              }}>
                <SelectTrigger className="w-[220px]" data-testid="select-sensitivity-variable">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SENSITIVITY_VARIABLES.map(v => (
                    <SelectItem key={v.key} value={v.key}>{v.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <span className="text-muted-foreground text-xs">vs</span>
              <Select value={selectedVariable2} onValueChange={v => setSelectedVariable2(v as SensitivityKey | "none")}>
                <SelectTrigger className="w-[220px]" data-testid="select-sensitivity-variable2">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">— None (1D charts) —</SelectItem>
                  {SENSITIVITY_VARIABLES
                    .filter(v => v.key !== selectedVariable)
                    .map(v => <SelectItem key={v.key} value={v.key}>{v.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {sensitivity2DData ? (
            <div className="space-y-4">
              {/* Metric tabs */}
              <div className="flex gap-1 border-b">
                {(["roi", "cashflow", "profit", "vsMarket"] as Metric2D[]).map(m => (
                  <button
                    key={m}
                    onClick={() => setSelectedMetric2D(m)}
                    className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                      selectedMetric2D === m
                        ? "border-primary text-primary"
                        : "border-transparent text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {metric2DLabels[m]}
                  </button>
                ))}
              </div>

              {/* Heatmap */}
              <div className="overflow-x-auto" data-testid="heatmap-property-2d">
                <table className="text-xs border-collapse">
                  <thead>
                    <tr>
                      <th className="p-1.5 text-left font-normal text-muted-foreground whitespace-nowrap" style={{ minWidth: 110 }}>
                        {sensitivity2DData.var2Label} \ {sensitivity2DData.var1Label}
                      </th>
                      {sensitivity2DData.labels1.map(lbl => (
                        <th key={lbl} className="p-1.5 text-center font-normal text-muted-foreground whitespace-nowrap" style={{ minWidth: 54 }}>
                          {lbl}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {sensitivity2DData.labels2.map((rowLabel, j) => (
                      <tr key={rowLabel}>
                        <td className="p-1.5 font-medium text-muted-foreground whitespace-nowrap">{rowLabel}</td>
                        {sensitivity2DData.cells.map((col, i) => {
                          const cell = col[j];
                          const val = cell[selectedMetric2D];
                          const { min, max } = sensitivity2DData.ranges[selectedMetric2D];
                          const bg = heatColor(val, min, max);
                          const tooltipVal = compactValue(val, selectedMetric2D);
                          const tooltip = selectedMetric2D === "vsMarket"
                            ? val >= 0
                              ? `Property wins by ${compactValue(val, "vsMarket")} — ${sensitivity2DData.var1Label}: ${sensitivity2DData.labels1[i]}, ${sensitivity2DData.var2Label}: ${rowLabel}`
                              : `Stocks win by ${compactValue(-val, "vsMarket")} — ${sensitivity2DData.var1Label}: ${sensitivity2DData.labels1[i]}, ${sensitivity2DData.var2Label}: ${rowLabel}`
                            : `${sensitivity2DData.var1Label}: ${sensitivity2DData.labels1[i]}, ${sensitivity2DData.var2Label}: ${rowLabel} → ${tooltipVal}`;
                          return (
                            <td
                              key={i}
                              title={tooltip}
                              style={{
                                backgroundColor: bg,
                                border: cell.isCurrent
                                  ? "2px solid hsl(var(--foreground))"
                                  : "1px solid hsl(var(--background))",
                              }}
                              className="h-8 text-center align-middle font-medium"
                            >
                              <span style={{ color: "white", textShadow: "0 0 3px rgba(0,0,0,0.6)" }}>
                                {compactValue(val, selectedMetric2D)}
                              </span>
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="text-xs text-muted-foreground">
                {selectedMetric2D === "vsMarket"
                  ? "Green = property beats stocks, red = stocks win, yellow = breakeven. Value shows profit difference."
                  : "Bold border = current scenario. Colors: red = worst → green = best for this property."}
              </p>
            </div>
          ) : (
            <>
              <div data-testid="chart-sensitivity-roi">
                <h4 className="text-sm font-medium mb-2">Total ROI ({settings.simulationDurationYears} years)</h4>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={sensitivityData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="label" />
                      <YAxis unit="%" />
                      <Tooltip
                        formatter={(value: number, name: string) => [`${value.toFixed(1)}%`, name]}
                        labelFormatter={(label) => `${currentLabel}: ${label}`}
                      />
                      <Legend />
                      <Bar dataKey="roi" name="Property ROI" radius={[4, 4, 0, 0]} fill="hsl(var(--primary))" />
                      <Line
                        dataKey="altROI"
                        name="Alt. Investment ROI"
                        type="monotone"
                        stroke="hsl(35, 80%, 50%)"
                        strokeDasharray="5 5"
                        strokeWidth={2}
                        dot={false}
                      />
                      {sensitivityData.map((point, i) => point.isCurrent ? (
                        <ReferenceLine key={i} x={point.label} stroke="hsl(var(--destructive))" strokeDasharray="3 3"
                          label={{ value: "Current", position: "top", fill: "hsl(var(--destructive))" }} />
                      ) : null)}
                    </ComposedChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div data-testid="chart-sensitivity-cashflow">
                <h4 className="text-sm font-medium mb-2">
                  {selectedVariable === "duration" ? "Avg. Annual Cash Flow" : "Year 1 Cash Flow"}
                </h4>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={sensitivityData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="label" />
                      <YAxis tickFormatter={v => `${(v / 1000).toFixed(1)}k`} />
                      <Tooltip
                        formatter={(value: number) => [fmt(value), selectedVariable === "duration" ? "Avg. Annual Cash Flow" : "Year 1 Cash Flow"]}
                        labelFormatter={(label) => `${currentLabel}: ${label}`}
                      />
                      <Legend />
                      <ReferenceLine y={0} stroke="hsl(var(--muted-foreground))" strokeDasharray="3 3" />
                      <Bar dataKey="yearlyCashFlow" name={selectedVariable === "duration" ? "Avg. Annual Cash Flow" : "Year 1 Cash Flow"} radius={[4, 4, 0, 0]} fill="hsl(160, 60%, 45%)" />
                      {sensitivityData.map((point, i) => point.isCurrent ? (
                        <ReferenceLine key={i} x={point.label} stroke="hsl(var(--destructive))" strokeDasharray="3 3"
                          label={{ value: "Current", position: "top", fill: "hsl(var(--destructive))" }} />
                      ) : null)}
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div data-testid="chart-sensitivity-profit">
                <h4 className="text-sm font-medium mb-2">Net Profit if Sold (Year {settings.simulationDurationYears})</h4>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={sensitivityData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="label" />
                      <YAxis tickFormatter={v => `${(v / 1000).toFixed(0)}k`} />
                      <Tooltip
                        formatter={(value: number) => [fmt(value), "Net Profit"]}
                        labelFormatter={(label) => `${currentLabel}: ${label}`}
                      />
                      <Legend />
                      <ReferenceLine y={0} stroke="hsl(var(--muted-foreground))" strokeDasharray="3 3" />
                      <Bar dataKey="totalProfit" name="Net Profit" radius={[4, 4, 0, 0]} fill="hsl(280, 60%, 50%)" />
                      {sensitivityData.map((point, i) => point.isCurrent ? (
                        <ReferenceLine key={i} x={point.label} stroke="hsl(var(--destructive))" strokeDasharray="3 3"
                          label={{ value: "Current", position: "top", fill: "hsl(var(--destructive))" }} />
                      ) : null)}
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {!sensitivity2DData && (
        <Card data-testid="card-sensitivity-table">
          <CardHeader>
            <CardTitle>{currentLabel} — Scenario Table</CardTitle>
          </CardHeader>
          <CardContent className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{currentLabel}</TableHead>
                  <TableHead>ROI</TableHead>
                  <TableHead>Alt. ROI</TableHead>
                  <TableHead>{selectedVariable === "duration" ? "Avg. Annual CF" : "Year 1 CF"}</TableHead>
                  <TableHead>Net Profit (Sold)</TableHead>
                  <TableHead className="text-right">Winner</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sensitivityData.map((point) => (
                  <TableRow key={point.value} className={point.isCurrent ? "bg-primary/5 font-medium" : ""}>
                    <TableCell>{point.label}{point.isCurrent ? " ← current" : ""}</TableCell>
                    <TableCell className={point.roi >= 0 ? "text-green-600" : "text-red-500"}>{point.roi.toFixed(1)}%</TableCell>
                    <TableCell className="text-muted-foreground">{point.altROI.toFixed(1)}%</TableCell>
                    <TableCell className={point.yearlyCashFlow >= 0 ? "text-green-600" : "text-red-500"}>{fmt(point.yearlyCashFlow)}</TableCell>
                    <TableCell className={point.totalProfit >= 0 ? "text-green-600" : "text-red-500"}>{fmt(point.totalProfit)}</TableCell>
                    <TableCell className="text-right">
                      <Badge variant={point.totalProfit >= point.altProfit ? "default" : "secondary"}>
                        {point.totalProfit >= point.altProfit ? "Property" : "Stocks"}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
