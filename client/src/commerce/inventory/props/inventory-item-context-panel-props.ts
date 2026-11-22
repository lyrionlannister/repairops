import type { InventoryMovement } from "../types/inventory";

export interface InventoryItemContextPanelProps {
  movements: InventoryMovement[];
  marginPercent: number | null;
}
