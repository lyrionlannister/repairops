import type { LayawayMethod, LayawayRecord } from "../types/layaways";
import type { Customer } from "../types/customers";

export const labelFor = (c: Customer) => `${c.name} · ${c.phone}`;

export const formatMoney = (v: number) => `$${v.toLocaleString("es-MX", { minimumFractionDigits: 2 })}`;

export const formatDate = (dateStr: string) => {
  const [y, m, d] = dateStr.split("-");
  return `${d}/${m}/${y}`;
};

export const METHOD_LABELS: Record<LayawayMethod, string> = {
  efectivo: "Efectivo",
  tarjeta: "Tarjeta",
  transferencia: "Transferencia",
};

export const STATUS_LABELS: Record<LayawayRecord["status"], string> = {
  open: "Abierto",
  completed: "Completado",
  cancelled: "Cancelado",
  expired: "Vencido",
};

export const daysUntil = (dateStr: string) => {
  const diff = new Date(dateStr).getTime() - Date.now();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
};

// "17 nov 2026" para fechas ISO con hora ("2026-11-17T09:00:00Z") y para fechas
// sueltas ("2026-11-17"), que no deben correrse un día por la zona horaria.
export const formatDay = (value: string): string => {
  const [y, m, d] = value.slice(0, 10).split("-").map(Number);
  const date = value.length <= 10 ? new Date(y!, m! - 1, d) : new Date(value);
  return date.toLocaleDateString("es-MX", { day: "2-digit", month: "short", year: "numeric" });
};
