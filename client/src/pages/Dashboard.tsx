import { useState, useMemo, useEffect } from "react";
import { Link } from "wouter";
import { Plus, Eye, EyeOff, FolderOpen, Home, RotateCcw } from "lucide-react";
import { PropertyMap } from "@/components/PropertyMap";
import { DashboardSection } from "@/components/DashboardSection";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { MapPin } from "lucide-react";
import { useProperties, useDeleteProperty, useDuplicateProperty } from "@/hooks/use-properties";
import { useProjects } from "@/hooks/use-projects";
import { useSettings } from "@/hooks/use-settings";
import { useDashboardLayout, DASHBOARD_SECTIONS } from "@/hooks/use-dashboard-layout";
import { useCardLayout } from "@/hooks/use-card-layout";
import { PropertyForm } from "@/components/PropertyForm";
import { PageHeader } from "@/components/PageHeader";
import { UserMenu } from "@/components/UserMenu";
import { Skeleton } from "@/components/ui/skeleton";
import { runSimulation } from "@/lib/simulation";
import { getMarketConfig } from "@/lib/market-configs";
import { getCurrencySymbol } from "@/lib/formatting";
import { InsightCards } from "@/components/dashboard/InsightCards";
import { ChartsSection } from "@/components/dashboard/ChartsSection";
import { SensitivitySection } from "@/components/dashboard/SensitivitySection";
import { PropertyCardItem } from "@/components/dashboard/PropertyCardItem";
import type { PropertySimulation, SensitivityVariable } from "@/components/dashboard/types";
import type { Settings } from "@shared/schema";

const SENSITIVITY_VARIABLES: SensitivityVariable[] = [
  { key: "interestRate", label: "Loan Interest Rate", settingsKey: "loanInterestRate", min: 0.5, max: 8, step: 0.5, unit: "%" },
  { key: "vacancyRate", label: "Vacancy Rate", settingsKey: "emptyMonthsPerYear", min: 0, max: 3, step: 0.25, unit: " mo" },
  { key: "appreciation", label: "Value Appreciation", settingsKey: "valueAppreciationRate", min: -1, max: 5, step: 0.5, unit: "%" },
  { key: "rentalIncome", label: "Rental Income", settingsKey: null, min: -30, max: 30, step: 5, unit: "%" },
  { key: "debtFreePrice", label: "Debt Free Price", settingsKey: null, min: -30, max: 30, step: 5, unit: "%" },
  { key: "duration", label: "Simulation Duration", settingsKey: "simulationDurationYears", min: 3, max: 30, step: 1, unit: " yr" },
  { key: "altReturn", label: "Alt. Investment Return", settingsKey: "alternativeInvestmentReturn", min: 3, max: 12, step: 0.5, unit: "%" },
];

function applyVariable(
  variable: SensitivityVariable, val: number,
  property: any, settings: Settings
): [any, Settings] {
  if (variable.key === "rentalIncome") {
    const adjusted = String(Math.round(parseFloat(String(property.rentPerMonth)) * (1 + val / 100)));
    return [{ ...property, rentPerMonth: adjusted }, settings];
  } else if (variable.key === "debtFreePrice") {
    const base = parseFloat(String(property.debtFreePrice || property.purchasePrice));
    const adjusted = String(Math.round(base * (1 + val / 100)));
    return [{ ...property, debtFreePrice: adjusted, purchasePrice: adjusted }, settings];
  } else {
    const settVal = variable.settingsKey === "simulationDurationYears" ? val : String(val);
    return [property, { ...settings, [variable.settingsKey!]: settVal } as Settings];
  }
}

