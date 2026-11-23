import { describe, expect, it, vi } from "vitest";
import { BillingService } from "../../../../src/app_platform/billing/services/billing.service.js";
import { createSubscriptionCheckoutSession } from "../../../../src/app_platform/billing/clients/stripe.client.js";
import { TRIAL_PERIOD_DAYS } from "../../../../src/app_platform/billing/constants.js";
import type { PlanDao } from "../../../../src/app_platform/billing/daos/plan.dao.js";
import type { SubscriptionDao } from "../../../../src/app_platform/billing/daos/subscription.dao.js";
import type { PlanLimitService } from "../../../../src/app_platform/billing/services/plan-limit.service.js";
import type { StripePriceDao } from "../../../../src/app_platform/billing/daos/stripe-price.dao.js";
import type { Subscription } from "../../../../src/app_platform/billing/entities/subscription.entity.js";

vi.mock("../../../../src/app_platform/billing/clients/stripe.client.js", () => ({
  createSubscriptionCheckoutSession: vi
    .fn()
    .mockResolvedValue({ url: "https://checkout.stripe.com/test" }),
  createOneTimeCheckoutSession: vi.fn(),
  syncExtrasSubscription: vi.fn(),
}));

const makeSubscription = (overrides: Partial<Subscription> = {}): Subscription =>
  ({
    id: "sub-1",
    stripeCustomerId: "cus_test",
    stripeSubscriptionId: null,
    tenant: { publicId: "tenant-public-1" },
    ...overrides,
  }) as Subscription;

function makeService(subscription: Subscription) {
  const planDao = {
    findByKey: vi.fn().mockResolvedValue({ id: "plan-1", key: "basico" }),
  } as unknown as PlanDao;
  const stripePriceDao = {
    findByKey: vi.fn().mockResolvedValue({ stripePriceId: "price_test123" }),
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
