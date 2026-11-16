import { useState } from "react";
import { useApiClient } from "./use-api-client";

export const usePdfDownload = () => {
  const { apiClient } = useApiClient();
  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const download = async (endpoint: string, filename: string) => {
    setDownloading(true);
    setError(null);
    try {
      const res = await apiClient(endpoint);
      if (!res.ok) throw new Error("No se pudo generar el PDF");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = filename;
      link.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error desconocido");
    } finally {
      setDownloading(false);
    }
  };

  return { downloading, error, download };
};
