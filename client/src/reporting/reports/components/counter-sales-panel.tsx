import type { FC } from "react";
import { ShoppingCart } from "lucide-react";
import { EmptyState } from "@ui/table/empty-state";
import { ReportPanel } from "./report-panel";
import { formatMoney } from "../utils/format";
import type { CounterSalesPanelProps } from "../props/counter-sales-panel-props";

export const CounterSalesPanel: FC<CounterSalesPanelProps> = ({ report, currency }) => (
  <ReportPanel
    title="Productos más vendidos"
    subtitle="Accesorios y refacciones vendidos en mostrador."
  >
    {!report || report.data.length === 0 ? (
      <EmptyState
        icon={<ShoppingCart />}
        title="Sin productos vendidos en este periodo"
        description="Prueba con otro rango de fechas."
      />
    ) : (
      <ul className="divide-y divide-gray-100 dark:divide-gray-800">
        {report.data.map((row) => (
          <li key={row.key} className="flex items-center justify-between gap-3 py-2.5 text-sm">
            <span className="min-w-0 truncate text-gray-700 dark:text-gray-300">{row.label}</span>
            <span className="shrink-0 text-gray-500 tabular-nums dark:text-gray-400">
              {row.quantity} pzs ·{" "}
              <span className="font-medium text-gray-800 dark:text-white/90">
                {formatMoney(row.revenue, currency)}
              </span>
            </span>
          </li>
        ))}
      </ul>
    )}
  </ReportPanel>
);
