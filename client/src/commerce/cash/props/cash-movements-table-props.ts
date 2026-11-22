import type { CashMovementFilters, CashMovementRow } from "../types/cash-page";

export interface CashMovementsTableProps {
  rows: CashMovementRow[];
  pageItems: CashMovementRow[];
  totalMovements: number;
  filters: CashMovementFilters;
  hasFilters: boolean;
  page: number;
  pageSize: number;
  totalPages: number;
  totalItems: number;
  startIndex: number;
  onFilterChange: (key: keyof CashMovementFilters, value: string) => void;
  onClearFilters: () => void;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
  onRegisterIncome: () => void;
}
