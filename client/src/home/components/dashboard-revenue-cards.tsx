import type { FC } from "react";
import { Wallet, Banknote } from "lucide-react";
import type { Trend } from "../hooks/use-dashboard-page";
import { TrendBadge } from "./trend-badge";
import { formatMoney } from "../utils/format";

interface DashboardRevenueCardsProps {
  monthlyRevenue: string;
  todayRevenue: string;
  monthDelta: Trend | null;
  todayDelta: Trend | null;
}

export const DashboardRevenueCards: FC<DashboardRevenueCardsProps> = ({
  monthlyRevenue,
  todayRevenue,
  monthDelta,
  todayDelta,
}) => (
  <div className="grid grid-cols-1 gap-4 lg:grid-cols-3 md:gap-5">
    <div className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-brand-500 to-brand-600 p-6 shadow-theme-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg lg:col-span-2">
      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/15">
        <Banknote className="size-6 text-white" />
      </div>
      <div className="mt-5 flex items-end justify-between">
        <div>
          <span className="text-sm text-white/80">Ventas este mes</span>
          <h4 className="mt-2 text-3xl font-bold text-white">{formatMoney(monthlyRevenue)}</h4>
        </div>
        <TrendBadge trend={monthDelta} inverted />
      </div>
    </div>

    <div className="group rounded-2xl border border-gray-200 bg-white p-5 shadow-theme-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-brand-200 hover:shadow-lg dark:border-gray-800 dark:bg-gray-900 md:p-6">
      <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-violet-100 dark:bg-violet-500/10">
        <Wallet className="size-5 text-violet-600 dark:text-violet-400" />
      </div>
      <div className="mt-4 flex items-end justify-between">
        <div>
          <span className="text-sm text-gray-500 dark:text-gray-400">Ingreso del día</span>
          <h4 className="mt-2 text-2xl font-bold text-gray-900 dark:text-white">
            {formatMoney(todayRevenue)}
          </h4>
        </div>
        <TrendBadge trend={todayDelta} />
      </div>
    </div>
  </div>
);
