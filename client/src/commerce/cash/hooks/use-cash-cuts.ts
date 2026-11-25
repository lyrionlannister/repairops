import { useCallback, useEffect, useState } from "react";
import { useApiClient } from "@common/hooks/use-api-client";
import { usePermissions } from "@common/hooks/use-permissions";
import { useServerList } from "@common/hooks/use-server-list";
import type { CashCut, CashVarianceStats } from "../types/cash";

// El historial y los indicadores exigen cash.authorize-variance en la API; el último corte, solo cash.read.
export const useCashCuts = (branchId: string | null, refreshKey: unknown) => {
  const { apiClient } = useApiClient();
  const { can } = usePermissions();
  const canAudit = can("cash.authorize-variance");
  const [lastCut, setLastCut] = useState<CashCut | null>(null);
  const [stats, setStats] = useState<CashVarianceStats | null>(null);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    if (!branchId) return;
    const query = `?branchId=${encodeURIComponent(branchId)}`;
    setLoading(true);
    try {
      const requests: Promise<void>[] = [
        apiClient(`/cash/cuts/last${query}`).then(async (res) => {
          if (res.ok) setLastCut((await res.json()) as CashCut | null);
        }),
      ];
      if (canAudit) {
        requests.push(
          apiClient(`/cash/cuts/variance-stats${query}`).then(async (res) => {
            if (res.ok) setStats((await res.json()) as CashVarianceStats);
          }),
        );
      }
      await Promise.all(requests);
    } finally {
      setLoading(false);
    }
  }, [apiClient, branchId, canAudit]);

  const history = useServerList<CashCut>("/cash/cuts", {
    filters: { branchId },
    errorText: "No pudimos cargar el historial de cortes.",
    enabled: canAudit && Boolean(branchId),
  });
  const refetchHistory = history.refetch;

  useEffect(() => {
    load();
    void refetchHistory();
  }, [load, refetchHistory, refreshKey]);

  return { lastCut, history, stats, loading, canAudit };
};
