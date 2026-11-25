import { useApiResource } from "@common/hooks/use-api-resource";
import type { InventoryStats } from "../../inventory/types/inventory-stats";
import type { SupplierCriticalItem } from "../types/supplier-context";

export const useSupplierContext = (supplierId: string | null) => {
  const { data } = useApiResource<InventoryStats>(
    supplierId ? `/inventory/stats?supplierId=${encodeURIComponent(supplierId)}` : null,
  );

  const criticalItems: SupplierCriticalItem[] = data?.criticalItems ?? [];

  return {
    skuCount: data?.skuCount ?? 0,
    stockValueAtCost: Number(data?.stockValueAtCost ?? 0),
    criticalCount: data?.criticalCount ?? 0,
    criticalItems,
  };
};
