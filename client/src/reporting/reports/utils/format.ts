export const STATUS_LABELS: Record<string, string> = {
  received: "Recibido",
  in_repair: "En reparación",
  done: "Terminado",
  delivered: "Entregado",
  cancelled: "Cancelado",
};

export const todayIso = () => new Date().toISOString().slice(0, 10);

export const formatMoney = (value: number, currency: string) =>
  `${value.toLocaleString("es-MX", { minimumFractionDigits: 2 })} ${currency}`;
