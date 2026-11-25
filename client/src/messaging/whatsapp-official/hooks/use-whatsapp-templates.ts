import { useCallback, useState } from "react";
import { useApiClient } from "@common/hooks/use-api-client";
import type { WhatsappTemplateStatusRow } from "../types/whatsapp-templates";
import { apiErrorText } from "@common/utils/api-error";

// GET dispara la reconciliación on-demand en el backend (da de alta en Meta
// las plantillas del catálogo que falten y refresca el status de las que ya
// existen) -- no hace falta un endpoint de "crear" aparte, abrir esta
// pantalla ya las crea si no existen.
export const useWhatsappTemplates = () => {
  const { apiClient } = useApiClient();
  const [templates, setTemplates] = useState<WhatsappTemplateStatusRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sync = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiClient("/whatsapp-official/templates");
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(apiErrorText(body, "Error al sincronizar plantillas con Meta"));
      }
      setTemplates(await res.json());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Algo salió mal. Intenta de nuevo.");
    } finally {
      setLoading(false);
    }
  }, [apiClient]);

  return { templates, loading, error, sync };
};
