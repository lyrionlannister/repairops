import { useEffect, useState } from "react";
import { useSearchParams } from "react-router";

import { NEXT_STATUS } from "./use-repair-notes";
import { useRepairNoteDelivery } from "./use-repair-note-delivery";
import type { RepairNoteRecord, RepairNoteStatus, RepairNoteStatusFilter } from "../types/repair-notes";
import { STATUS_FILTERS } from "../utils/status-filter";
import { useRepairNotesList } from "./use-repair-notes-list";
export const useRepairNotesPage = ({
  deleteNote,
  cancelNote,
  changeStatus,
}: {
  deleteNote: (id: string) => Promise<boolean>;
  cancelNote: (id: string) => Promise<RepairNoteRecord | null>;
  changeStatus: (id: string, status: RepairNoteStatus) => Promise<RepairNoteRecord | null>;
}) => {
  const [search, setSearch] = useState("");
  const [searchParams] = useSearchParams();
  const [statusFilter, setStatusFilter] = useState<RepairNoteStatusFilter>(() => {
    const fromUrl = searchParams.get("status");
    return STATUS_FILTERS.find((f) => f === fromUrl) ?? "all";
  });
  const list = useRepairNotesList(search, statusFilter);
  const refetch = () => void list.refetch();
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [confirmCancelId, setConfirmCancelId] = useState<string | null>(null);
  const [advancingId, setAdvancingId] = useState<string | null>(null);
  const [deliveringNote, setDeliveringNote] = useState<RepairNoteRecord | null>(null);

  // Entregar desde la tabla abre el mismo modal de cobro que la vista
  // individual (RepairNoteDeliveryModal) -- un solo hook compartido por
  // toda la tabla, apuntando a la fila que el usuario eligió entregar.
  const delivery = useRepairNoteDelivery(deliveringNote, () => {
    setDeliveringNote(null);
    refetch();
  });

  useEffect(() => {
    if (deliveringNote) delivery.open();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [deliveringNote]);

  const confirmDelete = async () => {
    if (!confirmDeleteId) return;
    setDeletingId(confirmDeleteId);
    if (await deleteNote(confirmDeleteId)) refetch();
    setDeletingId(null);
    setConfirmDeleteId(null);
  };

  const confirmCancel = async () => {
    if (!confirmCancelId) return;
    setCancellingId(confirmCancelId);
    if (await cancelNote(confirmCancelId)) refetch();
    setCancellingId(null);
    setConfirmCancelId(null);
  };

  // Mismo criterio que la vista individual (useRepairNoteDetail.advance):
  // entregar abre el cobro del saldo; los demás pasos solo cambian el estado.
  const advanceStatus = async (note: RepairNoteRecord) => {
    const next = NEXT_STATUS[note.status];
    if (!next) return;
    if (next.status === "delivered") {
      setDeliveringNote(note);
      return;
    }
    setAdvancingId(note.id);
    if (await changeStatus(note.id, next.status)) refetch();
    setAdvancingId(null);
  };

  return {
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
    deliveryModalProps: delivery.modalProps,
  };
};
