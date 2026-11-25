import type { RepairNoteRecord } from "../types/repair-notes";

export interface RepairNotesTableProps {
  loading: boolean;
  error: string | null;
  hasFilters: boolean;
  pageItems: RepairNoteRecord[];
  canEditNotes: boolean;
  canCreateNotes: boolean;
  canCancelNotes: boolean;
  canDeleteNotes: boolean;
  cancellingId: string | null;
  deletingId: string | null;
  page: number;
  pageSize: number;
  totalPages: number;
  totalItems: number;
  startIndex: number;
  onRetry: () => void;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
  onRequestCancel: (id: string) => void;
  onRequestDelete: (id: string) => void;
  advancingId: string | null;
  onAdvance: (note: RepairNoteRecord) => void;
}
