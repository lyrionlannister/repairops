import type { InventoryItem } from "../types/inventory";

export interface InventoryItemSelectProps {
  value: string;
  onSelect: (item: InventoryItem | null) => void;
  branchId?: string | null;
  blockOutOfStock?: boolean;
  getLabel?: (item: InventoryItem) => string;
  placeholder?: string;
  disabled?: boolean;
  ariaLabel?: string;
}
