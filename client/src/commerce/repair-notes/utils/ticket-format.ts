const MONTHS = ["ENE", "FEB", "MAR", "ABR", "MAY", "JUN", "JUL", "AGO", "SEP", "OCT", "NOV", "DIC"];

export const formatTicketDate = (dateStr?: string): string => {
  if (!dateStr) return "";
  const [y, m, d] = dateStr.slice(0, 10).split("-");
  return `${d} ${MONTHS[Number(m) - 1] ?? m} ${y}`;
};

export const initialsOf = (name: string): string =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0]!.toUpperCase())
    .join("");
