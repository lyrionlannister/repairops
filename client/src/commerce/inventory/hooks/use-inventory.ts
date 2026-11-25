import { useState, useCallback } from "react";
import { useApiClient } from "@common/hooks/use-api-client";
import type { InventoryItem, InventoryMovement, CreateItemPayload } from "../types/inventory";
import { readApiError, apiErrorText } from "@common/utils/api-error";

export const useInventory = () => {
  const { apiClient } = useApiClient();
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [movements, setMovements] = useState<InventoryMovement[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);


  const create = useCallback(
    async (data: CreateItemPayload): Promise<boolean> => {
      setSaving(true);
      setError(null);
      try {
        const res = await apiClient("/inventory", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        });
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new Error(apiErrorText(body, "No se pudo crear el producto"));
        }
        const created: InventoryItem = await res.json();
        setItems((prev) => [...prev, created].sort((a, b) => a.name.localeCompare(b.name)));
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
    async (id: string, data: Partial<CreateItemPayload>): Promise<boolean> => {
      setSaving(true);
      setError(null);
      try {
        const res = await apiClient(`/inventory/${id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        });
        if (!res.ok) throw new Error(await readApiError(res, "No se pudo actualizar el producto"));
        const updated: InventoryItem = await res.json();
        setItems((prev) => prev.map((i) => (i.id === id ? updated : i)));
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
        const res = await apiClient(`/inventory/${id}`, { method: "DELETE" });
        if (!res.ok) throw new Error(await readApiError(res, "No se pudo eliminar el producto"));
        setItems((prev) => prev.filter((i) => i.id !== id));
        return true;
      } catch (err) {
        setError(err instanceof Error ? err.message : "Algo salió mal. Intenta de nuevo.");
        return false;
      }
    },
    [apiClient],
  );

  const bulkImport = useCallback(
    async (file: File, localId: string): Promise<{ imported: number } | null> => {
      setSaving(true);
      setError(null);
      try {
        const buffer = await file.arrayBuffer();
        const res = await apiClient(`/inventory/import?localId=${encodeURIComponent(localId)}`, {
          method: "POST",
          headers: { "Content-Type": file.type || "application/octet-stream" },
          body: buffer,
        });
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          const details = (body as { details?: string[] }).details;
          throw new Error(
            details?.length
              ? details.join("\n")
              : (apiErrorText(body, "Error al importar el archivo")),
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

  const fetchMovements = useCallback(
    async (inventoryItemId: string) => {
      setError(null);
      try {
        const res = await apiClient(`/inventory/${inventoryItemId}/movements`);
        if (!res.ok) throw new Error(await readApiError(res, "Error al cargar movimientos"));
        setMovements(await res.json());
      } catch (err) {
        setError(err instanceof Error ? err.message : "Algo salió mal. Intenta de nuevo.");
      }
    },
    [apiClient],
  );

  const registerMovement = useCallback(
    async (
      inventoryItemId: string,
      data: {
        type: "in" | "out" | "adjustment";
        quantity: number;
        reason?: string;
        createdByEmployeeId?: string;
      },
    ): Promise<boolean> => {
      setSaving(true);
      setError(null);
      try {
        const res = await apiClient(`/inventory/${inventoryItemId}/movements`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        });
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new Error(apiErrorText(body, "Error al registrar movimiento"));
        }
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

  const fetchById = useCallback(
    async (id: string): Promise<InventoryItem | null> => {
      setLoading(true);
      setError(null);
      try {
        const res = await apiClient(`/inventory/${encodeURIComponent(id)}`);
        if (!res.ok) throw new Error(await readApiError(res, "No encontramos el producto"));
        const item: InventoryItem = await res.json();
        setItems([item]);
        return item;
      } catch (err) {
        setError(err instanceof Error ? err.message : "Algo salió mal. Intenta de nuevo.");
        return null;
      } finally {
        setLoading(false);
      }
    },
    [apiClient],
  );

  return {
    items,
    movements,
    loading,
    saving,
    error,
    fetchById,
    create,
    update,
    remove,
    bulkImport,
    fetchMovements,
    registerMovement,
  };
};
