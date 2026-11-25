export interface InventoryCriticalItem {
  id: string;
  name: string;
  quantityOnHand: number;
}

export interface InventoryStats {
  skuCount: number;
  stockValueAtCost: string;
  criticalCount: number;
  criticalItems: InventoryCriticalItem[];
}

export interface SaleStats {
  count: number;
  total: string;
}
