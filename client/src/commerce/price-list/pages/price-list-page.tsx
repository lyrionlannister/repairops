import { useEffect } from "react";
import { useNavigate, useLocation } from "react-router";
import { Tags, Upload, Plus, Pencil, Trash2, Search, PackagePlus } from "lucide-react";

import { usePriceList } from "../hooks/use-price-list";
import { ALL_OPTION, usePriceListPage } from "../hooks/use-price-list-page";
import { Alert } from "@ui/alert/alert";
import { useSuppliers } from "@commerce/suppliers/hooks/use-suppliers";
import { Button } from "@ui/button/button";
import { ConfirmModal } from "@ui/modal/confirm-modal";
import { DataTable } from "@ui/table/data-table";
import { Select } from "@ui/select/select";
import { PageShell } from "@common/components/page-shell/page-shell";
import { formatPrice, priceListDescription } from "../utils/format";

export const PriceListPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { saving, remove } = usePriceList();
  const { suppliers, fetchAll: fetchSuppliers } = useSuppliers();

  useEffect(() => {
    fetchSuppliers();
  }, [fetchSuppliers]);

  const initialSuccessMessage =
    location.state?.imported !== undefined
      ? `PDF importado: ${location.state.imported} productos cargados.`
      : null;

  const {
    list,
    deleteConfirmId,
    setDeleteConfirmId,
    successMsg,
    search,
    setSearch,
    activeBrand,
    setActiveBrand,
    activeSupplierId,
    setActiveSupplierId,
    brands,
    hasFilters,
    handleDelete,
  } = usePriceListPage({ remove, initialSuccessMessage });

  return (
    <PageShell
      title="Lista de Precios"
      description={priceListDescription(list.total, hasFilters, list.loading)}
      action={
        <div className="flex shrink-0 gap-2">
          <Button variant="outline" onClick={() => navigate("/commerce/price-list/import")}>
            <Upload className="mr-1.5 size-4" />
            Importar PDF
          </Button>
          <Button variant="primary" onClick={() => navigate("/commerce/price-list/new")}>
            <Plus className="mr-1.5 size-4" />
            Nuevo producto
          </Button>
        </div>
      }
    >
      {successMsg && <Alert variant="success" title="Listo" message={successMsg} />}
      <div className="shrink-0 rounded-2xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-white/3">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative max-w-xs flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 z-10 size-4 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar marca o modelo..."
              aria-label="Buscar en la lista de precios"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              className="w-full rounded-lg border border-gray-300 bg-white py-2.5 pl-9 pr-4 text-sm text-gray-800 placeholder:text-gray-400 focus:border-brand-300 focus:outline-none dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200"
            />
          </div>
          <Select
            value={activeSupplierId}
            onChange={setActiveSupplierId}
            className="sm:w-56"
            options={[
              { value: ALL_OPTION, label: "Todos los proveedores" },
              ...suppliers.map((supplier) => ({ value: supplier.id, label: supplier.name })),
            ]}
          />
        </div>
        <div className="mt-3 flex flex-wrap gap-1.5">
          {[ALL_OPTION, ...brands].map((brand) => (
            <button
              key={brand || "all"}
              onClick={() => setActiveBrand(brand)}
              className={`rounded-full px-3 py-3 text-xs md:py-1 font-medium transition-colors ${
                activeBrand === brand
                  ? "bg-brand-600 text-white dark:bg-brand-500"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
              }`}
            >
              {brand || "Todas"}
            </button>
          ))}
        </div>
      </div>

      <DataTable
        loading={list.loading}
        error={list.items.length === 0 ? list.error : null}
        onRetry={() => void list.refetch()}
        loadingText="Cargando lista de precios..."
        isEmpty={list.items.length === 0}
        empty={{
          icon: <Tags />,
          title: hasFilters ? "Sin resultados para la búsqueda." : "No hay productos en la lista de precios.",
          description: hasFilters
            ? "Prueba con otra marca, proveedor o término."
            : "Importa un PDF o agrega uno manualmente.",
          action: !hasFilters && (
            <Button
              variant="primary"
              startIcon={<Plus className="size-4" />}
              onClick={() => navigate("/commerce/price-list/new")}
            >
              Nuevo producto
            </Button>
          ),
        }}
        pagination={{
          page: list.page,
          pageSize: list.pageSize,
          totalPages: list.totalPages,
          totalItems: list.total,
          startIndex: list.startIndex,
          onPageChange: list.setPage,
          onPageSizeChange: list.setPageSize,
        }}
        className="min-w-225"
        colgroup={
          <colgroup>
            <col />
            <col />
            <col className="w-36" />
            <col className="w-36" />
            <col className="w-44" />
          </colgroup>
        }
        header={
          <tr className="border-b border-gray-200 dark:border-gray-800">
            <th className="px-4 py-4 text-center text-[11px] font-semibold uppercase tracking-[0.12em] text-gray-500 dark:text-gray-400">
              Marca
            </th>
            <th className="px-4 py-4 text-center text-[11px] font-semibold uppercase tracking-[0.12em] text-gray-500 dark:text-gray-400">
              Modelo
            </th>
            <th className="px-4 py-4 text-center text-[11px] font-semibold uppercase tracking-[0.12em] text-gray-500 dark:text-gray-400">
              Proveedor
            </th>
            <th className="px-4 py-4 text-center text-[11px] font-semibold uppercase tracking-[0.12em] text-gray-500 dark:text-gray-400">
              Precio
            </th>
            <th className="px-4 py-4 text-center text-[11px] font-semibold uppercase tracking-[0.12em] text-gray-500 dark:text-gray-400">
              Acciones
            </th>
          </tr>
        }
      >
        <tbody>
          {list.items.map((item) => (
            <tr
              key={item.id}
              className="border-b border-gray-100 transition-colors last:border-0 hover:bg-gray-50 dark:border-gray-800/50 dark:hover:bg-white/2"
            >
              <td className="px-4 py-4 text-sm text-gray-500 dark:text-gray-400">{item.brand}</td>
              <td className="px-4 py-4 text-sm font-medium text-gray-800 dark:text-white/90">
                {item.model}
              </td>
              <td className="px-4 py-4 text-sm text-gray-500 dark:text-gray-400">
                {item.supplier?.name ?? "—"}
              </td>
              <td className="px-4 py-4 text-right text-sm text-gray-700 dark:text-gray-300 tabular-nums">
                {formatPrice(item.price)}
              </td>
              <td className="px-4 py-4 text-right">
                <div className="flex items-center justify-end gap-1">
                  <button
                    onClick={() =>
                      navigate("/commerce/inventory/new", {
                        state: {
                          prefillFromPriceList: {
                            name: `${item.brand} ${item.model}`,
                            costPrice: String(item.price),
                            supplierId: item.supplierId,
                          },
                        },
                      })
                    }
                    title="Agregar a inventario"
                    aria-label="Agregar a inventario"
                    className="rounded-lg p-1.5 text-gray-400 hover:bg-brand-50 hover:text-brand-600 dark:hover:bg-brand-950/30"
                  >
                    <PackagePlus className="size-4" />
                  </button>
                  <button
                    onClick={() => navigate(`/commerce/price-list/${item.id}/edit`)}
                    title="Editar"
                    aria-label="Editar"
                    className="rounded-lg p-1.5 text-gray-400 hover:bg-brand-50 hover:text-brand-600 dark:hover:bg-brand-950/30"
                  >
                    <Pencil className="size-4" />
                  </button>
                  <button
                    onClick={() => setDeleteConfirmId(item.id)}
                    title="Eliminar"
                    aria-label="Eliminar"
                    className="rounded-lg p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-950/30"
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
        title="Eliminar producto"
        message="¿Eliminar este producto de la lista de precios? Esta acción no se puede deshacer."
        danger
        loading={saving}
        onConfirm={() => deleteConfirmId && handleDelete(deleteConfirmId)}
        onClose={() => setDeleteConfirmId(null)}
      />
    </PageShell>
  );
};
