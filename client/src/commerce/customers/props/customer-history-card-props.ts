import type { RepairNoteRecord } from "@commerce/repair-notes/types/repair-notes";
import type { Sale } from "@commerce/inventory/types/sales";
import type { LayawayRecord } from "../types/layaways";

export interface CustomerHistoryCardProps {
  notes: RepairNoteRecord[];
  sales: Sale[];
  layaways: LayawayRecord[];
}
