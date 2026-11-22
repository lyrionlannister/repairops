import type { TicketSizeSpec, TicketWidth } from "../types/ticket";

const MONTHS = ["ENE", "FEB", "MAR", "ABR", "MAY", "JUN", "JUL", "AGO", "SEP", "OCT", "NOV", "DIC"];

export const TICKET_BLACK = "#000000";
export const TICKET_WHITE = "#ffffff";

// Tamaños del diseño por ancho de rollo (px a 96 dpi; el navegador imprime el ancho en mm reales).
export const TICKET_SIZES: Record<TicketWidth, TicketSizeSpec> = {
  80: {
    pad: "14px 14px 22px",
    base: 11,
    name: 16,
    small: 9.5,
    label: 9,
    falla: 8.5,
    folio: 32,
    saldo: 20,
    legal: 8,
    logo: 38,
    qr: "37mm",
    barcode: 190,
    barcodeH: 40,
  },
  58: {
    pad: "11px 10px 18px",
    base: 10,
    name: 13,
    small: 8.5,
    label: 8,
    falla: 7.5,
    folio: 26,
    saldo: 20,
    legal: 7.5,
    logo: 32,
    qr: "31mm",
    barcode: 150,
    barcodeH: 34,
  },
};

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
