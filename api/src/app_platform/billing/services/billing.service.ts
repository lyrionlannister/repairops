import { singleton } from "tsyringe";
import { runInTransaction } from "../../../core/database/transaction-context.js";
import { BusinessError } from "../../../core/http/business-error.js";
import { allowSystemScope, runWithTenant } from "../../../core/tenancy/tenant-context.js";
import { PlanDao } from "../daos/plan.dao.js";
import { SubscriptionDao } from "../daos/subscription.dao.js";
import { StripePriceDao } from "../daos/stripe-price.dao.js";
import type { Plan, PlanKey } from "../entities/plan.entity.js";
import type { Subscription, SubscriptionStatus } from "../entities/subscription.entity.js";
import type { AssignSubscriptionDto } from "../dtos/assign-subscription.dto.js";
import {
  createBillingPortalSession,
  createCustomer,
  createOneTimeCheckoutSession,
  createSubscriptionCheckoutSession,
  syncExtrasSubscription,
} from "../clients/stripe.client.js";
import {
  EXTRA_BRANCH_PRICE_KEY,
  EXTRA_USER_PRICE_KEY,
  planPriceKey,
  whatsappPackPriceKey,
} from "../utils/price-keys.js";
import {
  portalReturnUrl,
  signupCheckoutUrls,
  whatsappPackageCheckoutUrls,
} from "../utils/checkout-urls.js";
import {
  TRIAL_PERIOD_DAYS,
  WHATSAPP_PACKAGE_SIZES,
  type WhatsappPackageSize,
} from "../constants.js";
import {
  effectiveLimits,
  MissingSubscriptionError,
  PlanLimitService,
  type PlanLimits,
  type PlanUsage,
} from "./plan-limit.service.js";

export interface PlanSummary {
  // null = onboarding: todavía sin elegir plan.
  plan: Pick<Plan, "key" | "name" | "maxUsers" | "maxBranches"> | null;
  status: SubscriptionStatus;
  extraUsers: number;
  extraBranches: number;
  limits: PlanLimits | null;
  usage: PlanUsage;
}

export interface TenantPlanSummary extends PlanSummary {
  tenantId: string;
  tenantName: string;
}

export interface PublicPlanOption {
  key: Exclude<PlanKey, "platform">;
  name: string;
  maxUsers: number | null;
  maxBranches: number | null;
  whatsappMonthlyQuota: number | null;
  monthlyPrice: string | null;
  yearlyPrice: string | null;
}

export interface WhatsappPackageOption {
  size: WhatsappPackageSize;
  // null = price de Stripe sin configurar todavía; el cliente lo muestra como
  // no disponible y el checkout rechaza igual en servidor.
  price: string | null;
}

export class PlanDowngradeError extends Error {}

const toPlan = ({ key, name, maxUsers, maxBranches }: Plan) => ({
  key,
  name,
  maxUsers,
  maxBranches,
});

@singleton()
export class BillingService {
  constructor(
    private planDao: PlanDao,
    private subscriptionDao: SubscriptionDao,
    private planLimitService: PlanLimitService,
    private stripePriceDao: StripePriceDao,
  ) {}

  async startSubscription(
    planKey: PlanKey,
    status: SubscriptionStatus,
    options: { stripeCustomerId?: string; billingInterval?: "month" | "year" } = {},
  ): Promise<Subscription> {
    const plan = await this.requirePlan(planKey);
    return this.subscriptionDao.create({
      planId: plan.id,
      status,
      stripeCustomerId: options.stripeCustomerId ?? null,
      billingInterval: options.billingInterval ?? null,
    });
  }

  // Registro público: crea el Customer de Stripe del taller. Único punto
  // por el que AuthService toca Stripe al registrar (así los tests de auth
  // mockean BillingService y nunca cargan el cliente real).
  async createCustomerForTenant(input: {
    email: string;
    name: string;
    tenantPublicId: string;
  }): Promise<string> {
    const customer = await createCustomer(input);
    return customer.id;
  }

  // Registro público: ya existe el Customer de Stripe, pero el owner todavía
  // no elige plan (eso pasa después, en el onboarding -- ver selectPlan).
  async startSubscriptionWithoutPlan(stripeCustomerId: string): Promise<Subscription> {
    return this.subscriptionDao.create({
      planId: null,
      status: "incomplete",
      stripeCustomerId,
    });
  }

