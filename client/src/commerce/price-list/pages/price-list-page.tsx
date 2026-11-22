import { useEffect } from "react";
import { useNavigate, useLocation } from "react-router";
import { Tags, Upload, Plus, Pencil, Trash2, Search, PackagePlus } from "lucide-react";

import { usePriceList } from "../hooks/use-price-list";
import { usePriceListPage } from "../hooks/use-price-list-page";
import { useSuppliers } from "@commerce/suppliers/hooks/use-suppliers";
import { Button } from "@ui/button/button";
import { ConfirmModal } from "@ui/modal/confirm-modal";
import { DataTable } from "@ui/table/data-table";
import { Select } from "@ui/select/select";
import { PageShell } from "@common/components/page-shell/page-shell";
import { usePaginatedList } from "@common/hooks/use-paginated-list";
import { formatPrice } from "../utils/format";

export const PriceListPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { items, loading, saving, fetchAll, remove } = usePriceList();
  const { suppliers, fetchAll: fetchSuppliers } = useSuppliers();

  useEffect(() => {
    fetchAll();
    fetchSuppliers();
  }, [fetchAll, fetchSuppliers]);

  const initialSuccessMessage =
    location.state?.imported !== undefined
      ? `PDF importado: ${location.state.imported} productos cargados.`
      : null;

  const {
    deleteConfirmId,
    setDeleteConfirmId,
    search,
    setSearch,
    activeBrand,
    setActiveBrand,
    activeSupplier,
    setActiveSupplier,
    brands,
    filtered,
    handleDelete,
  } = usePriceListPage({
    items,
    remove,
    initialSuccessMessage,
  });

  const { page, setPage, pageSize, setPageSize, totalPages, totalItems, startIndex, pageItems } =
    usePaginatedList(filtered);

  return (
    <PageShell
      title="Lista de Precios"
      description={
        items.length > 0 ? `${items.length} productos en total.` : "Aún no hay productos."
      }
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
      <div className="shrink-0 rounded-2xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-white/3">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative max-w-xs flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 z-10 size-4 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar modelo..."
              value={search}
              onChange={(event) => {
                setSearch(event.target.value);
                setPage(1);
              }}
              className="w-full rounded-lg border border-gray-300 bg-white py-2.5 pl-9 pr-4 text-sm text-gray-800 placeholder:text-gray-400 focus:border-brand-300 focus:outline-none dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200"
            />
          </div>
          <Select
            value={activeSupplier}
            onChange={(value) => {
              setActiveSupplier(value);
              setPage(1);
            }}
            className="sm:w-56"
            options={["Todos", ...suppliers.map((supplier) => supplier.name)].map((supplier) => ({
              value: supplier,
              label: supplier,
            }))}
          />
        </div>
        <div className="mt-3 flex flex-wrap gap-1.5">
          {brands.map((brand) => (
            <button
              key={brand}
              onClick={() => {
                setActiveBrand(brand);
                setPage(1);
              }}
              className={`rounded-full px-3 py-3 text-xs md:py-1 font-medium transition-colors ${
                activeBrand === brand
                  ? "bg-brand-600 text-white dark:bg-brand-500"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
              }`}
            >
              {brand}
            </button>
          ))}
        </div>
      </div>

      <DataTable
        loading={loading}
        loadingText="Cargando lista de precios..."
        isEmpty={pageItems.length === 0}
        empty={{
          icon: <Tags />,
          title:
            items.length === 0
              ? "No hay productos en la lista de precios."
              : "Sin resultados para la búsqueda.",
          description:
            items.length === 0
              ? "Importa un PDF o agrega uno manualmente."
              : "Prueba con otra marca, proveedor o término.",
          action: (
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
          page,
          pageSize,
          totalPages,
          totalItems,
          startIndex,
          onPageChange: setPage,
          onPageSizeChange: setPageSize,
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
          {pageItems.map((item) => (
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
                    className="rounded-lg p-1.5 text-gray-400 hover:bg-brand-50 hover:text-brand-600 dark:hover:bg-brand-950/30"
                  >
                    <PackagePlus className="size-4" />
                  </button>
                  <button
                    onClick={() => navigate(`/commerce/price-list/${item.id}/edit`)}
                    className="rounded-lg p-1.5 text-gray-400 hover:bg-brand-50 hover:text-brand-600 dark:hover:bg-brand-950/30"
                  >
                    <Pencil className="size-4" />
                  </button>
                  <button
                    onClick={() => setDeleteConfirmId(item.id)}
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
