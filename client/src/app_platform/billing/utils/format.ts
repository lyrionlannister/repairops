import type { BadgeColor } from "@common/types/badge";
import type { SubscriptionStatus } from "../types/plan";
import type { PlanOption, SubscriptionFormData, TenantPlan } from "../types/platform-tenants";
export const formatUsage = (used: number, limit: number | null): string =>
  limit === null ? `${used} (sin límite)` : `${used} de ${limit}`;

export const STATUS_LABELS: Record<SubscriptionStatus, string> = {
  incomplete: "Registro incompleto",
  trialing: "Prueba",
  active: "Activo",
  past_due: "Pago pendiente",
  canceled: "Cancelado",
};

export const STATUS_BADGE_COLOR: Record<SubscriptionStatus, BadgeColor> = {
  incomplete: "light",
  trialing: "info",
  active: "success",
  past_due: "warning",
  canceled: "error",
};

export const STATUS_CHART_COLOR: Record<SubscriptionStatus, string> = {
  incomplete: "#98a2b3",
  trialing: "#465fff",
  active: "#12b76a",
  past_due: "#f79009",
  canceled: "#f04438",
};

const limitLabel = (value: number | null, one: string, many: string) =>
  value === null ? `${many} sin límite` : `${value} ${value === 1 ? one : many}`;

export const planOptionLabel = (plan: PlanOption): string =>
  `${plan.name} (${limitLabel(plan.maxUsers, "usuario", "usuarios")}, ${limitLabel(plan.maxBranches, "sucursal", "sucursales")})`;

const MONEY = new Intl.NumberFormat("es-MX", {
  style: "currency",
  currency: "MXN",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});
export const formatMoney = (amount: string): string => MONEY.format(Number(amount));

const USD = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  minimumFractionDigits: 4,
  maximumFractionDigits: 4,
});
export const formatUsd = (amount: string): string => USD.format(Number(amount));

const PLAN_LABELS: Record<string, string> = {
  basico: "Básico",
  crecimiento: "Crecimiento",
  cadena: "Cadena",
  platform: "Plataforma",
};
export const planLabel = (planKey: string): string => PLAN_LABELS[planKey] ?? planKey;

const INTERVAL_LABELS: Record<string, string> = { month: "mensual", year: "anual" };
export const intervalLabel = (interval: string): string => INTERVAL_LABELS[interval] ?? interval;

// Para métricas donde "subir" es malo (gasto, cancelaciones): el badge pinta
// verde/rojo según si mejoró, no según si el número creció.
export const invertTrendDirection = <T extends { up: boolean } | null>(trend: T): T =>
  trend ? ({ ...trend, up: !trend.up } as T) : trend;

export const formatPaidAt = (paidAt: string): string =>
  new Date(paidAt).toLocaleDateString("es-MX", { day: "2-digit", month: "short", year: "numeric" });

// tenant.plan puede venir null (onboarding, sin plan elegido todavía) --
// "basico" solo precarga el <Select>, no se guarda nada hasta que el admin confirme.
export const tenantToForm = (tenant: TenantPlan): SubscriptionFormData => ({
  planKey: tenant.plan?.key ?? "basico",
  extraUsers: String(tenant.extraUsers),
  extraBranches: String(tenant.extraBranches),
  status: tenant.status,
});
