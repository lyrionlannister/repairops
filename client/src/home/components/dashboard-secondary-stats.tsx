import type { FC } from "react";
import { formatMoney } from "../utils/format";
import { Banknote, PackageOpen, TrendingUp, CalendarDays } from "lucide-react";

interface DashboardSecondaryStatsProps {
  // null cuando el rol no ve importes: la tarjeta no se pinta.
  weeklyRevenue: string | null;
  openRepairNotes: number;
  criticalStockItems: number;
  openCashSessions: number;
}

export const DashboardSecondaryStats: FC<DashboardSecondaryStatsProps> = ({
  weeklyRevenue,
  openRepairNotes,
  criticalStockItems,
  openCashSessions,
}) => (
  <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 md:gap-5">
    {weeklyRevenue !== null && (
    <div className="group rounded-2xl border border-gray-200 bg-white p-4 shadow-theme-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-brand-200 hover:shadow-lg dark:border-gray-800 dark:bg-gray-900">
      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-teal-100 dark:bg-teal-500/10">
        <Banknote className="size-4 text-teal-600 dark:text-teal-400" />
      </div>
      <div className="mt-3">
        <span className="text-xs text-gray-500 dark:text-gray-400">Ventas esta semana</span>
        <h4 className="mt-1 text-lg font-bold text-gray-900 dark:text-white">
          {formatMoney(weeklyRevenue)}
        </h4>
      </div>
    </div>
    )}

    <div className="group rounded-2xl border border-gray-200 bg-white p-4 shadow-theme-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-brand-200 hover:shadow-lg dark:border-gray-800 dark:bg-gray-900">
      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-100 dark:bg-brand-500/10">
        <PackageOpen className="size-4 text-brand-600 dark:text-brand-400" />
      </div>
      <div className="mt-3">
        <span className="text-xs text-gray-500 dark:text-gray-400">Notas abiertas</span>
        <h4 className="mt-1 text-lg font-bold text-gray-900 dark:text-white">{openRepairNotes}</h4>
      </div>
    </div>

    <div className="group rounded-2xl border border-gray-200 bg-white p-4 shadow-theme-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-brand-200 hover:shadow-lg dark:border-gray-800 dark:bg-gray-900">
      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-500/10">
        <TrendingUp className="size-4 text-blue-600 dark:text-blue-400" />
      </div>
      <div className="mt-3">
        <span className="text-xs text-gray-500 dark:text-gray-400">Stock crítico</span>
        <h4 className="mt-1 text-lg font-bold text-gray-900 dark:text-white">{criticalStockItems}</h4>
      </div>
    </div>

    <div className="group rounded-2xl border border-gray-200 bg-white p-4 shadow-theme-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-brand-200 hover:shadow-lg dark:border-gray-800 dark:bg-gray-900">
      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-orange-100 dark:bg-orange-500/10">
        <CalendarDays className="size-4 text-orange-500 dark:text-orange-400" />
      </div>
      <div className="mt-3">
        <span className="text-xs text-gray-500 dark:text-gray-400">Caja abierta</span>
        <h4 className="mt-1 text-lg font-bold text-gray-900 dark:text-white">{openCashSessions}</h4>
      </div>
    </div>
  </div>
);
