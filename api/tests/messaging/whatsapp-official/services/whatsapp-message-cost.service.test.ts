import "reflect-metadata";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import AppDataSource from "../../../../src/core/config/data-source.js";
import { WhatsappOutboundMessage } from "../../../../src/messaging/whatsapp-official/entities/whatsapp-outbound-message.entity.js";
import { WhatsappAccount } from "../../../../src/messaging/whatsapp-official/entities/whatsapp-account.entity.js";
import { WhatsappMetaPricing } from "../../../../src/messaging/whatsapp-official/entities/whatsapp-meta-pricing.entity.js";
import { WhatsappOutboundMessageDao } from "../../../../src/messaging/whatsapp-official/daos/whatsapp-outbound-message.dao.js";
import { WhatsappMetaPricingDao } from "../../../../src/messaging/whatsapp-official/daos/whatsapp-meta-pricing.dao.js";
import { WhatsappMessageCostService } from "../../../../src/messaging/whatsapp-official/services/whatsapp-message-cost.service.js";
import { runWithTenant } from "../../../../src/core/tenancy/tenant-context.js";

// Integration test against a real Postgres: el catálogo whatsapp_meta_pricing
// ya viene sembrado por la migración CreateWhatsappMetaPricing.
describe("WhatsappMessageCostService", () => {
  let service: WhatsappMessageCostService;
  let outboundDao: WhatsappOutboundMessageDao;
  const base = Date.now();
  const tenantA = `${base}1`;
  let accountA: WhatsappAccount;

  beforeAll(async () => {
    await AppDataSource.initialize();
    outboundDao = new WhatsappOutboundMessageDao(
      AppDataSource.getRepository(WhatsappOutboundMessage),
    );
    const pricingDao = new WhatsappMetaPricingDao(AppDataSource.getRepository(WhatsappMetaPricing));
    service = new WhatsappMessageCostService(outboundDao, pricingDao);
    accountA = await AppDataSource.getRepository(WhatsappAccount).save({
      tenantId: tenantA,
      wabaId: `waba_${base}`,
      phoneNumberId: `pn_${base}`,
      accessToken: "token",
    });
  });

  afterAll(async () => {
    await AppDataSource.destroy();
  });

  it("resuelve el costo real desde el catálogo por categoría y lo guarda en el tenant dueño del mensaje", async () => {
    const wamid = `wamid.svc.${base}`;
    await runWithTenant(tenantA, () =>
      outboundDao.create({
        accountId: accountA.id,
        catalogKey: "nota_lista",
        to: "5215500000002",
        idempotencyKey: `idem-svc-${base}`,
        status: "sent",
        metaMessageId: wamid,
      }),
    );

    await service.recordStatusUpdate({ messageId: wamid, category: "utility", billable: true });

    const updated = await runWithTenant(tenantA, () =>
      outboundDao.findByIdempotencyKey(`idem-svc-${base}`),
    );
    expect(updated?.conversationCategory).toBe("utility");
    expect(updated?.billable).toBe(true);
    expect(Number(updated?.metaCostUsd)).toBeCloseTo(0.0085, 4);
  });

  it("un status sin categoria (billable:false, ej. 'read') no toca la fila", async () => {
    const wamid = `wamid.nocat.${base}`;
    await runWithTenant(tenantA, () =>
      outboundDao.create({
        accountId: accountA.id,
        catalogKey: "nota_lista",
        to: "5215500000003",
        idempotencyKey: `idem-nocat-${base}`,
        status: "sent",
        metaMessageId: wamid,
      }),
    );

    await service.recordStatusUpdate({ messageId: wamid, category: null, billable: false });

    const untouched = await runWithTenant(tenantA, () =>
      outboundDao.findByIdempotencyKey(`idem-nocat-${base}`),
    );
    expect(untouched?.conversationCategory).toBeNull();
    expect(untouched?.metaCostUsd).toBeNull();
  });

  it("un wamid que no corresponde a ningun mensaje propio no lanza, solo no hace nada", async () => {
    await expect(
      service.recordStatusUpdate({
        messageId: `wamid.unknown.${base}`,
        category: "marketing",
        billable: true,
      }),
    ).resolves.toBeUndefined();
  });
});
