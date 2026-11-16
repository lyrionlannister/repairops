import { useEffect, useMemo } from "react";
import { useInventory } from "../../inventory/hooks/use-inventory";

export interface SupplierCriticalItem {
  id: string;
  name: string;
  quantityOnHand: number;
}

export const useSupplierContext = (supplierId: string | null) => {
  const { items, fetchAll } = useInventory();

  useEffect(() => {
    if (supplierId !== null) fetchAll();
  }, [supplierId, fetchAll]);

  const supplierItems = useMemo(
    () => items.filter((i) => i.supplierId === supplierId),
    [items, supplierId],
  );

  const skuCount = supplierItems.length;

  const stockValueAtCost = useMemo(
    () => supplierItems.reduce((sum, i) => sum + i.quantityOnHand * i.costPrice, 0),
    [supplierItems],
  );

  const criticalItems: SupplierCriticalItem[] = useMemo(
    () =>
      supplierItems
        .filter((i) => i.quantityOnHand <= i.minStock)
        .map((i) => ({ id: i.id, name: i.name, quantityOnHand: i.quantityOnHand })),
    [supplierItems],
  );

  return { skuCount, stockValueAtCost, criticalItems };
};
