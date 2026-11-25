export interface InventoryFilters {
  branchId: string | null;
  supplierId?: string;
  criticalOnly?: boolean;
  search?: string;
}

import type { InventoryItem } from "../entities/inventory-item.entity.js";

// Entidad parcial (no objeto plano): asi la frontera HTTP sabe traducir su id a public_id.
export type InventoryCriticalItem = Pick<InventoryItem, "id" | "publicId" | "name" | "quantityOnHand">;

export interface InventoryStats {
  skuCount: number;
  stockValueAtCost: string;
  criticalCount: number;
  criticalItems: InventoryCriticalItem[];
}
