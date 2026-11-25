import type { Sale } from "../types/sales";

export interface SalesTableProps {
  error?: string | null;
  onRetry?: () => void;
  loading: boolean;
  hasFilters: boolean;
  pageItems: Sale[];
  page: number;
  pageSize: number;
  totalPages: number;
  totalItems: number;
  startIndex: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
}
