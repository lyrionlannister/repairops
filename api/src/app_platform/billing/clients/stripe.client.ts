import Stripe from "stripe";
import { requiredEnv } from "../../../core/config/env.js";
import type { SubscriptionStatus } from "../entities/subscription.entity.js";

// Unico lugar que instancia el SDK de Stripe. Igual criterio que
// whatsapp-graph.client.ts: funciones planas, sin estado propio, consumidas
// por un Service -- nunca por un Dao ni por un Controller directo.
let client: Stripe | null = null;

function stripe(): Stripe {
  if (!client) client = new Stripe(requiredEnv("STRIPE_PRIVATE_KEY"));
  return client;
}

export interface CreateCustomerInput {
  email: string;
  name: string;
  tenantPublicId: string;
}

export async function createCustomer(input: CreateCustomerInput): Promise<Stripe.Customer> {
  return stripe().customers.create({
    email: input.email,
    name: input.name,
    metadata: { tenant_public_id: input.tenantPublicId },
  });
}

export interface CreateSubscriptionCheckoutSessionInput {
  stripeCustomerId: string;
  stripePriceId: string;
  tenantPublicId: string;
  // undefined = sin trial -- Stripe cobra de inmediato. Nunca mandar 0: omitir
  // el campo es la única forma correcta de no dar periodo de prueba.
  trialPeriodDays?: number;
  successUrl: string;
  cancelUrl: string;
}

export async function createSubscriptionCheckoutSession(
  input: CreateSubscriptionCheckoutSessionInput,
): Promise<Stripe.Checkout.Session> {
  return stripe().checkout.sessions.create({
    mode: "subscription",
    customer: input.stripeCustomerId,
    line_items: [{ price: input.stripePriceId, quantity: 1 }],
    subscription_data: {
      ...(input.trialPeriodDays ? { trial_period_days: input.trialPeriodDays } : {}),
      metadata: { tenant_public_id: input.tenantPublicId },
    },
    metadata: { tenant_public_id: input.tenantPublicId },
    success_url: input.successUrl,
    cancel_url: input.cancelUrl,
  });
}

export interface CreateOneTimeCheckoutSessionInput {
  stripeCustomerId: string;
  stripePriceId: string;
  tenantPublicId: string;
  stripePriceKey: string;
  successUrl: string;
  cancelUrl: string;
}

export async function createOneTimeCheckoutSession(
  input: CreateOneTimeCheckoutSessionInput,
): Promise<Stripe.Checkout.Session> {
  return stripe().checkout.sessions.create({
    mode: "payment",
    customer: input.stripeCustomerId,
    line_items: [{ price: input.stripePriceId, quantity: 1 }],
    metadata: { tenant_public_id: input.tenantPublicId, stripe_price_key: input.stripePriceKey },
    success_url: input.successUrl,
    cancel_url: input.cancelUrl,
  });
}

export interface CreateBillingPortalSessionInput {
  stripeCustomerId: string;
  returnUrl: string;
}

// Portal del cliente de Stripe: el taller cancela, cambia de plan o de
// método de pago sin pasar por soporte. La sesión expira sola; el return
// vuelve a la app.
export async function createBillingPortalSession(
  input: CreateBillingPortalSessionInput,
): Promise<Stripe.BillingPortal.Session> {
  return stripe().billingPortal.sessions.create({
    customer: input.stripeCustomerId,
    return_url: input.returnUrl,
  });
}

export async function retrieveSubscription(
  stripeSubscriptionId: string,
): Promise<Stripe.Subscription> {
  return stripe().subscriptions.retrieve(stripeSubscriptionId);
}

export async function retrieveCheckoutSession(
  stripeCheckoutSessionId: string,
): Promise<Stripe.Checkout.Session> {
  return stripe().checkout.sessions.retrieve(stripeCheckoutSessionId);
}

export interface SyncExtrasSubscriptionInput {
  stripeCustomerId: string;
  existingStripeSubscriptionId: string | null;
  extraUserPriceId: string;
  extraBranchPriceId: string;
  extraUsers: number;
  extraBranches: number;
}

// Crea, actualiza o cancela la Subscription de extras según las cantidades
// pedidas -- siempre mensual, sin importar el intervalo del plan base.
export async function syncExtrasSubscription(
  input: SyncExtrasSubscriptionInput,
): Promise<Stripe.Subscription | null> {
  const hasExtras = input.extraUsers > 0 || input.extraBranches > 0;

  if (!hasExtras) {
    if (input.existingStripeSubscriptionId) {
      await stripe().subscriptions.cancel(input.existingStripeSubscriptionId);
    }
    return null;
  }

  const items = [
    { price: input.extraUserPriceId, quantity: input.extraUsers },
    { price: input.extraBranchPriceId, quantity: input.extraBranches },
  ];

  if (!input.existingStripeSubscriptionId) {
    return stripe().subscriptions.create({
      customer: input.stripeCustomerId,
      items,
      proration_behavior: "create_prorations",
    });
  }

  const current = await stripe().subscriptions.retrieve(input.existingStripeSubscriptionId);
  const itemsWithIds = current.items.data.map((item) => {
    const priceId = item.price.id;
    const quantity = priceId === input.extraUserPriceId ? input.extraUsers : input.extraBranches;
    return { id: item.id, quantity };
  });
  return stripe().subscriptions.update(input.existingStripeSubscriptionId, {
    items: itemsWithIds,
    proration_behavior: "create_prorations",
  });
}

export function constructWebhookEvent(rawBody: Buffer, signature: string): Stripe.Event {
  return stripe().webhooks.constructEvent(rawBody, signature, requiredEnv("STRIPE_WEBHOOK_SECRET"));
}

// Esta cuenta de Stripe ya no trae current_period_start/end en el nivel de
// Subscription (billing_mode "flexible") -- viven por item. Cada Subscription
// nuestra tiene siempre un solo item (plan o extras), así que items.data[0] basta.
export function subscriptionPeriod(
  subscription: Stripe.Subscription,
): { start: Date; end: Date } | null {
  const item = subscription.items.data[0];
  if (!item) return null;
  return {
    start: new Date(item.current_period_start * 1000),
    end: new Date(item.current_period_end * 1000),
  };
}

// Tampoco invoice.subscription a nivel raíz en esta cuenta -- vive en
// invoice.parent.subscription_details.subscription.
export function subscriptionIdFromInvoice(invoice: Stripe.Invoice): string | null {
  const subscription = invoice.parent?.subscription_details?.subscription;
  if (!subscription) return null;
  return typeof subscription === "string" ? subscription : subscription.id;
}

export function customerIdFrom(object: {
  customer: string | Stripe.Customer | Stripe.DeletedCustomer | null;
}): string | null {
  const { customer } = object;
  if (!customer) return null;
  return typeof customer === "string" ? customer : customer.id;
}

export function toLocalSubscriptionStatus(status: Stripe.Subscription.Status): SubscriptionStatus {
  switch (status) {
    case "trialing":
      return "trialing";
    case "active":
      return "active";
    case "incomplete":
      return "incomplete";
    case "canceled":
    case "incomplete_expired":
      return "canceled";
    case "past_due":
    case "unpaid":
    case "paused":
    default:
      return "past_due";
  }
}
