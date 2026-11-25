import { useCallback, useState } from "react";
import { useApiClient } from "@common/hooks/use-api-client";
import type { InventoryCountRecord } from "../types/inventory-counts";
import { readApiError } from "@common/utils/api-error";

async function readError(res: Response, fallback: string): Promise<{ message: string; missingReasonItemIds?: string[] }> {
  const body = await res.json().catch(() => ({}));
  return {
    message: (body as { error?: string }).error?.toString() ?? fallback,
    missingReasonItemIds: (body as { missingReasonItemIds?: string[] }).missingReasonItemIds,
  };
}

export const useInventoryCounts = () => {
  const { apiClient } = useApiClient();
  const [count, setCount] = useState<InventoryCountRecord | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [missingReasonItemIds, setMissingReasonItemIds] = useState<string[]>([]);

  const fetchById = useCallback(
    async (countId: string) => {
      setLoading(true);
      try {
        const res = await apiClient(`/inventory/counts/${countId}`);
        if (!res.ok) throw new Error(await readApiError(res, "Error al cargar el conteo"));
        setCount(await res.json());
      } catch (err) {
        setError(err instanceof Error ? err.message : "Algo salió mal. Intenta de nuevo.");
      } finally {
        setLoading(false);
      }
    },
    [apiClient],
  );

  const open = useCallback(
    async (branchId: string): Promise<boolean> => {
      setSaving(true);
      setError(null);
      try {
        const res = await apiClient("/inventory/counts", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ branchId }),
        });
        if (!res.ok) throw new Error((await readError(res, "Error al abrir el conteo")).message);
        const created: InventoryCountRecord = await res.json();
        setCount({ ...created, items: [] });
        await fetchById(created.id);
        return true;
      } catch (err) {
        setError(err instanceof Error ? err.message : "Algo salió mal. Intenta de nuevo.");
        return false;
      } finally {
        setSaving(false);
      }
    },
    [apiClient, fetchById],
  );

  const setCounted = useCallback(
    async (countItemId: string, countedQuantity: number, reason?: string): Promise<boolean> => {
      if (!count) return false;
      setSaving(true);
      setError(null);
      try {
        const res = await apiClient(`/inventory/counts/${count.id}/items/${countItemId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ countedQuantity, reason }),
        });
        if (!res.ok) throw new Error((await readError(res, "Error al capturar la cantidad")).message);
        await fetchById(count.id);
        return true;
      } catch (err) {
        setError(err instanceof Error ? err.message : "Algo salió mal. Intenta de nuevo.");
        return false;
      } finally {
        setSaving(false);
      }
    },
    [apiClient, count, fetchById],
  );

  const close = useCallback(async (): Promise<boolean> => {
    if (!count) return false;
    setSaving(true);
    setError(null);
    setMissingReasonItemIds([]);
    try {
      const res = await apiClient(`/inventory/counts/${count.id}/close`, { method: "POST" });
      if (!res.ok) {
        const { message, missingReasonItemIds: missing } = await readError(res, "Error al cerrar el conteo");
        if (missing) setMissingReasonItemIds(missing);
        throw new Error(message);
      }
      // El cierre responde sin lineas: se recargan para mostrar el resultado.
      await fetchById(count.id);
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Algo salió mal. Intenta de nuevo.");
      return false;
    } finally {
      setSaving(false);
    }
  }, [apiClient, count, fetchById]);

  return { count, loading, saving, error, missingReasonItemIds, open, fetchById, setCounted, close };
};
