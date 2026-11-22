import type { SubscriptionStatus } from "../hooks/use-plan";
import type { PlanOption, SubscriptionFormData, TenantPlan } from "../hooks/use-platform-tenants";

export const formatUsage = (used: number, limit: number | null): string =>
  limit === null ? `${used} (sin límite)` : `${used} de ${limit}`;

export const STATUS_LABELS: Record<SubscriptionStatus, string> = {
  trialing: "Prueba",
  active: "Activo",
  past_due: "Pago pendiente",
  canceled: "Cancelado",
};

const limitLabel = (value: number | null, one: string, many: string) =>
  value === null ? `${many} sin límite` : `${value} ${value === 1 ? one : many}`;

export const planOptionLabel = (plan: PlanOption): string =>
  `${plan.name} (${limitLabel(plan.maxUsers, "usuario", "usuarios")}, ${limitLabel(plan.maxBranches, "sucursal", "sucursales")})`;

export const tenantToForm = (tenant: TenantPlan): SubscriptionFormData => ({
  planKey: tenant.plan.key,
  extraUsers: String(tenant.extraUsers),
  extraBranches: String(tenant.extraBranches),
  status: tenant.status,
});
