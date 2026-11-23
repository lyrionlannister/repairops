import type { RevenueByPlanRow } from "../types/billing-overview";

export interface BillingRevenueChartProps {
  rows: RevenueByPlanRow[];
  days: number;
}
