import { singleton } from "tsyringe";
import { Response } from "express";
import { BillingWebhookService } from "../services/billing-webhook.service.js";
import type { StripeWebhookRequest } from "../middlewares/verify-stripe-signature.middleware.js";

@singleton()
export class BillingWebhookController {
  constructor(private billingWebhookService: BillingWebhookService) {}

  // La firma ya la validó verifyStripeSignatureMiddleware. 200 siempre que el
  // evento quedó procesado (o ya se había procesado antes) -- un 5xx hace que
  // Stripe reintente.
  receive = async (req: StripeWebhookRequest, res: Response): Promise<void> => {
    try {
      await this.billingWebhookService.handle(req.stripeEvent!);
    } catch (error) {
      console.error("Error procesando webhook de Stripe:", error);
      res.sendStatus(500);
      return;
    }
    res.sendStatus(200);
  };
}
