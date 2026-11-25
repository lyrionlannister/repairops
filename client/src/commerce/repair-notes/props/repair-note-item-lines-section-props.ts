import type { InventoryItem } from "@commerce/inventory/types/inventory";
import type { RepairNoteItemLine } from "../types/repair-note-item-lines";

export interface RepairNoteItemLinesSectionProps {
  itemLines: RepairNoteItemLine[];
  branchId: string | null;
  saving: boolean;
  onItemChange: (index: number, item: InventoryItem | null) => void;
  onLineChange: (index: number, patch: Partial<RepairNoteItemLine>) => void;
  onAddLine: () => void;
  onRemoveLine: (index: number) => void;
}
