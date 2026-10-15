import type { Property, Project } from "@shared/schema";

export const EXPORT_VERSION = 1 as const;

export interface ExportProject {
  _exportId: number;
  name: string;
  description: string | null;
}

export interface ExportProperty {
  name: string;
  city: string;
  area: string;
  sizeM2: string;
  buildYear?: number | null;
  purchasePrice: string;
  debtFreePrice?: string | null;
  renovationCost?: string | null;
  rentPerMonth: string;
  maintenanceFeePerMonth: string;
  financeFeePerMonth?: string | null;
  waterFeePerMonth?: string | null;
  otherCostsPerMonth?: string | null;
  downPayment: string;
  yearlyExtraMaintenance?: string | null;
  isFinanceFeeDeductible?: boolean | null;
  /** References _exportId values in the projects array */
  projectExportIds: number[];
  address?: string | null;
  latitude?: string | null;
  longitude?: string | null;
  notes?: string | null;
  customLink?: string | null;
}

export interface ExportData {
  version: typeof EXPORT_VERSION;
  exportedAt: string;
  projects: ExportProject[];
  properties: ExportProperty[];
}

/** Build an ExportData payload from a subset of properties + all their referenced projects */
export function buildExportData(
  properties: Property[],
  allProjects: Project[],
): ExportData {
  // Include only projects that are referenced by the exported properties
  const referencedProjectIds = new Set(
    properties.flatMap(p => (p.projectIds as number[]) ?? []),
  );
  const includedProjects = allProjects.filter(p => referencedProjectIds.has(p.id));

  const exportProjects: ExportProject[] = includedProjects.map(p => ({
    _exportId: p.id,
    name: p.name,
    description: p.description ?? null,
  }));

  const exportProperties: ExportProperty[] = properties.map(p => ({
    name: p.name,
    city: p.city,
    area: p.area,
    sizeM2: p.sizeM2,
    buildYear: p.buildYear,
    purchasePrice: p.purchasePrice,
    debtFreePrice: p.debtFreePrice,
    renovationCost: p.renovationCost,
    rentPerMonth: p.rentPerMonth,
    maintenanceFeePerMonth: p.maintenanceFeePerMonth,
    financeFeePerMonth: p.financeFeePerMonth,
    waterFeePerMonth: p.waterFeePerMonth,
    otherCostsPerMonth: p.otherCostsPerMonth,
    downPayment: p.downPayment,
    yearlyExtraMaintenance: p.yearlyExtraMaintenance,
    isFinanceFeeDeductible: p.isFinanceFeeDeductible,
    projectExportIds: (p.projectIds as number[]) ?? [],
    address: p.address,
    latitude: p.latitude,
    longitude: p.longitude,
    notes: p.notes,
    customLink: p.customLink,
  }));

  return {
    version: EXPORT_VERSION,
    exportedAt: new Date().toISOString(),
    projects: exportProjects,
    properties: exportProperties,
  };
}

export function downloadJson(data: ExportData, filename: string) {
  const json = JSON.stringify(data, null, 2);
  const blob = new Blob([json], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function buildFilename(label: string): string {
  const date = new Date().toISOString().split("T")[0];
  const slug = label
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
  return `investalo-${slug}-${date}.json`;
}

export function validateExportData(data: unknown): data is ExportData {
  if (!data || typeof data !== "object") return false;
  const d = data as Record<string, unknown>;
  return (
    d.version === EXPORT_VERSION &&
    Array.isArray(d.projects) &&
    Array.isArray(d.properties)
  );
}

export function readJsonFile(file: File): Promise<unknown> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = e => {
      try {
        resolve(JSON.parse(e.target?.result as string));
      } catch {
        reject(new Error("File is not valid JSON"));
      }
    };
    reader.onerror = () => reject(new Error("Failed to read file"));
    reader.readAsText(file);
  });
}
