import type { CashMovementMethod, CashMovementOrigin, CashVarianceKind } from "../types/cash";

export const METHOD_LABELS: Record<CashMovementMethod, string> = {
  efectivo: "Efectivo",
  tarjeta: "Tarjeta",
  transferencia: "Transferencia",
};

export const ORIGIN_LABELS: Record<CashMovementOrigin, string> = {
  sale: "Venta",
  repair_note: "Reparación",
  repair_note_item: "Reparación",
  layaway: "Apartado",
  layaway_item: "Apartado",
  return: "Devolución",
  customer_payment: "Abono de cliente",
  quote: "Cotización",
  count: "Conteo",
  manual: "Manual",
};

// Solo formatea lo que manda la API (texto decimal): el cliente no suma ni resta dinero.
export const formatMoney = (value: number | string | null | undefined) => {
  if (value === null || value === undefined || value === "") return "—";
  const amount = Number(value);
  const text = Math.abs(amount).toLocaleString("es-MX", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  return `${amount < 0 ? "-" : ""}$${text}`;
};

export const formatTime = (iso: string) =>
  new Date(iso).toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit" });

export const formatDateTime = (iso: string | null) =>
  iso ? new Date(iso).toLocaleString("es-MX", { dateStyle: "medium", timeStyle: "short" }) : "—";

export const formatElapsed = (fromIso: string, now: Date) => {
  const minutes = Math.max(0, Math.floor((now.getTime() - new Date(fromIso).getTime()) / 60000));
  const hours = Math.floor(minutes / 60);
  return hours > 0 ? `${hours} h ${minutes % 60} min` : `${minutes} min`;
};

export const varianceKind = (variance: string | null): CashVarianceKind => {
  const value = Number(variance ?? 0);
  if (value < 0) return "shortage";
  if (value > 0) return "overage";
  return "exact";
};

export const VARIANCE_LABELS: Record<CashVarianceKind, string> = {
  shortage: "Faltante",
  overage: "Sobrante",
  exact: "Cuadró",
};

export const originLink = (origin: CashMovementOrigin, id: string | null): string | null =>
  origin === "repair_note" && id ? `/commerce/repair-notes/${id}` : null;
