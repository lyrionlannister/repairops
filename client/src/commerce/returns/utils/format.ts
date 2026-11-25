import type { RefundMethod } from "../types/returns";

export const PAYMENT_LABELS: Record<RefundMethod, string> = {
  efectivo: "Efectivo",
  tarjeta: "Tarjeta",
  transferencia: "Transferencia",
};

export const formatMoney = (v: number | string) =>
  `$${Number(v).toLocaleString("es-MX", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export const round2 = (v: number) => Math.round(v * 100) / 100;

export const newIdempotencyKey = () =>
  typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`;
