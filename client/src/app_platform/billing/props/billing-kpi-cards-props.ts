import type { Trend } from "../types/billing-overview";

export interface BillingKpiCardsProps {
  revenue: string;
  revenueTrend: Trend | null;
  newTenants: number;
  newTenantsTrend: Trend | null;
  whatsappCostTotal: string;
  whatsappCostTrend: Trend | null;
  canceledTenants: number;
  canceledTenantsTrend: Trend | null;
}
