import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { Plus, Pencil, Search, Trash2, Truck } from "lucide-react";

import { Button } from "@ui/button/button";
import { Input } from "@ui/inputs/input";
import { ConfirmModal } from "@ui/modal/confirm-modal";
import { DataTable } from "@ui/table/data-table";
import { PageShell } from "@common/components/page-shell/page-shell";
import { usePaginatedList } from "@common/hooks/use-paginated-list";

import { useSuppliers } from "../hooks/use-suppliers";
import { useSuppliersPage } from "../hooks/use-suppliers-page";

export const SuppliersPage = () => {
  const navigate = useNavigate();
  const { suppliers, loading, saving, error, fetchAll, remove } = useSuppliers();
  const { search, setSearch, filteredSuppliers } = useSuppliersPage(suppliers);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const { page, setPage, pageSize, setPageSize, totalPages, totalItems, startIndex, pageItems } =
    usePaginatedList(filteredSuppliers);

  const handleDelete = async (id: string) => {
    await remove(id);
    setDeleteConfirmId(null);
  };

  return (
    <PageShell
      title="Proveedores"
      description="Gestiona los proveedores de tu taller."
      action={
        <Button variant="primary" onClick={() => navigate("/commerce/suppliers/new")}>
          <Plus className="mr-1.5 size-4" />
          Nuevo proveedor
        </Button>
      }
    >
      <div className="shrink-0 rounded-2xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-white/3">
        <div className="relative max-w-sm">
          <Search className="pointer-events-none absolute left-3 top-1/2 z-10 size-4 -translate-y-1/2 text-gray-400" />
          <Input
            name="search"
            value={search}
            onChange={(event) => {
              setSearch(event.target.value);
              setPage(1);
            }}
            placeholder="Buscar proveedor"
            className="pl-9"
          />
        </div>
      </div>

      <DataTable
        loading={loading}
        error={suppliers.length === 0 ? error : null}
        onRetry={() => void fetchAll()}
        loadingText="Cargando proveedores..."
        isEmpty={pageItems.length === 0}
        empty={{
          icon: <Truck />,
          title:
            suppliers.length === 0
              ? "No hay proveedores registrados."
              : "Sin resultados para la búsqueda.",
          description:
            suppliers.length === 0
              ? "Registra el primero para comenzar."
              : "Prueba con otro término.",
          action: (
            <Button
              variant="primary"
              startIcon={<Plus className="size-4" />}
              onClick={() => navigate("/commerce/suppliers/new")}
            >
              Nuevo proveedor
            </Button>
          ),
        }}
        pagination={{
          page,
          pageSize,
          totalPages,
          totalItems,
          startIndex,
          onPageChange: setPage,
          onPageSizeChange: setPageSize,
        }}
        className="min-w-125"
        colgroup={
          <colgroup>
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
              Teléfono
            </th>
            <th className="px-4 py-4 text-center text-[11px] font-semibold uppercase tracking-[0.12em] text-gray-500 dark:text-gray-400">
              Acciones
            </th>
          </tr>
        }
      >
        <tbody>
          {pageItems.map((supplier) => (
            <tr
              key={supplier.id}
              className="border-b border-gray-100 transition-colors last:border-0 hover:bg-gray-50 dark:border-gray-800/50 dark:hover:bg-white/2"
            >
              <td className="px-4 py-4 text-sm font-medium text-gray-800 dark:text-white/90">
                {supplier.name}
              </td>
              <td className="px-4 py-4 text-sm text-gray-600 dark:text-gray-300">
                {supplier.phone || "—"}
              </td>
              <td className="px-4 py-4 text-right">
                <div className="flex items-center justify-end gap-1">
                  <button
                    onClick={() => navigate(`/commerce/suppliers/${supplier.id}/edit`)}
                    className="rounded-lg p-1.5 text-gray-400 hover:bg-brand-50 hover:text-brand-600 dark:hover:bg-brand-950/30 dark:hover:text-brand-400"
                    title="Editar"
                  >
                    <Pencil className="size-4" />
                  </button>
                  <button
                    onClick={() => setDeleteConfirmId(supplier.id)}
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
      </DataTable>

      <ConfirmModal
        isOpen={deleteConfirmId !== null}
        title="Eliminar proveedor"
        message="¿Eliminar este proveedor? Esta acción no se puede deshacer."
        danger
        loading={saving}
        onConfirm={() => deleteConfirmId && handleDelete(deleteConfirmId)}
        onClose={() => setDeleteConfirmId(null)}
      />
    </PageShell>
  );
};
