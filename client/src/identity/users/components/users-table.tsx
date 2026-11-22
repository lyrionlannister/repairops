import type { FC } from "react";
import { UserPlus, Pencil, Users } from "lucide-react";

import { Toggle } from "@ui/toggle/toggle";
import { Button } from "@ui/button/button";
import { DataTable } from "@ui/table/data-table";
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
  <DataTable
    loading={loading}
    loadingText="Cargando usuarios..."
    error={error}
    onRetry={onRetry}
    isEmpty={pageItems.length === 0}
    empty={{
      icon: <Users />,
      title: "No hay usuarios registrados.",
      description: "Crea el primer usuario para comenzar.",
      action: (
        <Button variant="primary" startIcon={<UserPlus className="size-4" />} onClick={onCreate}>
          Nuevo usuario
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
        <th className="px-4 py-4 text-center text-[11px] font-semibold uppercase tracking-[0.12em] text-gray-500 dark:text-gray-400">
          Nombre
        </th>
        <th className="px-4 py-4 text-center text-[11px] font-semibold uppercase tracking-[0.12em] text-gray-500 dark:text-gray-400">
          Email
        </th>
        <th className="px-4 py-4 text-center text-[11px] font-semibold uppercase tracking-[0.12em] text-gray-500 dark:text-gray-400">
          Roles
        </th>
        <th className="px-4 py-4 text-center text-[11px] font-semibold uppercase tracking-[0.12em] text-gray-500 dark:text-gray-400">
          Creado
        </th>
        <th className="px-4 py-4 text-center text-[11px] font-semibold uppercase tracking-[0.12em] text-gray-500 dark:text-gray-400">
          Estado
        </th>
        <th className="px-4 py-4 text-center text-[11px] font-semibold uppercase tracking-[0.12em] text-gray-500 dark:text-gray-400">
          Acciones
        </th>
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
          <td className="px-4 py-4 text-sm text-gray-500 dark:text-gray-400">
            {formatRoles(user.roles)}
          </td>
          <td className="px-4 py-4 text-sm text-gray-500 dark:text-gray-400">
            {formatDate(user.createdAt)}
          </td>
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
  </DataTable>
);
