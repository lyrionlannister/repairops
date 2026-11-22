export interface InventoryCountItemRecord {
  id: string;
  inventoryItemId: string;
  countedQuantity: number | null;
  reason: string | null;
  appliedMovementId: string | null;
}

export interface InventoryCountRecord {
  id: string;
  branchId: string;
  status: InventoryCountStatus;
  openedAt: string;
  closedAt: string | null;
  items?: InventoryCountItemRecord[];
}

export type InventoryCountStatus = "open" | "closed";
