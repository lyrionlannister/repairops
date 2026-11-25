import { useState, useCallback } from "react";
import { useApiClient, API_BASE_URL } from "@common/hooks/use-api-client";
import type { StagingRow, StagingRecord } from "../types/import-staging";
import { readApiError, apiErrorText } from "@common/utils/api-error";

type StagingEvent = StagingRecord | { status: "error"; error: string };

export const useImportStaging = () => {
  const { apiClient } = useApiClient();
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const upload = useCallback(
    async (file: File, supplierId: string): Promise<string | null> => {
      setUploading(true);
      setError(null);
      try {
        const buffer = await file.arrayBuffer();
        const res = await apiClient(
          `/import-staging/upload?supplierId=${encodeURIComponent(supplierId)}&fileName=${encodeURIComponent(file.name)}`,
          {
            method: "POST",
            headers: { "Content-Type": file.type || "application/octet-stream" },
            body: buffer,
          },
        );
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new Error(apiErrorText(body, "Error al subir el archivo"));
        }
        const data = (await res.json()) as { importId: string };
        return data.importId;
      } catch (err) {
        setError(err instanceof Error ? err.message : "Algo salió mal. Intenta de nuevo.");
        return null;
      } finally {
        setUploading(false);
      }
    },
    [apiClient],
  );

  // Reemplaza el polling: un solo stream que manda el estado cada vez que
  // cambia (incluido el progreso por bloque) y se cierra solo al llegar a un
  // estado terminal. Devuelve la función de limpieza -- el caller DEBE
  // invocarla apenas reciba un estado terminal (ready/error), si no el
  // navegador reintenta la conexión sola y vuelve a abrir el stream.
  const subscribeToImport = useCallback(
    (importId: string, onUpdate: (event: StagingEvent) => void): (() => void) => {
      const source = new EventSource(`${API_BASE_URL}/import-staging/${importId}/events`, {
        withCredentials: true,
      });
      source.onmessage = (event) => {
        onUpdate(JSON.parse(event.data) as StagingEvent);
      };
      source.onerror = () => {
        source.close();
        onUpdate({ status: "error", error: "Se perdió la conexión con el servidor" });
      };
      return () => source.close();
    },
    [],
  );

  const updateRows = useCallback(
    async (importId: string, rows: StagingRow[]): Promise<boolean> => {
      setSaving(true);
      setError(null);
      try {
        const res = await apiClient(`/import-staging/${importId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ rows }),
        });
        if (!res.ok) throw new Error(await readApiError(res, "Error al guardar los cambios"));
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

  const commit = useCallback(
    async (importId: string): Promise<{ imported: number } | null> => {
      setSaving(true);
      setError(null);
      try {
        const res = await apiClient(`/import-staging/${importId}/commit`, {
          method: "POST",
        });
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new Error(
            apiErrorText(body, "Error al confirmar la importación"),
          );
        }
        return (await res.json()) as { imported: number };
      } catch (err) {
        setError(err instanceof Error ? err.message : "Algo salió mal. Intenta de nuevo.");
        return null;
      } finally {
        setSaving(false);
      }
    },
    [apiClient],
  );

  const discard = useCallback(
    async (importId: string): Promise<boolean> => {
      try {
        const res = await apiClient(`/import-staging/${importId}`, {
          method: "DELETE",
        });
        return res.ok;
      } catch {
        return false;
      }
    },
    [apiClient],
  );

  return {
    uploading,
    saving,
    error,
    upload,
    subscribeToImport,
    updateRows,
    commit,
    discard,
    clearError: () => setError(null),
  };
};
