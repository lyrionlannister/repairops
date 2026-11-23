import type { ReactNode } from "react";
import type { RepairNoteRecord } from "../types/repair-notes";
import type { DetailItemLine } from "../types/repair-note-detail";

export interface RepairNoteDetailSummaryProps {
  note: RepairNoteRecord;
  technicianName: string | null;
  serviceTypeNames: string[][];
  itemLines: DetailItemLine[];
  actions: ReactNode;
}
