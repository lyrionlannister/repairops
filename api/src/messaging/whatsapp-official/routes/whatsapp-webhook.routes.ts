import { Router } from "express";
import { WhatsappWebhookController } from "../controllers/whatsapp-webhook.controller.js";

// Publico a proposito -- Meta llama este endpoint sin JWT. La firma
// X-Hub-Signature-256 (verificada en el controller) es la unica autenticacion,
// igual que /api/v1/n8n/* usa su propio secreto compartido en vez de JWT.
export const createWhatsappWebhookRouter = (controller: WhatsappWebhookController): Router => {
  const router = Router();
  router.get("/webhook", controller.verify);
  router.post("/webhook", controller.receive);
  return router;
};
