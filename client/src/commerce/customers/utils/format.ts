import type { LayawayMethod, LayawayRecord } from "../hooks/use-layaways";
import type { Customer } from "../hooks/use-customers";

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
