import "reflect-metadata";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import AppDataSource from "../../../../src/core/config/data-source.js";
import { WhatsappMessagePackage } from "../../../../src/messaging/whatsapp-official/entities/whatsapp-message-package.entity.js";
import { WhatsappMessagePackageDao } from "../../../../src/messaging/whatsapp-official/daos/whatsapp-message-package.dao.js";
import { runWithTenant } from "../../../../src/core/tenancy/tenant-context.js";

// Integration test against a real Postgres -- mismo patrón que quote.dao.test.ts.
describe("WhatsappMessagePackageDao tenant isolation", () => {
  let dao: WhatsappMessagePackageDao;
  const base = Date.now();
  const tenantA = `${base}1`;
  const tenantB = `${base}2`;

  beforeAll(async () => {
    await AppDataSource.initialize();
    dao = new WhatsappMessagePackageDao(AppDataSource.getRepository(WhatsappMessagePackage));
  });

  afterAll(async () => {
    await AppDataSource.destroy();
  });

  it("sumGrantedSince only cuenta los paquetes del tenant actual", async () => {
    await runWithTenant(tenantA, () =>
      dao.claim({
        stripeCheckoutSessionId: `cs_a_${base}`,
        stripePriceKey: "whatsapp_pack_500",
        messagesGranted: 500,
        amountPaid: "230.84",
      }),
    );
    await runWithTenant(tenantB, () =>
      dao.claim({
        stripeCheckoutSessionId: `cs_b_${base}`,
        stripePriceKey: "whatsapp_pack_1000",
        messagesGranted: 1000,
        amountPaid: "404.84",
      }),
    );

    const since = new Date(0);
    const totalA = await runWithTenant(tenantA, () => dao.sumGrantedSince(since));
    const totalB = await runWithTenant(tenantB, () => dao.sumGrantedSince(since));

    expect(totalA).toBe(500);
    expect(totalB).toBe(1000);
  });

  it("claim es idempotente por stripeCheckoutSessionId: un reintento del webhook no acredita dos veces", async () => {
    const sessionId = `cs_retry_${base}`;
    const payload = {
      stripeCheckoutSessionId: sessionId,
      stripePriceKey: "whatsapp_pack_2500" as const,
      messagesGranted: 2500,
      amountPaid: "926.84",
    };

    const first = await runWithTenant(tenantA, () => dao.claim(payload));
    const retry = await runWithTenant(tenantA, () => dao.claim(payload));

    expect(first).toBe(true);
    expect(retry).toBe(false);

    const since = new Date(0);
    const total = await runWithTenant(tenantA, () => dao.sumGrantedSince(since));
    expect(total).toBe(500 + 2500); // suma con el paquete de la prueba anterior, mismo tenantA
  });
});
