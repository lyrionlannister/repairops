
export type InventoryMovementForm = {
  type: "in" | "out" | "adjustment";
  quantity: string;
  reason: string;
  createdByEmployeeId: string;
};
