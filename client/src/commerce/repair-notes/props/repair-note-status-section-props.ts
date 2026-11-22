import type { RepairNoteStatus } from "../types/repair-notes";

export interface RepairNoteStatusSectionProps {
  status: RepairNoteStatus;
  saving: boolean;
  onStatusChange: (status: RepairNoteStatus) => void;
}
