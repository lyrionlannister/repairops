import type { InventoryItem } from "../types/inventory";
import type { SaleLineItem } from "../types/sale-cart";

export interface SaleCartLinesSectionProps {
  lines: SaleLineItem[];
  branchId: string | null;
  onItemChange: (index: number, item: InventoryItem | null) => void;
  onLineChange: (index: number, patch: Partial<SaleLineItem>) => void;
  onAddLine: () => void;
  onRemoveLine: (index: number) => void;
}
