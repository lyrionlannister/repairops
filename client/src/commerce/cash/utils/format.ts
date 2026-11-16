export const METHOD_LABELS: Record<"efectivo" | "tarjeta" | "transferencia", string> = {
  efectivo: "Efectivo",
  tarjeta: "Tarjeta",
  transferencia: "Transferencia",
};

export const formatMoney = (value: number) =>
  `$${Number(value).toLocaleString("es-MX", { minimumFractionDigits: 2 })}`;

export const formatTime = (iso: string) =>
  new Date(iso).toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit" });
