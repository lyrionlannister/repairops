import { useCallback, useState } from "react";
import { useApiClient } from "@common/hooks/use-api-client";
import type { BillingOverview, DashboardPeriodDays } from "../types/billing-overview";
import { readApiError } from "@common/utils/api-error";

// Solo admin de plataforma (platform.tenants.read, mismo permiso que /platform/tenants).
export const useBillingOverview = () => {
  const { apiClient } = useApiClient();
  const [overview, setOverview] = useState<BillingOverview | null>(null);
  const [days, setDays] = useState<DashboardPeriodDays>(30);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchOverview = useCallback(
    async (requestedDays: DashboardPeriodDays = days) => {
      setLoading(true);
      setError(null);
      try {
        const response = await apiClient(`/platform/billing/overview?days=${requestedDays}`);
        if (!response.ok) throw new Error(await readApiError(response, "Error al cargar el panel de ingresos"));
        setOverview(await response.json());
        setDays(requestedDays);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Algo salió mal. Intenta de nuevo.");
      } finally {
        setLoading(false);
      }
    },
    [apiClient, days],
  );

  const changePeriod = useCallback(
    (nextDays: DashboardPeriodDays) => fetchOverview(nextDays),
    [fetchOverview],
  );

  return { overview, days, loading, error, fetchOverview, changePeriod };
};
