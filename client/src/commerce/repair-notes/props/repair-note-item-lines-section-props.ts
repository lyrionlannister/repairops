import type { InventoryItem } from "@commerce/inventory/types/inventory";
import type { RepairNoteItemLine } from "../types/repair-note-item-lines";

export interface RepairNoteItemLinesSectionProps {
  itemLines: RepairNoteItemLine[];
  inventoryItems: InventoryItem[];
  saving: boolean;
  onItemChange: (index: number, inventoryItemId: string) => void;
  onLineChange: (index: number, patch: Partial<RepairNoteItemLine>) => void;
  onAddLine: () => void;
  onRemoveLine: (index: number) => void;
}
