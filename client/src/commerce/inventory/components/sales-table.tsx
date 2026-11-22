import type { FC } from "react";
import { useNavigate } from "react-router";
import { Plus, ShoppingCart } from "lucide-react";
import { Button } from "@ui/button/button";
import { TableBody, TableRow, TableCell } from "@ui/table/table";
import { DataTable } from "@ui/table/data-table";
import { formatMoney, formatDate } from "../utils/format";
import type { SalesTableProps } from "../props/sales-table-props";

export const SalesTable: FC<SalesTableProps> = ({
  loading,
  sales,
  filteredSales,
  pageItems,
  page,
  pageSize,
  totalPages,
  totalItems,
  startIndex,
  onPageChange,
  onPageSizeChange,
}) => {
  const navigate = useNavigate();

  return (
    <DataTable
      loading={loading}
      loadingText="Cargando ventas..."
      isEmpty={filteredSales.length === 0}
      empty={{
        icon: <ShoppingCart />,
        title:
          sales.length === 0 ? "No hay ventas registradas." : "Sin resultados para la búsqueda.",
        description:
          sales.length === 0
            ? "Las ventas aparecerán aquí al cobrarlas."
            : "Prueba con otro término.",
        action: (
          <Button
            variant="primary"
            startIcon={<Plus className="size-4" />}
            onClick={() => navigate("/commerce/sales/new")}
          >
            Venta rápida
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
      className="min-w-160"
      colgroup={
        <colgroup>
          <col className="w-24" />
          <col />
          <col className="w-32" />
          <col className="w-44" />
        </colgroup>
      }
      header={
        <TableRow className="border-b border-gray-200 dark:border-gray-800">
          {["Folio", "Cliente", "Total", "Fecha"].map((h) => (
            <TableCell
              key={h}
              isHeader
              className="px-4 py-4 text-center text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400"
            >
              {h}
            </TableCell>
          ))}
        </TableRow>
      }
    >
      <TableBody>
        {pageItems.map((sale) => (
          <TableRow
            key={sale.id}
            className="border-b border-gray-100 transition-colors last:border-0 hover:bg-gray-50 dark:border-gray-800/50 dark:hover:bg-white/2"
          >
            <TableCell className="px-4 py-4 text-sm text-gray-500 dark:text-gray-400">
              #{sale.saleNumber}
            </TableCell>
            <TableCell className="px-4 py-4 text-sm font-medium text-gray-800 dark:text-white/90">
              {sale.customerName ?? "Mostrador"}
            </TableCell>
            <TableCell className="px-4 py-4 text-sm font-medium text-gray-800 dark:text-white/90">
              {formatMoney(sale.totalValue)}
            </TableCell>
            <TableCell className="px-4 py-4 text-sm text-gray-500 dark:text-gray-400">
              {formatDate(sale.createdAt)}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </DataTable>
  );
};
