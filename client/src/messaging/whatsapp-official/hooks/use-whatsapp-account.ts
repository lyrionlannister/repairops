import { useCallback, useState } from "react";
import { useApiClient } from "@common/hooks/use-api-client";

export interface WhatsappAccountStatus {
  status: "connected" | "disconnected";
  phoneNumberId: string;
  ownedByPlatform: boolean;
}

export interface ConnectWhatsappAccountInput {
  wabaId: string;
  phoneNumberId: string;
  accessToken: string;
}

export const useWhatsappAccount = () => {
  const { apiClient } = useApiClient();
  const [account, setAccount] = useState<WhatsappAccountStatus | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [connecting, setConnecting] = useState(false);
  const [connectError, setConnectError] = useState<string | null>(null);

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

  // Valida las credenciales contra Meta antes de guardar nada (ver plan
  // Fase 4, Checkpoint 6) -- si Meta las rechaza, la cuenta piloto actual no
  // se toca y el formulario se queda abierto con el error real de Meta.
  const connectAccount = useCallback(
    async (input: ConnectWhatsappAccountInput): Promise<boolean> => {
      setConnecting(true);
      setConnectError(null);
      try {
        const res = await apiClient("/whatsapp-official/account", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(input),
        });
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new Error(
            (body as { error?: string | string[] }).error?.toString() ?? "Error al conectar la cuenta",
          );
        }
        setAccount(await res.json());
        return true;
      } catch (err) {
        setConnectError(err instanceof Error ? err.message : "Error desconocido");
        return false;
      } finally {
        setConnecting(false);
      }
    },
    [apiClient],
  );

  return { account, loading, error, fetchStatus, connecting, connectError, connectAccount };
};
