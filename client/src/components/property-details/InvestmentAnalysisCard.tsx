import { Brain, Loader2, CheckCircle, AlertTriangle, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { InvestmentAnalysis } from "@shared/schema";

interface InvestmentAnalysisCardProps {
  analysis: InvestmentAnalysis | null;
  isLoading: boolean;
  error: string | null;
  canAnalyze: boolean;
  claudeEnabled: boolean;
  onRun: () => void;
  onClear: () => void;
}

export function InvestmentAnalysisCard({
  analysis, isLoading, error, canAnalyze, claudeEnabled, onRun, onClear,
}: InvestmentAnalysisCardProps) {
  if (!claudeEnabled || !canAnalyze) return null;

  return (
    <Card data-testid="card-investment-analysis" className="mb-8">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <CardTitle className="text-base flex items-center gap-2">
            <Brain className="w-4 h-4" /> Investment Analysis
          </CardTitle>
          <div className="flex items-center gap-2">
            {analysis && (
              <Button
                size="sm"
                variant="ghost"
                onClick={onClear}
                data-testid="btn-remove-analysis"
              >
                Remove
              </Button>
            )}
            <Button
              size="sm"
              variant="outline"
              onClick={onRun}
              disabled={isLoading}
              data-testid="btn-run-analysis"
            >
              {isLoading ? (
                <><Loader2 className="w-3 h-3 mr-1 animate-spin" />Analyzing…</>
              ) : analysis ? (
                "Re-analyze"
              ) : (
                "Analyze Investment"
              )}
            </Button>
          </div>
        </div>
        {!analysis && !isLoading && !error && (
          <CardDescription>
            Click to analyze this property listing against investment guardrails using AI.
          </CardDescription>
        )}
      </CardHeader>

      {(analysis || error) && (
        <CardContent className="space-y-4">
          {error && (
            <p className="text-sm text-destructive" data-testid="text-analysis-error">{error}</p>
          )}
          {analysis && (
            <>
              <div className="flex items-center gap-2">
                {analysis.verdict === "good" && (
                  <Badge className="flex items-center gap-1 bg-green-600 hover:bg-green-600 text-white" data-testid="badge-verdict">
                    <CheckCircle className="w-3 h-3" /> Good Investment
                  </Badge>
                )}
                {analysis.verdict === "caution" && (
                  <Badge className="flex items-center gap-1 bg-amber-500 hover:bg-amber-500 text-white" data-testid="badge-verdict">
                    <AlertTriangle className="w-3 h-3" /> Proceed with Caution
                  </Badge>
                )}
                {analysis.verdict === "poor" && (
                  <Badge variant="destructive" className="flex items-center gap-1" data-testid="badge-verdict">
                    <XCircle className="w-3 h-3" /> Poor Investment
                  </Badge>
                )}
              </div>
              <p className="text-sm" data-testid="text-analysis-summary">{analysis.summary}</p>
              {analysis.positives.length > 0 && (
                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-1">Positives</p>
                  <ul className="space-y-1">
                    {analysis.positives.map((item, i) => (
                      <li key={i} className="text-sm flex items-start gap-1">
                        <CheckCircle className="w-3 h-3 mt-0.5 text-green-600 flex-shrink-0" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {analysis.flags.length > 0 && (
                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-1">Flags Identified</p>
                  <ul className="space-y-1">
                    {analysis.flags.map((item, i) => (
                      <li key={i} className="text-sm flex items-start gap-1">
                        <AlertTriangle className="w-3 h-3 mt-0.5 text-amber-500 flex-shrink-0" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {analysis.recommendation && (
                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-1">Recommendation</p>
                  <p className="text-sm" data-testid="text-analysis-recommendation">{analysis.recommendation}</p>
                </div>
              )}
            </>
          )}
        </CardContent>
      )}
    </Card>
  );
}
