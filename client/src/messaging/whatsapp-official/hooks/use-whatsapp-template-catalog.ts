import { useCallback, useState } from "react";
import { useApiClient } from "@common/hooks/use-api-client";
import type { WhatsappTemplateCatalogEntryRow, CreateWhatsappTemplateCatalogEntryInput, UpdateWhatsappTemplateCatalogEntryInput } from "../types/whatsapp-template-catalog";

async function readError(res: Response, fallback: string): Promise<string> {
  const body = await res.json().catch(() => ({}));
  return (body as { error?: string | string[] }).error?.toString() ?? fallback;
}

// `scope` elige el prefijo de ruta -- "tenant" es el catálogo de la empresa
// (owner del tenant actual), "system" es el de la plataforma misma
// (solo isPlatformAdmin, ver plan Fase 4 Checkpoint 7). Mismo shape de
// respuesta en ambos, el backend ya separa la autorización.
export const useWhatsappTemplateCatalog = (scope: "tenant" | "system" = "tenant") => {
  const { apiClient } = useApiClient();
  const basePath =
    scope === "system" ? "/whatsapp-official/catalog/system" : "/whatsapp-official/catalog";
  const [entries, setEntries] = useState<WhatsappTemplateCatalogEntryRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchEntries = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiClient(basePath);
      if (!res.ok) throw new Error(await readError(res, "Error al cargar el catálogo"));
      setEntries(await res.json());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error desconocido");
    } finally {
      setLoading(false);
    }
  }, [apiClient, basePath]);

  const create = useCallback(
    async (input: CreateWhatsappTemplateCatalogEntryInput): Promise<boolean> => {
      setSaving(true);
      setError(null);
      try {
        const res = await apiClient(basePath, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(input),
        });
        if (!res.ok) throw new Error(await readError(res, "Error al crear la plantilla"));
        const created = (await res.json()) as WhatsappTemplateCatalogEntryRow;
        setEntries((prev) => [...prev, created]);
        return true;
      } catch (err) {
        setError(err instanceof Error ? err.message : "Error desconocido");
        return false;
      } finally {
        setSaving(false);
      }
    },
    [apiClient, basePath],
  );

  const update = useCallback(
    async (id: string, input: UpdateWhatsappTemplateCatalogEntryInput): Promise<boolean> => {
      setSaving(true);
      setError(null);
      try {
        const res = await apiClient(`${basePath}/${id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(input),
        });
        if (!res.ok) throw new Error(await readError(res, "Error al editar la plantilla"));
        const updated = (await res.json()) as WhatsappTemplateCatalogEntryRow;
        setEntries((prev) => prev.map((e) => (e.id === id ? updated : e)));
        return true;
      } catch (err) {
        setError(err instanceof Error ? err.message : "Error desconocido");
        return false;
      } finally {
        setSaving(false);
      }
    },
    [apiClient, basePath],
  );

  const remove = useCallback(
    async (id: string): Promise<boolean> => {
      setSaving(true);
      setError(null);
      try {
        const res = await apiClient(`${basePath}/${id}`, { method: "DELETE" });
        if (!res.ok) throw new Error(await readError(res, "Error al borrar la plantilla"));
        setEntries((prev) => prev.filter((e) => e.id !== id));
        return true;
      } catch (err) {
        setError(err instanceof Error ? err.message : "Error desconocido");
        return false;
      } finally {
        setSaving(false);
      }
    },
    [apiClient, basePath],
  );

  return { entries, loading, saving, error, fetchEntries, create, update, remove };
};
