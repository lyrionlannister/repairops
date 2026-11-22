import type { FC } from "react";
import { ArrowDownRight, ArrowUpRight, PiggyBank, Scale } from "lucide-react";
import { formatMoney } from "../utils/format";
import type { CashKpiRowProps } from "../props/cash-kpi-row-props";

export const CashKpiRow: FC<CashKpiRowProps> = ({ openingBalance, summary }) => {
  const tiles = [
    {
      label: "Fondo inicial",
      value: formatMoney(openingBalance),
      icon: PiggyBank,
      tone: "text-gray-800 dark:text-white/90",
    },
    {
      label: "Ingresos",
      value: formatMoney(summary?.totalIncome),
      icon: ArrowUpRight,
      tone: "text-success-600 dark:text-success-400",
    },
    {
      label: "Egresos",
      value: formatMoney(summary?.totalExpense),
      icon: ArrowDownRight,
      tone: "text-error-500 dark:text-error-400",
    },
    {
      label: "Neto del turno",
      value: formatMoney(summary?.net),
      icon: Scale,
      tone: "text-brand-600 dark:text-brand-400",
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-4 xsm:grid-cols-2 xl:grid-cols-4">
      {tiles.map(({ label, value, icon: Icon, tone }) => (
        <div
          key={label}
          className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/3"
        >
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold tracking-wide text-gray-400 uppercase">{label}</p>
            <Icon className="size-4 text-gray-400" aria-hidden />
          </div>
          <p className={`mt-1 text-2xl font-bold tabular-nums ${tone}`}>{value}</p>
        </div>
      ))}
    </div>
  );
};
