const MONTHS = [
  "enero", "febrero", "marzo", "abril", "mayo", "junio",
  "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre",
];

// "2026-11-16" → "16 de noviembre de 2026" (folio del encabezado).
export const longDate = (value: string): string => {
  const [y = "", m = "", d = ""] = value.slice(0, 10).split("-");
  return `${d} de ${MONTHS[Number(m) - 1] ?? m} de ${y}`;
};

// "2026-11-16" → "16/11/2026" (fechas dentro del cuerpo).
export const shortDate = (value: string | null): string => {
  if (!value) return "—";
  const [y = "", m = "", d = ""] = value.slice(0, 10).split("-");
  return `${d}/${m}/${y}`;
};
