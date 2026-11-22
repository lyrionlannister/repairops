import { useEffect } from "react";
import { useNavigate } from "react-router";
import { Plus } from "lucide-react";
import { useRepairNotes } from "../hooks/use-repair-notes";
import { useRepairNotesPage } from "../hooks/use-repair-notes-page";
import { Button } from "@ui/button/button";
import { PageShell } from "@common/components/page-shell/page-shell";
import { ConfirmModal } from "@ui/modal/confirm-modal";
import { usePaginatedList } from "@common/hooks/use-paginated-list";
import { usePermissions } from "@common/hooks/use-permissions";
import { RepairNotesFilterBar } from "../components/repair-notes-filter-bar";
import { RepairNotesTable } from "../components/repair-notes-table";
import { RepairNoteDeliveryModal } from "../components/repair-note-delivery-modal";

export const RepairNotesPage: React.FC = () => {
  const navigate = useNavigate();
  const { canAny } = usePermissions();
  const canEditNotes = canAny("repair-notes.write", "repair-notes.write.own");
  const { notes, loading, error, fetchNotes, deleteNote, cancelNote, changeStatus } = useRepairNotes();
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
    advancingId,
    advanceStatus,
    deliveryModalProps,
  } = useRepairNotesPage({ notes, deleteNote, cancelNote, changeStatus, refetch: fetchNotes });

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
        advancingId={advancingId}
        onAdvance={advanceStatus}
      />

      <RepairNoteDeliveryModal {...deliveryModalProps} />

      <ConfirmModal
        isOpen={Boolean(confirmCancelId)}
        title="Cancelar nota"
        message="¿Cancelar esta nota? El cliente decidió no tomar el servicio. Si tenía productos del inventario, se devuelven al stock."
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
