import type { FC } from "react";
import { UserPlus, Pencil } from "lucide-react";

import { Toggle } from "@ui/toggle/toggle";
import { Button } from "@ui/button/button";
import { Pagination } from "@ui/table/pagination";
import { ScrollTable } from "@ui/table/scroll-table";
import { formatRoles } from "../utils/roles";
import { formatDate } from "../utils/format";
import type { UsersTableProps } from "../props/users-table-props";

export const UsersTable: FC<UsersTableProps> = ({
  loading,
  error,
  pageItems,
  togglingId,
  page,
  pageSize,
  totalPages,
  totalItems,
  startIndex,
  onRetry,
  onCreate,
  onEdit,
  onToggleStatus,
  onPageChange,
  onPageSizeChange,
}) => (
  <div className="flex flex-1 min-h-0 flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-theme-sm dark:border-gray-800 dark:bg-gray-900">
    {loading ? (
      <div className="flex flex-col items-center justify-center gap-4 p-10 text-center">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-brand-200 border-t-brand-600" />
        <p className="text-sm text-gray-500 dark:text-gray-400">Cargando usuarios...</p>
      </div>
    ) : error ? (
      <div className="flex flex-col items-center justify-center gap-4 p-10 text-center">
        <p className="text-sm text-red-500">{error}</p>
        <Button variant="secondary" onClick={onRetry}>Reintentar</Button>
      </div>
    ) : pageItems.length === 0 ? (
      <div className="flex flex-col items-center justify-center gap-4 p-10 text-center">
        <p className="text-base font-semibold text-gray-700 dark:text-gray-200">No hay usuarios registrados.</p>
        <p className="text-sm text-gray-500 dark:text-gray-400">Crea el primer usuario para comenzar.</p>
        <Button variant="primary" startIcon={<UserPlus className="size-4" />} onClick={onCreate}>
          Nuevo usuario
        </Button>
      </div>
    ) : (
      <ScrollTable
        className="min-w-200"
        colgroup={
          <colgroup>
            <col />
            <col />
            <col />
            <col />
            <col />
            <col className="w-28" />
          </colgroup>
        }
        header={
          <tr className="border-b border-gray-200 dark:border-gray-800">
            <th className="px-4 py-4 text-center text-[11px] font-semibold uppercase tracking-[0.12em] text-gray-500 dark:text-gray-400">Nombre</th>
            <th className="px-4 py-4 text-center text-[11px] font-semibold uppercase tracking-[0.12em] text-gray-500 dark:text-gray-400">Email</th>
            <th className="px-4 py-4 text-center text-[11px] font-semibold uppercase tracking-[0.12em] text-gray-500 dark:text-gray-400">Roles</th>
            <th className="px-4 py-4 text-center text-[11px] font-semibold uppercase tracking-[0.12em] text-gray-500 dark:text-gray-400">Creado</th>
            <th className="px-4 py-4 text-center text-[11px] font-semibold uppercase tracking-[0.12em] text-gray-500 dark:text-gray-400">Estado</th>
            <th className="px-4 py-4 text-center text-[11px] font-semibold uppercase tracking-[0.12em] text-gray-500 dark:text-gray-400">Acciones</th>
          </tr>
        }
      >
        <tbody>
          {pageItems.map((user) => (
            <tr
              key={user.id}
              className="border-b border-gray-100 transition-colors last:border-0 hover:bg-gray-50 dark:border-gray-800/50 dark:hover:bg-white/2"
            >
              <td className="px-4 py-4 text-sm font-medium text-gray-800 dark:text-white/90">
                {user.firstName} {user.lastName}
              </td>
              <td className="px-4 py-4 text-sm text-gray-500 dark:text-gray-400">{user.email}</td>
              <td className="px-4 py-4 text-sm text-gray-500 dark:text-gray-400">{formatRoles(user.roles)}</td>
              <td className="px-4 py-4 text-sm text-gray-500 dark:text-gray-400">{formatDate(user.createdAt)}</td>
              <td className="px-4 py-4">
                <Toggle
                  checked={user.isActive}
                  onChange={() => onToggleStatus(user.id)}
                  disabled={togglingId === user.id}
                />
              </td>
              <td className="px-4 py-4 text-right">
                <button
                  onClick={() => onEdit(user.id)}
                  className="rounded-lg p-1.5 text-gray-400 hover:bg-brand-50 hover:text-brand-600 dark:hover:bg-brand-950/30 dark:hover:text-brand-400"
                  title="Editar"
                >
                  <Pencil className="size-4" />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </ScrollTable>
    )}

    {!loading && !error && totalItems > 0 && (
      <div className="flex shrink-0 flex-col gap-3 border-t border-gray-100 px-5 py-4 dark:border-gray-800 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
          <span>Mostrar</span>
          <select
            value={pageSize}
            onChange={(event) => onPageSizeChange(Number(event.target.value))}
            className="h-11 rounded-lg md:h-9 border border-gray-300 bg-white px-2 text-sm text-gray-700 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300"
          >
            {[10, 25, 50].map((size) => (
              <option key={size} value={size}>{size}</option>
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
