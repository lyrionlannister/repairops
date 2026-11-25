import { useCallback, useEffect, useState } from "react";
import { useApiClient } from "./use-api-client";
import { readApiError } from "@common/utils/api-error";

// Pide el PDF al API (el unico definidor de los documentos en carta) y entrega una
// URL de objeto para mostrarlo, descargarlo o abrirlo en otra pestaña.
export const usePdfPreview = (endpoint: string | null) => {
  const { apiClient } = useApiClient();
  const [url, setUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!endpoint) return;
    let objectUrl: string | null = null;
    let cancelled = false;
    setLoading(true);
    setError(null);
    apiClient(endpoint)
      .then(async (response) => {
        if (!response.ok) throw new Error(await readApiError(response, "No se pudo generar el PDF"));
        const blob = await response.blob();
        if (cancelled) return;
        objectUrl = URL.createObjectURL(blob);
        setUrl(objectUrl);
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof Error ? err.message : "Algo salió mal. Intenta de nuevo.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
      setUrl(null);
    };
  }, [endpoint, apiClient]);

  const download = useCallback(
    (filename: string) => {
      if (!url) return;
      const link = document.createElement("a");
      link.href = url;
      link.download = filename;
      link.click();
    },
    [url],
  );

  const openInTab = useCallback(() => {
    if (url) window.open(url, "_blank", "noopener");
  }, [url]);

  return { url, loading, error, download, openInTab };
};
