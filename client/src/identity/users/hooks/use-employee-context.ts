import { useApiResource } from "@common/hooks/use-api-resource";
import type { SaleStats } from "../../../commerce/inventory/types/inventory-stats";
import type { RepairNoteStats } from "../../../commerce/repair-notes/types/repair-note-stats";

export function useEmployeeContext(employeeId: string | null) {
  const id = employeeId ? encodeURIComponent(employeeId) : null;
  const sales = useApiResource<SaleStats>(id && `/sales/stats?employeeId=${id}`);
  const notes = useApiResource<RepairNoteStats>(id && `/repair-notes/stats?assignedEmployeeId=${id}`);

  return {
    salesCount: sales.data?.count ?? 0,
    salesTotal: Number(sales.data?.total ?? 0),
    notesTotal: notes.data?.total ?? 0,
    notesOpenCount: notes.data?.open ?? 0,
  };
}
