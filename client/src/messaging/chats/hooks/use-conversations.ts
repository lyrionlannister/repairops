import { useCallback, useEffect, useRef, useState } from "react";
import { useApiClient } from "../../../core/common/hooks/use-api-client";
import { useChatSocket } from "./use-chat-socket";
import { applyChatMessageEvent } from "../utils/apply-chat-message-event";
import type { Conversation } from "../types/conversations";

export function useConversations() {
  const { apiClient } = useApiClient();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchConversations = useCallback(async (): Promise<void> => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiClient("/chats");
      if (!response.ok) {
        setError("No se pudieron cargar las conversaciones.");
        return;
      }
      const data = (await response.json()) as Conversation[];
      setConversations(data);
    } catch {
      setError("No hay conexión con el servidor. Revisa tu internet e intenta de nuevo.");
    } finally {
      setLoading(false);
    }
  }, [apiClient]);

  useEffect(() => {
    fetchConversations().catch(console.error);
  }, [fetchConversations]);

  // Un contacto que no estaba en la lista (primer mensaje suyo) no se puede
  // insertar con los datos del evento solo (falta su nombre, etc.): se pide
  // la lista completa una sola vez, no polling.
  const fetchConversationsRef = useRef(fetchConversations);
  fetchConversationsRef.current = fetchConversations;

  useChatSocket(
    useCallback((event) => {
      setConversations((prev) => {
        const next = applyChatMessageEvent(prev, event);
        if (next) return next;
        fetchConversationsRef.current().catch(console.error);
        return prev;
      });
    }, []),
  );

  return { conversations, loading, error, refetch: fetchConversations };
}
