import type { FC } from "react";
import { Link } from "react-router";
import { ArrowDownCircle, ArrowUpCircle, ExternalLink, Plus, Wallet, X } from "lucide-react";
import { Button } from "@ui/button/button";
import { Select } from "@ui/select/select";
import { DataTable } from "@ui/table/data-table";
import { METHOD_LABELS, ORIGIN_LABELS, formatMoney, formatTime } from "../utils/format";
import type { CashMovementsTableProps } from "../props/cash-movements-table-props";

const HEADER =
  "px-5 py-3 text-center text-[11px] font-semibold uppercase tracking-[0.12em] text-gray-500 dark:text-gray-400";
const ORIGIN_OPTIONS = [
  "sale",
  "repair_note",
  "layaway",
  "return",
  "customer_payment",
  "manual",
] as const;

export const CashMovementsTable: FC<CashMovementsTableProps> = ({
  rows,
  pageItems,
  totalMovements,
  filters,
  hasFilters,
  page,
  pageSize,
  totalPages,
  totalItems,
  startIndex,
  onFilterChange,
  onClearFilters,
  onPageChange,
  onPageSizeChange,
  onRegisterIncome,
}) => (
  <DataTable
    containerClassName="min-h-128 shrink-0"
    isEmpty={rows.length === 0}
    empty={{
      icon: <Wallet />,
      title: hasFilters
        ? "Ningún movimiento coincide con los filtros."
        : "Sin movimientos registrados todavía.",
      description: hasFilters
        ? "Prueba con otros filtros."
        : "Los cobros, ventas y movimientos manuales aparecerán aquí.",
      action: (
        <Button
          variant="primary"
          startIcon={<Plus className="size-4" />}
          onClick={onRegisterIncome}
        >
          Registrar ingreso
        </Button>
      ),
    }}
    pagination={{
      page,
      pageSize,
      totalPages,
      totalItems,
      startIndex,
      onPageChange,
      onPageSizeChange,
    }}
    toolbar={
      <div className="flex flex-col gap-3 border-b border-gray-100 p-5 lg:flex-row lg:items-center lg:justify-between dark:border-gray-800">
        <div>
          <h3 className="text-base font-semibold text-gray-800 dark:text-white/90">Movimientos</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {hasFilters ? `${rows.length} de ${totalMovements}` : `${totalMovements}`} en este turno
          </p>
        </div>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-3 lg:flex lg:items-center lg:[&>*]:w-52">
          <Select
            value={filters.type}
            onChange={(value) => onFilterChange("type", value)}
            placeholder="Todos los tipos"
            options={[
              { value: "income", label: "Ingresos" },
              { value: "expense", label: "Egresos" },
            ]}
          />
          <Select
            value={filters.method}
            onChange={(value) => onFilterChange("method", value)}
            placeholder="Todos los métodos"
            options={Object.entries(METHOD_LABELS).map(([value, label]) => ({ value, label }))}
          />
          <Select
            value={filters.origin}
            onChange={(value) => onFilterChange("origin", value)}
            placeholder="Todos los orígenes"
            options={ORIGIN_OPTIONS.map((value) => ({ value, label: ORIGIN_LABELS[value] }))}
          />
          {hasFilters && (
            <button
              type="button"
              onClick={onClearFilters}
              className="inline-flex min-h-11 items-center justify-center gap-1 rounded-lg px-3 text-sm lg:w-auto! text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-white/5"
            >
              <X className="size-4" aria-hidden />
              Limpiar
            </button>
          )}
        </div>
      </div>
    }

    header={
      <tr>
        <th className={HEADER}>Hora</th>
        <th className={HEADER}>Tipo</th>
        <th className={HEADER}>Método</th>
        <th className={HEADER}>Origen</th>
        <th className={HEADER}>Registró</th>
        <th className={HEADER}>Nota</th>
        <th className={HEADER}>Monto</th>
      </tr>
    }
  >
    <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
      {pageItems.map((movement) => (
        <tr key={movement.id}>
          <td className="px-5 py-4 text-sm text-gray-500 tabular-nums dark:text-gray-400">
            {formatTime(movement.createdAt)}
          </td>
          <td className="px-5 py-4">
            <span className="inline-flex items-center gap-1.5 text-sm font-medium text-gray-700 dark:text-gray-300">
              {movement.type === "income" ? (
                <ArrowUpCircle className="size-4 text-success-500" aria-hidden />
              ) : (
                <ArrowDownCircle className="size-4 text-error-500" aria-hidden />
              )}
              {movement.type === "income" ? "Ingreso" : "Egreso"}
            </span>
          </td>
          <td className="px-5 py-4 text-sm text-gray-600 dark:text-gray-300">
            {METHOD_LABELS[movement.method]}
          </td>
          <td className="px-5 py-4 text-sm">
            {movement.originHref ? (
              <Link
                to={movement.originHref}
                className="inline-flex items-center gap-1 font-medium text-brand-600 hover:underline dark:text-brand-400"
              >
                {movement.originLabel}
                <ExternalLink className="size-3.5" aria-hidden />
              </Link>
            ) : (
              <span className="text-gray-600 dark:text-gray-300">{movement.originLabel}</span>
            )}
          </td>
          <td className="px-5 py-4 text-sm text-gray-600 dark:text-gray-300">
            {movement.createdByName}
          </td>
          <td className="px-5 py-4 text-sm text-gray-500 dark:text-gray-400">
            {movement.note ?? "—"}
          </td>
          <td
            className={`px-5 py-3 text-sm font-semibold tabular-nums ${
              movement.amount === null
                ? "text-gray-400"
                : movement.type === "income"
                  ? "text-success-600 dark:text-success-400"
                  : "text-error-500 dark:text-error-400"
            }`}
          >
            {movement.amount === null
              ? "Oculto"
              : `${movement.type === "income" ? "+" : "−"}${formatMoney(movement.amount)}`}
          </td>
        </tr>
      ))}
    </tbody>
  </DataTable>
);
