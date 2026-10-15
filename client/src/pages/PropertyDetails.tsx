import { Link, useRoute } from "wouter";
import { useProperty } from "@/hooks/use-properties";
import { useSettings } from "@/hooks/use-settings";
import { usePropertyAnalysis } from "@/hooks/use-property-analysis";
import { useSimulationResults } from "@/hooks/use-simulation-results";
import { useAppConfig } from "@/hooks/use-app-config";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PropertyForm } from "@/components/PropertyForm";
import { PropertyMap } from "@/components/PropertyMap";
import { InvestmentAnalysisCard } from "@/components/property-details/InvestmentAnalysisCard";
import { SimulationChartsTab } from "@/components/property-details/SimulationChartsTab";
import { SensitivityAnalysisTab } from "@/components/property-details/SensitivityAnalysisTab";
import { BreakEvenTab } from "@/components/property-details/BreakEvenTab";
import { YearlyBreakdownTab } from "@/components/property-details/YearlyBreakdownTab";
import { FinancialSummaryTab } from "@/components/property-details/FinancialSummaryTab";
import { PropertyInputsTab } from "@/components/property-details/PropertyInputsTab";
import { ArrowLeft, Edit, TrendingUp, TrendingDown, MapPin, ExternalLink, FileText } from "lucide-react";
import { useState, useEffect } from "react";
import type { Property, Settings } from "@shared/schema";

