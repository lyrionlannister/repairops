import type { FC } from "react";
import { useNavigate } from "react-router";
import { FileText, Pencil, Trash2, Check, X, Wrench } from "lucide-react";
import { TableBody, TableRow, TableCell } from "@ui/table/table";
import { Pagination } from "@ui/table/pagination";
import { ScrollTable } from "@ui/table/scroll-table";
import { STATUS_CONFIG, formatDate, formatCurrency } from "../utils/format";
import type { QuotesTableProps } from "../props/quotes-table-props";

export const QuotesTable: FC<QuotesTableProps> = ({
  canEdit,
  canDelete,
  loading,
  quotes,
  filteredQuotes,
  pageItems,
  deletingId,
  page,
  pageSize,
  totalPages,
  totalItems,
  startIndex,
  onPageChange,
  onPageSizeChange,
  onStatusChange,
  onRequestDelete,
}) => {
  const navigate = useNavigate();

  return (
    <div className="flex flex-1 min-h-0 flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/3">
      {loading ? (
        <div className="p-8 text-center text-sm text-gray-500 dark:text-gray-400">Cargando cotizaciones...</div>
      ) : filteredQuotes.length === 0 ? (
        <div className="p-8 text-center text-sm text-gray-500 dark:text-gray-400">
          {quotes.length === 0 ? "No hay cotizaciones registradas." : "Sin resultados para la búsqueda."}
        </div>
      ) : (
        <ScrollTable
          className="min-w-175"
          colgroup={
            <colgroup>
              <col />
              <col className="w-24" />
              <col className="w-32" />
              <col className="w-32" />
              <col className="w-28" />
              <col className="w-52" />
            </colgroup>
          }
          header={
            <TableRow className="border-b border-gray-200 dark:border-gray-800">
              {["Cliente", "Tipo", "Estado", "Válida hasta", "Total", "Acciones"].map((h) => (
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
            {pageItems.map((quote) => {
              const status = STATUS_CONFIG[quote.status];
              return (
                <TableRow
                  key={quote.id}
                  className="border-b border-gray-100 transition-colors last:border-0 hover:bg-gray-50 dark:border-gray-800/50 dark:hover:bg-white/2"
                >
                  <TableCell className="px-4 py-4">
                    <p className="text-sm font-medium text-gray-800 dark:text-white/90">{quote.customerName}</p>
                    {quote.contactNumber && <p className="text-xs text-gray-400">{quote.contactNumber}</p>}
                  </TableCell>
                  <TableCell className="px-4 py-4 text-sm text-gray-500 dark:text-gray-400">
                    {quote.kind === "repair" ? "Reparación" : "Producto"}
                  </TableCell>
                  <TableCell className="px-4 py-4">
                    <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${status.className}`}>
                      {status.label}
                    </span>
                  </TableCell>
                  <TableCell className="px-4 py-4 text-sm text-gray-500 dark:text-gray-400">
                    {formatDate(quote.validUntil)}
                  </TableCell>
                  <TableCell className="px-4 py-4 text-sm font-medium text-gray-800 dark:text-white/90">
                    {formatCurrency(Number(quote.totalValue))}
                  </TableCell>
                  <TableCell className="px-4 py-4">
                    <div className="flex items-center gap-1">
                      {canEdit && quote.status === "pending" && (
                        <>
                          <button
                            title="Aceptar"
                            onClick={() => onStatusChange(quote.id, "accepted")}
                            className="rounded-lg p-1.5 text-gray-400 hover:bg-green-50 hover:text-green-600 dark:hover:bg-green-900/20"
                          >
                            <Check className="size-4" />
                          </button>
                          <button
                            title="Rechazar"
                            onClick={() => onStatusChange(quote.id, "rejected")}
                            className="rounded-lg p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/20"
                          >
                            <X className="size-4" />
                          </button>
                        </>
                      )}
                      {quote.status === "accepted" && quote.kind === "repair" && quote.repairNoteId && (
                        <button
                          title="Ver nota de reparación"
                          onClick={() => navigate(`/commerce/repair-notes/${quote.repairNoteId}`)}
                          className="rounded-lg p-1.5 text-gray-400 hover:bg-brand-50 hover:text-brand-600 dark:hover:bg-brand-900/20"
                        >
                          <Wrench className="size-4" />
                        </button>
                      )}
                      <button
                        title="Ver / Descargar PDF"
                        onClick={() => navigate(`/commerce/quotes/${quote.id}/print`)}
                        className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-700 dark:hover:bg-gray-800 dark:hover:text-white"
                      >
                        <FileText className="size-4" />
                      </button>
                      {canEdit && (
                      <button
                        title="Editar"
                        onClick={() => navigate(`/commerce/quotes/${quote.id}/edit`)}
                        className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-700 dark:hover:bg-gray-800 dark:hover:text-white"
                      >
                        <Pencil className="size-4" />
                      </button>
                      )}
                      {canDelete && (
                      <button
                        title="Eliminar"
                        onClick={() => onRequestDelete(quote.id)}
                        disabled={deletingId === quote.id}
                        className="rounded-lg p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/20 dark:hover:text-red-400 disabled:opacity-50"
                      >
                        <Trash2 className="size-4" />
                      </button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
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
};
