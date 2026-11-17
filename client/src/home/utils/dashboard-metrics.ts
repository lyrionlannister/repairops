// Solo formato: los totales, la zona horaria y las series ya llegan calculados
// desde el API (GET /dashboard/summary y /dashboard/series).

// Los importes viajan como cadenas decimales exactas. Solo para pintar una gráfica
// o un badge se pasan a número; ninguna suma de dinero ocurre en el cliente.
export const toChartValue = (amount: string): number => Number(amount);

export const dayLabel = (bucket: string): string => {
  const [, mm, dd] = bucket.split("-");
  return `${dd}/${mm}`;
};

export const formatLastInteraction = (lastAt: string | null): string => {
  if (!lastAt) return "Sin datos";
  const date = new Date(lastAt);
  const dd = String(date.getDate()).padStart(2, "0");
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const hh = String(date.getHours()).padStart(2, "0");
  const min = String(date.getMinutes()).padStart(2, "0");
  return `${dd}-${mm}-${date.getFullYear()} ${hh}:${min}`;
};
