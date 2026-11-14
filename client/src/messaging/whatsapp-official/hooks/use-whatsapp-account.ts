import { useCallback, useState } from "react";
import { useApiClient } from "@common/hooks/use-api-client";

export interface WhatsappAccountStatus {
  status: "connected" | "disconnected";
  phoneNumberId: string;
  ownedByPlatform: boolean;
}

export const useWhatsappAccount = () => {
  const { apiClient } = useApiClient();
  const [account, setAccount] = useState<WhatsappAccountStatus | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchStatus = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiClient("/whatsapp-official/status");
      if (!res.ok) throw new Error("Error al obtener el estado de WhatsApp");
      setAccount(await res.json());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error desconocido");
    } finally {
      setLoading(false);
    }
  }, [apiClient]);

  return { account, loading, error, fetchStatus };
};
