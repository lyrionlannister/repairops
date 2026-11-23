import { useCallback, useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router";

import { useBranch } from "@common/hooks/use-branch";
import { useServiceTypes } from "@common/hooks/use-service-types";
import { usePermissions } from "@common/hooks/use-permissions";
import { useCurrentUser } from "@common/hooks/use-current-user";
import { useEmployees } from "@identity/users/hooks/use-employees";
import { useBranchScopedInventory } from "@commerce/inventory/hooks/use-branch-scoped-inventory";
import { NEXT_STATUS, useRepairNotes } from "./use-repair-notes";
import { useRepairNoteDelivery } from "./use-repair-note-delivery";
import { deviceServiceTypeNames } from "../utils/devices";
import type { RepairNoteItemRecord } from "../types/repair-notes";
import type { DetailItemLine, SavedKind } from "../types/repair-note-detail";

export const useRepairNoteDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { can, canAny } = usePermissions();
  const currentUser = useCurrentUser();
  const { workingBranchId } = useBranch();
  const {
    note,
    loading,
    error,
    fetchNote,
    fetchNoteItems,
    cancelNote,
    deleteNote,
    changeStatus,
  } = useRepairNotes();
  const { employees, fetchAll: fetchEmployees } = useEmployees();
  const { serviceTypes, fetchAll: fetchServiceTypes } = useServiceTypes();
  const { items: inventoryItems, fetchAll: fetchInventory } = useBranchScopedInventory(
    note?.localId || workingBranchId,
  );

  const [itemRecords, setItemRecords] = useState<RepairNoteItemRecord[]>([]);
  const [confirm, setConfirm] = useState<"cancel" | "delete" | null>(null);
  const [busy, setBusy] = useState(false);
  const [advancing, setAdvancing] = useState(false);
  const delivery = useRepairNoteDelivery(note, () => {
    if (id) fetchNote(id);
  });

  // Lo manda el formulario al terminar de guardar, para avisar que ya se puede imprimir.
  const saved = (location.state as { saved?: SavedKind } | null)?.saved ?? null;

  useEffect(() => {
    if (!id) return;
    fetchNote(id);
    fetchNoteItems(id).then(setItemRecords);
    fetchEmployees();
    fetchServiceTypes();
    fetchInventory();
  }, [
    id,
    fetchNote,
    fetchNoteItems,
    fetchEmployees,
    fetchServiceTypes,
    fetchInventory,
  ]);

  const technicianName = useMemo(() => {
    const employee = employees.find((e) => e.id === note?.assignedEmployeeId);
    if (employee) return `${employee.firstName} ${employee.lastName}`;
    // Sin staff.list (el técnico) no hay lista de personal: su propia nota sí se nombra.
    if (currentUser && String(note?.assignedEmployeeId) === String(currentUser.id)) {
      return `${currentUser.firstName} ${currentUser.lastName}`;
    }
    return null;
  }, [employees, note?.assignedEmployeeId, currentUser]);

  const serviceTypeNames = useMemo(
    () => deviceServiceTypeNames(note?.devices ?? [], serviceTypes),
    [note?.devices, serviceTypes],
  );

  const itemLines = useMemo<DetailItemLine[]>(
    () =>
      itemRecords.map((r) => ({
        id: r.id,
        name: inventoryItems.find((i) => i.id === r.inventoryItemId)?.name ?? "Producto",
        quantity: r.quantity,
        unitPrice: r.unitPrice,
      })),
    [itemRecords, inventoryItems],
  );

  const confirmAction = useCallback(async () => {
    if (!id || !confirm) return;
    setBusy(true);
    if (confirm === "cancel") {
      await cancelNote(id);
      await fetchNote(id);
      setConfirm(null);
    } else if (await deleteNote(id)) {
      navigate("/commerce/repair-notes");
    } else {
      setConfirm(null);
    }
    setBusy(false);
  }, [id, confirm, cancelNote, deleteNote, fetchNote, navigate]);

  const next = note ? NEXT_STATUS[note.status] : undefined;
  const advance = useCallback(async () => {
    if (!id || !next) return;
    // Entregar no cambia el estado a secas: abre el cobro, y el servidor entrega al registrar los pagos.
    if (next.status === "delivered") {
      await delivery.open();
      return;
    }
    setAdvancing(true);
    await changeStatus(id, next.status);
    setAdvancing(false);
  }, [id, next, changeStatus, delivery]);

  const isClosed = note?.status === "delivered" || note?.status === "cancelled";

  return {
    id,
    note,
    loading,
    error,
    saved,
    technicianName,
    serviceTypeNames,
    itemLines,
    canEdit: canAny("repair-notes.write", "repair-notes.write.own"),
    canCancel: !isClosed && can("repair-notes.write"),
    canDelete: can("repair-notes.delete"),
    confirm,
    setConfirm,
    busy,
    confirmAction,
    nextStep: next ?? null,
    advancing,
    advance,
    deliveryModalProps: delivery.modalProps,
  };
};
