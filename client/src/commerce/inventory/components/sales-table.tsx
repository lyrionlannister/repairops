import type { FC } from "react";
import type { Sale } from "../hooks/use-sales";
import { TableBody, TableRow, TableCell } from "@ui/table/table";
import { Pagination } from "@ui/table/pagination";
import { ScrollTable } from "@ui/table/scroll-table";
import { formatMoney, formatDate } from "../utils/format";

interface SalesTableProps {
  loading: boolean;
  sales: Sale[];
  filteredSales: Sale[];
  pageItems: Sale[];
  page: number;
  pageSize: number;
  totalPages: number;
  totalItems: number;
  startIndex: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
}

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
}) => (
  <div className="flex flex-1 min-h-0 flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/3">
    {loading ? (
      <div className="p-8 text-center text-sm text-gray-500 dark:text-gray-400">Cargando ventas...</div>
    ) : filteredSales.length === 0 ? (
      <div className="p-8 text-center text-sm text-gray-500 dark:text-gray-400">
        {sales.length === 0 ? "No hay ventas registradas." : "Sin resultados para la búsqueda."}
      </div>
    ) : (
      <ScrollTable
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
              <TableCell className="px-4 py-4 text-sm text-gray-500 dark:text-gray-400">#{sale.saleNumber}</TableCell>
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
