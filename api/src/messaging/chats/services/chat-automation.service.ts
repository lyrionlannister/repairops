import { singleton } from "tsyringe";
import { settingsService } from "../../../identity/settings/settings.service.js";

export type IncomingChatMessage = {
  tenantId: string;
  from: string;
  body: string;
};

export type ChatAutomationResponse = {
  reply?: string;
  transferToHuman?: boolean;
};

// Contrato HTTP hacia n8n, independiente del transporte. Hoy nada lo llama:
// el webhook solo atiende por ref de nota (ver WhatsappWebhookService); queda
// para cuando el flujo de n8n se retome.
@singleton()
export class ChatAutomationService {
  async send(message: IncomingChatMessage): Promise<ChatAutomationResponse | null> {
    try {
      const automationUrl = await settingsService.getAutomationUrl();
      const response = await fetch(automationUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(message),
      });

      if (!response.ok) {
        console.error("Error en n8n:", response.status, response.statusText);
        return null;
      }

      return (await response.json()) as ChatAutomationResponse;
    } catch (error) {
      console.error("Error al enviar mensaje a n8n:", error);
      return null;
    }
  }
}
