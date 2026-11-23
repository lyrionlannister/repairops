import type { NextFunction, Request, Response } from "express";
import Stripe from "stripe";
import { constructWebhookEvent } from "../clients/stripe.client.js";

export interface StripeWebhookRequest extends Request {
  stripeEvent?: Stripe.Event;
}

export function verifyStripeSignatureMiddleware(
  req: StripeWebhookRequest,
  res: Response,
  next: NextFunction,
): void {
  const rawBody = req.rawBody;
  const signature = req.header("stripe-signature");

  if (!rawBody || !signature) {
    res.sendStatus(400);
    return;
  }

  try {
    req.stripeEvent = constructWebhookEvent(rawBody, signature);
  } catch (error) {
    console.error("Firma de webhook de Stripe inválida:", error);
    res.sendStatus(400);
    return;
  }
  next();
}
