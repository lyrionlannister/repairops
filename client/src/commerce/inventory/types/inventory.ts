export interface InventoryItem {
  id: string;
  localId: string;
  name: string;
  sku: string | null;
  kind: InventoryItemKind;
  costPrice: number;
  salePrice: number;
  supplierId: string | null;
  quantityOnHand: number;
  minStock: number;
  // Fase 5, Pieza 3: quantityOnHand menos reservas activas (refacciones ya
  // comprometidas en notas de reparación que aún no se completan).
  available: number;
  createdAt: string;
  updatedAt: string;
}

export interface InventoryMovement {
  id: string;
  inventoryItemId: string;
  type: "in" | "out" | "adjustment";
  quantity: number;
  reason: string | null;
  relatedEntityType: "sale" | "repair_note" | "return" | "transfer" | "count" | "manual";
  createdByEmployeeId: string | null;
  createdAt: string;
}

export interface InventoryItemFormData {
  name: string;
  sku: string;
  kind: InventoryItemKind;
  costPrice: string;
  salePrice: string;
  minStock: string;
  supplierId: string;
}

export type InventoryItemKind = "accessory" | "part";

export type CreateItemPayload = Omit<
  InventoryItem,
  "id" | "quantityOnHand" | "available" | "createdAt" | "updatedAt"
>;
