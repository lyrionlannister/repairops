import type { DataTablePagination } from "@common/types/data-table";
import type { CashCut } from "../types/cash";

export interface CutHistoryTableProps {
  cuts: CashCut[];
  loading: boolean;
  error: string | null;
  onRetry: () => void;
  pagination: DataTablePagination;
  onView: (id: string) => void;
}
