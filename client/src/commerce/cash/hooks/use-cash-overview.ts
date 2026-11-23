import { useCallback, useEffect, useState } from "react";
import { useApiClient } from "@common/hooks/use-api-client";
import { useBranch } from "@common/hooks/use-branch";
import type { CashBranchStatus, CashCut, CashSessionRecord, CashSummary } from "../types/cash";

// Estado de la caja de cada sucursal activa: la sesión abierta (con su resumen) o el último corte.
export const useCashOverview = () => {
  const { apiClient } = useApiClient();
  const { branches } = useBranch();
  const [rows, setRows] = useState<CashBranchStatus[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const read = async <T>(url: string): Promise<T | null> => {
      const res = await apiClient(url);
      return res.ok ? ((await res.json()) as T) : null;
    };
    setLoading(true);
    try {
      const statuses = await Promise.all(
        branches
          .filter((branch) => branch.isActive)
          .map(async (branch) => {
            const id = encodeURIComponent(branch.id);
            const [session, lastCut] = await Promise.all([
              read<CashSessionRecord>(`/cash/sessions/open?localId=${id}`),
              read<CashCut>(`/cash/cuts/last?branchId=${id}`),
            ]);
            const summary = session
              ? await read<CashSummary>(`/cash/sessions/${session.id}/summary`)
              : null;
            return { branchId: branch.id, branchName: branch.name, session, summary, lastCut };
          }),
      );
      setRows(statuses);
    } finally {
      setLoading(false);
    }
  }, [apiClient, branches]);

  useEffect(() => {
    load();
  }, [load]);

  return { rows, loading, openCount: rows.filter((row) => row.session).length, reload: load };
};
