import { useCallback, useState } from "react";
import { useApiClient } from "@common/hooks/use-api-client";
import type { SaleWithItems, SaleListItem, CreateReturnPayload, ReturnRecord } from "../types/returns";
import { readApiError } from "@common/utils/api-error";

// Metodos de reembolso = CashMovementMethod del backend (ReturnService), no
// SalePaymentMethod -- "credito" existe para vender, nunca para reembolsar.

async function readError(res: Response, fallback: string): Promise<string> {
  const body = await res.json().catch(() => ({}));
  return (body as { error?: string | string[] }).error?.toString() ?? fallback;
}

export const useReturns = () => {
  const { apiClient } = useApiClient();
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchSaleDetail = useCallback(
    async (saleId: string): Promise<SaleWithItems | null> => {
      const detailRes = await apiClient(`/sales/${saleId}`);
      if (!detailRes.ok) throw new Error(await readApiError(detailRes, "Error al cargar la venta"));
      return await detailRes.json();
    },
    [apiClient],
  );

  // No hay endpoint de busqueda por folio en el backend -- la lista de
  // ventas de un taller es chica, filtrar del lado del cliente es la
  // opcion mas simple (ver plan Fase 5, Tarea R5).
  const findSaleByNumber = useCallback(
    async (saleNumber: number): Promise<SaleWithItems | null> => {
      setSearching(true);
      setSearchError(null);
      try {
        const listRes = await apiClient("/sales");
        if (!listRes.ok) throw new Error(await readApiError(listRes, "Error al buscar la venta"));
        const sales: Array<{ id: string; saleNumber: number }> = await listRes.json();
        const match = sales.find((s) => s.saleNumber === saleNumber);
        if (!match) {
          setSearchError(`No se encontró la venta con folio ${saleNumber}`);
          return null;
        }
        return await fetchSaleDetail(match.id);
      } catch (err) {
        setSearchError(err instanceof Error ? err.message : "Algo salió mal. Intenta de nuevo.");
        return null;
      } finally {
        setSearching(false);
      }
    },
    [apiClient, fetchSaleDetail],
  );

  // Mismo endpoint /sales sin buscador dedicado -- filtra del lado del
  // cliente por customerId, igual que findSaleByNumber filtra por folio.
  const listSalesByCustomer = useCallback(
    async (customerId: string): Promise<SaleListItem[]> => {
      const res = await apiClient("/sales");
      if (!res.ok) return [];
      const sales: SaleListItem[] = await res.json();
      return sales
        .filter((s) => s.customerId === customerId)
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    },
    [apiClient],
  );

  const findSaleById = useCallback(
    async (saleId: string): Promise<SaleWithItems | null> => {
      setSearching(true);
      setSearchError(null);
      try {
        return await fetchSaleDetail(saleId);
      } catch (err) {
        setSearchError(err instanceof Error ? err.message : "Algo salió mal. Intenta de nuevo.");
        return null;
      } finally {
        setSearching(false);
      }
    },
    [fetchSaleDetail],
  );

  // Cuanto ya se devolvio de cada linea -- SUMA sobre las devoluciones
  // previas de esta venta, nunca un campo cacheado (ver ReturnService).
  const getReturnedQuantities = useCallback(
    async (saleId: string): Promise<Record<string, number>> => {
      const res = await apiClient(`/returns/by-sale/${saleId}`);
      if (!res.ok) return {};
      const returns: Array<{ id: string }> = await res.json();
      const totals: Record<string, number> = {};
      await Promise.all(
        returns.map(async (r) => {
          const itemsRes = await apiClient(`/returns/${r.id}`);
          if (!itemsRes.ok) return;
          const detail: { items: Array<{ saleItemId: string; quantity: number }> } = await itemsRes.json();
          for (const item of detail.items) {
            totals[item.saleItemId] = (totals[item.saleItemId] ?? 0) + item.quantity;
          }
        }),
      );
      return totals;
    },
    [apiClient],
  );

  const create = useCallback(
    async (data: CreateReturnPayload): Promise<ReturnRecord | null> => {
      setSaving(true);
      setError(null);
      try {
        const res = await apiClient("/returns", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        });
        if (!res.ok) throw new Error(await readError(res, "Error al registrar la devolución"));
        return await res.json();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Algo salió mal. Intenta de nuevo.");
        return null;
      } finally {
        setSaving(false);
      }
    },
    [apiClient],
  );

  return {
    searching,
    searchError,
    saving,
    error,
    findSaleByNumber,
    findSaleById,
    listSalesByCustomer,
    getReturnedQuantities,
    create,
    clearError: () => setError(null),
  };
};
