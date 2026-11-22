import type { CashSummary } from "../types/cash";

export interface CashKpiRowProps {
  openingBalance: number | string;
  summary: CashSummary | null;
}
