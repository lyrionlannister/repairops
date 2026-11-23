import { useMemo, useState } from "react";
import { useSearchParams } from "react-router";
import { isCriticalStock } from "../utils/stock";
import type { InventoryItem } from "../types/inventory";

export const useCriticalStockFilter = (items: InventoryItem[]) => {
  const [searchParams] = useSearchParams();
  const [criticalOnly, setCriticalOnly] = useState(() => searchParams.get("stock") === "critical");
  const visibleItems = useMemo(
    () => (criticalOnly ? items.filter(isCriticalStock) : items),
    [items, criticalOnly],
  );
  return { criticalOnly, setCriticalOnly, visibleItems };
};
