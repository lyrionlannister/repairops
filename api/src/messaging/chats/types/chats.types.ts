export interface ConversationDto {
  sessionId: string;
  phone: string;
  contactName?: string;
  messageCount: number;
  lastContent: string;
  lastType: string;
}

export interface MessageDto {
  id: string;
  sessionId: string;
  content: string;
  type: string;
  fromMe: boolean;
  // Tipo de contenido de WhatsApp ("text", "image", ...). `content` lleva el pie de foto si lo hay.
  messageType: string;
  // public_id del mensaje cuando tiene archivo descargable (GET /chats/:sessionId/media/:mediaId).
  mediaId?: string;
  mediaMime?: string;
  mediaSize?: number;
  location?: { lat: string; lng: string };
}
