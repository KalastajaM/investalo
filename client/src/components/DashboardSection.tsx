import type { ReactNode } from "react";
import { ChevronDown, ChevronRight, ArrowUp, ArrowDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

interface DashboardSectionProps {
  id: string;
  title: string;
  icon?: ReactNode;
  description?: string;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  onMoveUp?: () => void;
  onMoveDown?: () => void;
  isFirst: boolean;
  isLast: boolean;
  children: ReactNode;
  headerRight?: ReactNode;
}

export function DashboardSection({
  title,
  icon,
  description,
  isCollapsed,
  onToggleCollapse,
  onMoveUp,
  onMoveDown,
  isFirst,
  isLast,
  children,
  headerRight,
}: DashboardSectionProps) {
  return (
    <Collapsible open={!isCollapsed} onOpenChange={() => onToggleCollapse()} className="mb-6">
      <div className="flex items-center gap-2 group mb-2">
        <CollapsibleTrigger asChild>
          <Button variant="ghost" size="sm" className="h-8 px-2 gap-1.5 text-muted-foreground hover:text-foreground">
            {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            <span className="flex items-center gap-2 font-semibold text-sm">
              {icon}
              {title}
            </span>
          </Button>
        </CollapsibleTrigger>
        {description && !isCollapsed && (
          <span className="text-xs text-muted-foreground hidden sm:inline">{description}</span>
        )}
        <div className="flex-1" />
        {headerRight}
        <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            onClick={onMoveUp}
            disabled={isFirst}
            title="Move up"
          >
            <ArrowUp className="w-3 h-3" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            onClick={onMoveDown}
            disabled={isLast}
            title="Move down"
          >
            <ArrowDown className="w-3 h-3" />
          </Button>
        </div>
      </div>
      <CollapsibleContent>
        {children}
      </CollapsibleContent>
    </Collapsible>
  );
}
