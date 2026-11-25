export interface InventoryCountItemRecord {
  id: string;
  inventoryItemId: string;
  itemName?: string | null;
  itemSku?: string | null;
  countedQuantity: number | null;
  reason: string | null;
  appliedMovementId: string | null;
}

export interface InventoryCountRecord {
  id: string;
  countNumber: number;
  branchId: string;
  status: InventoryCountStatus;
  openedAt: string;
  closedAt: string | null;
  items?: InventoryCountItemRecord[];
}

export type InventoryCountStatus = "open" | "closed";
