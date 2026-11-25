import type { AccessorySalesReport } from "../types/reports";

export interface CounterSalesPanelProps {
  report: AccessorySalesReport | null;
  currency: string;
}
