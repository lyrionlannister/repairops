export const formatCurrency = (value: string) =>
  new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN" }).format(Number(value));

export const limitLabel = (value: number | null, one: string, many: string): string =>
  value === null ? `${many} sin límite` : `${value} ${value === 1 ? one : many}`;
