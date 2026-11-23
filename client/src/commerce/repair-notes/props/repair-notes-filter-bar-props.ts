import type { RepairNoteStatusFilter } from "../types/repair-notes";

export interface RepairNotesFilterBarProps {
  search: string;
  onSearchChange: (value: string) => void;
  statusFilter: RepairNoteStatusFilter;
  onStatusFilterChange: (value: RepairNoteStatusFilter) => void;
}
