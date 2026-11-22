import type { RepairNoteStatus } from "./repair-notes";

export interface HistoryEntry {
  id: string;
  brand: string;
  model: string;
  status: RepairNoteStatus;
  totalValue: number;
  receivedAt: string;
}
