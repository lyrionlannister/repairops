import { useState, useCallback } from "react";
import { useApiClient } from "@common/hooks/use-api-client";
import { useBranchQuery } from "../../../core/common/hooks/use-branch-query";
import type { Sale, CreateSalePayload } from "../types/sales";

export const useSales = () => {
  const { apiClient } = useApiClient();
  const [sales, setSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const branchQuery = useBranchQuery();

  const fetchAll = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiClient(`/sales${branchQuery}`);
      if (!res.ok) throw new Error("Error al cargar ventas");
      setSales(await res.json());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error desconocido");
    } finally {
      setLoading(false);
    }
  }, [apiClient, branchQuery]);

  const create = useCallback(
    async (data: CreateSalePayload): Promise<Sale | null> => {
      setCreating(true);
      setError(null);
      try {
        const res = await apiClient("/sales", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        });
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new Error((body as { error?: string }).error ?? "Error al registrar la venta");
        }
        const sale: Sale = await res.json();
        setSales((prev) => [sale, ...prev]);
        return sale;
      } catch (err) {
        setError(err instanceof Error ? err.message : "Error desconocido");
        return null;
      } finally {
        setCreating(false);
      }
    },
    [apiClient],
  );

  return { sales, loading, creating, error, fetchAll, create };
};
