import "reflect-metadata";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import AppDataSource from "../../../../src/core/config/data-source.js";
import { WhatsappOutboundMessage } from "../../../../src/messaging/whatsapp-official/entities/whatsapp-outbound-message.entity.js";
import { WhatsappAccount } from "../../../../src/messaging/whatsapp-official/entities/whatsapp-account.entity.js";
import { WhatsappOutboundMessageDao } from "../../../../src/messaging/whatsapp-official/daos/whatsapp-outbound-message.dao.js";
import { allowSystemScope, runWithTenant } from "../../../../src/core/tenancy/tenant-context.js";

// Integration test against a real Postgres -- mismo patrón que quote.dao.test.ts.
describe("WhatsappOutboundMessageDao tenant isolation y costo de Meta", () => {
  let dao: WhatsappOutboundMessageDao;
  const base = Date.now();
  const tenantA = `${base}1`;
  const tenantB = `${base}2`;
  let accountA: WhatsappAccount;
  let accountB: WhatsappAccount;

  beforeAll(async () => {
    await AppDataSource.initialize();
    dao = new WhatsappOutboundMessageDao(AppDataSource.getRepository(WhatsappOutboundMessage));
    const accountRepo = AppDataSource.getRepository(WhatsappAccount);
    accountA = await accountRepo.save({
      tenantId: tenantA,
      wabaId: `waba_a_${base}`,
      phoneNumberId: `pn_a_${base}`,
      accessToken: "token-a",
    });
    accountB = await accountRepo.save({
      tenantId: tenantB,
      wabaId: `waba_b_${base}`,
      phoneNumberId: `pn_b_${base}`,
      accessToken: "token-b",
    });
  });

  afterAll(async () => {
    await AppDataSource.destroy();
  });

  it("findByMetaMessageIdAcrossTenants resuelve el mensaje sin importar el tenant actual, y el tenant ajeno no lo ve por el camino normal", async () => {
    const wamid = `wamid.cost.${base}`;
    await runWithTenant(tenantB, () =>
      dao.create({
        accountId: accountB.id,
        catalogKey: "nota_lista",
        to: "5215500000000",
        idempotencyKey: `idem-${base}`,
        status: "sent",
        metaMessageId: wamid,
      }),
    );

    const found = await allowSystemScope(() => dao.findByMetaMessageIdAcrossTenants(wamid));
    expect(found?.tenantId).toBe(tenantB);

    const fromTenantA = await runWithTenant(tenantA, () => dao.findById(found!.id));
    expect(fromTenantA).toBeNull();
  });

  it("sumCostByTenantSince agrupa el costo real por tenant, ignorando mensajes sin costo", async () => {
    const since = new Date(0);
    await runWithTenant(tenantA, async () => {
      const withCost = await dao.create({
        accountId: accountA.id,
        catalogKey: "nota_lista",
        to: "5215500000001",
        idempotencyKey: `idem-cost-a-${base}`,
        status: "sent",
        metaMessageId: `wamid.cost.a.${base}`,
      });
      await dao.update(withCost.id, {
        conversationCategory: "utility",
        billable: true,
        metaCostUsd: "0.0085",
      });
      // Sin status de Meta todavia (ej. recien enviado): no debe sumar a la agregacion.
      await dao.create({
        accountId: accountA.id,
        catalogKey: "nota_lista",
        to: "5215500000004",
        idempotencyKey: `idem-nocost-a-${base}`,
        status: "sent",
      });
    });

    const rows = await allowSystemScope(() => dao.sumCostByTenantSince(since));
    const rowA = rows.find((r) => r.tenantId === tenantA);
    expect(rowA).toBeDefined();
    expect(Number(rowA!.messageCount)).toBe(1);
    expect(Number(rowA!.totalCostUsd)).toBeCloseTo(0.0085, 4);
  });
});
