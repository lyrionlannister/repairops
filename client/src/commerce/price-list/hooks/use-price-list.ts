import { useState, useCallback } from "react";
import { useApiClient } from "@common/hooks/use-api-client";
import type { PriceListItem } from "../types/price-list";
import { readApiError, apiErrorText } from "@common/utils/api-error";

export const usePriceList = () => {
  const { apiClient } = useApiClient();
  const [items, setItems] = useState<PriceListItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchAll = useCallback(
    async (query?: string) => {
      setLoading(true);
      setError(null);
      try {
        const endpoint = query ? `/price-list?q=${encodeURIComponent(query)}` : "/price-list";
        const res = await apiClient(endpoint);
        if (!res.ok) throw new Error(await readApiError(res, "Error al cargar lista de precios"));
        setItems(await res.json());
      } catch (err) {
        setError(err instanceof Error ? err.message : "Algo salió mal. Intenta de nuevo.");
      } finally {
        setLoading(false);
      }
    },
    [apiClient],
  );

  const fetchById = useCallback(
    async (id: string): Promise<PriceListItem | null> => {
      setLoading(true);
      setError(null);
      try {
        const res = await apiClient(`/price-list/${encodeURIComponent(id)}`);
        if (!res.ok) throw new Error(await readApiError(res, "No encontramos el producto"));
        return (await res.json()) as PriceListItem;
      } catch (err) {
        setError(err instanceof Error ? err.message : "Algo salió mal. Intenta de nuevo.");
        return null;
      } finally {
        setLoading(false);
      }
    },
    [apiClient],
  );

  const create = useCallback(
    async (
      data: Omit<PriceListItem, "id" | "createdAt" | "updatedAt" | "supplier">,
    ): Promise<boolean> => {
      setSaving(true);
      setError(null);
      try {
        const res = await apiClient("/price-list", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        });
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new Error(apiErrorText(body, "No se pudo crear el producto"));
        }
        const created: PriceListItem = await res.json();
        setItems((prev) =>
          [...prev, created].sort(
            (a, b) => a.brand.localeCompare(b.brand) || a.model.localeCompare(b.model),
          ),
        );
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
    async (
      id: string,
      data: Partial<Omit<PriceListItem, "id" | "createdAt" | "updatedAt" | "supplier">>,
    ): Promise<boolean> => {
      setSaving(true);
      setError(null);
      try {
        const res = await apiClient(`/price-list/${id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        });
        if (!res.ok) throw new Error(await readApiError(res, "No se pudo actualizar el producto"));
        const updated: PriceListItem = await res.json();
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
        const res = await apiClient(`/price-list/${id}`, {
          method: "DELETE",
        });
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

  return { items, loading, saving, error, fetchAll, fetchById, create, update, remove };
};
