import type { FC } from "react";
import { useNavigate } from "react-router";
import { Pencil, Trash2, Smartphone, Users } from "lucide-react";
import type { Customer } from "../hooks/use-customers";
import { Pagination } from "@ui/table/pagination";
import { ScrollTable } from "@ui/table/scroll-table";

interface CustomersTableProps {
  loading: boolean;
  pageItems: Customer[];
  page: number;
  pageSize: number;
  totalPages: number;
  totalItems: number;
  startIndex: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
  onOpenHistory: (customer: Customer) => void;
  onRequestDelete: (id: string) => void;
}

export const CustomersTable: FC<CustomersTableProps> = ({
  loading,
  pageItems,
  page,
  pageSize,
  totalPages,
  totalItems,
  startIndex,
  onPageChange,
  onPageSizeChange,
  onOpenHistory,
  onRequestDelete,
}) => {
  const navigate = useNavigate();

  return (
    <div className="flex flex-1 min-h-0 flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/3">
      {loading ? (
        <div className="p-8 text-center text-sm text-gray-500 dark:text-gray-400">Cargando clientes...</div>
      ) : pageItems.length === 0 ? (
        <div className="flex flex-col items-center gap-3 p-12 text-center text-gray-400">
          <Users className="size-10 opacity-40" />
          <p className="text-sm">No hay clientes registrados todavía.</p>
        </div>
      ) : (
        <ScrollTable
          className="min-w-175"
          colgroup={
            <colgroup>
              <col />
              <col />
              <col />
              <col />
              <col className="w-36" />
            </colgroup>
          }
          header={
            <tr className="border-b border-gray-200 dark:border-gray-800">
              <th className="px-4 py-4 text-center text-[11px] font-semibold uppercase tracking-[0.12em] text-gray-500 dark:text-gray-400">Nombre</th>
              <th className="px-4 py-4 text-center text-[11px] font-semibold uppercase tracking-[0.12em] text-gray-500 dark:text-gray-400">Teléfono</th>
              <th className="px-4 py-4 text-center text-[11px] font-semibold uppercase tracking-[0.12em] text-gray-500 dark:text-gray-400">Email</th>
              <th className="px-4 py-4 text-center text-[11px] font-semibold uppercase tracking-[0.12em] text-gray-500 dark:text-gray-400">Límite crédito</th>
              <th className="px-4 py-4 text-center text-[11px] font-semibold uppercase tracking-[0.12em] text-gray-500 dark:text-gray-400">Acciones</th>
            </tr>
          }
        >
          <tbody>
            {pageItems.map((customer) => (
              <tr
                key={customer.id}
                className="border-b border-gray-100 transition-colors last:border-0 hover:bg-gray-50 dark:border-gray-800/50 dark:hover:bg-white/2"
              >
                <td className="px-4 py-4 text-sm font-medium text-gray-800 dark:text-white/90">{customer.name}</td>
                <td className="px-4 py-4 text-sm text-gray-600 dark:text-gray-300">{customer.phone}</td>
                <td className="px-4 py-4 text-sm text-gray-600 dark:text-gray-300">{customer.email || "—"}</td>
                <td className="px-4 py-4 text-sm text-gray-600 dark:text-gray-300">
                  {customer.creditLimit > 0 ? `$${customer.creditLimit.toLocaleString("es-MX")}` : "—"}
                </td>
                <td className="px-4 py-4 text-right">
                  <div className="flex items-center justify-end gap-1">
                    <button
                      onClick={() => onOpenHistory(customer)}
                      className="rounded-lg p-1.5 text-gray-400 hover:bg-brand-50 hover:text-brand-600 dark:hover:bg-brand-950/30 dark:hover:text-brand-400"
                      title="Historial de equipos"
                    >
                      <Smartphone className="size-4" />
                    </button>
                    <button
                      onClick={() => navigate(`/app/customers/${customer.id}/edit`)}
                      className="rounded-lg p-1.5 text-gray-400 hover:bg-brand-50 hover:text-brand-600 dark:hover:bg-brand-950/30 dark:hover:text-brand-400"
                      title="Editar"
                    >
                      <Pencil className="size-4" />
                    </button>
                    <button
                      onClick={() => onRequestDelete(customer.id)}
                      className="rounded-lg p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-950/30"
                      title="Eliminar"
                    >
                      <Trash2 className="size-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </ScrollTable>
      )}

      {!loading && totalItems > 0 && (
        <div className="flex shrink-0 flex-col gap-3 border-t border-gray-100 px-5 py-4 dark:border-gray-800 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
            <span>Mostrar</span>
            <select
              value={pageSize}
              onChange={(event) => onPageSizeChange(Number(event.target.value))}
              className="h-11 rounded-lg md:h-9 border border-gray-300 bg-white px-2 text-sm text-gray-700 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300"
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
  );
};
