import type { QuoteListItem } from "../types/quotes-page";

export interface QuotesTableProps {
  loading: boolean;
  quotes: QuoteListItem[];
  filteredQuotes: QuoteListItem[];
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
