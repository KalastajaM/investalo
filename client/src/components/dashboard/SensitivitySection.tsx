import { useState } from "react";
import { Link, useLocation } from "wouter";
import { TrendingUp, ChevronDown, ChevronRight } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, ReferenceLine } from "recharts";
import type { Settings } from "@shared/schema";
import type { PropertySimulation, InsightMetricConfig, SensitivityVariable } from "./types";
import { CHART_COLORS } from "./types";

type HeatmapCell = { bestId: number; bestName: string; bestColorIdx: number; bestVal: number };

interface SensitivitySectionProps {
  projectSensitivityData: Record<string, unknown>[];
  bestPropertyPerValue: Record<string, unknown>[];
  selectedSims: PropertySimulation[];
  activeMetric: InsightMetricConfig;
  sensitivityVariables: SensitivityVariable[];
  sensitivityVariable: string;
  projectSensitivity2DData: {
    cells: HeatmapCell[][];
    values1: number[]; values2: number[];
    labels1: string[]; labels2: string[];
    var1Label: string; var2Label: string;
  } | null;
  fmt: (v: number) => string;
  currencySymbol: string;
  settings: Settings;
}

export function SensitivitySection({
  projectSensitivityData,
  bestPropertyPerValue,
  selectedSims,
  activeMetric,
  sensitivityVariables,
  sensitivityVariable,
  projectSensitivity2DData,
  fmt,
  currencySymbol,
  settings,
}: SensitivitySectionProps) {
  const [bestPropertyCollapsed, setBestPropertyCollapsed] = useState(true);
  const [, navigate] = useLocation();

  const handleLegendClick = (entry: any) => {
    const sim = selectedSims.find(s => s.name === entry.value);
    if (sim) navigate(`/property/${sim.id}`);
  };

  const formatMetricValue = (val: number) => {
    if (activeMetric.unit === "%") return `${val.toFixed(1)}%`;
    return fmt(val);
  };

  const yAxisProps = activeMetric.unit === "%"
    ? { unit: "%" }
    : { tickFormatter: (v: number) => `${(v / 1000).toFixed(0)}k` };

  const currentRefLine = (() => {
    const variable = sensitivityVariables.find(v => v.key === sensitivityVariable);
    if (!variable) return null;
    if (variable.key === "rentalIncome" || variable.key === "debtFreePrice") {
      return <ReferenceLine x="+0%" stroke="red" strokeDasharray="4 4" label={{ value: "Current", position: "top", fontSize: 11 }} />;
    }
    const currentValue = variable.settingsKey ? parseFloat(String((settings as any)[variable.settingsKey])) : NaN;
    if (isNaN(currentValue)) return null;
    const label = `${currentValue}${variable.unit || ""}`;
    return <ReferenceLine x={label} stroke="red" strokeDasharray="4 4" label={{ value: "Current", position: "top", fontSize: 11 }} />;
  })();

  return (
    <div className="space-y-6" data-testid="project-sensitivity">
      {projectSensitivity2DData ? (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-primary" />
              Winner Heatmap — {activeMetric.label}
            </CardTitle>
            <CardDescription>
              Which property has the {activeMetric.higher ? "highest" : "lowest"} {activeMetric.label.toLowerCase()} at each combination of{" "}
              <strong>{projectSensitivity2DData.var1Label}</strong> (columns) and{" "}
              <strong>{projectSensitivity2DData.var2Label}</strong> (rows)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-3 mb-4">
              {selectedSims.map((sim, i) => (
                <div key={sim.id} className="flex items-center gap-1.5 text-sm">
                  <div className="w-3 h-3 rounded-sm shrink-0" style={{ backgroundColor: CHART_COLORS[i % CHART_COLORS.length] }} />
                  <Link href={`/property/${sim.id}`} className="underline hover:opacity-75">{sim.name}</Link>
                </div>
              ))}
            </div>
            <div className="overflow-x-auto" data-testid="heatmap-2d">
              <table className="text-xs border-collapse">
                <thead>
                  <tr>
                    <th className="p-1 text-left text-muted-foreground font-normal whitespace-nowrap" style={{ minWidth: 90 }}>
                      {projectSensitivity2DData.var2Label} \ {projectSensitivity2DData.var1Label}
                    </th>
                    {projectSensitivity2DData.labels1.map(lbl => (
                      <th key={lbl} className="p-1 text-center font-normal text-muted-foreground whitespace-nowrap" style={{ minWidth: 42 }}>
                        {lbl}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {projectSensitivity2DData.labels2.map((rowLabel, j) => (
                    <tr key={rowLabel}>
                      <td className="p-1 text-muted-foreground font-medium whitespace-nowrap">{rowLabel}</td>
                      {projectSensitivity2DData.cells.map((col, i) => {
                        const cell = col[j];
                        const color = CHART_COLORS[cell.bestColorIdx % CHART_COLORS.length];
                        return (
                          <td
                            key={i}
                            title={`${cell.bestName}: ${formatMetricValue(cell.bestVal)}`}
                            style={{ backgroundColor: color }}
                            className="border border-background/20 h-7 w-10"
                          />
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-primary" />
                  Project Sensitivity Analysis
                </CardTitle>
                <CardDescription>
                  Compare how changing parameters affects all properties — metric: <strong>{activeMetric.label}</strong>
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div data-testid="chart-project-sensitivity-metric">
              <h4 className="text-sm font-medium mb-2">{activeMetric.label} ({activeMetric.unit.trim() || currencySymbol})</h4>
              <div className="h-[350px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={projectSensitivityData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="label" />
                    <YAxis {...yAxisProps} />
                    <Tooltip
                      contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                      formatter={(value: number) => formatMetricValue(value)}
                    />
                    <Legend onClick={handleLegendClick} style={{ cursor: "pointer" }} />
                    {selectedSims.map((sim, i) => (
                      <Line
                        key={sim.id}
                        type="monotone"
                        dataKey={`${sim.id}${activeMetric.suffix}`}
                        name={sim.name}
                        stroke={CHART_COLORS[i % CHART_COLORS.length]}
                        strokeWidth={2}
                        dot={false}
                      />
                    ))}
                    {currentRefLine}
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {!projectSensitivity2DData && bestPropertyPerValue.length > 0 && (
        <Card data-testid="card-best-property-table">
          <CardHeader className="cursor-pointer select-none" onClick={() => setBestPropertyCollapsed(c => !c)}>
            <div className="flex items-center gap-2">
              {bestPropertyCollapsed ? <ChevronRight className="w-4 h-4 shrink-0" /> : <ChevronDown className="w-4 h-4 shrink-0" />}
              <div>
                <CardTitle className="text-base">Best Property by Scenario</CardTitle>
                <CardDescription>
                  Which property has the {activeMetric.higher ? "highest" : "lowest"} {activeMetric.label.toLowerCase()} at each {sensitivityVariables.find(v => v.key === sensitivityVariable)?.label.toLowerCase()} level
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          {!bestPropertyCollapsed && (
            <CardContent className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2 px-3 font-medium">{sensitivityVariables.find(v => v.key === sensitivityVariable)?.label}</th>
                    <th className="text-left py-2 px-3 font-medium">Best Property</th>
                    <th className="text-right py-2 px-3 font-medium">{activeMetric.label}</th>
                    {selectedSims.map(sim => (
                      <th key={sim.id} className="text-right py-2 px-3 font-medium">
                        <Link href={`/property/${sim.id}`} className="text-primary underline hover:opacity-75">
                          {sim.name}
                        </Link>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {bestPropertyPerValue.map((row, i) => (
                    <tr key={i} className={`border-b ${row.isCurrent ? "bg-primary/5 font-medium" : ""}`}>
                      <td className="py-2 px-3">
                        {row.label as string}
                        {!!row.isCurrent && <Badge variant="outline" className="ml-2 text-xs">Current</Badge>}
                      </td>
                      <td className="py-2 px-3 font-medium text-primary">
                        {(() => {
                          const bestSim = selectedSims.find(s => s.name === (row.bestProperty as string));
                          return bestSim
                            ? <Link href={`/property/${bestSim.id}`} className="underline hover:opacity-75">{row.bestProperty as string}</Link>
                            : row.bestProperty as string;
                        })()}
                      </td>
                      <td className="text-right py-2 px-3 text-primary">{formatMetricValue(row.bestValue as number)}</td>
                      {selectedSims.map(sim => {
                        const val = row[`${sim.id}${activeMetric.suffix}`];
                        return (
                          <td key={sim.id} className={`text-right py-2 px-3 ${row.bestProperty === sim.name ? "text-primary font-medium" : "text-muted-foreground"}`}>
                            {typeof val === 'number' ? formatMetricValue(val) : '-'}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          )}
        </Card>
      )}
    </div>
  );
}
