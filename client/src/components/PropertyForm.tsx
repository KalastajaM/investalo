import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertPropertySchema, marketAnalysisSchema, type InsertProperty, type MarketAnalysis, type Property } from "@shared/schema";
import { Form } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calculator, Building, Banknote, ArrowRight, TrendingUp, TrendingDown, Minus, BarChart3, FileText, AlertCircle, Sparkles } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useCreateProperty, useUpdateProperty } from "@/hooks/use-properties";
import { useProjects } from "@/hooks/use-projects";
import { useSettings } from "@/hooks/use-settings";
import { useAppConfig } from "@/hooks/use-app-config";
import React, { useEffect, useMemo, useState } from "react";
import { getMarketComparison, suggestCity, suggestArea, type MarketComparison } from "@/lib/market-data";
import { getMarketConfig } from "@/lib/market-configs";
import { getCurrencySymbol } from "@/lib/formatting";
import { BasicInfoTab } from "./property-form/BasicInfoTab";
import { PurchaseLoanTab } from "./property-form/PurchaseLoanTab";
import { IncomeCostsTab } from "./property-form/IncomeCostsTab";
import { DetailsTab } from "./property-form/DetailsTab";
import { UrlImportPanel } from "./property-form/UrlImportPanel";

interface PropertyFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  property?: Property;
  defaultProjectId?: number;
}

function RatingBadge({ rating }: { rating: "below" | "on-par" | "above" | "unknown" }) {
  if (rating === "unknown") return null;
  const config = {
    below: { label: "Below market", variant: "default" as const, icon: TrendingDown },
    "on-par": { label: "On par", variant: "secondary" as const, icon: Minus },
    above: { label: "Above market", variant: "destructive" as const, icon: TrendingUp },
  };
  const { label, variant, icon: Icon } = config[rating];
  return (
    <Badge variant={variant} data-testid={`badge-rating-${rating}`}>
      <Icon className="w-3 h-3 mr-1" />
      {label}
    </Badge>
  );
}

function formatAmount(val: number, currencySymbol: string, locale: string): string {
  return `${val.toLocaleString(locale, { maximumFractionDigits: 0 })} ${currencySymbol}`;
}

