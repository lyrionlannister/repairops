import { useCallback, useState } from "react";
import { useApiClient } from "@common/hooks/use-api-client";
import type { CreateInventoryTransferPayload } from "../types/inventory-transfers";
import { apiErrorText } from "@common/utils/api-error";

export const useInventoryTransfers = () => {
  const { apiClient } = useApiClient();
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
          throw new Error(apiErrorText(body, "No se pudo hacer la transferencia"));
        }
        return true;
      } catch (err) {
        setError(err instanceof Error ? err.message : "Algo salió mal. Intenta de nuevo.");
        return false;
      } finally {
        setCreating(false);
      }
    },
    [apiClient],
  );

  return { creating, error, create };
};
