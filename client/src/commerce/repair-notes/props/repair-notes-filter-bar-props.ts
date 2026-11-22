import type { RepairNoteStatus } from "../types/repair-notes";

export interface RepairNotesFilterBarProps {
  search: string;
  onSearchChange: (value: string) => void;
  statusFilter: RepairNoteStatus | "all";
  onStatusFilterChange: (value: RepairNoteStatus | "all") => void;
}