function MarketComparisonPanel({ comparison, currencySymbol, locale }: { comparison: MarketComparison; currencySymbol: string; locale: string }) {
  const fmt = (val: number) => formatAmount(val, currencySymbol, locale);
  return (
    <div className="rounded-md border p-4 space-y-4 bg-muted/30" data-testid="market-comparison-panel">
      <div className="flex items-center gap-2 flex-wrap">
        <BarChart3 className="w-4 h-4 text-muted-foreground" />
        <span className="text-sm font-medium">Market Comparison</span>
        <Badge variant="outline" className="text-xs">
          {comparison.source === "area" ? "Area-level data" : "City-level data"}
        </Badge>
      </div>

      {comparison.buildYearNote && (
        <div className="flex items-center gap-2 text-xs text-amber-600 dark:text-amber-400">
          <AlertCircle className="w-3 h-3 flex-shrink-0" />
          <span>{comparison.buildYearNote}</span>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-medium text-muted-foreground">Purchase Price</span>
            <RatingBadge rating={comparison.priceRating} />
          </div>
          <p className="text-xs text-muted-foreground">
            Market range: {fmt(comparison.suggestedPrice.low)} - {fmt(comparison.suggestedPrice.high)}
          </p>
          <p className="text-sm font-medium">
            Suggested: {fmt(comparison.suggestedPrice.mid)}
          </p>
          <p className="text-xs text-muted-foreground">
            ({formatAmount(comparison.pricePerSqmUsed.low, currencySymbol, locale)}-{formatAmount(comparison.pricePerSqmUsed.high, currencySymbol, locale)}/m²)
          </p>
        </div>

        <div className="space-y-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-medium text-muted-foreground">Monthly Rent</span>
            <RatingBadge rating={comparison.rentRating} />
          </div>
          <p className="text-xs text-muted-foreground">
            Market range: {fmt(comparison.suggestedRent.low)} - {fmt(comparison.suggestedRent.high)}/mo
          </p>
          <p className="text-sm font-medium">
            Suggested: {fmt(comparison.suggestedRent.mid)}/mo
          </p>
          <p className="text-xs text-muted-foreground">
            ({comparison.rentPerSqmUsed.low}-{comparison.rentPerSqmUsed.high} {currencySymbol}/m²/mo)
          </p>
        </div>

        <div className="space-y-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-medium text-muted-foreground">Maintenance Fee</span>
            <RatingBadge rating={comparison.maintenanceRating} />
          </div>
          <p className="text-xs text-muted-foreground">
            Market range: {comparison.suggestedMaintenance.low.toFixed(0)} - {comparison.suggestedMaintenance.high.toFixed(0)} {currencySymbol}/mo
          </p>
          <p className="text-sm font-medium">
            Suggested: {comparison.suggestedMaintenance.mid.toFixed(0)} {currencySymbol}/mo
          </p>
          <p className="text-xs text-muted-foreground">
            ({comparison.maintenancePerSqmUsed.low.toFixed(1)}-{comparison.maintenancePerSqmUsed.high.toFixed(1)} {currencySymbol}/m²/mo)
          </p>
        </div>
      </div>

      <p className="text-xs text-muted-foreground italic">
        Based on market reference data. Maintenance adjusted for building age when year is provided.
      </p>
    </div>
  );
}

function ClaudeMarketPanel({
  analysis,
  isLoading,
  onAnalyze,
  onApply,
  currencySymbol,
  locale,
}: {
  analysis: MarketAnalysis | null;
  isLoading: boolean;
  onAnalyze: () => void;
  onApply: (field: "purchasePrice" | "rentPerMonth", value: number) => void;
  currencySymbol: string;
  locale: string;
}) {
  const fmt = (v: number) => `${v.toLocaleString(locale, { maximumFractionDigits: 0 })} ${currencySymbol}`;

  return (
    <div className="rounded-md border p-4 space-y-4 bg-muted/30">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-primary" />
          <span className="text-sm font-medium">AI Market Analysis</span>
          {analysis?.confidence && (
            <Badge variant="outline" className="text-xs capitalize">{analysis.confidence} confidence</Badge>
          )}
        </div>
        <Button type="button" variant="outline" size="sm" onClick={onAnalyze} disabled={isLoading}>
          {isLoading ? "Analyzing..." : analysis ? "Refresh" : "Analyze Market"}
        </Button>
      </div>

      {analysis ? (
        <>
          <p className="text-xs text-muted-foreground italic">{analysis.summary}</p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <TrendingDown className="w-3.5 h-3.5 text-muted-foreground" />
                <span className="text-xs font-medium text-muted-foreground">Asking Price Assessment</span>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">{analysis.askingPriceAnalysis}</p>
              <p className="text-xs text-muted-foreground">
                Offer range: {fmt(analysis.offerPriceRange.low)} – {fmt(analysis.offerPriceRange.high)}
              </p>
              <p className="text-sm font-medium">Recommended offer: {fmt(analysis.offerPriceRange.mid)}</p>
              <Button type="button" variant="outline" size="sm"
                onClick={() => onApply("purchasePrice", analysis.offerPriceRange.mid)}>
                Apply Recommended Offer
              </Button>
            </div>

            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Banknote className="w-3.5 h-3.5 text-muted-foreground" />
                <span className="text-xs font-medium text-muted-foreground">Market Rent Estimate</span>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">{analysis.rentAnalysis}</p>
              <p className="text-xs text-muted-foreground">
                Range: {fmt(analysis.marketRentEstimate.low)} – {fmt(analysis.marketRentEstimate.high)}/mo
              </p>
              <p className="text-sm font-medium">Market rate: {fmt(analysis.marketRentEstimate.mid)}/mo</p>
              <Button type="button" variant="outline" size="sm"
                onClick={() => onApply("rentPerMonth", analysis.marketRentEstimate.mid)}>
                Apply Market Rent
              </Button>
            </div>
          </div>

          <p className="text-xs text-muted-foreground">
            Analyzed {new Date(analysis.analyzedAt).toLocaleDateString()} · AI estimates, verify with local sources
          </p>
        </>
      ) : (
        <p className="text-xs text-muted-foreground">
          Click "Analyze Market" for an AI-powered assessment of the asking price, a recommended offer range, and a market rent estimate.
        </p>
      )}
    </div>
  );
}

export function PropertyForm({ open, onOpenChange, property, defaultProjectId }: PropertyFormProps) {
  const { toast } = useToast();
  const createMutation = useCreateProperty();
  const updateMutation = useUpdateProperty();
  const { data: projects } = useProjects();
  const { data: settings } = useSettings();
  const { claudeFeatures } = useAppConfig();
  const [isGeocoding, setIsGeocoding] = useState(false);
  const [importUrl, setImportUrl] = useState("");
  const [isImporting, setIsImporting] = useState(false);
  const [marketAnalysis, setMarketAnalysis] = useState<MarketAnalysis | null>(() => {
    if (!property?.marketAnalysis) return null;
    const parsed = marketAnalysisSchema.safeParse(property.marketAnalysis);
    return parsed.success ? parsed.data : null;
  });
  const [isAnalyzingMarket, setIsAnalyzingMarket] = useState(false);

  const marketConfig = getMarketConfig(settings?.market);
  const currencySymbol = getCurrencySymbol(settings?.currency ?? marketConfig.currency);

  const defaultValues: InsertProperty = {
    name: "",
    city: marketConfig.id === "fi" ? "Helsinki" : "",
    area: "",
    sizeM2: "0",
    buildYear: null,
    purchasePrice: "0",
    debtFreePrice: "0",
    renovationCost: "0",
    rentPerMonth: "0",
    maintenanceFeePerMonth: "0",
    financeFeePerMonth: "0",
    waterFeePerMonth: "20",
    otherCostsPerMonth: "0",
    downPayment: "0",
    yearlyExtraMaintenance: "0",
    isFinanceFeeDeductible: true,
    projectIds: defaultProjectId ? [defaultProjectId] : [],
    address: "",
    latitude: null,
    longitude: null,
    rooms: "",
    notes: "",
    customLink: "",
  };

  const form = useForm<InsertProperty>({
    resolver: zodResolver(insertPropertySchema),
    defaultValues,
  });

  const watchedCity = form.watch("city");
  const watchedArea = form.watch("area");
  const watchedSize = form.watch("sizeM2");
  const watchedPrice = form.watch("purchasePrice");
  const watchedRent = form.watch("rentPerMonth");
  const watchedMaintenance = form.watch("maintenanceFeePerMonth");
  const watchedBuildYear = form.watch("buildYear");

  const citysuggestion = useMemo(() => suggestCity(watchedCity || ""), [watchedCity]);
  const areaSuggestion = useMemo(() => suggestArea(watchedCity || "", watchedArea || ""), [watchedCity, watchedArea]);

  const marketComparison = useMemo(() => {
    const size = parseFloat(watchedSize || "0");
    const price = parseFloat(watchedPrice || "0");
    const rent = parseFloat(watchedRent || "0");
    const maintenance = parseFloat(watchedMaintenance || "0");
    if (!watchedCity || size <= 0) return null;
    return getMarketComparison(
      watchedCity,
      watchedArea || "",
      size,
      price,
      rent,
      maintenance,
      watchedBuildYear || null
    );
  }, [watchedCity, watchedArea, watchedSize, watchedPrice, watchedRent, watchedMaintenance, watchedBuildYear]);

  useEffect(() => {
    if (property) {
      form.reset({
        name: property.name,
        city: property.city,
        area: property.area,
        sizeM2: String(property.sizeM2),
        buildYear: property.buildYear ?? null,
        purchasePrice: String(property.purchasePrice),
        debtFreePrice: String(property.debtFreePrice || property.purchasePrice),
        renovationCost: String(property.renovationCost || "0"),
        rentPerMonth: String(property.rentPerMonth),
        maintenanceFeePerMonth: String(property.maintenanceFeePerMonth),
        financeFeePerMonth: String(property.financeFeePerMonth || "0"),
        waterFeePerMonth: String(property.waterFeePerMonth || "20"),
        otherCostsPerMonth: String(property.otherCostsPerMonth || "0"),
        downPayment: String(property.downPayment),
        yearlyExtraMaintenance: String(property.yearlyExtraMaintenance || "0"),
        isFinanceFeeDeductible: property.isFinanceFeeDeductible ?? true,
        projectIds: (property.projectIds as number[] | null) ?? [],
        address: property.address || "",
        latitude: property.latitude ? String(property.latitude) : null,
        longitude: property.longitude ? String(property.longitude) : null,
        rooms: property.rooms || "",
        notes: property.notes || "",
        customLink: property.customLink || "",
      });
      const parsed = marketAnalysisSchema.safeParse(property.marketAnalysis);
      setMarketAnalysis(parsed.success ? parsed.data : null);
    } else {
      form.reset({ ...defaultValues, projectIds: defaultProjectId ? [defaultProjectId] : [] });
      setMarketAnalysis(null);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [property, open]);

  const onSubmit = async (data: InsertProperty) => {
    try {
      if (property) {
        await updateMutation.mutateAsync({ id: property.id, ...data });
        toast({ title: "Property updated", description: "Changes saved successfully." });
      } else {
        await createMutation.mutateAsync(data);
        toast({ title: "Property created", description: "New property added to your portfolio." });
      }
      onOpenChange(false);
    } catch (error: any) {
      toast({ variant: "destructive", title: "Error", description: error.message });
    }
  };

  const applyMarketSuggestion = (field: "purchasePrice" | "rentPerMonth" | "maintenanceFeePerMonth", value: number) => {
    form.setValue(field, String(Math.round(value)));
    const labels: Record<string, string> = {
      purchasePrice: "Purchase Price",
      rentPerMonth: "Monthly Rent",
      maintenanceFeePerMonth: "Maintenance Fee",
    };
    toast({ title: "Value Applied", description: `${labels[field]} set to ${formatAmount(Math.round(value), currencySymbol, marketConfig.locale)}` });
  };

  const runMarketAnalysis = async () => {
    if (!property?.id) return;
    setIsAnalyzingMarket(true);
    try {
      const res = await fetch(`/api/properties/${property.id}/market-analyze`, { method: "POST" });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ message: "Failed to analyze" }));
        throw new Error(err.message || "Failed to analyze");
      }
      const data = await res.json();
      setMarketAnalysis(marketAnalysisSchema.parse(data));
    } catch (e: any) {
      toast({ title: "Market analysis failed", description: e.message, variant: "destructive" });
    } finally {
      setIsAnalyzingMarket(false);
    }
  };

  const estimateRent = () => {
    if (marketComparison) {
      form.setValue("rentPerMonth", String(marketComparison.suggestedRent.mid));
      toast({ title: "Rent Estimated", description: `Based on market data: ~${marketComparison.rentPerSqmUsed.mid}${currencySymbol}/m² for ${watchedCity}` });
    } else {
      const size = parseFloat(form.getValues("sizeM2"));
      if (size > 0) {
        const estimated = Math.round(size * 22);
        form.setValue("rentPerMonth", String(estimated));
        toast({ title: "Rent Estimated", description: `Based on ~22${currencySymbol}/m² for ${size}m²` });
      }
    }
  };

  const geocodeAddress = async () => {
    const address = form.getValues("address");
    if (!address) {
      toast({ variant: "destructive", title: "No address", description: "Enter an address first" });
      return;
    }
    setIsGeocoding(true);
    try {
      const countryHint = marketConfig.name !== "Generic" ? `, ${marketConfig.name}` : "";
      const query = `${address}${countryHint}`;
      const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=1`);
      const data = await res.json();
      if (data && data.length > 0) {
        form.setValue("latitude", String(data[0].lat));
        form.setValue("longitude", String(data[0].lon));
        toast({ title: "Location found", description: `Coordinates set for "${data[0].display_name?.split(",").slice(0,3).join(",")}"` });
      } else {
        toast({ variant: "destructive", title: "Not found", description: "Could not find coordinates for this address" });
      }
    } catch {
      toast({ variant: "destructive", title: "Error", description: "Failed to geocode address" });
    } finally {
      setIsGeocoding(false);
    }
  };

  const importFromUrl = async () => {
    if (!importUrl.trim()) {
      toast({ variant: "destructive", title: "No URL", description: "Paste a listing URL first" });
      return;
    }
    setIsImporting(true);
    try {
      const res = await fetch("/api/scrape-property", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: importUrl.trim() }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ message: "Failed to import" }));
        throw new Error(err.message || "Failed to import");
      }
      const data = await res.json();
      const filled: string[] = [];
      if (data.name) { form.setValue("name", data.name); filled.push("name"); }
      if (data.city) { form.setValue("city", data.city); filled.push("city"); }
      if (data.area) { form.setValue("area", data.area); filled.push("area"); }
      if (data.sizeM2) { form.setValue("sizeM2", data.sizeM2); filled.push("size"); }
      if (data.buildYear) { form.setValue("buildYear", data.buildYear); filled.push("build year"); }
      if (data.purchasePrice) { form.setValue("purchasePrice", data.purchasePrice); filled.push("price"); }
      if (data.debtFreePrice) { form.setValue("debtFreePrice", data.debtFreePrice); filled.push("debt-free price"); }
      if (data.maintenanceFeePerMonth) { form.setValue("maintenanceFeePerMonth", data.maintenanceFeePerMonth); filled.push("maintenance"); }
      if (data.financeFeePerMonth) { form.setValue("financeFeePerMonth", data.financeFeePerMonth); filled.push("finance fee"); }
      if (data.waterFeePerMonth) { form.setValue("waterFeePerMonth", data.waterFeePerMonth); filled.push("water fee"); }
      if (data.rooms) { form.setValue("rooms", data.rooms); filled.push("rooms"); }
      if (data.address) { form.setValue("address", data.address); filled.push("address"); }
      if (data.customLink) { form.setValue("customLink", data.customLink); }
      if (filled.length === 0) {
        toast({ variant: "destructive", title: "Nothing imported", description: "Could not extract property data from this URL" });
      } else {
        toast({ title: "Data imported", description: `Filled in: ${filled.join(", ")}` });
      }
    } catch (err: any) {
      toast({ variant: "destructive", title: "Import failed", description: err.message });
    } finally {
      setIsImporting(false);
    }
  };

  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-display">
            {property ? "Edit Property" : "Add New Property"}
          </DialogTitle>
          <DialogDescription>
            Enter the details of the apartment to calculate its ROI potential.
          </DialogDescription>
        </DialogHeader>

        {claudeFeatures && (
          <UrlImportPanel
            importUrl={importUrl}
            onImportUrlChange={setImportUrl}
            onImport={importFromUrl}
            isImporting={isImporting}
          />
        )}

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 mt-4">
            <Tabs defaultValue="basic" className="w-full">
              <TabsList className="grid w-full grid-cols-5 mb-6">
                <TabsTrigger value="basic" data-testid="tab-basic">
                  <Building className="w-4 h-4 mr-2" />
                  Basic Info
                </TabsTrigger>
                <TabsTrigger value="purchase" data-testid="tab-purchase">
                  <Banknote className="w-4 h-4 mr-2" />
                  Purchase & Loan
                </TabsTrigger>
                <TabsTrigger value="income" data-testid="tab-income">
                  <Calculator className="w-4 h-4 mr-2" />
                  Income & Costs
                </TabsTrigger>
                <TabsTrigger value="details" data-testid="tab-details">
                  <FileText className="w-4 h-4 mr-2" />
                  Details
                </TabsTrigger>
                <TabsTrigger value="market" data-testid="tab-market">
                  <BarChart3 className="w-4 h-4 mr-2" />
                  Market
                </TabsTrigger>
              </TabsList>

              <TabsContent value="basic" className="space-y-4">
                <BasicInfoTab
                  control={form.control}
                  setValue={form.setValue}
                  citysuggestion={citysuggestion}
                  areaSuggestion={areaSuggestion}
                  projects={projects}
                />
              </TabsContent>

              <TabsContent value="purchase" className="space-y-4">
                <PurchaseLoanTab
                  control={form.control}
                  currencySymbol={currencySymbol}
                  marketConfig={marketConfig}
                />
              </TabsContent>

              <TabsContent value="income" className="space-y-4">
                <IncomeCostsTab
                  control={form.control}
                  currencySymbol={currencySymbol}
                  marketConfig={marketConfig}
                  onEstimateRent={estimateRent}
                />
              </TabsContent>

              <TabsContent value="details" className="space-y-4">
                <DetailsTab
                  control={form.control}
                  onGeocode={geocodeAddress}
                  isGeocoding={isGeocoding}
                />
              </TabsContent>

              <TabsContent value="market" className="space-y-4">
                {claudeFeatures ? (
                  property ? (
                    <ClaudeMarketPanel
                      analysis={marketAnalysis}
                      isLoading={isAnalyzingMarket}
                      onAnalyze={runMarketAnalysis}
                      onApply={applyMarketSuggestion}
                      currencySymbol={currencySymbol}
                      locale={marketConfig.locale}
                    />
                  ) : (
                    <p className="text-sm text-muted-foreground">Save the property first to run market analysis.</p>
                  )
                ) : marketConfig.features.marketData && marketComparison ? (
                  <div className="space-y-3">
                    <MarketComparisonPanel comparison={marketComparison} currencySymbol={currencySymbol} locale={marketConfig.locale} />
                    <div className="flex flex-wrap gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => applyMarketSuggestion("purchasePrice", marketComparison.suggestedPrice.mid)}
                        data-testid="button-apply-suggested-price"
                      >
                        Apply Suggested Price
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => applyMarketSuggestion("rentPerMonth", marketComparison.suggestedRent.mid)}
                        data-testid="button-apply-suggested-rent"
                      >
                        Apply Suggested Rent
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => applyMarketSuggestion("maintenanceFeePerMonth", marketComparison.suggestedMaintenance.mid)}
                        data-testid="button-apply-suggested-maintenance"
                      >
                        Apply Suggested Maintenance
                      </Button>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">No market data available for this property.</p>
                )}
              </TabsContent>
            </Tabs>

            <div className="flex justify-end gap-3 pt-4 border-t">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)} data-testid="button-cancel">Cancel</Button>
              <Button type="submit" disabled={isPending} data-testid="button-submit-property">
                {isPending ? "Saving..." : property ? "Update Property" : "Add Property"}
                {!isPending && <ArrowRight className="w-4 h-4 ml-2" />}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
