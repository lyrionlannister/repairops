import { useEffect, useRef } from "react";
import { chatSocketUrl } from "../utils/chat-socket-url";
import type { ChatMessageEvent } from "../types/chats-socket";

const RECONNECT_DELAY_MS = 3000;

// Un socket por hook: use-messages y use-conversations se suscriben cada uno
// al suyo. La cookie de sesion viaja sola en el handshake (mismo criterio que
// useApiClient: httpOnly, sameSite=strict same-site), no hay token que pasar.
export function useChatSocket(onMessage: (event: ChatMessageEvent) => void): void {
  const handlerRef = useRef(onMessage);
  handlerRef.current = onMessage;

  useEffect(() => {
    const url = chatSocketUrl();
    if (!url) return;

    let socket: WebSocket | null = null;
    let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
    let stopped = false;

    const connect = () => {
      socket = new WebSocket(url);
      socket.onmessage = (ev) => {
        try {
          const data = JSON.parse(ev.data as string) as ChatMessageEvent;
          if (data.type === "chat:message") handlerRef.current(data);
        } catch {
          // Mensaje no reconocido: se ignora en vez de tumbar el socket.
        }
      };
      socket.onclose = () => {
        if (!stopped) reconnectTimer = setTimeout(connect, RECONNECT_DELAY_MS);
      };
    };

    connect();

    return () => {
      stopped = true;
      if (reconnectTimer) clearTimeout(reconnectTimer);
      socket?.close();
    };
  }, []);
}
