import { useCallback, useState } from "react";
import { useApiClient } from "@common/hooks/use-api-client";
import { usePermissions } from "@common/hooks/use-permissions";

export type PlanKey = "basico" | "crecimiento" | "cadena" | "platform";
export type SubscriptionStatus = "trialing" | "active" | "past_due" | "canceled";

// null = sin límite.
export interface PlanSummary {
  plan: { key: PlanKey; name: string; maxUsers: number | null; maxBranches: number | null };
  status: SubscriptionStatus;
  extraUsers: number;
  extraBranches: number;
  limits: { users: number | null; branches: number | null };
  usage: { users: number; branches: number };
}

export const usePlan = () => {
  const { apiClient } = useApiClient();
  const { can } = usePermissions();
  const canRead = can("billing.read");
  const [summary, setSummary] = useState<PlanSummary | null>(null);

  const fetchPlan = useCallback(async () => {
    if (!canRead) return;
    const res = await apiClient("/billing/plan");
    if (res.ok) setSummary(await res.json());
  }, [apiClient, canRead]);

  return { summary, fetchPlan };
};
