import type { RepairNoteStatus } from "./repair-notes";

export type RepairNoteHistoryEntry = {
  id: string;
  devicesLabel: string;
  status: RepairNoteStatus;
  totalValue: number;
  receivedAt: string;
};
