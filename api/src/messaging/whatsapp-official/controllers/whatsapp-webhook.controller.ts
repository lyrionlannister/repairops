import { singleton } from "tsyringe";
import { Request, Response } from "express";
import { WhatsappInboundQueueService } from "../services/whatsapp-inbound-queue.service.js";
import { requiredEnv } from "../../../core/config/env.js";
import { safeEqual } from "../utils/verify-signature.js";

@singleton()
export class WhatsappWebhookController {
  constructor(private whatsappInboundQueueService: WhatsappInboundQueueService) {}

  // Handshake de suscripcion que exige Meta antes de mandar cualquier POST
  // (se configura una sola vez en el panel de la WABA).
  verify = (req: Request, res: Response): void => {
    const mode = req.query["hub.mode"];
    const token = req.query["hub.verify_token"];
    const challenge = req.query["hub.challenge"];

    if (mode === "subscribe" &&
      typeof token === "string" &&
      safeEqual(token, requiredEnv("WHATSAPP_WEBHOOK_VERIFY_TOKEN"))) {
      res.status(200).send(challenge);
      return;
    }
    res.sendStatus(403);
  };

  // La firma ya la valido verifyMetaSignatureMiddleware. 200 solo con el
  // mensaje ya en la cola: si Redis falla, el 500 hace que Meta reintente, y
  // el jobId por wamid descarta el duplicado si el primer intento si entro.
  receive = async (req: Request, res: Response): Promise<void> => {
    try {
      await this.whatsappInboundQueueService.enqueuePayload(req.body);
    } catch (error) {
      console.error("Error encolando webhook de WhatsApp:", error);
      res.sendStatus(500);
      return;
    }
    res.sendStatus(200);
  };
}
