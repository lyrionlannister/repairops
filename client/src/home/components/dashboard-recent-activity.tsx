import type { FC } from "react";
import { Banknote, Wrench } from "lucide-react";
import { formatMoney, formatRelativeTime } from "../utils/format";
import type { DashboardRecentActivityProps } from "../props/dashboard-recent-activity-props";

export const DashboardRecentActivity: FC<DashboardRecentActivityProps> = ({ recentActivity }) => (
  <div className="flex h-full flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white p-5 shadow-theme-sm dark:border-gray-800 dark:bg-white/3 sm:p-6">
    <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">Actividad reciente</h3>
    <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Últimos movimientos de caja</p>
    {recentActivity.length === 0 ? (
      <div className="mt-4 flex min-h-64 flex-1 items-center justify-center">
        <p className="text-sm text-gray-400 dark:text-gray-500">
          Sin actividad registrada todavía.
        </p>
      </div>
    ) : (
      <div className="custom-scrollbar mt-4 min-h-64 flex-1 divide-y divide-gray-100 overflow-y-auto pr-1 dark:divide-gray-800">
        {recentActivity.map((item) => (
          <div
            key={`${item.kind}-${item.id}`}
            className="flex items-center justify-between gap-3 py-3"
          >
            <div className="flex items-center gap-3">
              <div
                className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${
                  item.kind === "repair"
                    ? "bg-blue-100 dark:bg-blue-500/10"
                    : "bg-emerald-100 dark:bg-emerald-500/10"
                }`}
              >
                {item.kind === "repair" ? (
                  <Wrench className="size-4 text-blue-600 dark:text-blue-400" />
                ) : (
                  <Banknote className="size-4 text-emerald-600 dark:text-emerald-400" />
                )}
              </div>
              <div>
                <p className="text-sm font-medium text-gray-800 dark:text-white/90">{item.title}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">{item.subtitle}</p>
              </div>
            </div>
            <div className="text-right">
              {item.amount !== undefined && (
                <p className="text-sm font-semibold text-gray-800 dark:text-white/90">
                  {formatMoney(item.amount)}
                </p>
              )}
              <p className="text-xs text-gray-400 dark:text-gray-500">
                {formatRelativeTime(item.date)}
              </p>
            </div>
          </div>
        ))}
      </div>
    )}
  </div>
);
