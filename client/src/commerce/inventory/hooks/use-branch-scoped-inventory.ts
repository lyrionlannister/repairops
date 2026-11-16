import { useMemo } from "react";
import { useInventory } from "./use-inventory";

// Mismo criterio en los 4 lugares que listan inventario para elegir items
// (inventario, venta rapida, cotizaciones, notas de reparacion): vender o
// referenciar de otra sucursal decrementaria/afectaria el stock equivocado.
export const useBranchScopedInventory = (localId: string | null) => {
  const { items: allItems, ...rest } = useInventory();

  const items = useMemo(
    () => (localId ? allItems.filter((item) => item.localId === localId) : allItems),
    [allItems, localId],
  );

  return { items, allItems, ...rest };
};
