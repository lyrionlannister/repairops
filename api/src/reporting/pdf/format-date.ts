const MONTHS = [
  "enero",
  "febrero",
  "marzo",
  "abril",
  "mayo",
  "junio",
  "julio",
  "agosto",
  "septiembre",
  "octubre",
  "noviembre",
  "diciembre",
];

export const longDate = (value: string): string => {
  const [y = "", m = "", d = ""] = value.slice(0, 10).split("-");
  return `${d} de ${MONTHS[Number(m) - 1] ?? m} de ${y}`;
};

export const shortDate = (value: string | null): string => {
  if (!value) return "—";
  const [y = "", m = "", d = ""] = value.slice(0, 10).split("-");
  return `${d}/${m}/${y}`;
};
