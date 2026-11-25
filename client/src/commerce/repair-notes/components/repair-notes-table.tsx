import type { FC } from "react";
import { describeDevices } from "../utils/devices";
import { useNavigate } from "react-router";
import {
  Plus,
  Printer,
  Pencil,
  Trash2,
  Ban,
  Eye,
  Wrench,
  CheckCircle2,
  HandCoins,
} from "lucide-react";
import { NEXT_STATUS, STATUS_CONFIG } from "../hooks/use-repair-notes";
import { Button } from "@ui/button/button";
import { DataTable } from "@ui/table/data-table";
import { formatDate, formatCurrency } from "../utils/format";
import type { RepairNoteStatus } from "../types/repair-notes";
import type { RepairNotesTableProps } from "../props/repair-notes-table-props";

const NEXT_STATUS_ICON: Record<string, FC<{ className?: string }>> = {
  in_repair: Wrench,
  done: CheckCircle2,
  delivered: HandCoins,
};

export const RepairNotesTable: FC<RepairNotesTableProps> = ({
  loading,
  error,
  hasFilters,
  pageItems,
  canEditNotes,
  canCreateNotes,
  canCancelNotes,
  canDeleteNotes,
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
    <DataTable
      loading={loading}
      loadingText="Cargando notas..."
      error={error}
      onRetry={onRetry}
      isEmpty={pageItems.length === 0}
      empty={{
        icon: <Wrench />,
        title: !hasFilters ? "No hay notas registradas." : "Sin resultados para la búsqueda.",
        description: !hasFilters
          ? "Crea la primera nota para comenzar."
          : "Prueba con otro cliente, equipo o estado.",
        action: canCreateNotes && !hasFilters && (
          <Button
            variant="primary"
            startIcon={<Plus className="size-4" />}
            onClick={() => navigate("/commerce/repair-notes/new")}
          >
            Nueva nota
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
                <div>
                  <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                    {note.customerName}
                  </p>
                  {note.contactNumber && (
                    <p className="text-xs text-gray-400">{note.contactNumber}</p>
                  )}
                </div>
              </td>
              <td className="px-4 py-4 text-sm text-gray-600 dark:text-gray-300">
                {describeDevices(note.devices)}
              </td>
              <td className="px-4 py-4">
                <span
                  className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${status?.className ?? ""}`}
                >
                  {status?.label ?? note.status}
                </span>
              </td>
              <td className="px-4 py-4 text-sm text-gray-500 dark:text-gray-400">
                {formatDate(note.receivedAt)}
              </td>
              <td className="px-4 py-4 text-sm font-medium text-gray-800 dark:text-white/90">
                {formatCurrency(Number(note.totalValue))}
              </td>
              <td className="px-4 py-4">
                <div className="flex items-center gap-1">
                  {canEditNotes &&
                    NEXT_STATUS[note.status] &&
                    (() => {
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
                    aria-label="Ver nota"
                    onClick={() => navigate(`/commerce/repair-notes/${note.id}`)}
                    className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-700 dark:hover:bg-gray-800 dark:hover:text-white"
                  >
                    <Eye className="size-4" />
                  </button>
                  <button
                    title="Imprimir"
                    aria-label="Imprimir"
                    onClick={() => navigate(`/commerce/repair-notes/${note.id}/print`)}
                    className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-700 dark:hover:bg-gray-800 dark:hover:text-white"
                  >
                    <Printer className="size-4" />
                  </button>
                  {canEditNotes && (
                    <>
                      {note.status !== "cancelled" && (
                        <button
                          title="Editar"
                          aria-label="Editar"
                          onClick={() => navigate(`/commerce/repair-notes/${note.id}/edit`)}
                          className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-700 dark:hover:bg-gray-800 dark:hover:text-white"
                        >
                          <Pencil className="size-4" />
                        </button>
                      )}
                      {canCancelNotes &&
                        note.status !== "delivered" &&
                        note.status !== "cancelled" && (
                          <button
                            title="Cancelar"
                            aria-label="Cancelar"
                            onClick={() => onRequestCancel(note.id)}
                            disabled={cancellingId === note.id}
                            className="rounded-lg p-1.5 text-gray-400 hover:bg-orange-50 hover:text-orange-600 dark:hover:bg-orange-900/20 dark:hover:text-orange-400 disabled:opacity-50"
                          >
                            <Ban className="size-4" />
                          </button>
                        )}
                      {canDeleteNotes && note.status !== "done" && note.status !== "delivered" && (
                        <button
                          title="Eliminar"
                          aria-label="Eliminar"
                          onClick={() => onRequestDelete(note.id)}
                          disabled={deletingId === note.id}
                          className="rounded-lg p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/20 dark:hover:text-red-400 disabled:opacity-50"
                        >
                          <Trash2 className="size-4" />
                        </button>
                      )}
                    </>
                  )}
                </div>
              </td>
            </tr>
          );
        })}
      </tbody>
    </DataTable>
  );
};
