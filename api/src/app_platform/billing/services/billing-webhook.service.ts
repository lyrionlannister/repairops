import { singleton } from "tsyringe";
import type Stripe from "stripe";
import { allowSystemScope, runWithTenant } from "../../../core/tenancy/tenant-context.js";
import { SubscriptionDao } from "../daos/subscription.dao.js";
import { StripeWebhookEventDao } from "../daos/stripe-webhook-event.dao.js";
import { StripeInvoicePaymentDao } from "../daos/stripe-invoice-payment.dao.js";
import { StripePriceDao } from "../daos/stripe-price.dao.js";
import { WhatsappMessagePackageDao } from "../../../messaging/whatsapp-official/daos/whatsapp-message-package.dao.js";
import type { Subscription } from "../entities/subscription.entity.js";
import type { StripePriceKey } from "../entities/stripe-price.entity.js";
import {
  customerIdFrom,
  retrieveSubscription,
  subscriptionIdFromInvoice,
  subscriptionPeriod,
  toLocalSubscriptionStatus,
} from "../clients/stripe.client.js";

@singleton()
export class BillingWebhookService {
  constructor(
    private stripeWebhookEventDao: StripeWebhookEventDao,
    private subscriptionDao: SubscriptionDao,
    private stripeInvoicePaymentDao: StripeInvoicePaymentDao,
    private stripePriceDao: StripePriceDao,
    private whatsappMessagePackageDao: WhatsappMessagePackageDao,
  ) {}

  async handle(event: Stripe.Event): Promise<void> {
    const isNew = await this.stripeWebhookEventDao.claim(event.id, event.type);
    if (!isNew) return;

    switch (event.type) {
      case "checkout.session.completed":
        await this.onCheckoutSessionCompleted(event.data.object);
        return;
      case "invoice.payment_succeeded":
        await this.onInvoicePaymentSucceeded(event.data.object);
        return;
      case "invoice.payment_failed":
        await this.onInvoicePaymentFailed(event.data.object);
        return;
      case "customer.subscription.deleted":
        await this.onSubscriptionDeleted(event.data.object);
        return;
      case "customer.subscription.updated":
        await this.onSubscriptionUpdated(event.data.object);
        return;
      default:
        return; // evento no relevante para nosotros, 200 igual.
    }
  }

  // El webhook no trae JWT: resuelve el tenant por el Customer de Stripe
  // antes de poder entrar a runWithTenant, igual que whatsapp-webhook.service.ts
  // resuelve por phone_number_id.
  private async withSubscriptionByCustomer(
    stripeCustomerId: string,
    fn: (subscription: Subscription) => Promise<void>,
  ): Promise<void> {
    const subscription = await allowSystemScope(() =>
      this.subscriptionDao.findByStripeCustomerIdAcrossTenants(stripeCustomerId),
    );
    if (!subscription) {
      console.warn(`Webhook de Stripe: sin subscription local para customer ${stripeCustomerId}`);
      return;
    }
    await runWithTenant(subscription.tenantId, () => fn(subscription));
  }

  private async onCheckoutSessionCompleted(session: Stripe.Checkout.Session): Promise<void> {
    const customerId = customerIdFrom(session);
    if (!customerId) return;

    if (session.mode === "subscription") {
      const stripeSubscriptionId =
        typeof session.subscription === "string" ? session.subscription : session.subscription?.id;
      if (!stripeSubscriptionId) return;

      await this.withSubscriptionByCustomer(customerId, async (subscription) => {
        const stripeSubscription = await retrieveSubscription(stripeSubscriptionId);
        const period = subscriptionPeriod(stripeSubscription);
        await this.subscriptionDao.update(subscription.id, {
          stripeSubscriptionId,
          status: toLocalSubscriptionStatus(stripeSubscription.status),
          currentPeriodStart: period?.start ?? null,
          currentPeriodEnd: period?.end ?? null,
        });
      });
      return;
    }

    if (session.mode === "payment") {
      const stripePriceKey = session.metadata?.["stripe_price_key"];
      if (!stripePriceKey) return;

      await this.withSubscriptionByCustomer(customerId, async () => {
        const price = await this.stripePriceDao.findByKey(stripePriceKey as StripePriceKey);
        if (!price || price.messagesGranted === null) return;
        await this.whatsappMessagePackageDao.claim({
          stripeCheckoutSessionId: session.id,
          stripePriceKey: price.key,
          messagesGranted: price.messagesGranted,
          amountPaid: price.amount,
        });
      });
    }
  }

