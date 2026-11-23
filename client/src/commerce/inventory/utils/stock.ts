// Mismo umbral que el conteo "Stock crítico" del dashboard (DashboardDao.getOperationalCounts).
export const isCriticalStock = (item: { quantityOnHand: number; minStock: number }): boolean =>
  item.quantityOnHand <= Math.max(item.minStock, 3);
