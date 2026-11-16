import { useEffect } from "react";
import { useNavigate } from "react-router";
import { Plus, Printer, Pencil, Trash2, Search, Ban } from "lucide-react";
import { useRepairNotes } from "../hooks/use-repair-notes";
import { useRepairNotesPage } from "../hooks/use-repair-notes-page";
import { STATUS_CONFIG } from "../types/repair-note.types";
import type { RepairNoteStatus } from "../types/repair-note.types";
import Button from "@ui/button/button";
import Pagination from "@ui/table/pagination";
import ScrollTable from "@ui/table/scroll-table";
import PageShell from "@common/components/page-shell/page-shell";
import ConfirmModal from "@ui/modal/confirm-modal";
import usePaginatedList from "@common/hooks/use-paginated-list";
import { useCurrentUser } from "@common/hooks/use-current-user";

const formatDate = (dateStr?: string) => {
  if (!dateStr) return "—";
  const [y, m, d] = dateStr.split("-");
  return `${d}/${m}/${y}`;
};

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN" }).format(value);

const RepairNotesPage: React.FC = () => {
  const navigate = useNavigate();
  const currentUser = useCurrentUser();
  // Un cajero no edita diagnósticos de reparación, ni por pantalla ni por
  // API (requireRole en repair-note.routes.ts bloquea el lado de API).
  const canEditNotes = currentUser?.role !== "cashier";
  const { notes, loading, error, fetchNotes, deleteNote, cancelNote } = useRepairNotes();
  const {
    search,
    setSearch,
    statusFilter,
    setStatusFilter,
    deletingId,
    cancellingId,
    filteredNotes,
    confirmDeleteId,
    setConfirmDeleteId,
    confirmCancelId,
    setConfirmCancelId,
    confirmDelete,
    confirmCancel,
  } = useRepairNotesPage({ notes, deleteNote, cancelNote });

  const { page, setPage, pageSize, setPageSize, totalPages, totalItems, startIndex, pageItems } =
    usePaginatedList(filteredNotes);

  useEffect(() => {
    fetchNotes();
  }, [fetchNotes]);

  return (
    <PageShell
      title="Notas de Reparación"
      description="Gestiona el taller de reparación de celulares."
      action={
        canEditNotes ? (
          <Button
            variant="primary"
            startIcon={<Plus className="size-4" />}
            onClick={() => navigate("/admin/repair-notes/new")}
          >
            Nueva nota
          </Button>
        ) : undefined
      }
    >
      <div className="flex flex-col gap-3 rounded-2xl border border-gray-200 bg-white p-3 shadow-theme-sm sm:flex-row sm:items-center dark:border-gray-800 dark:bg-gray-900">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 z-10 -translate-y-1/2 size-4 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar por cliente, equipo o # control..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="w-full rounded-xl border border-gray-200 bg-gray-50 py-2.5 pl-9 pr-4 text-sm text-gray-800 placeholder:text-gray-400 focus:border-brand-300 focus:outline-none focus:ring-2 focus:ring-brand-500/20 dark:border-gray-700 dark:bg-gray-950/60 dark:text-white/90 dark:placeholder:text-gray-500"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value as RepairNoteStatus | "all"); setPage(1); }}
          className="rounded-xl border border-gray-200 bg-gray-50 py-2.5 px-3 text-sm text-gray-800 focus:border-brand-300 focus:outline-none focus:ring-2 focus:ring-brand-500/20 dark:border-gray-700 dark:bg-gray-950/60 dark:text-white/90"
        >
          <option value="all">Todos los estados</option>
          <option value="received">Recibido</option>
          <option value="in_repair">En Reparación</option>
          <option value="done">Listo</option>
          <option value="delivered">Entregado</option>
          <option value="cancelled">Cancelado</option>
        </select>
      </div>

      <div className="flex flex-1 min-h-0 flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-theme-sm dark:border-gray-800 dark:bg-gray-900">
        {loading ? (
          <div className="flex flex-col items-center justify-center gap-4 p-10 text-center">
            <div className="h-10 w-10 animate-spin rounded-full border-2 border-brand-200 border-t-brand-600" />
            <p className="text-sm text-gray-500 dark:text-gray-400">Cargando notas...</p>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center gap-4 p-10 text-center">
            <p className="text-sm text-red-500">{error}</p>
            <Button variant="secondary" onClick={fetchNotes}>Reintentar</Button>
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
              <Button
                variant="primary"
                startIcon={<Plus className="size-4" />}
                onClick={() => navigate("/admin/repair-notes/new")}
              >
                Nueva nota
              </Button>
            )}
          </div>
        ) : (
          <ScrollTable
            colgroup={
              <colgroup>
                <col className="w-16" />
                <col />
                <col />
                <col />
                <col />
                <col />
                <col className="w-44" />
              </colgroup>
            }
            header={
              <tr className="border-b border-gray-200 dark:border-gray-800">
                {["#", "Cliente", "Equipo", "Estado", "Recibido", "Total", "Acciones"].map((h) => (
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
                      <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                        {note.customerName}
                      </p>
                      {note.contactNumber && (
                        <p className="text-xs text-gray-400">{note.contactNumber}</p>
                      )}
                    </td>
                    <td className="px-4 py-4 text-sm text-gray-600 dark:text-gray-300">
                      {note.brand} {note.model}
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
                        <button
                          title="Imprimir"
                          onClick={() => navigate(`/admin/repair-notes/${note.id}/print`)}
                          className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-700 dark:hover:bg-gray-800 dark:hover:text-white"
                        >
                          <Printer className="size-4" />
                        </button>
                        {canEditNotes && (
                          <>
                            <button
                              title="Editar"
                              onClick={() => navigate(`/admin/repair-notes/${note.id}/edit`)}
                              className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-700 dark:hover:bg-gray-800 dark:hover:text-white"
                            >
                              <Pencil className="size-4" />
                            </button>
                            {note.status !== "delivered" && note.status !== "cancelled" && (
                              <button
                                title="Cancelar"
                                onClick={() => setConfirmCancelId(note.id)}
                                disabled={cancellingId === note.id}
                                className="rounded-lg p-1.5 text-gray-400 hover:bg-orange-50 hover:text-orange-600 dark:hover:bg-orange-900/20 dark:hover:text-orange-400 disabled:opacity-50"
                              >
                                <Ban className="size-4" />
                              </button>
                            )}
                            <button
                              title="Eliminar"
                              onClick={() => setConfirmDeleteId(note.id)}
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
                onChange={(event) => setPageSize(Number(event.target.value))}
                className="h-9 rounded-lg border border-gray-300 bg-white px-2 text-sm text-gray-700 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300"
              >
                {[10, 25, 50].map((size) => (
                  <option key={size} value={size}>{size}</option>
                ))}
              </select>
              <span>
                Mostrando {startIndex + 1}–{Math.min(startIndex + pageSize, totalItems)} de {totalItems}
              </span>
            </div>
            <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} />
          </div>
        )}
      </div>

      <ConfirmModal
        isOpen={Boolean(confirmCancelId)}
        title="Cancelar nota"
        message="¿Cancelar esta nota? El cliente decidió no tomar el servicio. Si tenía items de inventario, el stock se revierte."
        confirmLabel="Cancelar nota"
        danger
        loading={cancellingId === confirmCancelId}
        onConfirm={confirmCancel}
        onClose={() => setConfirmCancelId(null)}
      />

      <ConfirmModal
        isOpen={Boolean(confirmDeleteId)}
        title="Eliminar nota"
        message="¿Eliminar esta nota de reparación? Esta acción no se puede deshacer."
        confirmLabel="Eliminar"
        danger
        loading={deletingId === confirmDeleteId}
        onConfirm={confirmDelete}
        onClose={() => setConfirmDeleteId(null)}
      />
    </PageShell>
  );
};

export default RepairNotesPage;
