import { useCallback, useState } from "react";
import { useApiClient } from "@common/hooks/use-api-client";
import { usePermissions } from "@common/hooks/use-permissions";
import type { PlanSummary } from "../types/plan";

// null = sin límite.
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
