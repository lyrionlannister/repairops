import type { PlanKey, PlanSummary, SubscriptionStatus } from "./plan";

export interface TenantPlan extends PlanSummary {
  tenantId: string;
  tenantName: string;
}

export interface PlanOption {
  key: PlanKey;
  name: string;
  maxUsers: number | null;
  maxBranches: number | null;
}

export interface SubscriptionFormData {
  planKey: PlanKey;
  extraUsers: string;
  extraBranches: string;
  status: SubscriptionStatus;
}
