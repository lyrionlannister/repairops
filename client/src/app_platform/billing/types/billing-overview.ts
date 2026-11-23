import type { SubscriptionStatus } from "./plan";

export type DashboardPeriodDays = 7 | 30 | 90;

export type Trend = { pct: number; up: boolean };

export interface RevenueByPlanRow {
  planKey: string;
  billingInterval: "month" | "year";
  total: string;
}

export interface RecentPayment {
  tenantName: string;
  planKey: string;
  billingInterval: string;
  amount: string;
  currency: string;
  paidAt: string;
}

export interface WhatsappCostByTenant {
  tenantName: string;
  messageCount: number;
  totalCostUsd: string;
}

export interface ActivityItem {
  kind: "signup" | "payment" | "cancellation";
  tenantName: string;
  amount?: string;
  occurredAt: string;
}

export interface BillingOverview {
  days: DashboardPeriodDays;
  revenue: string;
  revenueTrend: Trend | null;
  newTenants: number;
  newTenantsTrend: Trend | null;
  whatsappCostTotal: string;
  whatsappCostTrend: Trend | null;
  canceledTenants: number;
  canceledTenantsTrend: Trend | null;
  subscriptionsByStatus: Partial<Record<SubscriptionStatus, number>>;
  revenueByPlan: RevenueByPlanRow[];
  recentPayments: RecentPayment[];
  whatsappCostByTenant: WhatsappCostByTenant[];
  recentActivity: ActivityItem[];
}
