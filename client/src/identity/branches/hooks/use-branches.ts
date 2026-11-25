import { useState, useCallback } from "react";
import { useApiClient } from "@common/hooks/use-api-client";
import type { Branch } from "../types/branches";
import { readApiError, apiErrorText } from "@common/utils/api-error";

export const useBranches = () => {
  const { apiClient } = useApiClient();
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiClient("/branches");
      if (!res.ok) throw new Error(await readApiError(res, "Error al cargar sucursales"));
      setBranches(await res.json());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Algo salió mal. Intenta de nuevo.");
    } finally {
      setLoading(false);
    }
  }, [apiClient]);

  const create = useCallback(
    async (data: Pick<Branch, "name" | "address" | "phone">): Promise<boolean> => {
      setSaving(true);
      setError(null);
      try {
        const res = await apiClient("/branches", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        });
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new Error(apiErrorText(body, "Error al crear sucursal"));
        }
        const created: Branch = await res.json();
        setBranches((prev) => [...prev, created].sort((a, b) => a.name.localeCompare(b.name)));
        return true;
      } catch (err) {
        setError(err instanceof Error ? err.message : "Algo salió mal. Intenta de nuevo.");
        return false;
      } finally {
        setSaving(false);
      }
    },
    [apiClient],
  );

  const update = useCallback(
    async (id: string, data: Pick<Branch, "name" | "address" | "phone">): Promise<boolean> => {
      setSaving(true);
      setError(null);
      try {
        const res = await apiClient(`/branches/${id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        });
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new Error(apiErrorText(body, "Error al actualizar sucursal"));
        }
        const updated: Branch = await res.json();
        setBranches((prev) => prev.map((b) => (b.id === id ? updated : b)));
        return true;
      } catch (err) {
        setError(err instanceof Error ? err.message : "Algo salió mal. Intenta de nuevo.");
        return false;
      } finally {
        setSaving(false);
      }
    },
    [apiClient],
  );

  const setActive = useCallback(
    async (id: string, isActive: boolean): Promise<boolean> => {
      setError(null);
      try {
        const res = await apiClient(`/branches/${id}/active`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ isActive }),
        });
        if (!res.ok) throw new Error(await readApiError(res, "Error al actualizar sucursal"));
        const updated: Branch = await res.json();
        setBranches((prev) => prev.map((b) => (b.id === id ? updated : b)));
        return true;
      } catch (err) {
        setError(err instanceof Error ? err.message : "Algo salió mal. Intenta de nuevo.");
        return false;
      }
    },
    [apiClient],
  );

  return { branches, loading, saving, error, fetchAll, create, update, setActive };
};