export default function Dashboard() {
  const { data: properties, isLoading: loadingProperties } = useProperties();
  const { data: projects, isLoading: loadingProjects } = useProjects();
  const { data: settings, isLoading: loadingSettings } = useSettings();
  const deleteMutation = useDeleteProperty();
  const duplicateMutation = useDuplicateProperty();
  const { order, collapsed, toggleCollapsed, moveSection, resetLayout } = useDashboardLayout();

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedInsight, setSelectedInsight] = useState<string>("roi");
  const [editingPropertyId, setEditingPropertyId] = useState<number | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [selectedProjectId, setSelectedProjectId] = useState<string>(() =>
    localStorage.getItem("selectedProjectId") || "all"
  );
  const [sensitivityVariable, setSensitivityVariable] = useState("interestRate");
  const [sensitivityVariable2, setSensitivityVariable2] = useState<string | null>(null);

  useEffect(() => {
    localStorage.setItem("selectedProjectId", selectedProjectId);
  }, [selectedProjectId]);

  const filteredProperties = useMemo(() => {
    if (!properties) return [];
    if (selectedProjectId === "all") return properties;
    if (selectedProjectId === "unassigned") return properties.filter(p => !p.projectIds || (p.projectIds as number[]).length === 0);
    return properties.filter(p => (p.projectIds as number[] || []).includes(Number(selectedProjectId)));
  }, [properties, selectedProjectId]);

  const simulations = useMemo<PropertySimulation[]>(() => {
    if (!filteredProperties.length || !settings) return [];
    return filteredProperties.map(p => ({ ...p, ...runSimulation(p, settings) }));
  }, [filteredProperties, settings]);

  const simulationIds = useMemo(() => simulations.map(s => s.id), [simulations]);

  useEffect(() => {
    setSelectedIds(prev => {
      if (simulationIds.length === 0) return new Set();
      const validPrev = new Set(Array.from(prev).filter(id => simulationIds.includes(id)));
      if (validPrev.size > 0) return validPrev;
      return new Set(simulationIds);
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [simulationIds.join(",")]);

  const marketConfig = getMarketConfig(settings?.market);
  const currencySymbol = getCurrencySymbol(settings?.currency ?? marketConfig.currency);
  const fmt = (v: number) => `${Math.round(v).toLocaleString(marketConfig.locale)} ${currencySymbol}`;
  const fmtK = (v: number) => `${(v / 1000).toFixed(0)}k${currencySymbol}`;

  const sorted = useMemo(() => [...simulations].sort((a, b) => b.roiPercent - a.roiPercent), [simulations]);
  const selectedSims = useMemo(() => sorted.filter(s => selectedIds.has(s.id)), [sorted, selectedIds]);

  const sortedIds = useMemo(() => sorted.map(s => s.id), [sorted]);
  const { orderedIds: cardOrder, isCollapsed: isCardCollapsed, toggleCollapsed: toggleCardCollapsed, moveCard, resetCardLayout } = useCardLayout(sortedIds);
  const orderedSorted = useMemo(
    () => cardOrder.map(id => sorted.find(s => s.id === id)).filter(Boolean) as typeof sorted,
    [cardOrder, sorted]
  );

  const chartData = useMemo(() => selectedSims.map(s => ({
    name: s.name.length > 20 ? s.name.substring(0, 18) + "..." : s.name,
    ROI: parseFloat(s.roiPercent.toFixed(1)),
    "Cash Flow": Math.round(s.totalCashFlow),
    "Profit if Sold": Math.round(s.years[s.years.length - 1].totalProfitIfSold),
  })), [selectedSims]);

  const equityChartData = useMemo(() => selectedSims.length > 0
    ? selectedSims[0].years.map((_, i) => {
        const point: Record<string, number | string> = { year: selectedSims[0].years[i].year };
        selectedSims.forEach(sim => {
          point[sim.name.substring(0, 15)] = Math.round(sim.years[i]?.equity || 0);
        });
        return point;
      })
    : [], [selectedSims]);

  const ltvChartData = useMemo(() => selectedSims.length > 0
    ? selectedSims[0].years.map((_, i) => {
        const point: Record<string, number | string> = { year: selectedSims[0].years[i].year };
        selectedSims.forEach(sim => {
          const yr = sim.years[i];
          point[sim.name.substring(0, 15)] = yr && yr.propertyValue > 0
            ? parseFloat(((yr.remainingLoan / yr.propertyValue) * 100).toFixed(1))
            : 0;
        });
        return point;
      })
    : [], [selectedSims]);

  const projectSensitivityData = useMemo(() => {
    if (!settings || selectedSims.length < 2) return [];
    const variable = SENSITIVITY_VARIABLES.find(v => v.key === sensitivityVariable);
    if (!variable) return [];

    const values: number[] = [];
    for (let v = variable.min; v <= variable.max; v += variable.step) {
      values.push(parseFloat(v.toFixed(2)));
    }

    const isPropertyPercent = variable.settingsKey === null && variable.key !== "duration";
    const currentValue = isPropertyPercent ? 0 : parseFloat(String((settings as any)[variable.settingsKey!]));

    return values.map(val => {
      const point: Record<string, unknown> = {
        value: val,
        label: isPropertyPercent ? `${val >= 0 ? "+" : ""}${val}%` : `${val}${variable.unit}`,
        isCurrent: Math.abs(val - currentValue) < 0.01,
      };

      selectedSims.forEach(sim => {
        let modifiedSettings = settings;
        let modifiedProperty: any = sim;

        if (variable.key === "rentalIncome") {
          const adjustedRent = String(Math.round(parseFloat(String(sim.rentPerMonth)) * (1 + val / 100)));
          modifiedProperty = { ...sim, rentPerMonth: adjustedRent };
        } else if (variable.key === "debtFreePrice") {
          const adjustedPrice = String(Math.round(parseFloat(String(sim.debtFreePrice || sim.purchasePrice)) * (1 + val / 100)));
          modifiedProperty = { ...sim, debtFreePrice: adjustedPrice, purchasePrice: adjustedPrice };
        } else {
          const settingValue = variable.settingsKey === "simulationDurationYears" ? val : String(val);
          modifiedSettings = { ...settings, [variable.settingsKey!]: settingValue } as Settings;
        }

        const result = runSimulation(modifiedProperty, modifiedSettings);
        const lastYr = result.years[result.years.length - 1];
        const avgAnnualCF = result.years.length > 0 ? Math.round(result.totalCashFlow / result.years.length) : 0;
        point[`${sim.id}_roi`] = parseFloat(result.roiPercent.toFixed(1));
        point[`${sim.id}_cf`] = sensitivityVariable === "duration" ? avgAnnualCF : Math.round(result.years[0].cashFlow);
        point[`${sim.id}_profit`] = Math.round(lastYr.totalProfitIfSold);
        point[`${sim.id}_cash`] = Math.round(lastYr.saleBreakdown.totalCashInvested);
        point[`${sim.id}_ltv`] = lastYr.propertyValue > 0 ? parseFloat(((lastYr.remainingLoan / lastYr.propertyValue) * 100).toFixed(1)) : 0;
      });

      return point;
    });
  }, [settings, selectedSims, sensitivityVariable]);

  const insightMetricConfig = {
    roi:      { suffix: "_roi", label: "ROI", dataKey: "roi", unit: "%", higher: true },
    cash:     { suffix: "_cash", label: "Total Cash Invested", dataKey: "cash", unit: ` ${currencySymbol}`, higher: false },
    cashflow: { suffix: "_cf", label: sensitivityVariable === "duration" ? "Avg. Annual Cash Flow" : "Year 1 Cash Flow", dataKey: "cf", unit: ` ${currencySymbol}`, higher: true },
    risk:     { suffix: "_ltv", label: "Loan-to-Value", dataKey: "ltv", unit: "%", higher: false },
  } as const;
  const activeMetric = insightMetricConfig[selectedInsight as keyof typeof insightMetricConfig] ?? insightMetricConfig.roi;

  const bestPropertyPerValue = useMemo(() => {
    if (projectSensitivityData.length === 0 || selectedSims.length < 2) return [];
    return projectSensitivityData.map(point => {
      let bestName = "";
      let bestVal = activeMetric.higher ? -Infinity : Infinity;
      selectedSims.forEach(sim => {
        const val = point[`${sim.id}${activeMetric.suffix}`];
        if (typeof val === 'number') {
          if (activeMetric.higher ? val > bestVal : val < bestVal) {
            bestVal = val;
            bestName = sim.name;
          }
        }
      });
      return { ...point, bestProperty: bestName, bestValue: bestVal };
    });
  }, [projectSensitivityData, selectedSims, activeMetric]);

  const projectSensitivity2DData = useMemo(() => {
    if (!settings || !sensitivityVariable2 || selectedSims.length < 2) return null;
    const var1 = SENSITIVITY_VARIABLES.find(v => v.key === sensitivityVariable);
    const var2 = SENSITIVITY_VARIABLES.find(v => v.key === sensitivityVariable2);
    if (!var1 || !var2) return null;

    const genValues = (v: SensitivityVariable) => {
      const vals: number[] = [];
      for (let x = v.min; x <= v.max; x += v.step) vals.push(parseFloat(x.toFixed(2)));
      return vals;
    };
    const labelFor = (v: SensitivityVariable, val: number) =>
      (v.settingsKey === null && v.key !== "duration")
        ? `${val >= 0 ? "+" : ""}${val}%`
        : `${val}${v.unit}`;

    const values1 = genValues(var1);
    const values2 = genValues(var2);

    const cells = values1.map(v1 =>
      values2.map(v2 => {
        let bestId = -1, bestName = "", bestColorIdx = 0;
        let bestVal = activeMetric.higher ? -Infinity : Infinity;
        selectedSims.forEach((sim, idx) => {
          const [p1, s1] = applyVariable(var1, v1, sim, settings);
          const [p2, s2] = applyVariable(var2, v2, p1, s1);
          const result = runSimulation(p2, s2);
          const lastYr = result.years[result.years.length - 1];
          let metricVal: number;
          if (activeMetric.suffix === "_roi")        metricVal = parseFloat(result.roiPercent.toFixed(1));
          else if (activeMetric.suffix === "_cf")    metricVal = Math.round(result.years[0]?.cashFlow ?? 0);
          else if (activeMetric.suffix === "_ltv")   metricVal = lastYr.propertyValue > 0 ? parseFloat(((lastYr.remainingLoan / lastYr.propertyValue) * 100).toFixed(1)) : 0;
          else                                       metricVal = Math.round(lastYr?.saleBreakdown?.totalCashInvested ?? 0);
          if (activeMetric.higher ? metricVal > bestVal : metricVal < bestVal) {
            bestVal = metricVal; bestId = sim.id; bestName = sim.name; bestColorIdx = idx;
          }
        });
        return { bestId, bestName, bestColorIdx, bestVal };
      })
    );

    return {
      cells,
      values1, values2,
      labels1: values1.map(v => labelFor(var1, v)),
      labels2: values2.map(v => labelFor(var2, v)),
      var1Label: var1.label,
      var2Label: var2.label,
    };
  }, [settings, selectedSims, sensitivityVariable, sensitivityVariable2, activeMetric]);

  const insights = useMemo(() => {
    if (selectedSims.length === 0) return null;
    const lastYear = (sim: PropertySimulation) => sim.years[sim.years.length - 1];
    return {
      highestROI: [...selectedSims].sort((a, b) => b.roiPercent - a.roiPercent)[0],
      lowestCash: [...selectedSims].sort((a, b) => lastYear(a).saleBreakdown.totalCashInvested - lastYear(b).saleBreakdown.totalCashInvested)[0],
      bestCashFlow: [...selectedSims].sort((a, b) => (b.years[0].cashFlow / 12) - (a.years[0].cashFlow / 12))[0],
      lowestRisk: [...selectedSims].sort((a, b) => {
        const ltv = (sim: PropertySimulation) => Number(sim.purchasePrice) > 0 ? (Number(sim.purchasePrice) - Number(sim.downPayment)) / Number(sim.purchasePrice) : 0;
        return ltv(a) - ltv(b);
      })[0],
    };
  }, [selectedSims]);

  const mapMarkers = useMemo(() =>
    filteredProperties
      .filter(p => p.latitude && p.longitude)
      .map(p => ({
        lat: parseFloat(String(p.latitude)),
        lng: parseFloat(String(p.longitude)),
        label: p.name,
        popup: `<strong>${p.name}</strong><br/>${p.address || `${p.city}, ${p.area}`}`,
        id: p.id,
      })),
    [filteredProperties]
  );

  if (loadingProperties || loadingSettings || loadingProjects) {
    return (
      <div className="container mx-auto p-8 space-y-8">
        <Skeleton className="h-12 w-1/3" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Skeleton className="h-64 rounded-xl" />
          <Skeleton className="h-64 rounded-xl" />
          <Skeleton className="h-64 rounded-xl" />
        </div>
      </div>
    );
  }

  const toggleSelected = (id: number) => setSelectedIds(prev => {
    const next = new Set(prev);
    if (next.has(id)) next.delete(id); else next.add(id);
    return next;
  });

  const handleEdit = (id: number) => { setEditingPropertyId(id); setIsFormOpen(true); };
  const handleDelete = (id: number) => {
    deleteMutation.mutate(id);
    setSelectedIds(prev => { const next = new Set(prev); next.delete(id); return next; });
  };
  const handleDuplicate = (id: number) => duplicateMutation.mutate(id);
  const handleAddNew = () => { setEditingPropertyId(null); setIsFormOpen(true); };

  const sectionLabels: Record<string, string> = {};
  DASHBOARD_SECTIONS.forEach(s => { sectionLabels[s.id] = s.label; });
  const visibleSections = order.filter(id => sectionLabels[id]);

  const renderSection = (sectionId: string) => {
    if (sectionId === "insights") {
      if (!insights) return null;
      if (selectedSims.length < 1) return null;
      return (
        <InsightCards
          insights={insights}
          selectedSims={selectedSims}
          selectedInsight={selectedInsight}
          onSelectInsight={setSelectedInsight}
          fmt={fmt}
          currencySymbol={currencySymbol}
          marketConfig={marketConfig}
          settings={settings!}
        />
      );
    }

    if (sectionId === "selection") {
      return (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Select Properties for Charts</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {sorted.map(sim => (
                <Button
                  key={sim.id}
                  variant={selectedIds.has(sim.id) ? "default" : "outline"}
                  size="sm"
                  onClick={() => toggleSelected(sim.id)}
                  data-testid={`button-toggle-property-${sim.id}`}
                  className="gap-2"
                >
                  {selectedIds.has(sim.id) ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                  {sim.name}
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>
      );
    }

    if (sectionId === "charts") {
      if (selectedSims.length === 0) return null;
      return (
        <ChartsSection
          chartData={chartData}
          equityChartData={equityChartData}
          ltvChartData={ltvChartData}
          selectedSims={selectedSims}
          fmt={fmt}
          fmtK={fmtK}
          currencySymbol={currencySymbol}
          settings={settings!}
        />
      );
    }

    if (sectionId === "sensitivity") {
      if (selectedSims.length < 2 || projectSensitivityData.length === 0) return null;
      return (
        <SensitivitySection
          projectSensitivityData={projectSensitivityData}
          bestPropertyPerValue={bestPropertyPerValue}
          selectedSims={selectedSims}
          activeMetric={activeMetric}
          sensitivityVariables={SENSITIVITY_VARIABLES}
          sensitivityVariable={sensitivityVariable}
          projectSensitivity2DData={projectSensitivity2DData}
          fmt={fmt}
          currencySymbol={currencySymbol}
          settings={settings!}
        />
      );
    }

    if (sectionId === "map") {
      if (mapMarkers.length === 0) return null;
      return (
        <Card data-testid="card-project-map">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="w-5 h-5 text-primary" />
              Property Locations
            </CardTitle>
          </CardHeader>
          <CardContent>
            <PropertyMap markers={mapMarkers} height="350px" />
          </CardContent>
        </Card>
      );
    }

    if (sectionId === "projects") {
      if (orderedSorted.length === 0) return null;
      return (
        <div className="space-y-3" data-testid="projects-section">
          {orderedSorted.map((sim, idx) => (
            <PropertyCardItem
              key={sim.id}
              sim={sim}
              idx={idx}
              groupLength={orderedSorted.length}
              isCollapsed={isCardCollapsed(sim.id)}
              onToggleCollapse={() => toggleCardCollapsed(sim.id)}
              onMoveUp={() => moveCard(sim.id, "up")}
              onMoveDown={() => moveCard(sim.id, "down")}
              onEdit={() => handleEdit(sim.id)}
              onDelete={() => handleDelete(sim.id)}
              onDuplicate={() => handleDuplicate(sim.id)}
              fmt={fmt}
              currencySymbol={currencySymbol}
              marketConfig={marketConfig}
            />
          ))}
        </div>
      );
    }

    return null;
  };

  return (
    <div className="container mx-auto p-4 md:p-8 min-h-screen">
      <PageHeader
        title="Investalo Dashboard"
        description="Compare your property portfolio performance and ROI potential."
        actions={
          <div className="flex items-center gap-3 flex-wrap">
            <Link href="/projects">
              <Button variant="outline" data-testid="button-projects">
                <FolderOpen className="w-4 h-4 mr-2" /> Projects
              </Button>
            </Link>
            <Link href="/settings">
              <Button variant="outline" data-testid="button-settings">Global Settings</Button>
            </Link>
            <Button onClick={handleAddNew} data-testid="button-add-property">
              <Plus className="w-4 h-4 mr-2" /> Add Property
            </Button>
            <UserMenu />
          </div>
        }
      />

      {projects && projects.length > 0 && (
        <div className="flex items-center gap-3 mb-6" data-testid="project-filter">
          <FolderOpen className="w-4 h-4 text-muted-foreground shrink-0" />
          <span className="text-sm font-medium text-muted-foreground shrink-0">Filter by project:</span>
          <Select value={selectedProjectId} onValueChange={setSelectedProjectId}>
            <SelectTrigger className="w-[220px]" data-testid="select-project-filter">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Properties</SelectItem>
              <SelectItem value="unassigned">Unassigned</SelectItem>
              {projects.map(p => (
                <SelectItem key={p.id} value={String(p.id)}>{p.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          {selectedProjectId !== "all" && (
            <Badge variant="secondary">
              {filteredProperties.length} {filteredProperties.length === 1 ? "property" : "properties"}
            </Badge>
          )}
        </div>
      )}

      {sorted.length > 0 ? (
        <>
          <div className="flex items-center justify-end gap-2 mb-4">
            <Button
              variant="ghost"
              size="sm"
              className="text-xs text-muted-foreground"
              onClick={() => { resetLayout(); resetCardLayout(); }}
              data-testid="button-reset-layout"
            >
              <RotateCcw className="w-3 h-3 mr-1" /> Reset layout
            </Button>
          </div>

          {visibleSections.map((sectionId, idx) => {
            const content = renderSection(sectionId);
            if (content === null) return null;
            return (
              <DashboardSection
                key={sectionId}
                id={sectionId}
                title={sectionLabels[sectionId]}
                isCollapsed={!!collapsed[sectionId]}
                onToggleCollapse={() => toggleCollapsed(sectionId)}
                onMoveUp={() => moveSection(sectionId, "up")}
                onMoveDown={() => moveSection(sectionId, "down")}
                isFirst={idx === 0}
                isLast={idx === visibleSections.length - 1}
                headerRight={sectionId === "sensitivity" ? (
                  <div className="flex items-center gap-2 flex-wrap">
                    <Select value={sensitivityVariable} onValueChange={v => {
                      setSensitivityVariable(v);
                      if (sensitivityVariable2 === v) setSensitivityVariable2(null);
                    }}>
                      <SelectTrigger className="w-[180px] h-8" data-testid="select-sensitivity-var">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {SENSITIVITY_VARIABLES.map(v => (
                          <SelectItem key={v.key} value={v.key}>{v.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <span className="text-muted-foreground text-xs">vs</span>
                    <Select
                      value={sensitivityVariable2 ?? "none"}
                      onValueChange={v => setSensitivityVariable2(v === "none" ? null : v)}
                    >
                      <SelectTrigger className="w-[180px] h-8" data-testid="select-sensitivity-var2">
                        <SelectValue placeholder="2nd variable (optional)" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">— None (1D chart) —</SelectItem>
                        {SENSITIVITY_VARIABLES
                          .filter(v => v.key !== sensitivityVariable)
                          .map(v => <SelectItem key={v.key} value={v.key}>{v.label}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                ) : undefined}
              >
                {content}
              </DashboardSection>
            );
          })}
        </>
      ) : (
        <div className="text-center py-20 rounded-2xl border border-dashed border-border">
          <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 mb-6">
            <Home className="h-8 w-8 text-primary" />
          </div>
          <h2 className="text-2xl font-bold text-foreground mb-2">No properties yet</h2>
          <p className="text-muted-foreground max-w-md mx-auto mb-8">
            Add a property to start calculating ROI, cash flow, and comparing investment opportunities.
          </p>
          <Button onClick={handleAddNew} size="lg" data-testid="button-add-first">
            <Plus className="w-5 h-5 mr-2" /> Add First Property
          </Button>
        </div>
      )}

      <PropertyForm
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        property={properties?.find(p => p.id === editingPropertyId)}
      />
    </div>
  );
}
