import type { Sale } from "../types/sales";

export interface SalesTableProps {
  loading: boolean;
  sales: Sale[];
  filteredSales: Sale[];
  pageItems: Sale[];
  page: number;
  pageSize: number;
  totalPages: number;
  totalItems: number;
  startIndex: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
}
