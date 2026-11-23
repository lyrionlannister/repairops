import "reflect-metadata";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import AppDataSource from "../../../../src/core/config/data-source.js";
import { StripeInvoicePayment } from "../../../../src/app_platform/billing/entities/stripe-invoice-payment.entity.js";
import { StripeInvoicePaymentDao } from "../../../../src/app_platform/billing/daos/stripe-invoice-payment.dao.js";
import { allowSystemScope, runWithTenant } from "../../../../src/core/tenancy/tenant-context.js";

// Integration test against a real Postgres -- mismo patrón que quote.dao.test.ts.
describe("StripeInvoicePaymentDao tenant isolation", () => {
  let dao: StripeInvoicePaymentDao;
  const base = Date.now();
  const tenantA = `${base}1`;
  const tenantB = `${base}2`;

  beforeAll(async () => {
    await AppDataSource.initialize();
    dao = new StripeInvoicePaymentDao(AppDataSource.getRepository(StripeInvoicePayment));
  });

  afterAll(async () => {
    await AppDataSource.destroy();
  });

  it("findAll solo ve los pagos del tenant actual", async () => {
    await runWithTenant(tenantA, () =>
      dao.claim({
        stripeInvoiceId: `in_a_${base}`,
        planKey: "basico",
        billingInterval: "month",
        amount: "288.84",
        currency: "MXN",
        paidAt: new Date(),
      }),
    );
    await runWithTenant(tenantB, () =>
      dao.claim({
        stripeInvoiceId: `in_b_${base}`,
        planKey: "crecimiento",
        billingInterval: "month",
        amount: "520.84",
        currency: "MXN",
        paidAt: new Date(),
      }),
    );

    const paymentsA = await runWithTenant(tenantA, () => dao.findAll());
    const paymentsB = await runWithTenant(tenantB, () => dao.findAll());

    expect(paymentsA.map((p) => p.stripeInvoiceId)).toEqual([`in_a_${base}`]);
    expect(paymentsB.map((p) => p.stripeInvoiceId)).toEqual([`in_b_${base}`]);
  });

  it("claim es idempotente por stripeInvoiceId: un reintento del webhook no duplica el pago", async () => {
    const payload = {
      stripeInvoiceId: `in_retry_${base}`,
      planKey: "cadena" as const,
      billingInterval: "year" as const,
      amount: "9268.40",
      currency: "MXN",
      paidAt: new Date(),
    };

    const first = await runWithTenant(tenantA, () => dao.claim(payload));
    const retry = await runWithTenant(tenantA, () => dao.claim(payload));

    expect(first).toBe(true);
    expect(retry).toBe(false);
  });

  it("sumSince (dashboard de platform-admin) suma a través de todos los tenants", async () => {
    const since = new Date(0);
    const total = await allowSystemScope(() => dao.sumSince(since));
    // Al menos los 288.84 + 520.84 + 9268.40 insertados arriba (puede haber más de otras corridas).
    expect(Number(total)).toBeGreaterThanOrEqual(288.84 + 520.84 + 9268.4);
  });
});
