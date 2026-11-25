import type { InventoryItem } from "../entities/inventory-item.entity.js";
import type { InventoryTransfer } from "../entities/inventory-transfer.entity.js";

export type InventoryTransferItemRef = Pick<InventoryItem, "name" | "localId">;

export type InventoryTransferListRow = Omit<InventoryTransfer, "fromItem" | "toItem"> & {
  fromItem: InventoryTransferItemRef | null;
  toItem: InventoryTransferItemRef | null;
};
