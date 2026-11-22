import type { Trend } from "../types/dashboard-page";

export interface DashboardRevenueCardsProps {
  monthlyRevenue: string;
  weeklyRevenue: string;
  todayRevenue: string;
  monthDelta: Trend | null;
  todayDelta: Trend | null;
}
