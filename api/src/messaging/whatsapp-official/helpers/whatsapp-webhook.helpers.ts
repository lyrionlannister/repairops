import type { IncomingWhatsappMessage } from "../services/whatsapp-webhook.service.js";

// El mismo payload de Meta trae tanto mensajes nuevos (value.messages) como
// actualizaciones de estado de entrega (value.statuses) bajo el mismo
// "field": "messages" -- esta funcion solo extrae texto entrante, cualquier
// otra cosa (status, imagen, audio, etc.) se ignora sin error, Meta no
// reintenta por eso.
export function extractIncomingTextMessages(payload: unknown): IncomingWhatsappMessage[] {
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
        if (raw?.type !== "text" || !raw?.text?.body || !raw?.from) continue;

        const contact = value.contacts?.find((c: any) => c.wa_id === raw.from);
        messages.push({
          phoneNumberId,
          from: raw.from,
          messageId: raw.id,
          body: raw.text.body,
          contactName: contact?.profile?.name,
        });
      }
    }
  }

  return messages;
}
