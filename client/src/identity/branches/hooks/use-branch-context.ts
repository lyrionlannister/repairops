import { useEffect, useMemo } from "react";

import { useInventory } from "../../../commerce/inventory/hooks/use-inventory";
import { useSales } from "../../../commerce/inventory/hooks/use-sales";
import { useRepairNotes } from "../../../commerce/repair-notes/hooks/use-repair-notes";
import { useCash } from "../../../commerce/cash/hooks/use-cash";

const CLOSED_STATUSES = ["delivered", "cancelled"];

export const useBranchContext = (branchId: string | null) => {
  const { items, fetchAll: fetchInventory } = useInventory();
  const { sales, fetchAll: fetchSales } = useSales();
  const { notes, fetchNotes } = useRepairNotes();
  const { session, fetchOpenSession } = useCash();

  useEffect(() => {
    if (!branchId) return;
    fetchInventory();
    fetchSales();
    fetchNotes();
    fetchOpenSession(branchId);
  }, [branchId, fetchInventory, fetchSales, fetchNotes, fetchOpenSession]);

  return useMemo(() => {
    if (!branchId) {
      return {
        skuCount: 0,
        stockValue: 0,
        criticalCount: 0,
        monthlySalesTotal: 0,
        monthlySalesCount: 0,
        openRepairNotesCount: 0,
        cashSessionOpen: false,
      };
    }

    const branchItems = items.filter((i) => i.localId === branchId);
    const skuCount = branchItems.length;
    const stockValue = branchItems.reduce((sum, i) => sum + i.quantityOnHand * i.costPrice, 0);
    const criticalCount = branchItems.filter((i) => i.quantityOnHand <= i.minStock).length;

    const now = new Date();
    const branchSales = sales.filter((s) => {
      if (s.localId !== branchId) return false;
      const createdAt = new Date(s.createdAt);
      return createdAt.getFullYear() === now.getFullYear() && createdAt.getMonth() === now.getMonth();
    });
    const monthlySalesTotal = branchSales.reduce((sum, s) => sum + s.totalValue, 0);
    const monthlySalesCount = branchSales.length;

    const openRepairNotesCount = notes.filter(
      (n) => n.localId === branchId && !CLOSED_STATUSES.includes(n.status),
    ).length;

    return {
      skuCount,
      stockValue,
      criticalCount,
      monthlySalesTotal,
      monthlySalesCount,
      openRepairNotesCount,
      cashSessionOpen: Boolean(session),
    };
  }, [branchId, items, sales, notes, session]);
};