// Inner component — only rendered when both property and settings are available.
// All hooks can be called unconditionally here.
function PropertyDetailsContent({ id, property, settings }: { id: number; property: Property; settings: Settings }) {
  const [isEditOpen, setIsEditOpen] = useState(false);
  const { claudeFeatures } = useAppConfig();

  const { analysis, isLoading: analysisLoading, error: analysisError,
    runAnalysis, clearAnalysis, initializeFromProperty } = usePropertyAnalysis(id);

  useEffect(() => {
    initializeFromProperty(property.investmentAnalysis);
  }, [property.id]);

  const simResults = useSimulationResults(property, settings);
  const { sim, yr1, yrLast, fmt, currencySymbol, marketConfig,
    totalCashInvested, propertyWins, altProfit } = simResults;

  return (
    <div className="container mx-auto p-4 md:p-8 min-h-screen">
      <div className="mb-6">
        <Link href="/">
          <Button variant="ghost" className="pl-0" data-testid="button-back-dashboard">
            <ArrowLeft className="w-4 h-4 mr-2" /> Back to Dashboard
          </Button>
        </Link>
      </div>

      <PageHeader
        title={property.name}
        description={[`${property.city}, ${property.area}`, `${property.sizeM2} m²`, property.rooms || ""].filter(Boolean).join(" · ")}
        actions={
          <Button onClick={() => setIsEditOpen(true)} variant="outline" data-testid="button-edit-property">
            <Edit className="w-4 h-4 mr-2" /> Edit Property
          </Button>
        }
      />

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <Card className="bg-primary text-primary-foreground border-none">
          <CardHeader className="pb-2">
            <CardDescription className="text-primary-foreground/70 text-xs uppercase">Total ROI ({settings.simulationDurationYears}y)</CardDescription>
            <CardTitle className="text-3xl">{sim.roiPercent.toFixed(1)}%</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm opacity-90">On {fmt(totalCashInvested)} invested</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="text-xs uppercase">Monthly CF (Yr 1)</CardDescription>
            <CardTitle className={`text-2xl ${yr1.cashFlow > 0 ? 'text-green-600' : 'text-red-500'}`}>
              {Math.round(yr1.cashFlow / 12).toLocaleString(marketConfig.locale)} {currencySymbol}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">After taxes & loan</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="text-xs uppercase">Net Profit if Sold</CardDescription>
            <CardTitle className={`text-2xl ${yrLast.totalProfitIfSold >= 0 ? 'text-green-600' : 'text-red-500'}`}>
              {fmt(yrLast.totalProfitIfSold)}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">After {settings.simulationDurationYears} years, all costs</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="text-xs uppercase">vs. Stock Market</CardDescription>
            <CardTitle className="text-2xl flex items-center gap-2">
              {propertyWins ? (
                <><TrendingUp className="w-5 h-5 text-green-600" /> <span className="text-green-600">Property</span></>
              ) : (
                <><TrendingDown className="w-5 h-5 text-red-500" /> <span className="text-red-500">Stocks</span></>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">Alt: {fmt(altProfit)} profit</p>
          </CardContent>
        </Card>
      </div>

      {/* Location & Notes */}
      {(property.address || property.notes || property.customLink || (property.latitude && property.longitude)) && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {property.latitude && property.longitude && (
            <Card data-testid="card-property-map">
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <MapPin className="w-4 h-4" /> Location
                </CardTitle>
                {property.address && <CardDescription>{property.address}</CardDescription>}
              </CardHeader>
              <CardContent>
                <PropertyMap
                  markers={[{
                    lat: parseFloat(String(property.latitude)),
                    lng: parseFloat(String(property.longitude)),
                    label: property.name,
                    popup: `<strong>${property.name}</strong><br/>${property.address || `${property.city}, ${property.area}`}`,
                  }]}
                  height="250px"
                />
              </CardContent>
            </Card>
          )}
          {(property.notes || property.customLink) && (
            <Card data-testid="card-property-notes">
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <FileText className="w-4 h-4" /> Notes & Links
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {property.customLink && (
                  <div>
                    <p className="text-xs font-medium text-muted-foreground mb-1">Property Link</p>
                    <a
                      href={property.customLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-primary hover:underline flex items-center gap-1"
                      data-testid="link-custom-property"
                    >
                      <ExternalLink className="w-3 h-3" />
                      {property.customLink.length > 60 ? property.customLink.substring(0, 60) + "..." : property.customLink}
                    </a>
                  </div>
                )}
                {property.notes && (
                  <div>
                    <p className="text-xs font-medium text-muted-foreground mb-1">Notes</p>
                    <p className="text-sm whitespace-pre-wrap" data-testid="text-property-notes">{property.notes}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      )}

      <InvestmentAnalysisCard
        analysis={analysis}
        isLoading={analysisLoading}
        error={analysisError}
        canAnalyze={!!property.customLink}
        claudeEnabled={claudeFeatures}
        onRun={() => property.customLink && runAnalysis(property.customLink)}
        onClear={clearAnalysis}
      />

      <Tabs defaultValue="charts">
        <TabsList className="w-full md:w-auto grid grid-cols-3 md:grid-cols-6 md:inline-flex">
          <TabsTrigger value="charts" data-testid="tab-charts">Charts</TabsTrigger>
          <TabsTrigger value="sensitivity" data-testid="tab-sensitivity">Sensitivity</TabsTrigger>
          <TabsTrigger value="breakeven" data-testid="tab-breakeven">Break-Even</TabsTrigger>
          <TabsTrigger value="table" data-testid="tab-table">Yearly Breakdown</TabsTrigger>
          <TabsTrigger value="financials" data-testid="tab-financials">Financial Summary</TabsTrigger>
          <TabsTrigger value="details" data-testid="tab-details">Inputs</TabsTrigger>
        </TabsList>

        <TabsContent value="charts" className="mt-6 space-y-6">
          <SimulationChartsTab simResults={simResults} settings={settings} />
        </TabsContent>

        <TabsContent value="sensitivity" className="mt-6 space-y-6">
          <SensitivityAnalysisTab property={property} settings={settings} simResults={simResults} />
        </TabsContent>

        <TabsContent value="breakeven" className="mt-6 space-y-6">
          <BreakEvenTab simResults={simResults} settings={settings} />
        </TabsContent>

        <TabsContent value="table" className="mt-6">
          <YearlyBreakdownTab simResults={simResults} />
        </TabsContent>

        <TabsContent value="financials" className="mt-6 space-y-6">
          <FinancialSummaryTab simResults={simResults} property={property} settings={settings} />
        </TabsContent>

        <TabsContent value="details" className="mt-6">
          <PropertyInputsTab property={property} simResults={simResults} />
        </TabsContent>
      </Tabs>

      <PropertyForm open={isEditOpen} onOpenChange={setIsEditOpen} property={property} />
    </div>
  );
}

// Route-level component: resolves data then delegates to content component.
export default function PropertyDetails() {
  const [, params] = useRoute("/property/:id");
  const id = parseInt(params?.id || "0");
  const { data: property, isLoading: loadingProp } = useProperty(id);
  const { data: settings, isLoading: loadingSettings } = useSettings();

  if (loadingProp || loadingSettings) {
    return (
      <div className="container mx-auto p-8">
        <Skeleton className="h-12 w-1/3 mb-8" />
        <Skeleton className="h-[400px] w-full" />
      </div>
    );
  }

  if (!property || !settings) return <div className="p-8">Property not found</div>;

  return <PropertyDetailsContent id={id} property={property} settings={settings} />;
}
