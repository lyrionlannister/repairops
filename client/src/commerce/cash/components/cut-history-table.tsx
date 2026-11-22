import type { FC } from "react";
import { FileText, History } from "lucide-react";
import { DataTable } from "@ui/table/data-table";
import { VarianceBadge } from "./variance-badge";
import { formatDateTime, formatMoney } from "../utils/format";
import type { CutHistoryTableProps } from "../props/cut-history-table-props";

const HEADER =
  "px-5 py-3 text-center text-[11px] font-semibold uppercase tracking-[0.12em] text-gray-500 dark:text-gray-400";

export const CutHistoryTable: FC<CutHistoryTableProps> = ({ cuts, onView }) => (
  <DataTable
    containerClassName="shrink-0"
    isEmpty={cuts.length === 0}
    empty={{
      icon: <History />,
      title: "Todavía no hay cortes de caja.",
      description: "Cada cierre de caja de esta sucursal quedará registrado aquí.",
    }}
    toolbar={
      <div className="border-b border-gray-100 p-5 dark:border-gray-800">
        <h3 className="text-base font-semibold text-gray-800 dark:text-white/90">
          Historial de cortes
        </h3>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Últimos {cuts.length} cierres de esta sucursal
        </p>
      </div>
    }

    header={
      <tr>
        <th className={HEADER}>Cierre</th>
        <th className={HEADER}>Abrió</th>
        <th className={HEADER}>Cerró</th>
        <th className={HEADER}>Ingresos</th>
        <th className={HEADER}>Egresos</th>
        <th className={HEADER}>Resultado</th>
        <th className={HEADER}>Corte</th>
      </tr>
    }
  >
    <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
      {cuts.map((cut) => (
        <tr key={cut.id} className="hover:bg-gray-50 dark:hover:bg-white/2">
          <td className="px-5 py-3 text-sm text-gray-700 dark:text-gray-300">
            {formatDateTime(cut.closedAt)}
          </td>
          <td className="px-5 py-3 text-sm text-gray-600 dark:text-gray-300">
            {cut.openedByName ?? "—"}
          </td>
          <td className="px-5 py-3 text-sm text-gray-600 dark:text-gray-300">
            {cut.closedByName ?? "—"}
          </td>
          <td className="px-5 py-3 text-sm font-medium text-success-600 tabular-nums dark:text-success-400">
            {formatMoney(cut.totalIncome)}
          </td>
          <td className="px-5 py-3 text-sm font-medium text-error-500 tabular-nums dark:text-error-400">
            {formatMoney(cut.totalExpense)}
          </td>
          <td className="px-5 py-3">
            <VarianceBadge variance={cut.variance} />
          </td>
          <td className="px-5 py-3">
            <button
              type="button"
              onClick={() => onView(cut.id)}
              className="inline-flex min-h-11 items-center gap-1.5 rounded-lg px-3 text-sm font-medium text-brand-600 hover:bg-brand-50 dark:text-brand-400 dark:hover:bg-brand-500/10"
            >
              <FileText className="size-4" aria-hidden />
              Ver
            </button>
          </td>
        </tr>
      ))}
    </tbody>
  </DataTable>
);
