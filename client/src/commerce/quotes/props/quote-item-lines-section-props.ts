import type { InventoryItem } from "@commerce/inventory/types/inventory";
import type { QuoteItemLine } from "../types/quote-item-lines";

export interface QuoteItemLinesSectionProps {
  itemLines: QuoteItemLine[];
  branchId: string | null;
  saving: boolean;
  onInventoryItemChange: (index: number, item: InventoryItem | null) => void;
  onLineChange: (index: number, patch: Partial<QuoteItemLine>) => void;
  onAddLine: () => void;
  onRemoveLine: (index: number) => void;
}
