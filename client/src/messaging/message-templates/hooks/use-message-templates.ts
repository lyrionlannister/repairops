import { useState, useCallback } from "react";
import { useApiClient } from "@common/hooks/use-api-client";
import type { MessageTemplate } from "../types/message-templates";
import { readApiError, apiErrorText } from "@common/utils/api-error";

export const useMessageTemplates = () => {
  const { apiClient } = useApiClient();
  const [templates, setTemplates] = useState<MessageTemplate[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiClient("/message-templates");
      if (!res.ok) throw new Error(await readApiError(res, "Error al cargar templates"));
      setTemplates(await res.json());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Algo salió mal. Intenta de nuevo.");
    } finally {
      setLoading(false);
    }
  }, [apiClient]);

  const create = useCallback(
    async (data: Pick<MessageTemplate, "key" | "text" | "description">): Promise<boolean> => {
      setSaving(true);
      setError(null);
      try {
        const res = await apiClient("/message-templates", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        });
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new Error(apiErrorText(body, "No se pudo crear la plantilla"));
        }
        const created: MessageTemplate = await res.json();
        setTemplates((prev) => [...prev, created].sort((a, b) => a.key.localeCompare(b.key)));
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
    async (id: string, data: Pick<MessageTemplate, "text" | "description">): Promise<boolean> => {
      setSaving(true);
      setError(null);
      try {
        const res = await apiClient(`/message-templates/${id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        });
        if (!res.ok) throw new Error(await readApiError(res, "No se pudo actualizar la plantilla"));
        const updated: MessageTemplate = await res.json();
        setTemplates((prev) => prev.map((t) => (t.id === id ? updated : t)));
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

  const remove = useCallback(
    async (id: string): Promise<boolean> => {
      setError(null);
      try {
        const res = await apiClient(`/message-templates/${id}`, {
          method: "DELETE",
        });
        if (!res.ok) throw new Error(await readApiError(res, "No se pudo eliminar la plantilla"));
        setTemplates((prev) => prev.filter((t) => t.id !== id));
        return true;
      } catch (err) {
        setError(err instanceof Error ? err.message : "Algo salió mal. Intenta de nuevo.");
        return false;
      }
    },
    [apiClient],
  );

  return { templates, loading, saving, error, fetchAll, create, update, remove };
};
