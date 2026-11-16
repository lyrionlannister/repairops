import { useEffect } from "react";

import { useSales } from "../../../commerce/inventory/hooks/use-sales";
import { useRepairNotes } from "../../../commerce/repair-notes/hooks/use-repair-notes";

const CLOSED_REPAIR_STATUSES = ["delivered", "cancelled"];

export function useEmployeeContext(employeeId: string | null) {
  const { sales, fetchAll: fetchSales } = useSales();
  const { notes, fetchNotes } = useRepairNotes();

  useEffect(() => {
    if (!employeeId) return;
    fetchSales();
    fetchNotes();
  }, [employeeId, fetchSales, fetchNotes]);

  const employeeSales = employeeId ? sales.filter((s) => s.createdByEmployeeId === employeeId) : [];
  const employeeNotes = employeeId ? notes.filter((n) => n.assignedEmployeeId === employeeId) : [];
  const openNotes = employeeNotes.filter((n) => !CLOSED_REPAIR_STATUSES.includes(n.status));

  return {
    salesCount: employeeSales.length,
    salesTotal: employeeSales.reduce((sum, s) => sum + s.totalValue, 0),
    notesTotal: employeeNotes.length,
    notesOpenCount: openNotes.length,
  };
}
