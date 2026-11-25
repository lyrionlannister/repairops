export const formatPrice = (value: number) =>
  `$${Number(value).toLocaleString("es-MX", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export const priceListDescription = (total: number, hasFilters: boolean, loading: boolean): string => {
  if (loading && total === 0) return "Cargando lista de precios...";
  if (hasFilters) return `${total} ${total === 1 ? "producto coincide" : "productos coinciden"} con los filtros.`;
  return total > 0 ? `${total} ${total === 1 ? "producto" : "productos"} en total.` : "Aún no hay productos.";
};
