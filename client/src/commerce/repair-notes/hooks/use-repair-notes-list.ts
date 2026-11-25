import { useServerList } from "@common/hooks/use-server-list";
import { useBranchFilter } from "@common/hooks/use-branch-query";
import type { RepairNoteRecord, RepairNoteStatusFilter } from "../types/repair-notes";

export const useRepairNotesList = (search: string, statusFilter: RepairNoteStatusFilter) => {
  const branchId = useBranchFilter();
  const list = useServerList<RepairNoteRecord>("/repair-notes", {
    search,
    filters: { branchId, status: statusFilter === "all" ? undefined : statusFilter },
    errorText: "No pudimos cargar las notas.",
  });
  return { ...list, hasFilters: statusFilter !== "all" || list.hasSearch };
};
