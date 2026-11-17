import type { IncomingWhatsappMessage } from "../services/whatsapp-webhook.service.js";

// El mismo payload de Meta trae tanto mensajes nuevos (value.messages) como
// actualizaciones de estado de entrega (value.statuses) bajo el mismo
// "field": "messages" -- esta funcion solo extrae mensajes entrantes, cualquier
// otra cosa (status, reacciones, etc.) se ignora sin error, Meta no reintenta
// por eso. Se extraen texto, imagen, audio, video, documento, sticker y ubicacion.
const MEDIA_TYPES = ["image", "audio", "video", "document", "sticker"];

export function extractIncomingMessages(payload: unknown): IncomingWhatsappMessage[] {
  const messages: IncomingWhatsappMessage[] = [];
  const entries = (payload as any)?.entry;
  if (!Array.isArray(entries)) return messages;

  for (const entry of entries) {
    for (const change of entry?.changes ?? []) {
      const value = change?.value;
      if (!value?.messages) continue;

      const phoneNumberId = value.metadata?.phone_number_id;
      if (!phoneNumberId) continue;

      for (const raw of value.messages) {
        if (!raw?.from) continue;
        const contact = value.contacts?.find((c: any) => c.wa_id === raw.from);
        const common = { phoneNumberId, from: raw.from, messageId: raw.id, contactName: contact?.profile?.name };

        if (raw.type === "text") {
          if (raw.text?.body) messages.push({ ...common, body: raw.text.body, messageType: "text" });
          continue;
        }
        if (MEDIA_TYPES.includes(raw.type)) {
          const media = raw[raw.type];
          if (!media?.id) continue;
          messages.push({
            ...common,
            body: media.caption ?? "",
            messageType: raw.type,
            media: { id: media.id, mimeType: media.mime_type, sha256: media.sha256 },
          });
          continue;
        }
        if (raw.type === "location") {
          const { latitude, longitude, name } = raw.location ?? {};
          if (typeof latitude !== "number" || typeof longitude !== "number") continue;
          messages.push({
            ...common,
            body: name ?? "",
            messageType: "location",
            location: { lat: latitude.toFixed(6), lng: longitude.toFixed(6) },
          });
        }
      }
    }
  }

  return messages;
}
