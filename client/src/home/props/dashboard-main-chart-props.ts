import type { BusinessSeriesPoint } from "../types/dashboard-page";

export interface DashboardMainChartProps {
  dailyBusinessSeries: BusinessSeriesPoint[];
  dailyBusinessCategories: string[];
  currencyFormatter: Intl.NumberFormat;
}
