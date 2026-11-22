import { useCallback, useState } from "react";
import { useApiClient } from "@common/hooks/use-api-client";
import { useBranchQuery } from "../../../core/common/hooks/use-branch-query";
import type { LayawayRecord, OpenLayawayPayload, LayawayMethod } from "../types/layaways";

async function readError(res: Response, fallback: string): Promise<string> {
  const body = await res.json().catch(() => ({}));
  return (body as { error?: string | string[] }).error?.toString() ?? fallback;
}

export const useLayaways = () => {
  const { apiClient } = useApiClient();
  const [layaways, setLayaways] = useState<LayawayRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const branchQuery = useBranchQuery();

  const fetchAll = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiClient(`/layaways${branchQuery}`);
      if (!res.ok) throw new Error("Error al cargar apartados");
      setLayaways(await res.json());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error desconocido");
    } finally {
      setLoading(false);
    }
  }, [apiClient, branchQuery]);

  const open = useCallback(
    async (data: OpenLayawayPayload): Promise<LayawayRecord | null> => {
      setSaving(true);
      setError(null);
      try {
        const res = await apiClient("/layaways", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        });
        if (!res.ok) throw new Error(await readError(res, "Error al abrir el apartado"));
        const created: LayawayRecord = await res.json();
        setLayaways((prev) => [created, ...prev]);
        return created;
      } catch (err) {
        setError(err instanceof Error ? err.message : "Error desconocido");
        return null;
      } finally {
        setSaving(false);
      }
    },
    [apiClient],
  );

  const complete = useCallback(
    async (
      id: string,
      cashSessionId: string,
      payments: Array<{ method: LayawayMethod; amount: number }>,
    ): Promise<boolean> => {
      setSaving(true);
      setError(null);
      try {
        const res = await apiClient(`/layaways/${id}/complete`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ cashSessionId, payments }),
        });
        if (!res.ok) throw new Error(await readError(res, "Error al completar el apartado"));
        const updated: LayawayRecord = await res.json();
        setLayaways((prev) => prev.map((l) => (l.id === id ? updated : l)));
        return true;
      } catch (err) {
        setError(err instanceof Error ? err.message : "Error desconocido");
        return false;
      } finally {
        setSaving(false);
      }
    },
    [apiClient],
  );

  const cancel = useCallback(
    async (id: string): Promise<boolean> => {
      setSaving(true);
      setError(null);
      try {
        const res = await apiClient(`/layaways/${id}/cancel`, { method: "POST" });
        if (!res.ok) throw new Error(await readError(res, "Error al cancelar el apartado"));
        const updated: LayawayRecord = await res.json();
        setLayaways((prev) => prev.map((l) => (l.id === id ? updated : l)));
        return true;
      } catch (err) {
        setError(err instanceof Error ? err.message : "Error desconocido");
        return false;
      } finally {
        setSaving(false);
      }
    },
    [apiClient],
  );

  return { layaways, loading, saving, error, fetchAll, open, complete, cancel };
};