  // Paso de onboarding post-registro: el owner elige plan+ciclo desde las
  // cards, esto recién ahí crea la Checkout Session de Stripe (con trial).
  async selectPlan(
    planKey: Exclude<PlanKey, "platform">,
    billingInterval: "month" | "year",
  ): Promise<string> {
    const subscription = await this.subscriptionDao.findCurrent();
    if (!subscription) throw new MissingSubscriptionError();
    if (!subscription.stripeCustomerId) {
      throw new BusinessError("Falta el Customer de Stripe para este taller");
    }

    const plan = await this.requirePlan(planKey);
    const price = await this.stripePriceDao.findByKey(planPriceKey(planKey, billingInterval));
    if (!price) {
      throw new Error(`Price de Stripe no configurado para ${planKey}/${billingInterval}`);
    }

    const { successUrl, cancelUrl } = signupCheckoutUrls();
    // Un stripeSubscriptionId ya asignado significa que este taller ya tuvo un
    // Checkout completado antes (trial consumido), sin importar si después se
    // canceló o quedó con el pago rechazado -- un taller no recibe dos trials
    // por reelegir plan. onSubscriptionDeleted nunca limpia este campo, queda
    // como evidencia permanente de que sí hubo un trial.
    const alreadyHadTrial = subscription.stripeSubscriptionId !== null;
    const session = await createSubscriptionCheckoutSession({
      stripeCustomerId: subscription.stripeCustomerId,
      stripePriceId: price.stripePriceId,
      tenantPublicId: subscription.tenant!.publicId,
      trialPeriodDays: alreadyHadTrial ? undefined : TRIAL_PERIOD_DAYS,
      successUrl,
      cancelUrl,
    });

    await this.subscriptionDao.update(subscription.id, { planId: plan.id, billingInterval });

    return session.url!;
  }

  async getCurrent(): Promise<PlanSummary> {
    const subscription = await this.subscriptionDao.findCurrent();
    if (!subscription) throw new MissingSubscriptionError();
    return this.summarize(subscription);
  }

  async listPlans(): Promise<Plan[]> {
    return this.planDao.findAll();
  }

  // Para las cards de onboarding post-registro: planes públicos con su precio
  // real de Stripe (ya incluye IVA), sin exponer el catálogo interno completo.
  async listPublicPlans(): Promise<PublicPlanOption[]> {
    const plans = await this.planDao.findAll();
    return Promise.all(
      plans
        .filter((plan) => plan.isPublic)
        .map(async (plan) => {
          const planKey = plan.key as Exclude<PlanKey, "platform">;
          const [monthly, yearly] = await Promise.all([
            this.stripePriceDao.findByKey(planPriceKey(planKey, "month")),
            this.stripePriceDao.findByKey(planPriceKey(planKey, "year")),
          ]);
          return {
            key: planKey,
            name: plan.name,
            maxUsers: plan.maxUsers,
            maxBranches: plan.maxBranches,
            whatsappMonthlyQuota: plan.whatsappMonthlyQuota,
            monthlyPrice: monthly?.amount ?? null,
            yearlyPrice: yearly?.amount ?? null,
          };
        }),
    );
  }

  // Portal del cliente de Stripe: cancelar, cambiar de plan o de método de
  // pago. Sin Customer no hay nada que gestionar en Stripe.
  async createCustomerPortalSession(): Promise<string> {
    const subscription = await this.subscriptionDao.findCurrent();
    if (!subscription) throw new MissingSubscriptionError();
    if (!subscription.stripeCustomerId) {
      throw new BusinessError("Este taller todavía no tiene una suscripción en Stripe");
    }

    const session = await createBillingPortalSession({
      stripeCustomerId: subscription.stripeCustomerId,
      returnUrl: portalReturnUrl(),
    });
    return session.url;
  }

  // Precios reales de Stripe (ya incluyen IVA) para las cards de paquetes --
  // el cliente nunca hardcodea cifras, solo muestra lo que devuelve esto.
  async listWhatsappPackages(): Promise<WhatsappPackageOption[]> {
    return Promise.all(
      WHATSAPP_PACKAGE_SIZES.map(async (size) => {
        const price = await this.stripePriceDao.findByKey(whatsappPackPriceKey(size));
        return { size, price: price?.amount ?? null };
      }),
    );
  }

  // Compra de paquete extra de mensajes de WhatsApp -- one-time, no acumulable,
  // el webhook (checkout.session.completed, mode=payment) la acredita al completarse.
  async createWhatsappPackageCheckout(size: WhatsappPackageSize): Promise<string> {
    const subscription = await this.subscriptionDao.findCurrent();
    if (!subscription) throw new MissingSubscriptionError();
    if (!subscription.stripeCustomerId) {
      throw new BusinessError("Este taller todavía no tiene método de pago registrado en Stripe");
    }

    const priceKey = whatsappPackPriceKey(size);
    const price = await this.stripePriceDao.findByKey(priceKey);
    if (!price)
      throw new Error(`Price de Stripe no configurado para el paquete de ${size} mensajes`);

    const { successUrl, cancelUrl } = whatsappPackageCheckoutUrls();
    const session = await createOneTimeCheckoutSession({
      stripeCustomerId: subscription.stripeCustomerId,
      stripePriceId: price.stripePriceId,
      tenantPublicId: subscription.tenant!.publicId,
      stripePriceKey: priceKey,
      successUrl,
      cancelUrl,
    });
    return session.url!;
  }

