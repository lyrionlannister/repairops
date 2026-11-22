import type { InventoryItem } from "../types/inventory";
import type { SaleLineItem } from "../types/sale-cart";

export interface SaleCartLinesSectionProps {
  lines: SaleLineItem[];
  inventoryItems: InventoryItem[];
  onItemChange: (index: number, inventoryItemId: string) => void;
  onLineChange: (index: number, patch: Partial<SaleLineItem>) => void;
  onAddLine: () => void;
  onRemoveLine: (index: number) => void;
}
