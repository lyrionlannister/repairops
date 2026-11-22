import type { InventoryItem } from "@commerce/inventory/types/inventory";
import type { QuoteItemLine } from "../types/quote-item-lines";

export interface QuoteItemLinesSectionProps {
  itemLines: QuoteItemLine[];
  inventoryItems: InventoryItem[];
  saving: boolean;
  onInventoryItemChange: (index: number, inventoryItemId: string) => void;
  onLineChange: (index: number, patch: Partial<QuoteItemLine>) => void;
  onAddLine: () => void;
  onRemoveLine: (index: number) => void;
}
