import { singleton } from "tsyringe";
import { Request, Response } from "express";
import { WhatsappWebhookService } from "../services/whatsapp-webhook.service.js";
import { verifyMetaSignature } from "../utils/verify-signature.js";
import { extractIncomingTextMessages } from "../helpers/whatsapp-webhook.helpers.js";
import { requiredEnv } from "../../../core/config/env.js";

@singleton()
export class WhatsappWebhookController {
  constructor(private whatsappWebhookService: WhatsappWebhookService) {}

  // Handshake de suscripcion que exige Meta antes de mandar cualquier POST
  // (se configura una sola vez en el panel de la WABA).
  verify = (req: Request, res: Response): void => {
    const mode = req.query["hub.mode"];
    const token = req.query["hub.verify_token"];
    const challenge = req.query["hub.challenge"];

    if (mode === "subscribe" && token === requiredEnv("WHATSAPP_WEBHOOK_VERIFY_TOKEN")) {
      res.status(200).send(challenge);
      return;
    }
    res.sendStatus(403);
  };

  receive = async (req: Request, res: Response): Promise<void> => {
    const signatureHeader = req.header("x-hub-signature-256");
    const rawBody = (req as unknown as { rawBody?: Buffer }).rawBody;

    if (!rawBody || !verifyMetaSignature(rawBody, signatureHeader, requiredEnv("WHATSAPP_APP_SECRET"))) {
      res.sendStatus(401);
      return;
    }

    try {
      const messages = extractIncomingTextMessages(req.body);
      for (const message of messages) {
        await this.whatsappWebhookService.handleIncomingMessage(message);
      }
    } catch (error) {
      console.error("Error procesando webhook de WhatsApp:", error);
    }

    // Siempre 200 una vez pasada la firma: Meta reintenta agresivamente
    // cualquier otro status, y una falla nuestra (n8n caido, etc.) no debe
    // convertirse en una tormenta de reintentos.
    res.sendStatus(200);
  };
}
