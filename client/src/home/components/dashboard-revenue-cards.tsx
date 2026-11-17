import type { FC } from "react";
import { CalendarDays, CalendarRange, Banknote } from "lucide-react";
import type { Trend } from "../hooks/use-dashboard-page";
import { StatCard } from "./stat-card";
import { formatMoney } from "../utils/format";

interface DashboardRevenueCardsProps {
  monthlyRevenue: string;
  weeklyRevenue: string;
  todayRevenue: string;
  monthDelta: Trend | null;
  todayDelta: Trend | null;
}

export const DashboardRevenueCards: FC<DashboardRevenueCardsProps> = ({
  monthlyRevenue,
  weeklyRevenue,
  todayRevenue,
  monthDelta,
  todayDelta,
}) => (
  <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 md:gap-6">
    <StatCard
      icon={<Banknote />}
      iconTone="bg-brand-50 text-brand-600 dark:bg-brand-500/10 dark:text-brand-400"
      label="Ventas del mes"
      value={formatMoney(monthlyRevenue)}
      trend={monthDelta}
    />
    <StatCard
      icon={<CalendarRange />}
      iconTone="bg-teal-50 text-teal-600 dark:bg-teal-500/10 dark:text-teal-400"
      label="Ventas de la semana"
      value={formatMoney(weeklyRevenue)}
    />
    <StatCard
      icon={<CalendarDays />}
      iconTone="bg-violet-50 text-violet-600 dark:bg-violet-500/10 dark:text-violet-400"
      label="Ingreso del día"
      value={formatMoney(todayRevenue)}
      trend={todayDelta}
    />
  </div>
);
