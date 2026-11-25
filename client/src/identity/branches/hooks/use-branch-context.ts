import { useEffect } from "react";

import { useApiResource } from "@common/hooks/use-api-resource";
import { useCash } from "../../../commerce/cash/hooks/use-cash";
import type { InventoryStats, SaleStats } from "../../../commerce/inventory/types/inventory-stats";
import type { RepairNoteStats } from "../../../commerce/repair-notes/types/repair-note-stats";

// Cifras calculadas en el servidor sobre toda la sucursal, no sobre lo que alcance a
// descargar la pantalla.
export const useBranchContext = (branchId: string | null) => {
  const { session, fetchOpenSession } = useCash();
  const query = branchId ? `branchId=${encodeURIComponent(branchId)}` : null;
  const inventory = useApiResource<InventoryStats>(query && `/inventory/stats?${query}`);
  const sales = useApiResource<SaleStats>(query && `/sales/stats?${query}&period=month`);
  const notes = useApiResource<RepairNoteStats>(query && `/repair-notes/stats?${query}`);

  useEffect(() => {
    if (branchId) fetchOpenSession(branchId);
  }, [branchId, fetchOpenSession]);

  return {
    skuCount: inventory.data?.skuCount ?? 0,
    stockValue: Number(inventory.data?.stockValueAtCost ?? 0),
    criticalCount: inventory.data?.criticalCount ?? 0,
    monthlySalesTotal: Number(sales.data?.total ?? 0),
    monthlySalesCount: sales.data?.count ?? 0,
    openRepairNotesCount: notes.data?.open ?? 0,
    cashSessionOpen: Boolean(branchId && session),
  };
};
