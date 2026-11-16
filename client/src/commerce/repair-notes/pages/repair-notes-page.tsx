import { useEffect } from "react";
import { useNavigate } from "react-router";
import { Plus } from "lucide-react";
import { useRepairNotes } from "../hooks/use-repair-notes";
import { useRepairNotesPage } from "../hooks/use-repair-notes-page";
import { Button } from "@ui/button/button";
import { PageShell } from "@common/components/page-shell/page-shell";
import { ConfirmModal } from "@ui/modal/confirm-modal";
import { usePaginatedList } from "@common/hooks/use-paginated-list";
import { useCurrentUser } from "@common/hooks/use-current-user";
import { RepairNotesFilterBar } from "../components/repair-notes-filter-bar";
import { RepairNotesTable } from "../components/repair-notes-table";

export const RepairNotesPage: React.FC = () => {
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
          <Button variant="primary" startIcon={<Plus className="size-4" />} onClick={() => navigate("/commerce/repair-notes/new")}>
            Nueva nota
          </Button>
        ) : undefined
      }
    >
      <RepairNotesFilterBar
        search={search}
        onSearchChange={(value) => {
          setSearch(value);
          setPage(1);
        }}
        statusFilter={statusFilter}
        onStatusFilterChange={(value) => {
          setStatusFilter(value);
          setPage(1);
        }}
      />

      <RepairNotesTable
        loading={loading}
        error={error}
        notes={notes}
        filteredNotes={filteredNotes}
        pageItems={pageItems}
        canEditNotes={canEditNotes}
        cancellingId={cancellingId}
        deletingId={deletingId}
        page={page}
        pageSize={pageSize}
        totalPages={totalPages}
        totalItems={totalItems}
        startIndex={startIndex}
        onRetry={fetchNotes}
        onPageChange={setPage}
        onPageSizeChange={setPageSize}
        onRequestCancel={setConfirmCancelId}
        onRequestDelete={setConfirmDeleteId}
      />

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
