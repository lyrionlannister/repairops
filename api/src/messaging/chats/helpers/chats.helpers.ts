import { ChatMessageDao, ConversationRow } from "../daos/chat-message.dao.js";
import { ChatDirection } from "../entities/chat-message.entity.js";
import { ConversationDto, MessageDto } from "../types/chats.types.js";
import { can, currentUserId } from "../../../identity/authz/access.js";

// Telefono tal como se guarda y se usa de clave de conversacion: solo
// digitos (Meta manda wa_id sin "+"; el cliente puede pegar "+" o espacios).
export function normalizePhone(value: string): string {
  return value.replace(/\D/g, "");
}

// El cliente de chat conserva el vocabulario "human"/"ai": un entrante es del
// cliente ("human"), cualquier saliente (IA o agente) se pinta como "ai".
const toClientType = (direction: ChatDirection): string =>
  direction === "inbound" ? "human" : "ai";

export function toConversationDto(
  row: ConversationRow,
  contactNameByPhone: Map<string, string>,
): ConversationDto {
  const phone = normalizePhone(row.sessionId);
  return {
    sessionId: row.sessionId,
    phone,
    contactName: contactNameByPhone.get(phone),
    messageCount: row.messageCount,
    lastContent: row.lastContent ?? "",
    lastType: row.lastDirection ? toClientType(row.lastDirection) : "human",
  };
}

export function toMessageDto(entry: {
  publicId: string;
  contactPhone: string;
  body: string;
  direction: ChatDirection;
  messageType?: string;
  mediaKey?: string | null;
  mediaMime?: string | null;
  mediaSize?: number | null;
  locationLat?: string | null;
  locationLng?: string | null;
}): MessageDto {
  return {
    id: entry.publicId,
    sessionId: entry.contactPhone,
    content: entry.body,
    type: toClientType(entry.direction),
    fromMe: entry.direction === "outbound",
    messageType: entry.messageType ?? "text",
    ...(entry.mediaKey
      ? {
          mediaId: entry.publicId,
          mediaMime: entry.mediaMime ?? undefined,
          mediaSize: entry.mediaSize ?? undefined,
        }
      : {}),
    ...(entry.locationLat && entry.locationLng
      ? { location: { lat: entry.locationLat, lng: entry.locationLng } }
      : {}),
  };
}

// Compartido por ChatsService.canAccess (HTTP) y ChatRealtimeService (socket):
// misma regla de autorizacion para los dos canales, sin que uno dependa del
// otro (evita el ciclo ChatsService <-> ChatRealtimeService).
export async function canAccessConversation(
  dao: ChatMessageDao,
  sessionId: string,
  action: "read" | "reply",
): Promise<boolean> {
  const [full, own] =
    action === "read"
      ? (["chats.read", "chats.read.own"] as const)
      : (["chats.reply", "chats.reply.own"] as const);
  if (can(full)) return true;
  const userId = currentUserId();
  if (!can(own) || !userId) return false;
  return (await dao.findPhonesOfAssignedNotes(userId)).has(normalizePhone(sessionId));
}
