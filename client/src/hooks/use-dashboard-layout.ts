import { useState, useCallback } from "react";

export interface DashboardSection {
  id: string;
  label: string;
  icon?: string;
}

export const DASHBOARD_SECTIONS: DashboardSection[] = [
  { id: "selection", label: "Property Selection" },
  { id: "charts", label: "Comparison Charts" },
  { id: "insights", label: "Quick Insights" },
  { id: "sensitivity", label: "Sensitivity Analysis" },
  { id: "map", label: "Property Locations" },
  { id: "projects", label: "Property Cards" },
];

const DEFAULT_ORDER = DASHBOARD_SECTIONS.map(s => s.id);

interface LayoutState {
  order: string[];
  collapsed: Record<string, boolean>;
}

const STORAGE_KEY = "dashboardLayout.v2";

function loadLayout(): LayoutState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { order: DEFAULT_ORDER, collapsed: { projects: true } };
    const parsed = JSON.parse(raw) as LayoutState;
    const knownIds = new Set(DEFAULT_ORDER);
    const validOrder = parsed.order.filter(id => knownIds.has(id));
    const missing = DEFAULT_ORDER.filter(id => !validOrder.includes(id));
    return {
      order: [...validOrder, ...missing],
      collapsed: parsed.collapsed || {},
    };
  } catch {
    return { order: DEFAULT_ORDER, collapsed: { projects: true } };
  }
}

function saveLayout(state: LayoutState) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {}
}

export function useDashboardLayout() {
  const [layout, setLayout] = useState<LayoutState>(loadLayout);

  const toggleCollapsed = useCallback((sectionId: string) => {
    setLayout(prev => {
      const next = {
        ...prev,
        collapsed: { ...prev.collapsed, [sectionId]: !prev.collapsed[sectionId] },
      };
      saveLayout(next);
      return next;
    });
  }, []);

  const moveSection = useCallback((sectionId: string, direction: "up" | "down") => {
    setLayout(prev => {
      const idx = prev.order.indexOf(sectionId);
      if (idx === -1) return prev;
      const targetIdx = direction === "up" ? idx - 1 : idx + 1;
      if (targetIdx < 0 || targetIdx >= prev.order.length) return prev;
      const newOrder = [...prev.order];
      [newOrder[idx], newOrder[targetIdx]] = [newOrder[targetIdx], newOrder[idx]];
      const next = { ...prev, order: newOrder };
      saveLayout(next);
      return next;
    });
  }, []);

  const resetLayout = useCallback(() => {
    const next = { order: DEFAULT_ORDER, collapsed: {} };
    saveLayout(next);
    setLayout(next);
  }, []);

  return {
    order: layout.order,
    collapsed: layout.collapsed,
    toggleCollapsed,
    moveSection,
    resetLayout,
  };
}
