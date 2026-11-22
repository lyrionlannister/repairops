import type { CashCut } from "../types/cash";

export interface CutHistoryTableProps {
  cuts: CashCut[];
  onView: (id: string) => void;
}
