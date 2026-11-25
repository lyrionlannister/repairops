import type { InventoryItem } from "../types/inventory";
import type { InventoryTransferItemRef } from "../types/inventory-transfers";
import type { Branch } from "@identity/branches/types/branches";

export const useInventoryTransferLabels = (branches: Branch[]) => {
  const branchName = (branchId: string) =>
    branches.find((b) => b.id === branchId)?.name ?? "Sucursal sin nombre";

  const itemLabel = (item: InventoryItem) =>
    `${item.name} (${branchName(item.localId)}, existencia: ${item.quantityOnHand})`;

  const refLabel = (ref: InventoryTransferItemRef | null | undefined) =>
    ref ? `${ref.name} (${branchName(ref.localId)})` : "Producto eliminado";

  return { branchName, itemLabel, refLabel };
};
