import { Router } from "express";
import { BillingWebhookController } from "../controllers/billing-webhook.controller.js";
import { verifyStripeSignatureMiddleware } from "../middlewares/verify-stripe-signature.middleware.js";

// Publico a proposito -- Stripe llama este endpoint sin JWT. La firma
// Stripe-Signature es la unica autenticacion, igual que el webhook de WhatsApp.
export const createBillingWebhookRouter = (controller: BillingWebhookController): Router => {
  const router = Router();
  router.post("/webhook", verifyStripeSignatureMiddleware, controller.receive);
  return router;
};
