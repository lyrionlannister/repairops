import { useMemo } from "react";
import { useApiResource } from "@common/hooks/use-api-resource";
import type { PageResponse } from "@common/types/server-list";
import type { InventoryItem, InventoryMovement } from "../types/inventory";

const MOVEMENTS_SHOWN = 20;

export const useInventoryItemContext = (itemId: string | null) => {
  const id = itemId ? encodeURIComponent(itemId) : null;
  const item = useApiResource<InventoryItem>(id && `/inventory/${id}`);
  const movements = useApiResource<PageResponse<InventoryMovement>>(
    id && `/inventory/${id}/movements?page=1&pageSize=${MOVEMENTS_SHOWN}`,
  );

  const currentItem = item.data ?? undefined;

  const marginPercent = useMemo(() => {
    if (!currentItem?.supplierId || Number(currentItem.costPrice) <= 0) return null;
    return ((Number(currentItem.salePrice) - Number(currentItem.costPrice)) / Number(currentItem.costPrice)) * 100;
  }, [currentItem]);

  return {
    movements: movements.data?.items ?? [],
    movementsTotal: movements.data?.total ?? 0,
    currentItem,
    marginPercent,
  };
};
