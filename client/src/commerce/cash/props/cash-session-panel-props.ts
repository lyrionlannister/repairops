import type { CashMovementRecord, CashSessionRecord, CashSummary } from "../types/cash";

export interface CashSessionPanelProps {
  session: CashSessionRecord;
  summary: CashSummary | null;
  movements: CashMovementRecord[];
  pageItems: CashMovementRecord[];
  page: number;
  pageSize: number;
  totalPages: number;
  totalItems: number;
  startIndex: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
  onOpenMovement: () => void;
  onOpenClose: () => void;
}
