import { useState, useCallback } from "react";
import { useApiClient } from "@common/hooks/use-api-client";
import type { LocalRecord } from "../types/local";

export const useLocal = () => {
  const { apiClient } = useApiClient();
  const [local, setLocal] = useState<LocalRecord | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const fetchLocal = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiClient("/local");
      if (!response.ok) throw new Error("Error al cargar configuración");
      const data = (await response.json()) as LocalRecord;
      setLocal(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error desconocido");
    } finally {
      setLoading(false);
    }
  }, [apiClient]);

  const updateLocal = useCallback(
    async (data: Partial<LocalRecord>): Promise<boolean> => {
      setSaving(true);
      setSaveSuccess(false);
      setError(null);
      try {
        const response = await apiClient("/local", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        });
        if (!response.ok) {
          const body = (await response.json().catch(() => null)) as {
            error?: string | string[];
          } | null;
          const message = Array.isArray(body?.error) ? body.error.join(", ") : body?.error;
          throw new Error(message || "Error al guardar configuración");
        }
        const updated = (await response.json()) as LocalRecord;
        setLocal(updated);
        setSaveSuccess(true);
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

  return { local, loading, saving, saveSuccess, error, fetchLocal, updateLocal };
};
