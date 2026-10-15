import { useState, useCallback } from "react";
import { investmentAnalysisSchema, type InvestmentAnalysis } from "@shared/schema";
import { useUpdateProperty } from "./use-properties";

export function usePropertyAnalysis(propertyId: number) {
  const updateProperty = useUpdateProperty();
  const [analysis, setAnalysis] = useState<InvestmentAnalysis | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Call once on property load to safely parse the JSONB `investmentAnalysis` field.
   * Uses Zod to validate the shape rather than an unsafe `as InvestmentAnalysis` cast.
   */
  const initializeFromProperty = useCallback((raw: unknown) => {
    const parsed = investmentAnalysisSchema.safeParse(raw);
    setAnalysis(parsed.success ? parsed.data : null);
  }, []);

  /** Fetch analysis from the server, persist the result to the property record. */
  const runAnalysis = useCallback(async (url: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/analyze-property", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
        credentials: "include",
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({})) as { message?: string };
        throw new Error(body.message || "Analysis failed");
      }
      const data = investmentAnalysisSchema.parse(await res.json());
      setAnalysis(data);
      updateProperty.mutate({ id: propertyId, investmentAnalysis: data });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Analysis failed");
    } finally {
      setIsLoading(false);
    }
  }, [propertyId, updateProperty]);

  /** Remove the analysis from local state and from the database. */
  const clearAnalysis = useCallback(() => {
    setAnalysis(null);
    updateProperty.mutate({ id: propertyId, investmentAnalysis: null });
  }, [propertyId, updateProperty]);

  return { analysis, isLoading, error, runAnalysis, clearAnalysis, initializeFromProperty };
}
