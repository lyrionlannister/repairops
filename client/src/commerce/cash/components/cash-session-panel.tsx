import type { FC } from "react";
import { Wallet, Plus, ArrowDownCircle, ArrowUpCircle, Lock } from "lucide-react";
import type { CashMovementRecord, CashSessionRecord, CashSummary } from "../hooks/use-cash";
import { Button } from "@ui/button/button";
import { ScrollTable } from "@ui/table/scroll-table";
import { Pagination } from "@ui/table/pagination";
import { METHOD_LABELS, formatMoney, formatTime } from "../utils/format";

interface CashSessionPanelProps {
  session: CashSessionRecord;
  summary: CashSummary | null;
  movements: CashMovementRecord[];
  pageItems: CashMovementRecord[];
  page: number;
  pageSize: number;
  totalPages: number;
  totalItems: number;
  startIndex: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
  onOpenMovement: () => void;
  onOpenClose: () => void;
}

export const CashSessionPanel: FC<CashSessionPanelProps> = ({
  session,
  summary,
  movements,
  pageItems,
  page,
  pageSize,
  totalPages,
  totalItems,
  startIndex,
  onPageChange,
  onPageSizeChange,
  onOpenMovement,
  onOpenClose,
}) => (
  <>
    <div className="grid shrink-0 gap-4 sm:grid-cols-3">
      <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/3">
        <p className="text-xs font-semibold uppercase text-gray-400">Saldo de apertura</p>
        <p className="mt-1 text-xl font-bold text-gray-800 dark:text-white/90">
          {formatMoney(session.openingBalance)}
        </p>
      </div>
      <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/3">
        <p className="text-xs font-semibold uppercase text-gray-400">Ingresos</p>
        <p className="mt-1 text-xl font-bold text-green-600 dark:text-green-400">
          {formatMoney(summary?.totalIncome ?? 0)}
        </p>
      </div>
      <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/3">
        <p className="text-xs font-semibold uppercase text-gray-400">Egresos</p>
        <p className="mt-1 text-xl font-bold text-red-500 dark:text-red-400">
          {formatMoney(summary?.totalExpense ?? 0)}
        </p>
      </div>
    </div>

    <div className="flex shrink-0 gap-3">
      <Button variant="primary" onClick={onOpenMovement}>
        <Plus className="mr-1.5 size-4" />
        Registrar movimiento
      </Button>
      <Button variant="outline" onClick={onOpenClose}>
        <Lock className="mr-1.5 size-4" />
        Cerrar caja
      </Button>
    </div>

    <div className="flex flex-1 min-h-0 flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/3">
      {movements.length === 0 ? (
        <div className="flex flex-col items-center gap-3 p-12 text-center text-gray-400">
          <Wallet className="size-10 opacity-40" />
          <p className="text-sm">Sin movimientos registrados todavía.</p>
        </div>
      ) : (
        <ScrollTable
          className="min-w-160"
          colgroup={
            <colgroup>
              <col className="w-24" />
              <col className="w-28" />
              <col className="w-32" />
              <col />
              <col className="w-32" />
            </colgroup>
          }
          header={
            <tr>
              <th className="px-5 py-3 text-center text-[11px] font-semibold uppercase tracking-[0.12em] text-gray-500 dark:text-gray-400">
                Hora
              </th>
              <th className="px-5 py-3 text-center text-[11px] font-semibold uppercase tracking-[0.12em] text-gray-500 dark:text-gray-400">
                Tipo
              </th>
              <th className="px-5 py-3 text-center text-[11px] font-semibold uppercase tracking-[0.12em] text-gray-500 dark:text-gray-400">
                Método
              </th>
              <th className="px-5 py-3 text-center text-[11px] font-semibold uppercase tracking-[0.12em] text-gray-500 dark:text-gray-400">
                Nota
              </th>
              <th className="px-5 py-3 text-center text-[11px] font-semibold uppercase tracking-[0.12em] text-gray-500 dark:text-gray-400">
                Monto
              </th>
            </tr>
          }
        >
          <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
            {pageItems.map((movement) => (
              <tr key={movement.id}>
                <td className="px-5 py-3 text-xs text-gray-500 dark:text-gray-400">
                  {formatTime(movement.createdAt)}
                </td>
                <td className="px-5 py-3">
                  <span className="inline-flex items-center gap-1 text-xs font-medium">
                    {movement.type === "income" ? (
                      <ArrowUpCircle className="size-3.5 text-green-500" />
                    ) : (
                      <ArrowDownCircle className="size-3.5 text-red-500" />
                    )}
                    {movement.type === "income" ? "Ingreso" : "Egreso"}
                  </span>
                </td>
                <td className="px-5 py-3 text-xs text-gray-500 dark:text-gray-400">
                  {METHOD_LABELS[movement.method]}
                </td>
                <td className="px-5 py-3 text-xs text-gray-500 dark:text-gray-400">{movement.note ?? "—"}</td>
                <td
                  className={`px-5 py-3 text-right font-medium tabular-nums ${movement.type === "income" ? "text-green-600 dark:text-green-400" : "text-red-500 dark:text-red-400"}`}
                >
                  {movement.type === "income" ? "+" : "-"}
                  {formatMoney(movement.amount)}
                </td>
              </tr>
            ))}
          </tbody>
        </ScrollTable>
      )}

      {movements.length > 0 && (
        <div className="flex shrink-0 flex-col gap-3 border-t border-gray-100 px-5 py-4 dark:border-gray-800 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
            <span>Mostrar</span>
            <select
              value={pageSize}
              onChange={(event) => onPageSizeChange(Number(event.target.value))}
              className="h-9 rounded-lg border border-gray-300 bg-white px-2 text-sm text-gray-700 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300"
            >
              {[10, 25, 50].map((size) => (
                <option key={size} value={size}>
                  {size}
                </option>
              ))}
            </select>
            <span>
              Mostrando {startIndex + 1}–{Math.min(startIndex + pageSize, totalItems)} de {totalItems}
            </span>
          </div>
          <Pagination currentPage={page} totalPages={totalPages} onPageChange={onPageChange} />
        </div>
      )}
    </div>
  </>
);