  private async onInvoicePaymentSucceeded(invoice: Stripe.Invoice): Promise<void> {
    const customerId = customerIdFrom(invoice);
    if (!customerId) return;
    const invoiceSubscriptionId = subscriptionIdFromInvoice(invoice);

    await this.withSubscriptionByCustomer(customerId, async (subscription) => {
      // Solo la invoice de la Subscription del PLAN avanza el período/estado --
      // la de extras (siempre mensual, separada) factura aparte.
      if (invoiceSubscriptionId && invoiceSubscriptionId === subscription.stripeSubscriptionId) {
        const stripeSubscription = await retrieveSubscription(invoiceSubscriptionId);
        const period = subscriptionPeriod(stripeSubscription);
        await this.subscriptionDao.update(subscription.id, {
          status: "active",
          currentPeriodStart: period?.start ?? null,
          currentPeriodEnd: period?.end ?? null,
        });
      }

      if (subscription.plan && subscription.billingInterval) {
        await this.stripeInvoicePaymentDao.claim({
          stripeInvoiceId: invoice.id,
          planKey: subscription.plan.key,
          billingInterval: subscription.billingInterval,
          amount: (invoice.amount_paid / 100).toFixed(2),
          currency: invoice.currency.toUpperCase(),
          paidAt: new Date((invoice.status_transitions.paid_at ?? invoice.created) * 1000),
        });
      }
    });
  }

  private async onInvoicePaymentFailed(invoice: Stripe.Invoice): Promise<void> {
    const customerId = customerIdFrom(invoice);
    if (!customerId) return;
    const invoiceSubscriptionId = subscriptionIdFromInvoice(invoice);

    await this.withSubscriptionByCustomer(customerId, async (subscription) => {
      if (invoiceSubscriptionId && invoiceSubscriptionId === subscription.stripeSubscriptionId) {
        await this.subscriptionDao.update(subscription.id, { status: "past_due" });
      }
    });
  }

  private async onSubscriptionDeleted(stripeSubscription: Stripe.Subscription): Promise<void> {
    const customerId = customerIdFrom(stripeSubscription);
    if (!customerId) return;

    await this.withSubscriptionByCustomer(customerId, async (subscription) => {
      if (stripeSubscription.id === subscription.stripeSubscriptionId) {
        await this.subscriptionDao.update(subscription.id, { status: "canceled" });
      } else if (stripeSubscription.id === subscription.stripeExtrasSubscriptionId) {
        await this.subscriptionDao.update(subscription.id, { stripeExtrasSubscriptionId: null });
      }
    });
  }

  private async onSubscriptionUpdated(stripeSubscription: Stripe.Subscription): Promise<void> {
    const customerId = customerIdFrom(stripeSubscription);
    if (!customerId) return;

    await this.withSubscriptionByCustomer(customerId, async (subscription) => {
      // Solo la del plan: la de extras no tiene status/período propios que reflejar aquí.
      if (stripeSubscription.id !== subscription.stripeSubscriptionId) return;
      const period = subscriptionPeriod(stripeSubscription);
      await this.subscriptionDao.update(subscription.id, {
        status: toLocalSubscriptionStatus(stripeSubscription.status),
        currentPeriodStart: period?.start ?? null,
        currentPeriodEnd: period?.end ?? null,
      });
    });
  }
}
