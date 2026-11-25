import type { QuoteListItem } from "../types/quotes-page";

export interface QuotesTableProps {
  error?: string | null;
  onRetry?: () => void;
  loading: boolean;
  hasFilters: boolean;
  pageItems: QuoteListItem[];
  deletingId: string | null;
  page: number;
  pageSize: number;
  totalPages: number;
  totalItems: number;
  startIndex: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
  onStatusChange: (id: string, status: "accepted" | "rejected") => void;
  onRequestDelete: (id: string) => void;
  canEdit: boolean;
  canDelete: boolean;
}
