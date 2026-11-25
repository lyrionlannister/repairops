import { useState, useCallback } from "react";
import { useApiClient } from "@common/hooks/use-api-client";
import type { Sale, CreateSalePayload } from "../types/sales";
import { readApiError, apiErrorText } from "@common/utils/api-error";

export const useSales = () => {
  const { apiClient } = useApiClient();
  const [sales, setSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);


  const fetchByCustomer = useCallback(
    async (customerId: string) => {
      setLoading(true);
      setError(null);
      try {
        const res = await apiClient(`/sales?customerId=${encodeURIComponent(customerId)}`);
        if (!res.ok) throw new Error(await readApiError(res, "Error al cargar ventas"));
        setSales(await res.json());
      } catch (err) {
        setError(err instanceof Error ? err.message : "Algo salió mal. Intenta de nuevo.");
      } finally {
        setLoading(false);
      }
    },
    [apiClient],
  );


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
          throw new Error(apiErrorText(body, "Error al registrar la venta"));
        }
        const sale: Sale = await res.json();
        setSales((prev) => [sale, ...prev]);
        return sale;
      } catch (err) {
        setError(err instanceof Error ? err.message : "Algo salió mal. Intenta de nuevo.");
        return null;
      } finally {
        setCreating(false);
      }
    },
    [apiClient],
  );

  return { sales, loading, creating, error, fetchByCustomer, create };
};
