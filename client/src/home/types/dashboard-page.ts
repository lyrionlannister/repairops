import type { OverdueLevel } from "@commerce/customers/types/customers";

export interface SummaryResponse {
  counts: { openRepairNotes: number; criticalStockItems: number; openCashSessions: number; onlineUsers: number };
  chat: { todayCount: number; weekCount: number; lastAt: string | null };
  activity: Array<{ id: string; kind: ActivityItem["kind"]; title: string; subtitle: string; amount?: string; occurredAt: string }>;
  money?: {
    today: string;
    week: string;
    month: string;
    salesToday: string;
    todayTrend: Trend | null;
    monthTrend: Trend | null;
    credit: CreditPortfolio;
  };
}

export interface CreditPortfolio {
  balance: string;
  overdue: string;
  overdueLevel: OverdueLevel;
  customersWithDebt: number;
  overdueCustomers: number;
}

export interface SeriesResponse {
  chat: Point[];
  business?: Array<{ bucket: string; sales: string; repairs: string }>;
}

export type Point = { bucket: string; count: number };

export type Trend = { pct: number; up: boolean };

export type BusinessSeriesPoint = { bucket: string; sales: number; repairs: number };

export type ActivityItem = {
  id: string;
  kind: "sale" | "repair" | "other";
  title: string;
  subtitle: string;
  // Solo owner: el API no manda importes a los demás roles.
  amount?: string;
  date: string;
};
