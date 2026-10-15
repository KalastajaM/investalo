import { Link } from "wouter";
import { Edit, Trash2, Copy, TrendingUp, ArrowUp, ArrowDown, ChevronDown, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import type { MarketConfig } from "@/lib/market-configs";
import type { PropertySimulation } from "./types";

interface PropertyCardItemProps {
  sim: PropertySimulation;
  idx: number;
  groupLength: number;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onDuplicate: () => void;
  fmt: (v: number) => string;
  currencySymbol: string;
  marketConfig: MarketConfig;
}

export function PropertyCardItem({
  sim,
  idx,
  groupLength,
  isCollapsed,
  onToggleCollapse,
  onMoveUp,
  onMoveDown,
  onEdit,
  onDelete,
  onDuplicate,
  fmt,
  currencySymbol,
  marketConfig,
}: PropertyCardItemProps) {
  return (
    <Card className="group/card relative">
      <div className="flex items-center gap-2 px-4 pt-3 pb-1 group/header">
        <button
          onClick={onToggleCollapse}
          className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground transition-colors"
          data-testid={`button-toggle-card-${sim.id}`}
        >
          {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>
        <div className="flex-1 min-w-0 flex items-center gap-3">
          <span className="font-semibold truncate">{sim.name}</span>
          <span className="text-xs text-muted-foreground hidden sm:inline">
            {sim.city}, {sim.area} · {sim.sizeM2}m²{sim.rooms ? ` · ${sim.rooms}` : ""}
          </span>
        </div>
        <span className={`text-lg font-bold shrink-0 ${sim.roiPercent >= 0 ? 'text-green-600' : 'text-destructive'}`}>
          {sim.roiPercent.toFixed(1)}% <span className="text-xs text-muted-foreground font-semibold">ROI</span>
        </span>
        <div className="flex gap-0.5 opacity-0 group-hover/header:opacity-100 transition-opacity ml-2">
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            onClick={onMoveUp}
            disabled={idx === 0}
            title="Move up"
            data-testid={`button-card-up-${sim.id}`}
          >
            <ArrowUp className="w-3 h-3" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            onClick={onMoveDown}
            disabled={idx === groupLength - 1}
            title="Move down"
            data-testid={`button-card-down-${sim.id}`}
          >
            <ArrowDown className="w-3 h-3" />
          </Button>
        </div>
      </div>

      {!isCollapsed && (
        <>
          <CardContent className="space-y-4 pt-2">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground text-xs uppercase">Purchase</p>
                <p className="font-medium">{fmt(parseInt(sim.purchasePrice))}</p>
              </div>
              <div>
                <p className="text-muted-foreground text-xs uppercase">Rent</p>
                <p className="font-medium">{Math.round(parseFloat(sim.rentPerMonth)).toLocaleString(marketConfig.locale)} {currencySymbol}/mo</p>
              </div>
              <div>
                <p className="text-muted-foreground text-xs uppercase">Monthly CF (Yr 1)</p>
                <p className={`font-medium ${sim.years[0].cashFlow / 12 >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                  {Math.round(sim.years[0].cashFlow / 12).toLocaleString(marketConfig.locale)} {currencySymbol}/mo
                </p>
              </div>
              <div>
                <p className="text-muted-foreground text-xs uppercase">Profit if Sold</p>
                <p className="font-medium text-primary">
                  {fmt(sim.years[sim.years.length - 1].totalProfitIfSold)}
                </p>
              </div>
            </div>
          </CardContent>

          <CardFooter className="pt-2 flex justify-between border-t">
            <Link href={`/property/${sim.id}`} className="flex-1">
              <Button variant="ghost" className="w-full justify-start pl-0" data-testid={`button-view-${sim.id}`}>
                View Analysis <TrendingUp className="w-4 h-4 ml-2" />
              </Button>
            </Link>
            <div className="flex gap-1">
              <Button variant="ghost" size="icon" onClick={onDuplicate} title="Duplicate property" data-testid={`button-duplicate-${sim.id}`}>
                <Copy className="w-4 h-4" />
              </Button>
              <Button variant="ghost" size="icon" onClick={onEdit} data-testid={`button-edit-${sim.id}`}>
                <Edit className="w-4 h-4" />
              </Button>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="ghost" size="icon" data-testid={`button-delete-${sim.id}`}>
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete Property?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This will permanently remove <strong>{sim.name}</strong> from your portfolio.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={onDelete} className="bg-destructive text-destructive-foreground">
                      Delete
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </CardFooter>
        </>
      )}
    </Card>
  );
}
