import type { CashBreakdownRow } from "../types/cash-page";

export interface CashBreakdownCardProps {
  title: string;
  subtitle: string;
  rows: CashBreakdownRow[];
  emptyText: string;
}
