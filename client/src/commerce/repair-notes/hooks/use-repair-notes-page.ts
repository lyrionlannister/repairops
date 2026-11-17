import { useEffect, useMemo, useState } from "react";

import { NEXT_STATUS, type RepairNoteRecord, type RepairNoteStatus } from "./use-repair-notes";
import { useRepairNoteDelivery } from "./use-repair-note-delivery";

export const useRepairNotesPage = ({
  notes,
  deleteNote,
  cancelNote,
  changeStatus,
  refetch,
}: {
  notes: RepairNoteRecord[];
  deleteNote: (id: string) => Promise<boolean>;
  cancelNote: (id: string) => Promise<RepairNoteRecord | null>;
  changeStatus: (id: string, status: RepairNoteStatus) => Promise<RepairNoteRecord | null>;
  refetch: () => void;
}) => {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<RepairNoteStatus | "all">("all");
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

  const filteredNotes = useMemo(() => {
    return notes.filter((note) => {
      const matchesSearch =
        note.customerName.toLowerCase().includes(search.toLowerCase()) ||
        String(note.controlNumber).includes(search) ||
        note.brand.toLowerCase().includes(search.toLowerCase()) ||
        note.model.toLowerCase().includes(search.toLowerCase());

      const matchesStatus = statusFilter === "all" || note.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [notes, search, statusFilter]);

  const confirmDelete = async () => {
    if (!confirmDeleteId) return;
    setDeletingId(confirmDeleteId);
    await deleteNote(confirmDeleteId);
    setDeletingId(null);
    setConfirmDeleteId(null);
  };

  const confirmCancel = async () => {
    if (!confirmCancelId) return;
    setCancellingId(confirmCancelId);
    await cancelNote(confirmCancelId);
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
    await changeStatus(note.id, next.status);
    setAdvancingId(null);
  };

  return {
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
    deliveryModalProps: delivery.modalProps,
  };
};
