export interface Message {
  id: string;
  sessionId: string;
  content: string;
  type: string;
  fromMe: boolean;
  messageType: string;
  // Solo si el mensaje trae un archivo descargable.
  mediaId?: string;
  mediaMime?: string;
  mediaSize?: number;
  location?: { lat: string; lng: string };
}
