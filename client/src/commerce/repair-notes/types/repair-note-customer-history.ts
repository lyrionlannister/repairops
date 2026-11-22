import type { RepairNoteStatus } from "./repair-notes";

export type RepairNoteHistoryEntry = {
  id: string;
  brand: string;
  model: string;
  status: RepairNoteStatus;
  totalValue: number;
  receivedAt: string;
};
