import { useEffect, useMemo } from "react";
import { useInventory, type InventoryMovement } from "./use-inventory";

/**
 * Datos de contexto de un item de inventario (historial de movimientos + margen)
 * para mostrarse en un panel lateral junto al formulario de edición.
 */
export const useInventoryItemContext = (itemId: string | null) => {
  const { items, movements, fetchAll, fetchMovements } = useInventory();

  useEffect(() => {
    if (itemId !== null) fetchAll();
  }, [itemId, fetchAll]);

  useEffect(() => {
    if (itemId !== null) fetchMovements(itemId);
  }, [itemId, fetchMovements]);

  const currentItem = useMemo(() => items.find((i) => i.id === itemId), [items, itemId]);

  const sortedMovements = useMemo<InventoryMovement[]>(
    () => [...movements].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),
    [movements],
  );

  const marginPercent = useMemo(() => {
    if (!currentItem?.supplierId || currentItem.costPrice <= 0) return null;
    return ((currentItem.salePrice - currentItem.costPrice) / currentItem.costPrice) * 100;
  }, [currentItem]);

  return { movements: sortedMovements, currentItem, marginPercent };
};
