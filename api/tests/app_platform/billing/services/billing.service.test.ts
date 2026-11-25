import { beforeEach, describe, expect, it, vi } from "vitest";
import { BillingService } from "../../../../src/app_platform/billing/services/billing.service.js";
import {
  createBillingPortalSession,
  createSubscriptionCheckoutSession,
} from "../../../../src/app_platform/billing/clients/stripe.client.js";
import { TRIAL_PERIOD_DAYS } from "../../../../src/app_platform/billing/constants.js";
import { MissingSubscriptionError } from "../../../../src/app_platform/billing/services/plan-limit.service.js";
import type { PlanDao } from "../../../../src/app_platform/billing/daos/plan.dao.js";
import type { SubscriptionDao } from "../../../../src/app_platform/billing/daos/subscription.dao.js";
import type { PlanLimitService } from "../../../../src/app_platform/billing/services/plan-limit.service.js";
import type { StripePriceDao } from "../../../../src/app_platform/billing/daos/stripe-price.dao.js";
import type { Subscription } from "../../../../src/app_platform/billing/entities/subscription.entity.js";

// Mock compartido de Stripe (tests/support/stripe-client.mock.ts): con
// pool vmThreads el servicio queda ligado a la instancia del primer
// archivo que lo importa; si cada archivo usa su propia factoría, los
// demás afirman sobre otra instancia (0 llamadas) o sobre el cliente
// real ("Falta STRIPE_PRIVATE_KEY") solo en la suite completa.
vi.mock(
  "../../../../src/app_platform/billing/clients/stripe.client.js",
  async () => (await import("../../../support/stripe-client.mock.js")).stripeClientMock,
);
vi.mock(
  "../../../../src/identity/auth/clients/resend.client.js",
  async () => (await import("../../../support/resend-client.mock.js")).resendClientMock,
);

// selectPlan/portal/paquetes no usan transacciones: no cargar AppDataSource
// (data-source arrastra entidades de otros frentes en curso).
vi.mock("../../../../src/core/database/transaction-context.js", () => ({
  runInTransaction: async (fn: () => Promise<unknown>) => fn(),
}));

const makeSubscription = (overrides: Partial<Subscription> = {}): Subscription =>
  ({
    id: "sub-1",
    stripeCustomerId: "cus_test",
    stripeSubscriptionId: null,
    tenant: { publicId: "tenant-public-1" },
    ...overrides,
  }) as Subscription;

// Los mocks de stripe.client se comparten entre tests del archivo: limpiar el
// historial antes de cada uno para que los "not.toHaveBeenCalled" sean fiables.
beforeEach(() => {
  vi.clearAllMocks();
});

function makeService(
  subscription: Subscription | null,
  stripePriceByKey: (key: string) => unknown = () => ({ stripePriceId: "price_test123" }),
) {
  const planDao = {
    findByKey: vi.fn().mockResolvedValue({ id: "plan-1", key: "basico" }),
  } as unknown as PlanDao;
  const stripePriceDao = {
    findByKey: vi.fn().mockImplementation((key: string) => Promise.resolve(stripePriceByKey(key))),
  } as unknown as StripePriceDao;
  const subscriptionDao = {
    findCurrent: vi.fn().mockResolvedValue(subscription),
    update: vi.fn().mockResolvedValue(subscription),
  } as unknown as SubscriptionDao;
  const planLimitService = {} as unknown as PlanLimitService;

  return new BillingService(planDao, subscriptionDao, planLimitService, stripePriceDao);
}

describe("BillingService.selectPlan: un trial por taller", () => {
  it("incluye trial_period_days la primera vez (nunca tuvo una Subscription de Stripe)", async () => {
    const service = makeService(makeSubscription({ stripeSubscriptionId: null }));

    await service.selectPlan("basico", "month");

    expect(createSubscriptionCheckoutSession).toHaveBeenCalledWith(
      expect.objectContaining({ trialPeriodDays: TRIAL_PERIOD_DAYS }),
    );
  });

  it("no da un segundo trial si ya tuvo una Subscription antes, aunque hoy esté cancelada", async () => {
    const service = makeService(makeSubscription({ stripeSubscriptionId: "sub_old_canceled" }));

    await service.selectPlan("crecimiento", "year");

    expect(createSubscriptionCheckoutSession).toHaveBeenCalledWith(
      expect.objectContaining({ trialPeriodDays: undefined }),
    );
  });
});

describe("BillingService.createCustomerPortalSession", () => {
  it("crea la sesión del portal con el customer del taller y vuelve al inicio", async () => {
    const service = makeService(makeSubscription());

    const url = await service.createCustomerPortalSession();

    expect(url).toBe("https://billing.stripe.com/portal/test");
    expect(createBillingPortalSession).toHaveBeenCalledWith({
      stripeCustomerId: "cus_test",
      returnUrl: "http://localhost:5173/home",
    });
  });

  it("falla si el taller no tiene suscripción", async () => {
    const service = makeService(null);

    await expect(service.createCustomerPortalSession()).rejects.toThrow(MissingSubscriptionError);
    expect(createBillingPortalSession).not.toHaveBeenCalled();
  });

  it("falla con mensaje claro si el taller no tiene customer de Stripe", async () => {
    const service = makeService(makeSubscription({ stripeCustomerId: null }));

    await expect(service.createCustomerPortalSession()).rejects.toThrow(
      "Este taller todavía no tiene una suscripción en Stripe",
    );
    expect(createBillingPortalSession).not.toHaveBeenCalled();
  });
});

describe("BillingService.listWhatsappPackages", () => {
  it("lista los 3 tamaños con su precio real de Stripe", async () => {
    const prices: Record<string, string> = {
      whatsapp_pack_500: "230.84",
      whatsapp_pack_1000: "404.84",
      whatsapp_pack_2500: "926.84",
    };
    const service = makeService(makeSubscription(), (key) => ({
      stripePriceId: `price_${key}`,
      amount: prices[key],
    }));

    await expect(service.listWhatsappPackages()).resolves.toEqual([
      { size: 500, price: "230.84" },
      { size: 1000, price: "404.84" },
      { size: 2500, price: "926.84" },
    ]);
  });

  it("marca el precio como null cuando el price no está configurado", async () => {
    const service = makeService(makeSubscription(), () => null);

    await expect(service.listWhatsappPackages()).resolves.toEqual([
      { size: 500, price: null },
      { size: 1000, price: null },
      { size: 2500, price: null },
    ]);
  });
});
