import type { Property } from "@shared/schema";
import type { SimulationResult } from "@/lib/simulation";

export type PropertySimulation = Property & SimulationResult;

export const CHART_COLORS = [
  "hsl(210, 79%, 46%)",
  "hsl(160, 60%, 45%)",
  "hsl(30, 80%, 55%)",
  "hsl(280, 60%, 55%)",
  "hsl(350, 65%, 50%)",
  "hsl(190, 70%, 42%)",
];

export interface InsightMetricConfig {
  suffix: string;
  label: string;
  dataKey: string;
  unit: string;
  higher: boolean;
}

export interface SensitivityVariable {
  key: string;
  label: string;
  settingsKey: string | null;
  min: number;
  max: number;
  step: number;
  unit: string;
}
