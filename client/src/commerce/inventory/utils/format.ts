import type { InventoryMovement } from "../types/inventory";
import type { PaymentMethod } from "../types/sales";

export const PAYMENT_LABELS: Record<PaymentMethod, string> = {
  efectivo: "Efectivo",
  tarjeta: "Tarjeta",
  transferencia: "Transferencia",
  credito: "Crédito",
};

export const KIND_LABELS: Record<"accessory" | "part", string> = {
  accessory: "Accesorio",
  part: "Parte",
};

export const formatMoney = (value: number) =>
  `$${Number(value).toLocaleString("es-MX", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export const formatDate = (iso: string) =>
  new Date(iso).toLocaleString("es-MX", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });

export const MOVEMENT_LABELS: Record<InventoryMovement["type"], string> = {
  in: "Entrada",
  out: "Salida",
  adjustment: "Ajuste",
};
