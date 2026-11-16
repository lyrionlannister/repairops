export const formatDate = (dateStr?: string) => {
  if (!dateStr) return "—";
  const [y, m, d] = dateStr.split("-");
  return `${d}/${m}/${y}`;
};

export const formatCurrency = (value: number) =>
  new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN" }).format(value);

// Formato compacto para el recibo imprimible (térmico / carta), distinto del
// formatCurrency de la tabla: usa signo de dolar plano y guion largo si falta.
export const fmtCurrency = (value?: number) => (value != null ? `$${Number(value).toFixed(2)}` : "—");

export const splitDateParts = (dateStr?: string) => {
  if (!dateStr) return { dia: "--", mes: "--", anio: "--" };
  const [y, m, d] = dateStr.split("-");
  return { dia: d, mes: m, anio: y };
};
