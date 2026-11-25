export interface InventoryTransferItemRef {
  name: string;
  localId: string;
}

export interface InventoryTransfer {
  id: string;
  fromInventoryItemId: string;
  toInventoryItemId: string;
  fromItem?: InventoryTransferItemRef | null;
  toItem?: InventoryTransferItemRef | null;
  quantity: number;
  reason: string | null;
  createdAt: string;
}

export interface CreateInventoryTransferPayload {
  fromInventoryItemId: string;
  toInventoryItemId: string;
  quantity: number;
  reason?: string;
}