  async listTenants(): Promise<TenantPlanSummary[]> {
    const subscriptions = await allowSystemScope(() => this.subscriptionDao.findAllAcrossTenants());
    return Promise.all(
      subscriptions.map((subscription) =>
        runWithTenant(subscription.tenantId, async () => ({
          tenantId: subscription.tenant!.publicId,
          tenantName: subscription.tenant!.name,
          ...(await this.summarize(subscription)),
        })),
      ),
    );
  }

  // Bajar de plan o quitar extras solo procede si el uso actual ya cabe: nunca se
  // desactiva a nadie automáticamente.
  async assign(tenantPublicId: string, data: AssignSubscriptionDto): Promise<PlanSummary | null> {
    const found = await allowSystemScope(() =>
      this.subscriptionDao.findByTenantPublicIdAcrossTenants(tenantPublicId),
    );
    if (!found) return null;
    const plan = await this.requirePlan(data.planKey);

    return runWithTenant(found.tenantId, () =>
      runInTransaction(async () => {
        const current = await this.subscriptionDao.lockCurrent();
        if (!current) throw new MissingSubscriptionError();
        const next = {
          ...current,
          plan,
          extraUsers: data.extraUsers ?? current.extraUsers,
          extraBranches: data.extraBranches ?? current.extraBranches,
        } as Subscription;
        const limits = effectiveLimits(next);
        const usage = await this.planLimitService.usage();
        if (limits.users !== null && usage.users > limits.users) {
          throw new PlanDowngradeError(
            `El taller tiene ${usage.users} usuarios activos y el plan permite ${limits.users}`,
          );
        }
        if (limits.branches !== null && usage.branches > limits.branches) {
          throw new PlanDowngradeError(
            `El taller tiene ${usage.branches} sucursales activas y el plan permite ${limits.branches}`,
          );
        }
        const updated = await this.subscriptionDao.update(current.id, {
          planId: plan.id,
          extraUsers: next.extraUsers,
          extraBranches: next.extraBranches,
          status: data.status ?? current.status,
        });

        // Sin Stripe (tenant platform, o dev sin Stripe todavía): queda como estaba.
        // next, no current: lleva las cantidades nuevas, no las que tenía antes de este assign.
        const stripeExtrasSubscriptionId = next.stripeCustomerId
          ? await this.syncExtrasWithStripe(next)
          : current.stripeExtrasSubscriptionId;
        if (stripeExtrasSubscriptionId !== current.stripeExtrasSubscriptionId) {
          await this.subscriptionDao.update(current.id, { stripeExtrasSubscriptionId });
        }

        return this.summarize({ ...updated!, plan, stripeExtrasSubscriptionId });
      }),
    );
  }

  // Siempre mensual, en una Subscription de Stripe separada de la del plan
  // base -- aunque el plan sea anual (decisión del negocio).
  private async syncExtrasWithStripe(subscription: Subscription): Promise<string | null> {
    const [extraUserPrice, extraBranchPrice] = await Promise.all([
      this.stripePriceDao.findByKey(EXTRA_USER_PRICE_KEY),
      this.stripePriceDao.findByKey(EXTRA_BRANCH_PRICE_KEY),
    ]);
    if (!extraUserPrice || !extraBranchPrice) {
      throw new Error("Price de Stripe de extras no configurado");
    }
    const stripeSubscription = await syncExtrasSubscription({
      stripeCustomerId: subscription.stripeCustomerId!,
      existingStripeSubscriptionId: subscription.stripeExtrasSubscriptionId,
      extraUserPriceId: extraUserPrice.stripePriceId,
      extraBranchPriceId: extraBranchPrice.stripePriceId,
      extraUsers: subscription.extraUsers,
      extraBranches: subscription.extraBranches,
    });
    return stripeSubscription?.id ?? null;
  }

  private async requirePlan(key: PlanKey): Promise<Plan> {
    const plan = await this.planDao.findByKey(key);
    if (!plan) throw new Error(`Plan ${key} no existe`);
    return plan;
  }

  private async summarize(subscription: Subscription): Promise<PlanSummary> {
    return {
      plan: subscription.plan ? toPlan(subscription.plan) : null,
      status: subscription.status,
      extraUsers: subscription.extraUsers,
      extraBranches: subscription.extraBranches,
      limits: subscription.plan ? effectiveLimits(subscription) : null,
      usage: await this.planLimitService.usage(),
    };
  }
}
