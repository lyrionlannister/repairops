// Mismo umbral que el conteo "Stock crítico" del dashboard (DashboardDao.getOperationalCounts).
export const isCriticalStock = (item: { quantityOnHand: number; minStock: number }): boolean =>
  item.quantityOnHand <= Math.max(item.minStock, 3);

// GET /inventory/:id no trae "available" (solo el listado): sin ese dato se usa la existencia.
export const stockLabel = (item: { name: string; quantityOnHand: number; available?: number }): string => {
  const free = item.available ?? item.quantityOnHand;
  return free > 0 ? `${item.name} (${free} disponibles)` : `${item.name} (agotado)`;
};

export const inventoryDescription = (total: number, hasFilters: boolean, loading: boolean): string => {
  if (loading && total === 0) return "Cargando productos...";
  if (hasFilters) return `${total} ${total === 1 ? "producto coincide" : "productos coinciden"} con los filtros.`;
  return total > 0 ? `${total} ${total === 1 ? "producto" : "productos"} en total.` : "Aún no hay productos.";
};

export const countLineLabel = (line: { itemName?: string | null; itemSku?: string | null }): string =>
  line.itemName ? `${line.itemName}${line.itemSku ? ` (${line.itemSku})` : ""}` : "Producto eliminado";
