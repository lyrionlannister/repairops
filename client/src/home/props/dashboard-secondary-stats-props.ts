import type { CreditPortfolio } from "../types/dashboard-page";

export interface DashboardSecondaryStatsProps {
  openRepairNotes: number;
  criticalStockItems: number;
  openCashSessions: number;
  onlineUsers: number;
  credit: CreditPortfolio | null;
}
