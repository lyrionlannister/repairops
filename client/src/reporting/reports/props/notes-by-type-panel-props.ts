import type { RepairNotesByTypeReport } from "../types/reports";

export interface NotesByTypePanelProps {
  report: RepairNotesByTypeReport | null;
  currency: string;
}
