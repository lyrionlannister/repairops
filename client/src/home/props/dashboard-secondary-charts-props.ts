import type { Point } from "../types/dashboard-page";

export interface DashboardSecondaryChartsProps {
  daily: Point[];
  monthly: Point[];
  dailyCategories: string[];
  monthLabels: string[];
  year: number;
  // null cuando el rol no ve importes: la gráfica de dinero no se pinta.
  monthlyBusinessSeries: { salesData: number[]; repairsData: number[] } | null;
  currencyFormatter: Intl.NumberFormat;
}
