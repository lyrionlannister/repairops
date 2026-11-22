import type { QuoteStatus } from "../types/quotes";

export interface QuotesFilterBarProps {
  search: string;
  onSearchChange: (value: string) => void;
  statusFilter: QuoteStatus | "all";
  onStatusFilterChange: (value: QuoteStatus | "all") => void;
}
