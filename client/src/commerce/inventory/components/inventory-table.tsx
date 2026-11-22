import type { FC } from "react";
import { useNavigate } from "react-router";
import { Boxes, Pencil, Plus, Trash2, ArrowUpDown } from "lucide-react";
import { Button } from "@ui/button/button";
import { DataTable } from "@ui/table/data-table";
import { KIND_LABELS, formatMoney } from "../utils/format";
import type { InventoryTableProps } from "../props/inventory-table-props";

export const InventoryTable: FC<InventoryTableProps> = ({
  loading,
  pageItems,
  supplierName,
  page,
  pageSize,
  totalPages,
  totalItems,
  startIndex,
  onPageChange,
  onPageSizeChange,
  onOpenMovement,
  onRequestDelete,
  showCosts,
  canManage,
  canAdjust,
}) => {
  const navigate = useNavigate();

  return (
    <DataTable
      loading={loading}
      loadingText="Cargando inventario..."
      isEmpty={pageItems.length === 0}
      empty={{
        icon: <Boxes />,
        title: "No hay productos registrados.",
        description: "Agrega el primero o importa un CSV/Excel.",
        action: canManage && (
          <Button
            variant="primary"
            startIcon={<Plus className="size-4" />}
            onClick={() => navigate("/commerce/inventory/new")}
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
        onPageChange,
        onPageSizeChange,
      }}
      className="min-w-225"
      colgroup={
        <colgroup>
          <col />
          <col />
          <col />
          {showCosts && <col />}
          {showCosts && <col />}
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
            SKU
          </th>
          <th className="px-4 py-4 text-center text-[11px] font-semibold uppercase tracking-[0.12em] text-gray-500 dark:text-gray-400">
            Tipo
          </th>
          {showCosts && (
            <>
              <th className="px-4 py-4 text-center text-[11px] font-semibold uppercase tracking-[0.12em] text-gray-500 dark:text-gray-400">
                Proveedor
              </th>
              <th className="px-4 py-4 text-center text-[11px] font-semibold uppercase tracking-[0.12em] text-gray-500 dark:text-gray-400">
                Costo
              </th>
            </>
          )}
          <th className="px-4 py-4 text-center text-[11px] font-semibold uppercase tracking-[0.12em] text-gray-500 dark:text-gray-400">
            Venta
          </th>
          <th className="px-4 py-4 text-center text-[11px] font-semibold uppercase tracking-[0.12em] text-gray-500 dark:text-gray-400">
            Stock
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
            <td className="px-4 py-4 text-sm font-medium text-gray-800 dark:text-white/90">
              {item.name}
            </td>
            <td className="px-4 py-4 text-sm text-gray-500 dark:text-gray-400">
              {item.sku ?? "—"}
            </td>
            <td className="px-4 py-4 text-sm text-gray-500 dark:text-gray-400">
              {KIND_LABELS[item.kind]}
            </td>
            {showCosts && (
              <>
                <td className="px-4 py-4 text-sm text-gray-500 dark:text-gray-400">
                  {supplierName(item.supplierId)}
                </td>
                <td className="px-4 py-4 text-right text-sm text-gray-700 dark:text-gray-300 tabular-nums">
                  {formatMoney(item.costPrice)}
                </td>
              </>
            )}
            <td className="px-4 py-4 text-right text-sm text-gray-700 dark:text-gray-300 tabular-nums">
              {formatMoney(item.salePrice)}
            </td>
            <td className="px-4 py-4 text-right text-sm tabular-nums">
              <span
                className={
                  item.quantityOnHand <= 0
                    ? "text-error-500 font-medium"
                    : "text-gray-700 dark:text-gray-300"
                }
              >
                {item.quantityOnHand}
              </span>
            </td>
            <td className="px-4 py-4 text-right">
              <div className="flex items-center justify-end gap-1">
                {canAdjust && (
                  <button
                    onClick={() => onOpenMovement(item)}
                    title="Registrar movimiento"
                    className="rounded-lg p-1.5 text-gray-400 hover:bg-brand-50 hover:text-brand-600 dark:hover:bg-brand-950/30"
                  >
                    <ArrowUpDown className="size-4" />
                  </button>
                )}
                {canManage && (
                  <>
                    <button
                      onClick={() => navigate(`/commerce/inventory/${item.id}/edit`)}
                      className="rounded-lg p-1.5 text-gray-400 hover:bg-brand-50 hover:text-brand-600 dark:hover:bg-brand-950/30"
                    >
                      <Pencil className="size-4" />
                    </button>
                    <button
                      onClick={() => onRequestDelete(item.id)}
                      className="rounded-lg p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-950/30"
                    >
                      <Trash2 className="size-4" />
                    </button>
                  </>
                )}
              </div>
            </td>
          </tr>
        ))}
      </tbody>
    </DataTable>
  );
};
