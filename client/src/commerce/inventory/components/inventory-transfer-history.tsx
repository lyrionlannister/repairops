import type { FC } from "react";
import { ArrowRightLeft } from "lucide-react";
import { DataTable } from "@ui/table/data-table";
import { formatDate } from "../utils/format";
import type { InventoryTransferHistoryProps } from "../props/inventory-transfer-history-props";

const HEADER = "px-5 py-3 text-center text-[11px] font-semibold uppercase tracking-[0.12em] text-gray-500 dark:text-gray-400";

export const InventoryTransferHistory: FC<InventoryTransferHistoryProps> = ({
  transfers,
  loading,
  error,
  onRetry,
  pagination,
  refLabel,
}) => (
  <DataTable
    loading={loading}
    loadingText="Cargando transferencias..."
    error={transfers.length === 0 ? error : null}
    onRetry={onRetry}
    isEmpty={transfers.length === 0}
    empty={{
      icon: <ArrowRightLeft />,
      title: "Sin transferencias todavía.",
      description: "Cada transferencia entre sucursales quedará registrada aquí.",
    }}
    toolbar={
      <div className="border-b border-gray-100 p-5 dark:border-gray-800">
        <h2 className="text-base font-semibold text-gray-800 dark:text-white/90">Historial</h2>
      </div>
    }
    pagination={pagination}
    header={
      <tr>
        <th className={HEADER}>Fecha</th>
        <th className={HEADER}>Cantidad</th>
        <th className={HEADER}>Origen</th>
        <th className={HEADER}>Destino</th>
        <th className={HEADER}>Motivo</th>
      </tr>
    }
  >
    <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
      {transfers.map((t) => (
        <tr key={t.id} className="hover:bg-gray-50 dark:hover:bg-white/2">
          <td className="px-5 py-3 text-sm text-gray-500 dark:text-gray-400">{formatDate(t.createdAt)}</td>
          <td className="px-5 py-3 text-sm text-gray-700 dark:text-gray-300 tabular-nums">
            {t.quantity} {t.quantity === 1 ? "unidad" : "unidades"}
          </td>
          <td className="px-5 py-3 text-sm font-medium text-gray-800 dark:text-white/90">{refLabel(t.fromItem)}</td>
          <td className="px-5 py-3 text-sm font-medium text-gray-800 dark:text-white/90">{refLabel(t.toItem)}</td>
          <td className="px-5 py-3 text-sm text-gray-500 dark:text-gray-400">{t.reason || "—"}</td>
        </tr>
      ))}
    </tbody>
  </DataTable>
);
