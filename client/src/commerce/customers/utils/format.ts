import type { BadgeColor } from "@common/types/badge";
import type { LayawayMethod, LayawayRecord, LayawayStatusFilter } from "../types/layaways";
import type { Customer } from "../types/customers";

export const labelFor = (c: Customer) => (c.phone ? `${c.name} · ${c.phone}` : c.name);

export const formatMoney = (v: number | string) =>
  `$${Number(v).toLocaleString("es-MX", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export const formatDate = (dateStr: string) => {
  const [y, m, d] = dateStr.slice(0, 10).split("-");
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

export const STATUS_COLORS: Record<LayawayRecord["status"], BadgeColor> = {
  open: "primary",
  completed: "success",
  cancelled: "light",
  expired: "warning",
};

export const expiryHint = (days: number): string =>
  days <= 0 ? "vence hoy" : days === 1 ? "vence mañana" : `faltan ${days} días`;

export const isOverdue = (day: string): boolean => day < new Date().toLocaleDateString("en-CA");

// Días de calendario locales: con new Date("2026-12-01") (medianoche UTC) el
// conteo se recorría un día por la tarde en México.
export const daysUntil = (dateStr: string) => {
  const [y, m, d] = dateStr.slice(0, 10).split("-").map(Number);
  const today = new Date();
  const start = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  return Math.round((new Date(y!, m! - 1, d).getTime() - start.getTime()) / 86_400_000);
};

// "17 nov 2026" para fechas ISO con hora ("2026-11-17T09:00:00Z") y para fechas
// sueltas ("2026-11-17"), que no deben correrse un día por la zona horaria.
export const formatDay = (value: string): string => {
  const [y, m, d] = value.slice(0, 10).split("-").map(Number);
  const date = value.length <= 10 ? new Date(y!, m! - 1, d) : new Date(value);
  return date.toLocaleDateString("es-MX", { day: "2-digit", month: "short", year: "numeric" });
};

export const LAYAWAY_STATUS_FILTER_OPTIONS: Array<{ value: LayawayStatusFilter; label: string }> = [
  { value: "all", label: "Todos los estados" },
  { value: "open", label: "Abiertos" },
  { value: "completed", label: "Completados" },
  { value: "expired", label: "Vencidos" },
  { value: "cancelled", label: "Cancelados" },
];
