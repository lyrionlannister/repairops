import { useNavigate } from "react-router";
import { describeDevices } from "../utils/devices";
import { Ban, Pencil, Printer, Trash2 } from "lucide-react";
import { Button } from "@ui/button/button";
import { Alert } from "@ui/alert/alert";
import { ConfirmModal } from "@ui/modal/confirm-modal";
import { PageShell } from "@common/components/page-shell/page-shell";
import { useRepairNoteDetail } from "../hooks/use-repair-note-detail";
import { RepairNoteDetailSummary } from "../components/repair-note-detail-summary";
import { RepairNoteDeliveryModal } from "../components/repair-note-delivery-modal";

export const RepairNoteDetailPage: React.FC = () => {
  const navigate = useNavigate();
  const {
    id,
    note,
    loading,
    error,
    saved,
    technicianName,
    serviceTypeNames,
    itemLines,
    canEdit,
    canCancel,
    canDelete,
    confirm,
    setConfirm,
    busy,
    confirmAction,
    nextStep,
    advancing,
    advance,
    deliveryModalProps,
  } = useRepairNoteDetail();

  if (!note) {
    return (
      <div className={`p-8 text-center text-sm ${loading ? "text-gray-500 dark:text-gray-400" : "text-red-500"}`}>
        {loading ? "Cargando nota..." : (error ?? "Nota no encontrada.")}
      </div>
    );
  }

  return (
    <PageShell
      title={`Nota #${note.controlNumber}`}
      description={`${describeDevices(note.devices)} · ${note.customerName}`}
    >
      {saved && (
        <Alert
          variant="success"
          title={saved === "created" ? "Nota creada" : "Cambios guardados"}
          message="Ya puedes imprimirla desde el botón Imprimir."
        />
      )}

      <RepairNoteDetailSummary
        note={note}
        technicianName={technicianName}
        serviceTypeNames={serviceTypeNames}
        itemLines={itemLines}
        actions={
          <>
            {canDelete && (
              <Button variant="outline" startIcon={<Trash2 className="size-4" />} onClick={() => setConfirm("delete")}>
                Eliminar
              </Button>
            )}
            {canCancel && (
              <Button variant="outline" startIcon={<Ban className="size-4" />} onClick={() => setConfirm("cancel")}>
                Cancelar nota
              </Button>
            )}
            {canEdit && (
              <Button
                variant="outline"
                startIcon={<Pencil className="size-4" />}
                onClick={() => navigate(`/commerce/repair-notes/${id}/edit`)}
              >
                Editar
              </Button>
            )}
            <Button
              variant={nextStep && canEdit ? "outline" : "primary"}
              startIcon={<Printer className="size-4" />}
              onClick={() => navigate(`/commerce/repair-notes/${id}/print`)}
            >
              Imprimir
            </Button>
            {canEdit && nextStep && (
              <Button variant="primary" onClick={advance} disabled={advancing}>
                {advancing ? "Guardando..." : nextStep.label}
              </Button>
            )}
          </>
        }
      />

      <RepairNoteDeliveryModal {...deliveryModalProps} />

      <ConfirmModal
        isOpen={confirm === "cancel"}
        title="Cancelar nota"
        message="¿Cancelar esta nota? El cliente decidió no tomar el servicio. Si tenía productos del inventario, se devuelven al stock."
        confirmLabel="Cancelar nota"
        danger
        loading={busy}
        onConfirm={confirmAction}
        onClose={() => setConfirm(null)}
      />
      <ConfirmModal
        isOpen={confirm === "delete"}
        title="Eliminar nota"
        message="¿Eliminar esta nota de reparación? Esta acción no se puede deshacer."
        confirmLabel="Eliminar"
        danger
        loading={busy}
        onConfirm={confirmAction}
        onClose={() => setConfirm(null)}
      />
    </PageShell>
  );
};
