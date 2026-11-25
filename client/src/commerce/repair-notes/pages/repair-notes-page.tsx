import { useNavigate } from "react-router";
import { Plus } from "lucide-react";
import { useRepairNotes } from "../hooks/use-repair-notes";
import { useRepairNotesPage } from "../hooks/use-repair-notes-page";
import { Button } from "@ui/button/button";
import { PageShell } from "@common/components/page-shell/page-shell";
import { ConfirmModal } from "@ui/modal/confirm-modal";
import { usePermissions } from "@common/hooks/use-permissions";
import { RepairNotesFilterBar } from "../components/repair-notes-filter-bar";
import { RepairNotesTable } from "../components/repair-notes-table";
import { RepairNoteDeliveryModal } from "../components/repair-note-delivery-modal";

export const RepairNotesPage: React.FC = () => {
  const navigate = useNavigate();
  const { can, canAny } = usePermissions();
  const canEditNotes = canAny("repair-notes.write", "repair-notes.write.own");
  const canCreateNotes = canAny("repair-notes.create", "repair-notes.create.own");
  const { deleteNote, cancelNote, changeStatus } = useRepairNotes();
  const {
    list,
    search,
    setSearch,
    statusFilter,
    setStatusFilter,
    deletingId,
    cancellingId,
    confirmDeleteId,
    setConfirmDeleteId,
    confirmCancelId,
    setConfirmCancelId,
    confirmDelete,
    confirmCancel,
    advancingId,
    advanceStatus,
    deliveryModalProps,
  } = useRepairNotesPage({ deleteNote, cancelNote, changeStatus });

  return (
    <PageShell
      title="Notas de Reparación"
      description="Gestiona el taller de reparación de celulares."
      action={
        canCreateNotes ? (
          <Button
            variant="primary"
            startIcon={<Plus className="size-4" />}
            onClick={() => navigate("/commerce/repair-notes/new")}
          >
            Nueva nota
          </Button>
        ) : undefined
      }
    >
      <RepairNotesFilterBar
        search={search}
        onSearchChange={setSearch}
        statusFilter={statusFilter}
        onStatusFilterChange={setStatusFilter}
      />

      <RepairNotesTable
        loading={list.loading}
        error={list.error}
        hasFilters={list.hasFilters}
        pageItems={list.items}
        canEditNotes={canEditNotes}
        canCreateNotes={canCreateNotes}
        canCancelNotes={can("repair-notes.write")}
        canDeleteNotes={can("repair-notes.delete")}
        cancellingId={cancellingId}
        deletingId={deletingId}
        page={list.page}
        pageSize={list.pageSize}
        totalPages={list.totalPages}
        totalItems={list.total}
        startIndex={list.startIndex}
        onRetry={() => void list.refetch()}
        onPageChange={list.setPage}
        onPageSizeChange={list.setPageSize}
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
