import { useCallback, useEffect, useState } from "react";
import { useApiClient } from "../../../core/common/hooks/use-api-client";
import { useChatSocket } from "./use-chat-socket";
import type { Message } from "../types/messages";

export function useMessages(sessionId: string | null) {
  const { apiClient } = useApiClient();
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchMessages = useCallback(async (): Promise<void> => {
    if (!sessionId) return;
    try {
      setLoading(true);
      setError(null);
      const encoded = encodeURIComponent(sessionId);
      const response = await apiClient(`/chats/${encoded}`);
      if (!response.ok) {
        setError("No se pudieron cargar los mensajes.");
        return;
      }
      const data = (await response.json()) as Message[];
      setMessages(data);
    } catch {
      setError("No hay conexión con el servidor. Revisa tu internet e intenta de nuevo.");
    } finally {
      setLoading(false);
    }
  }, [apiClient, sessionId]);

  useEffect(() => {
    setMessages([]);
    fetchMessages().catch(console.error);
  }, [fetchMessages]);

  // Empuje en vivo del socket (ver ChatsService.recordMessage en el API):
  // agrega el mensaje nuevo de la conversacion abierta sin volver a pedir el
  // historial completo.
  useChatSocket(
    useCallback(
      (event) => {
        if (event.sessionId !== sessionId) return;
        setMessages((prev) =>
          prev.some((m) => m.id === event.message.id) ? prev : [...prev, event.message],
        );
      },
      [sessionId],
    ),
  );

  // El archivo se pide por el API (nunca hay una URL del bucket) y se baja como adjunto.
  const downloadMedia = useCallback(
    async (message: Message): Promise<boolean> => {
      if (!sessionId || !message.mediaId) return false;
      const response = await apiClient(
        `/chats/${encodeURIComponent(sessionId)}/media/${message.mediaId}`,
      );
      if (!response.ok) return false;
      const url = URL.createObjectURL(await response.blob());
      const link = document.createElement("a");
      link.href = url;
      link.download = `archivo-${message.id}`;
      link.click();
      URL.revokeObjectURL(url);
      return true;
    },
    [apiClient, sessionId],
  );

  return { messages, loading, error, downloadMedia };
}
