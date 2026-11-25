export const STATUS_LABELS: Record<string, string> = {
  received: "Recibido",
  in_repair: "En reparación",
  done: "Terminado",
  delivered: "Entregado",
  cancelled: "Cancelado",
};

export const PAY_CYCLE_SHORT: Record<string, string> = {
  weekly: "semanal",
  biweekly: "quincenal",
  monthly: "mensual",
};

export const ATTRIBUTION_LABELS: Record<string, string> = {
  total_value: "total cobrado",
  margin: "margen: cobrado menos costo de piezas",
  labor_only: "solo mano de obra",
};

export const formatMoney = (value: number, currency: string) =>
  new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency,
    currencyDisplay: "narrowSymbol",
  }).format(value);
