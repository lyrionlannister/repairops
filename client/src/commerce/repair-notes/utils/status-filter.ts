import type { RepairNoteStatus, RepairNoteStatusFilter } from "../types/repair-notes";

export const STATUS_FILTERS: RepairNoteStatusFilter[] = ["all", "open", "received", "in_repair", "done", "delivered", "cancelled"];

// "open" usa el mismo criterio que el conteo "Notas abiertas" del dashboard.
export const matchesStatusFilter = (status: RepairNoteStatus, filter: RepairNoteStatusFilter): boolean => {
  if (filter === "all") return true;
  if (filter === "open") return status !== "delivered" && status !== "cancelled";
  return status === filter;
};
