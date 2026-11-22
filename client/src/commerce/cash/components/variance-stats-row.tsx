import type { FC } from "react";
import { AlertTriangle, CalendarCheck, TrendingDown, TrendingUp } from "lucide-react";
import { formatMoney } from "../utils/format";
import type { VarianceStatsRowProps } from "../props/variance-stats-row-props";

export const VarianceStatsRow: FC<VarianceStatsRowProps> = ({ stats }) => {
  const tiles = [
    {
      label: "Cortes del mes",
      value: String(stats.closedCount),
      hint: `${stats.withVarianceCount} con diferencia`,
      icon: CalendarCheck,
      tone: "bg-brand-50 text-brand-500 dark:bg-brand-500/15",
    },
    {
      label: "Faltantes",
      value: formatMoney(stats.shortageTotal),
      hint: "Acumulado del mes",
      icon: TrendingDown,
      tone: "bg-error-50 text-error-500 dark:bg-error-500/15",
    },
    {
      label: "Sobrantes",
      value: formatMoney(stats.overageTotal),
      hint: `Neto: ${formatMoney(stats.netVariance)}`,
      icon: AlertTriangle,
      tone: "bg-warning-50 text-warning-600 dark:bg-warning-500/15",
    },
    {
      label: "Promedio por turno",
      value: formatMoney(stats.averageIncomePerShift),
      hint: "Ingresos por corte",
      icon: TrendingUp,
      tone: "bg-success-50 text-success-600 dark:bg-success-500/15",
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-4 xsm:grid-cols-2 xl:grid-cols-4">
      {tiles.map(({ label, value, hint, icon: Icon, tone }) => (
        <div
          key={label}
          className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/3"
        >
          <span className={`flex size-9 items-center justify-center rounded-xl ${tone}`}>
            <Icon className="size-4" aria-hidden />
          </span>
          <p className="mt-3 text-xs font-semibold tracking-wide text-gray-400 uppercase">
            {label}
          </p>
          <p className="mt-0.5 text-xl font-bold text-gray-800 tabular-nums dark:text-white/90">
            {value}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400">{hint}</p>
        </div>
      ))}
    </div>
  );
};
