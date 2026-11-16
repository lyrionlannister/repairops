import { useEffect, useMemo } from "react";
import { useRepairNotes } from "./use-repair-notes";
import type { RepairNoteStatus } from "../types/repair-note.types";

export type RepairNoteHistoryEntry = {
  id: string;
  brand: string;
  model: string;
  status: RepairNoteStatus;
  totalValue: number;
  receivedAt: string;
};

/**
 * Otras notas de reparación del mismo cliente, para pintar el panel de
 * historial en el form. No restringe a sucursal: el historial es del
 * cliente, sin importar en qué local se levantó cada nota.
 */
export function useRepairNoteCustomerHistory(customerId: string | null, excludeId?: string) {
  const { notes, fetchNotes } = useRepairNotes();

  useEffect(() => {
    if (notes.length === 0) fetchNotes();
  }, [notes.length, fetchNotes]);

  const otherNotes = useMemo<RepairNoteHistoryEntry[]>(() => {
    if (!customerId) return [];
    return notes
      .filter((n) => n.customerId === customerId && n.id !== excludeId)
      .map((n) => ({
        id: n.id,
        brand: n.brand,
        model: n.model,
        status: n.status as RepairNoteStatus,
        totalValue: Number(n.totalValue),
        receivedAt: n.receivedAt,
      }));
  }, [notes, customerId, excludeId]);

  return { otherNotes };
}
