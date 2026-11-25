import type { FC } from "react";
import { formatMoney } from "../utils/format";
import type { ReportSummaryProps } from "../props/report-summary-props";

export const ReportSummaryCards: FC<ReportSummaryProps> = ({ summary, currency }) => {
  const items = [
    {
      label: "Notas de reparación",
      value: String(summary.notesCount),
      hint: "Sin contar canceladas",
    },
    {
      label: "Valor de reparaciones",
      value: formatMoney(summary.notesRevenue, currency),
      hint: "Total de las notas",
    },
    {
      label: "Ventas en mostrador",
      value: formatMoney(summary.salesRevenue, currency),
      hint: `${summary.salesCount} ventas`,
    },
    {
      label: "Ticket promedio",
      value: formatMoney(summary.averageTicket, currency),
      hint: "Por venta en mostrador",
    },
  ];
  return (
    <div className="grid grid-cols-1 gap-4 2xsm:grid-cols-2 xl:grid-cols-4">
      {items.map((item) => (
        <div
          key={item.label}
          className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/3"
        >
          <p className="text-sm text-gray-500 dark:text-gray-400">{item.label}</p>
          <p className="mt-1.5 truncate text-xl font-bold text-gray-800 tabular-nums dark:text-white/90">
            {item.value}
          </p>
          <p className="mt-1 text-xs text-gray-400">{item.hint}</p>
        </div>
      ))}
    </div>
  );
};
