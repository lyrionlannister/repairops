
export type DeliveryMethod = "efectivo" | "tarjeta" | "transferencia" | "credito";

export type DeliveryPaymentLine = { method: DeliveryMethod; amount: string };
