import type { QuoteStatus } from "../hooks/use-quotes";

export const STATUS_CONFIG: Record<QuoteStatus, { label: string; className: string }> = {
  pending: { label: "Pendiente", className: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400" },
  accepted: { label: "Aceptada", className: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" },
  rejected: { label: "Rechazada", className: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400" },
};

export const QUOTE_STATUS_LABEL: Record<QuoteStatus, string> = {
  pending: "Pendiente",
  accepted: "Aceptada",
  rejected: "Rechazada",
};

export const formatDate = (dateStr?: string | null) => {
  if (!dateStr) return "—";
  const [y, m, d] = dateStr.split("-");
  return `${d}/${m}/${y}`;
};

export const formatCurrency = (value: number) =>
  new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN" }).format(value);
