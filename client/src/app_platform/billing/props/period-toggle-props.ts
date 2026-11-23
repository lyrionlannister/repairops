import type { DashboardPeriodDays } from "../types/billing-overview";

export interface PeriodToggleProps {
  value: DashboardPeriodDays;
  disabled?: boolean;
  onChange: (days: DashboardPeriodDays) => void;
}
