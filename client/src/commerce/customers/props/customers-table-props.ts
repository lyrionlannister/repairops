import type { Customer } from "../types/customers";

export interface CustomersTableProps {
  error?: string | null;
  onRetry?: () => void;
  loading: boolean;
  hasFilters: boolean;
  pageItems: Customer[];
  page: number;
  pageSize: number;
  totalPages: number;
  totalItems: number;
  startIndex: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
  onRequestDelete: (id: string) => void;
  canEdit: boolean;
  canDelete: boolean;
}
