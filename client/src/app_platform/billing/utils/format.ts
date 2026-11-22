import type { SubscriptionStatus } from "../hooks/use-plan";

export const formatUsage = (used: number, limit: number | null): string =>
  limit === null ? `${used} (sin límite)` : `${used} de ${limit}`;

export const STATUS_LABELS: Record<SubscriptionStatus, string> = {
  trialing: "Prueba",
  active: "Activo",
  past_due: "Pago pendiente",
  canceled: "Cancelado",
};
