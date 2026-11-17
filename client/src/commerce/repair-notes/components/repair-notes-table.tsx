import type { FC } from "react";
import { useNavigate } from "react-router";
import { Plus, Printer, Pencil, Trash2, Ban, Eye, Wrench, CheckCircle2, HandCoins } from "lucide-react";
import type { RepairNoteRecord, RepairNoteStatus } from "../hooks/use-repair-notes";
import { NEXT_STATUS, STATUS_CONFIG } from "../hooks/use-repair-notes";
import { Button } from "@ui/button/button";
import { Pagination } from "@ui/table/pagination";
import { ScrollTable } from "@ui/table/scroll-table";
import { formatDate, formatCurrency } from "../utils/format";

interface RepairNotesTableProps {
  loading: boolean;
  error: string | null;
  notes: RepairNoteRecord[];
  filteredNotes: RepairNoteRecord[];
  pageItems: RepairNoteRecord[];
  canEditNotes: boolean;
  cancellingId: string | null;
  deletingId: string | null;
  page: number;
  pageSize: number;
  totalPages: number;
  totalItems: number;
  startIndex: number;
  onRetry: () => void;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
  onRequestCancel: (id: string) => void;
  onRequestDelete: (id: string) => void;
  advancingId: string | null;
  onAdvance: (note: RepairNoteRecord) => void;
}

const NEXT_STATUS_ICON: Record<string, FC<{ className?: string }>> = {
  in_repair: Wrench,
  done: CheckCircle2,
  delivered: HandCoins,
};

export const RepairNotesTable: FC<RepairNotesTableProps> = ({
  loading,
  error,
  notes,
  filteredNotes,
  pageItems,
  canEditNotes,
  cancellingId,
  deletingId,
  page,
  pageSize,
  totalPages,
  totalItems,
  startIndex,
  onRetry,
  onPageChange,
  onPageSizeChange,
  onRequestCancel,
  onRequestDelete,
  advancingId,
  onAdvance,
}) => {
  const navigate = useNavigate();

  return (
    <div className="flex flex-1 min-h-0 flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-theme-sm dark:border-gray-800 dark:bg-gray-900">
      {loading ? (
        <div className="flex flex-col items-center justify-center gap-4 p-10 text-center">
          <div className="h-10 w-10 animate-spin rounded-full border-2 border-brand-200 border-t-brand-600" />
          <p className="text-sm text-gray-500 dark:text-gray-400">Cargando notas...</p>
        </div>
      ) : error ? (
        <div className="flex flex-col items-center justify-center gap-4 p-10 text-center">
          <p className="text-sm text-red-500">{error}</p>
          <Button variant="secondary" onClick={onRetry}>
            Reintentar
          </Button>
        </div>
      ) : filteredNotes.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-4 p-10 text-center">
          <p className="text-base font-semibold text-gray-700 dark:text-gray-200">
            {notes.length === 0 ? "No hay notas registradas." : "Sin resultados para la búsqueda."}
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {notes.length === 0 ? "Crea la primera nota para comenzar." : "Prueba con otro cliente, equipo o estado."}
          </p>
          {canEditNotes && (
            <Button variant="primary" startIcon={<Plus className="size-4" />} onClick={() => navigate("/commerce/repair-notes/new")}>
              Nueva nota
            </Button>
          )}
        </div>
      ) : (
        <ScrollTable
          className="min-w-240"
          colgroup={
            <colgroup>
              <col className="w-16" />
              <col />
              <col />
              <col />
              <col />
              <col />
              <col className="w-56" />
            </colgroup>
          }
          header={
            <tr className="border-b border-gray-200 dark:border-gray-800">
              {["Folio", "Cliente", "Equipo", "Estado", "Recibido", "Total", "Acciones"].map((h) => (
                <th
                  key={h}
                  className="px-4 py-4 text-center text-[11px] font-semibold uppercase tracking-[0.12em] text-gray-500 dark:text-gray-400"
                >
                  {h}
                </th>
              ))}
            </tr>
          }
        >
          <tbody>
            {pageItems.map((note) => {
              const status = STATUS_CONFIG[note.status as RepairNoteStatus];
              return (
                <tr
                  key={note.id}
                  className="border-b border-gray-100 transition-colors last:border-0 hover:bg-gray-50 dark:border-gray-800/50 dark:hover:bg-white/2"
                >
                  <td className="px-4 py-4 text-sm font-semibold text-gray-800 dark:text-white/90">
                    #{note.controlNumber}
                  </td>
                  <td className="px-4 py-4">
                    <p className="text-sm font-medium text-gray-800 dark:text-white/90">{note.customerName}</p>
                    {note.contactNumber && <p className="text-xs text-gray-400">{note.contactNumber}</p>}
                  </td>
                  <td className="px-4 py-4 text-sm text-gray-600 dark:text-gray-300">
                    {note.brand} {note.model}
                  </td>
                  <td className="px-4 py-4">
                    <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${status?.className ?? ""}`}>
                      {status?.label ?? note.status}
                    </span>
                  </td>
                  <td className="px-4 py-4 text-sm text-gray-500 dark:text-gray-400">{formatDate(note.receivedAt)}</td>
                  <td className="px-4 py-4 text-sm font-medium text-gray-800 dark:text-white/90">
                    {formatCurrency(Number(note.totalValue))}
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-1">
                      {canEditNotes && NEXT_STATUS[note.status] && (() => {
                        const next = NEXT_STATUS[note.status]!;
                        const Icon = NEXT_STATUS_ICON[next.status] ?? Wrench;
                        return (
                          <button
                            title={next.label}
                            onClick={() => onAdvance(note)}
                            disabled={advancingId === note.id}
                            className="rounded-lg p-1.5 text-gray-400 hover:bg-brand-50 hover:text-brand-600 dark:hover:bg-brand-900/20 disabled:opacity-50"
                          >
                            <Icon className="size-4" />
                          </button>
                        );
                      })()}
                      <button
                        title="Ver nota"
                        onClick={() => navigate(`/commerce/repair-notes/${note.id}`)}
                        className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-700 dark:hover:bg-gray-800 dark:hover:text-white"
                      >
                        <Eye className="size-4" />
                      </button>
                      <button
                        title="Imprimir"
                        onClick={() => navigate(`/commerce/repair-notes/${note.id}/print`)}
                        className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-700 dark:hover:bg-gray-800 dark:hover:text-white"
                      >
                        <Printer className="size-4" />
                      </button>
                      {canEditNotes && (
                        <>
                          <button
                            title="Editar"
                            onClick={() => navigate(`/commerce/repair-notes/${note.id}/edit`)}
                            className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-700 dark:hover:bg-gray-800 dark:hover:text-white"
                          >
                            <Pencil className="size-4" />
                          </button>
                          {note.status !== "delivered" && note.status !== "cancelled" && (
                            <button
                              title="Cancelar"
                              onClick={() => onRequestCancel(note.id)}
                              disabled={cancellingId === note.id}
                              className="rounded-lg p-1.5 text-gray-400 hover:bg-orange-50 hover:text-orange-600 dark:hover:bg-orange-900/20 dark:hover:text-orange-400 disabled:opacity-50"
                            >
                              <Ban className="size-4" />
                            </button>
                          )}
                          <button
                            title="Eliminar"
                            onClick={() => onRequestDelete(note.id)}
                            disabled={deletingId === note.id}
                            className="rounded-lg p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/20 dark:hover:text-red-400 disabled:opacity-50"
                          >
                            <Trash2 className="size-4" />
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </ScrollTable>
      )}

      {!loading && !error && totalItems > 0 && (
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
