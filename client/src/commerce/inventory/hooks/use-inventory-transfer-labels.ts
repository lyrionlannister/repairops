import type { InventoryItem } from "../types/inventory";
import type { Branch } from "@identity/branches/types/branches";

export const useInventoryTransferLabels = (items: InventoryItem[], branches: Branch[]) => {
  const branchName = (branchId: string) => branches.find((b) => b.id === branchId)?.name ?? `Sucursal ${branchId}`;

  const itemLabel = (item: InventoryItem) =>
    `${item.name} (${branchName(item.localId)}, stock: ${item.quantityOnHand})`;

  const itemNameById = (itemId: string) => {
    const item = items.find((i) => i.id === itemId);
    return item ? `${item.name} (${branchName(item.localId)})` : `Item ${itemId}`;
  };

  return { branchName, itemLabel, itemNameById };
};
