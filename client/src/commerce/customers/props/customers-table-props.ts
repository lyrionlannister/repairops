import type { Customer } from "../types/customers";

export interface CustomersTableProps {
  loading: boolean;
  pageItems: Customer[];
  page: number;
  pageSize: number;
  totalPages: number;
  totalItems: number;
  startIndex: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
  onOpenHistory: (customer: Customer) => void;
  onRequestDelete: (id: string) => void;
  canEdit: boolean;
  canDelete: boolean;
}
