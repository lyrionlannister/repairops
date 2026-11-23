import type { FC } from "react";
import { Link } from "react-router";
import { PackageOpen, AlertTriangle, Landmark, Users, ChevronRight, HandCoins } from "lucide-react";
import { usePermissions } from "@common/hooks/use-permissions";
import { OVERDUE_ICON_TONE, OVERDUE_TEXT_TONE } from "@commerce/customers/utils/overdue";
import { OPERATION_LINKS } from "../utils/operation-links";
import { formatMoney } from "../utils/format";
import { creditHint } from "../utils/credit";
import type { DashboardSecondaryStatsProps } from "../props/dashboard-secondary-stats-props";
import type { OperationRow } from "../types/dashboard-secondary-stats";

export const DashboardSecondaryStats: FC<DashboardSecondaryStatsProps> = ({
  openRepairNotes,
  criticalStockItems,
  openCashSessions,
  onlineUsers,
  credit,
}) => {
  const { canAny } = usePermissions();
  const rows: OperationRow[] = [
    {
      label: "Notas abiertas",
      value: openRepairNotes,
      link: OPERATION_LINKS.openRepairNotes,
      icon: <PackageOpen />,
      tone: "bg-brand-50 text-brand-600 dark:bg-brand-500/10 dark:text-brand-400",
    },
    {
      label: "Stock crítico",
      value: criticalStockItems,
      link: OPERATION_LINKS.criticalStockItems,
      icon: <AlertTriangle />,
      tone: "bg-orange-50 text-orange-600 dark:bg-orange-500/10 dark:text-orange-400",
    },
    {
      label: "Cajas abiertas",
      value: openCashSessions,
      link: OPERATION_LINKS.openCashSessions,
      icon: <Landmark />,
      tone: "bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400",
    },
    ...(credit
      ? [
          {
            label: "Créditos",
            hint: creditHint(credit),
            value: formatMoney(credit.balance),
            valueClassName: `text-lg ${OVERDUE_TEXT_TONE[credit.overdueLevel]}`,
            link: OPERATION_LINKS.pendingCredit,
            icon: <HandCoins />,
            tone: OVERDUE_ICON_TONE[credit.overdueLevel],
          },
        ]
      : []),
    {
      label: "Usuarios conectados",
      value: onlineUsers,
      link: OPERATION_LINKS.onlineUsers,
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
          <div key={row.label} className="py-3.5">
            <div className="flex items-center justify-between gap-3">
              <div className="flex min-w-0 items-center gap-3">
                <div
                  className={`flex size-10 shrink-0 items-center justify-center rounded-xl [&>svg]:size-5 ${row.tone}`}
                >
                  {row.icon}
                </div>
                <span className="text-sm text-gray-600 dark:text-gray-300">{row.label}</span>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <span
                  className={`font-bold ${row.valueClassName ?? "text-xl text-gray-800 dark:text-white/90"}`}
                >
                  {row.value}
                </span>
                {canAny(...row.link.permissions) && (
                  <Link
                    to={row.link.path}
                    className="inline-flex min-h-11 items-center gap-0.5 rounded-lg px-2 text-sm font-medium text-brand-600 hover:bg-brand-50 dark:text-brand-400 dark:hover:bg-brand-500/10"
                  >
                    Ver
                    <ChevronRight className="size-4" />
                  </Link>
                )}
              </div>
            </div>
            {row.hint && (
              <p className="mt-1 pl-13 text-xs text-gray-500 dark:text-gray-400">{row.hint}</p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
