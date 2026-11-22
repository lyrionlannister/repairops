import type { FC } from "react";
import { PackageOpen, AlertTriangle, Landmark, Users } from "lucide-react";
import type { DashboardSecondaryStatsProps } from "../props/dashboard-secondary-stats-props";

export const DashboardSecondaryStats: FC<DashboardSecondaryStatsProps> = ({
  openRepairNotes,
  criticalStockItems,
  openCashSessions,
  onlineUsers,
}) => {
  const rows = [
    {
      label: "Notas abiertas",
      value: openRepairNotes,
      icon: <PackageOpen />,
      tone: "bg-brand-50 text-brand-600 dark:bg-brand-500/10 dark:text-brand-400",
    },
    {
      label: "Stock crítico",
      value: criticalStockItems,
      icon: <AlertTriangle />,
      tone: "bg-orange-50 text-orange-600 dark:bg-orange-500/10 dark:text-orange-400",
    },
    {
      label: "Cajas abiertas",
      value: openCashSessions,
      icon: <Landmark />,
      tone: "bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400",
    },
    {
      label: "Usuarios conectados",
      value: onlineUsers,
      icon: <Users />,
      tone: "bg-sky-50 text-sky-600 dark:bg-sky-500/10 dark:text-sky-400",
    },
  ];
  return (
    <div className="flex h-full flex-col rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/3 sm:p-6">
      <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">Operación</h3>
      <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Estado actual del taller</p>
      <div className="mt-4 flex flex-1 flex-col justify-around divide-y divide-gray-100 dark:divide-gray-800">
        {rows.map((row) => (
          <div key={row.label} className="flex items-center justify-between gap-3 py-3.5">
            <div className="flex items-center gap-3">
              <div
                className={`flex size-10 items-center justify-center rounded-xl [&>svg]:size-5 ${row.tone}`}
              >
                {row.icon}
              </div>
              <span className="text-sm text-gray-600 dark:text-gray-300">{row.label}</span>
            </div>
            <span className="text-xl font-bold text-gray-800 dark:text-white/90">{row.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
};
