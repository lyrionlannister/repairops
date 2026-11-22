import { useCallback, useState } from "react";
import { useApiClient } from "@common/hooks/use-api-client";
import type { PlanKey, PlanSummary, SubscriptionStatus } from "./use-plan";

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

// Solo admin de plataforma (platform.tenants.read / platform.subscriptions.manage).
export const usePlatformTenants = () => {
  const { apiClient } = useApiClient();
  const [tenants, setTenants] = useState<TenantPlan[]>([]);
  const [plans, setPlans] = useState<PlanOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [tenantsRes, plansRes] = await Promise.all([
        apiClient("/platform/tenants"),
        apiClient("/platform/plans"),
      ]);
      if (!tenantsRes.ok) throw new Error("Error al cargar talleres");
      if (!plansRes.ok) throw new Error("Error al cargar planes");
      setTenants(await tenantsRes.json());
      setPlans(await plansRes.json());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error desconocido");
    } finally {
      setLoading(false);
    }
  }, [apiClient]);

  const assign = useCallback(
    async (tenantId: string, form: SubscriptionFormData): Promise<boolean> => {
      setSaving(true);
      try {
        const res = await apiClient(`/platform/tenants/${tenantId}/subscription`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            planKey: form.planKey,
            extraUsers: Number(form.extraUsers || 0),
            extraBranches: Number(form.extraBranches || 0),
            status: form.status,
          }),
        });
        // El motivo de un rechazo (p.ej. el uso no cabe en el plan) ya sale en el toast de useApiClient.
        return res.ok;
      } finally {
        setSaving(false);
      }
    },
    [apiClient],
  );

  return { tenants, plans, loading, saving, error, fetchAll, assign };
};
