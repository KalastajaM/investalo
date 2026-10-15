import { TrendingUp, Wallet, ArrowDownCircle, Shield } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { Settings } from "@shared/schema";
import type { MarketConfig } from "@/lib/market-configs";
import type { PropertySimulation } from "./types";

interface Insights {
  highestROI: PropertySimulation;
  lowestCash: PropertySimulation;
  bestCashFlow: PropertySimulation;
  lowestRisk: PropertySimulation;
}

interface InsightCardsProps {
  insights: Insights;
  selectedSims: PropertySimulation[];
  selectedInsight: string;
  onSelectInsight: (key: string) => void;
  fmt: (v: number) => string;
  currencySymbol: string;
  marketConfig: MarketConfig;
  settings: Settings;
}

export function InsightCards({
  insights,
  selectedSims,
  selectedInsight,
  onSelectInsight,
  fmt,
  currencySymbol,
  marketConfig,
  settings,
}: InsightCardsProps) {
  // Single selection: compact banner
  if (selectedSims.length === 1) {
    const sim = insights.highestROI;
    return (
      <Card className="bg-primary/5 border-primary/20">
        <CardContent className="py-4 flex flex-wrap items-center gap-4">
          <TrendingUp className="w-5 h-5 text-primary" />
          <span className="font-medium">Selected:</span>
          <span className="font-bold text-primary">{sim.name}</span>
          <Badge variant="secondary">{sim.roiPercent.toFixed(1)}% ROI</Badge>
          <span className="text-sm text-muted-foreground">
            Net profit if sold after {settings.simulationDurationYears} years: {fmt(sim.years[sim.years.length - 1].totalProfitIfSold)}
          </span>
        </CardContent>
      </Card>
    );
  }

  const insightCards = [
    {
      key: "roi",
      testId: "insight-highest-roi",
      icon: <TrendingUp className="w-4 h-4 text-primary" />,
      iconBg: "bg-primary/10",
      label: "Highest ROI",
      name: insights.highestROI.name,
      nameTestId: "text-insight-roi-name",
      value: `${insights.highestROI.roiPercent.toFixed(1)}%`,
      valueColor: "text-primary",
    },
    {
      key: "cash",
      testId: "insight-lowest-cash",
      icon: <Wallet className="w-4 h-4 text-green-600" />,
      iconBg: "bg-green-500/10",
      label: "Lowest Cash Needed",
      name: insights.lowestCash.name,
      nameTestId: "text-insight-cash-name",
      value: fmt(insights.lowestCash.years[insights.lowestCash.years.length - 1].saleBreakdown.totalCashInvested),
      valueColor: "text-green-600",
    },
    {
      key: "cashflow",
      testId: "insight-best-cashflow",
      icon: <ArrowDownCircle className="w-4 h-4 text-blue-600" />,
      iconBg: "bg-blue-500/10",
      label: "Best Cash Flow",
      name: insights.bestCashFlow.name,
      nameTestId: "text-insight-cf-name",
      value: `${Math.round(insights.bestCashFlow.years[0].cashFlow / 12).toLocaleString(marketConfig.locale)} ${currencySymbol}/mo`,
      valueColor: insights.bestCashFlow.years[0].cashFlow >= 0 ? "text-green-600" : "text-red-500",
    },
    {
      key: "risk",
      testId: "insight-lowest-risk",
      icon: <Shield className="w-4 h-4 text-amber-600" />,
      iconBg: "bg-amber-500/10",
      label: "Lowest Risk",
      name: insights.lowestRisk.name,
      nameTestId: "text-insight-risk-name",
      value: `LTV ${Number(insights.lowestRisk.purchasePrice) > 0
        ? (((Number(insights.lowestRisk.purchasePrice) - Number(insights.lowestRisk.downPayment)) / Number(insights.lowestRisk.purchasePrice)) * 100).toFixed(0)
        : 0}%`,
      valueColor: "text-amber-600",
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4" data-testid="insights-grid">
      {insightCards.map(card => (
        <Card
          key={card.key}
          data-testid={card.testId}
          className={`cursor-pointer transition-all ${selectedInsight === card.key ? "ring-2 ring-primary shadow-md" : "hover:shadow-xs"}`}
          onClick={() => onSelectInsight(card.key)}
        >
          <CardContent className="py-4 flex items-start gap-3">
            <div className={`rounded-md ${card.iconBg} p-2 shrink-0`}>
              {card.icon}
            </div>
            <div className="min-w-0">
              <p className="text-xs text-muted-foreground uppercase tracking-wide">{card.label}</p>
              <p className="font-bold truncate" data-testid={card.nameTestId}>{card.name}</p>
              <p className={`text-sm font-medium ${card.valueColor}`}>{card.value}</p>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
