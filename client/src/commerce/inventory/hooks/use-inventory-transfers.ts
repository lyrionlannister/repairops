import { useCallback, useState } from "react";
import { useApiClient } from "@common/hooks/use-api-client";

export interface InventoryTransfer {
  id: string;
  fromInventoryItemId: string;
  toInventoryItemId: string;
  quantity: number;
  reason: string | null;
  createdAt: string;
}

export interface CreateInventoryTransferPayload {
  fromInventoryItemId: string;
  toInventoryItemId: string;
  quantity: number;
  reason?: string;
}

export const useInventoryTransfers = () => {
  const { apiClient } = useApiClient();
  const [transfers, setTransfers] = useState<InventoryTransfer[]>([]);
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiClient("/inventory/transfers");
      if (!res.ok) throw new Error("Error al cargar transferencias");
      setTransfers(await res.json());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error desconocido");
    } finally {
      setLoading(false);
    }
  }, [apiClient]);

  const create = useCallback(
    async (data: CreateInventoryTransferPayload): Promise<boolean> => {
      setCreating(true);
      setError(null);
      try {
        const res = await apiClient("/inventory/transfers", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        });
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new Error((body as { error?: string | string[] }).error?.toString() ?? "Error al transferir");
        }
        const created: InventoryTransfer = await res.json();
        setTransfers((prev) => [created, ...prev]);
        return true;
      } catch (err) {
        setError(err instanceof Error ? err.message : "Error desconocido");
        return false;
      } finally {
        setCreating(false);
      }
    },
    [apiClient],
  );

  return { transfers, loading, creating, error, fetchAll, create };
};
