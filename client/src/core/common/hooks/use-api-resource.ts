import { useEffect, useState } from "react";
import { useApiClient } from "./use-api-client";

// Lectura simple de un recurso (resumen, estadisticas). Con path null no pide nada;
// una respuesta de un path anterior que llega tarde se descarta.
export const useApiResource = <T,>(path: string | null) => {
  const { apiClient } = useApiClient();
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!path) {
      setData(null);
      return;
    }
    let cancelled = false;
    setLoading(true);
    apiClient(path)
      .then(async (response) => {
        if (cancelled) return;
        setData(response.ok ? ((await response.json()) as T) : null);
      })
      .catch(() => {
        if (!cancelled) setData(null);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [apiClient, path]);

  return { data, loading };
};
