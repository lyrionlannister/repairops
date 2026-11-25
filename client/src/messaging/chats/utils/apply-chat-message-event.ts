import type { Conversation } from "../types/conversations";
import type { ChatMessageEvent } from "../types/chats-socket";

// Actualiza la conversación existente con el mensaje nuevo (y la sube al
// tope, como WhatsApp) sin pedir la lista completa de nuevo. Devuelve null
// cuando la conversación no existe todavía (contacto nuevo): el caller debe
// refrescar la lista completa en ese caso.
export function applyChatMessageEvent(
  conversations: Conversation[],
  event: ChatMessageEvent,
): Conversation[] | null {
  const index = conversations.findIndex((c) => c.sessionId === event.sessionId);
  if (index === -1) return null;

  const updated: Conversation = {
    ...conversations[index],
    messageCount: conversations[index].messageCount + 1,
    lastContent: event.message.content,
    lastType: event.message.type,
  };
  const rest = conversations.filter((_, i) => i !== index);
  return [updated, ...rest];
}
