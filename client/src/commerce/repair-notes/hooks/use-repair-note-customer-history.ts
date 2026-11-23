import { useEffect, useMemo } from "react";
import { describeDevices } from "../utils/devices";
import { useRepairNotes } from "./use-repair-notes";
import type { RepairNoteStatus } from "../types/repair-notes";
import type { RepairNoteHistoryEntry } from "../types/repair-note-customer-history";

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
        devicesLabel: describeDevices(n.devices),
        status: n.status as RepairNoteStatus,
        totalValue: Number(n.totalValue),
        receivedAt: n.receivedAt,
      }));
  }, [notes, customerId, excludeId]);

  return { otherNotes };
}
