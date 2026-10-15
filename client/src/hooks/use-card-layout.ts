import { useState, useCallback } from "react";

interface CardLayoutState {
  order: number[];
  collapsed: Record<number, boolean>;
}

const STORAGE_KEY = "dashboardCardLayout.v1";

function loadCardLayout(): CardLayoutState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { order: [], collapsed: {} };
    return JSON.parse(raw) as CardLayoutState;
  } catch {
    return { order: [], collapsed: {} };
  }
}

function saveCardLayout(state: CardLayoutState) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {}
}

export function useCardLayout(propertyIds: number[]) {
  const [layout, setLayout] = useState<CardLayoutState>(loadCardLayout);

  const orderedIds = (() => {
    const validSaved = layout.order.filter(id => propertyIds.includes(id));
    const missing = propertyIds.filter(id => !validSaved.includes(id));
    return [...validSaved, ...missing];
  })();

  const isCollapsed = useCallback((id: number) => !!layout.collapsed[id], [layout.collapsed]);

  const toggleCollapsed = useCallback((id: number) => {
    setLayout(prev => {
      const next = {
        ...prev,
        collapsed: { ...prev.collapsed, [id]: !prev.collapsed[id] },
      };
      saveCardLayout(next);
      return next;
    });
  }, []);

  const moveCard = useCallback((id: number, direction: "up" | "down") => {
    setLayout(prev => {
      const validSaved = prev.order.filter(pid => propertyIds.includes(pid));
      const missing = propertyIds.filter(pid => !validSaved.includes(pid));
      const currentOrder = [...validSaved, ...missing];

      const idx = currentOrder.indexOf(id);
      if (idx === -1) return prev;
      const targetIdx = direction === "up" ? idx - 1 : idx + 1;
      if (targetIdx < 0 || targetIdx >= currentOrder.length) return prev;
      [currentOrder[idx], currentOrder[targetIdx]] = [currentOrder[targetIdx], currentOrder[idx]];
      const next = { ...prev, order: currentOrder };
      saveCardLayout(next);
      return next;
    });
  }, [propertyIds]);

  const resetCardLayout = useCallback(() => {
    const next: CardLayoutState = { order: [], collapsed: {} };
    saveCardLayout(next);
    setLayout(next);
  }, []);

  return { orderedIds, isCollapsed, toggleCollapsed, moveCard, resetCardLayout };
}
