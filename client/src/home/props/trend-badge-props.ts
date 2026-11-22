import type { Trend } from "../types/dashboard-page";

export interface TrendBadgeProps {
  trend: Trend | null;
  inverted?: boolean;
}
