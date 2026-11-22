import type { FC } from "react";
import { useNavigate } from "react-router";
import { Pencil, Plus, Trash2, Smartphone, Users, Eye } from "lucide-react";
import { Button } from "@ui/button/button";
import { DataTable } from "@ui/table/data-table";
import type { CustomersTableProps } from "../props/customers-table-props";

export const CustomersTable: FC<CustomersTableProps> = ({
  loading,
  pageItems,
  page,
  pageSize,
  totalPages,
  totalItems,
  startIndex,
  onPageChange,
  canEdit,
  canDelete,
  onPageSizeChange,
  onOpenHistory,
  onRequestDelete,
}) => {
  const navigate = useNavigate();

  return (
    <DataTable
      loading={loading}
      loadingText="Cargando clientes..."
      isEmpty={pageItems.length === 0}
      empty={{
        icon: <Users />,
        title: "No hay clientes registrados.",
        description: "Registra el primero para comenzar.",
        action: canEdit && (
          <Button
            variant="primary"
            startIcon={<Plus className="size-4" />}
            onClick={() => navigate("/commerce/customers/new")}
          >
            Nuevo cliente
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
          <th className="px-4 py-4 text-center text-[11px] font-semibold uppercase tracking-[0.12em] text-gray-500 dark:text-gray-400">
            Nombre
          </th>
          <th className="px-4 py-4 text-center text-[11px] font-semibold uppercase tracking-[0.12em] text-gray-500 dark:text-gray-400">
            Teléfono
          </th>
          <th className="px-4 py-4 text-center text-[11px] font-semibold uppercase tracking-[0.12em] text-gray-500 dark:text-gray-400">
            Email
          </th>
          <th className="px-4 py-4 text-center text-[11px] font-semibold uppercase tracking-[0.12em] text-gray-500 dark:text-gray-400">
            Límite crédito
          </th>
          <th className="px-4 py-4 text-center text-[11px] font-semibold uppercase tracking-[0.12em] text-gray-500 dark:text-gray-400">
            Acciones
          </th>
        </tr>
      }
    >
      <tbody>
        {pageItems.map((customer) => (
          <tr
            key={customer.id}
            className="border-b border-gray-100 transition-colors last:border-0 hover:bg-gray-50 dark:border-gray-800/50 dark:hover:bg-white/2"
          >
            <td className="px-4 py-4 text-sm font-medium text-gray-800 dark:text-white/90">
              <button
                onClick={() => navigate(`/commerce/customers/${customer.id}`)}
                className="hover:text-brand-600 hover:underline dark:hover:text-brand-400"
              >
                {customer.name}
              </button>
            </td>
            <td className="px-4 py-4 text-sm text-gray-600 dark:text-gray-300">{customer.phone}</td>
            <td className="px-4 py-4 text-sm text-gray-600 dark:text-gray-300">
              {customer.email || "—"}
            </td>
            <td className="px-4 py-4 text-sm text-gray-600 dark:text-gray-300">
              {customer.creditLimit > 0 ? `$${customer.creditLimit.toLocaleString("es-MX")}` : "—"}
            </td>
            <td className="px-4 py-4 text-right">
              <div className="flex items-center justify-end gap-1">
                <button
                  onClick={() => navigate(`/commerce/customers/${customer.id}`)}
                  className="rounded-lg p-1.5 text-gray-400 hover:bg-brand-50 hover:text-brand-600 dark:hover:bg-brand-950/30 dark:hover:text-brand-400"
                  title="Ver cliente"
                >
                  <Eye className="size-4" />
                </button>
                <button
                  onClick={() => onOpenHistory(customer)}
                  className="rounded-lg p-1.5 text-gray-400 hover:bg-brand-50 hover:text-brand-600 dark:hover:bg-brand-950/30 dark:hover:text-brand-400"
                  title="Historial de equipos"
                >
                  <Smartphone className="size-4" />
                </button>
                {canEdit && (
                  <button
                    onClick={() => navigate(`/commerce/customers/${customer.id}/edit`)}
                    className="rounded-lg p-1.5 text-gray-400 hover:bg-brand-50 hover:text-brand-600 dark:hover:bg-brand-950/30 dark:hover:text-brand-400"
                    title="Editar"
                  >
                    <Pencil className="size-4" />
                  </button>
                )}
                {canDelete && (
                  <button
                    onClick={() => onRequestDelete(customer.id)}
                    className="rounded-lg p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-950/30"
                    title="Eliminar"
                  >
                    <Trash2 className="size-4" />
                  </button>
                )}
              </div>
            </td>
          </tr>
        ))}
      </tbody>
    </DataTable>
  );
};
