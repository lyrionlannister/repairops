import type { FC } from "react";
import { useNavigate } from "react-router";
import { FileText, Pencil, Plus, Trash2, Check, X, Wrench } from "lucide-react";
import { Button } from "@ui/button/button";
import { TableBody, TableRow, TableCell } from "@ui/table/table";
import { DataTable } from "@ui/table/data-table";
import { STATUS_CONFIG, formatDate, formatCurrency } from "../utils/format";
import type { QuotesTableProps } from "../props/quotes-table-props";

export const QuotesTable: FC<QuotesTableProps> = ({
  error,
  onRetry,
  canEdit,
  canDelete,
  loading,
  hasFilters,
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
    <DataTable
      error={error}
      onRetry={onRetry}
      loading={loading}
      loadingText="Cargando cotizaciones..."
      isEmpty={pageItems.length === 0}
      empty={{
        icon: <FileText />,
        title: hasFilters ? "Sin resultados para la búsqueda." : "No hay cotizaciones registradas.",
        description: hasFilters
          ? "Prueba con otro cliente, folio, equipo o estado."
          : "Crea la primera cotización para comenzar.",
        action: canEdit && !hasFilters && (
          <Button
            variant="primary"
            startIcon={<Plus className="size-4" />}
            onClick={() => navigate("/commerce/quotes/new")}
          >
            Nueva cotización
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
          <col className="w-20" />
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
          {["Folio", "Cliente", "Tipo", "Estado", "Válida hasta", "Total", "Acciones"].map((h) => (
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
              <TableCell className="px-4 py-4 text-sm text-gray-500 dark:text-gray-400">
                #{quote.quoteNumber}
              </TableCell>
              <TableCell className="px-4 py-4">
                <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                  {quote.customerName}
                </p>
                {quote.contactNumber && (
                  <p className="text-xs text-gray-400">{quote.contactNumber}</p>
                )}
              </TableCell>
              <TableCell className="px-4 py-4 text-sm text-gray-500 dark:text-gray-400">
                {quote.kind === "repair" ? "Reparación" : "Producto"}
              </TableCell>
              <TableCell className="px-4 py-4">
                <span
                  className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${status.className}`}
                >
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
    </DataTable>
  );
};
