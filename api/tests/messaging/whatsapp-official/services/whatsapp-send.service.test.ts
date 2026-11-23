import { describe, expect, it, vi, afterEach } from "vitest";
import {
  WhatsappSendService,
  WhatsappWindowClosedError,
} from "../../../../src/messaging/whatsapp-official/services/whatsapp-send.service.js";
import type { WhatsappOutboundMessageDao } from "../../../../src/messaging/whatsapp-official/daos/whatsapp-outbound-message.dao.js";
import type { WhatsappTemplateStatusDao } from "../../../../src/messaging/whatsapp-official/daos/whatsapp-template-status.dao.js";
import type { WhatsappTemplateCatalogEntryDao } from "../../../../src/messaging/whatsapp-official/daos/whatsapp-template-catalog-entry.dao.js";
import type { WhatsappAccountService } from "../../../../src/messaging/whatsapp-official/services/whatsapp-account.service.js";
import type { WhatsappQuotaService } from "../../../../src/messaging/whatsapp-official/services/whatsapp-quota.service.js";
import type { WhatsappOutboundMessage } from "../../../../src/messaging/whatsapp-official/entities/whatsapp-outbound-message.entity.js";
import type { WhatsappTemplateStatus } from "../../../../src/messaging/whatsapp-official/entities/whatsapp-template-status.entity.js";
import type { WhatsappTemplateCatalogEntry } from "../../../../src/messaging/whatsapp-official/entities/whatsapp-template-catalog-entry.entity.js";
import { mockEntity } from "../../../support/mock-entity.js";

afterEach(() => {
  vi.unstubAllGlobals();
});

const orderReadyEntry = mockEntity<WhatsappTemplateCatalogEntry>({
  id: "entry-1",
  key: "order_ready",
  metaName: "orden_lista_recoger",
  category: "UTILITY",
  language: "es_MX",
  text: "Hola {{nombre}}, tu equipo {{modelo}} ya está listo para recoger en nuestra sucursal.",
  variables: ["nombre", "modelo"],
  enabled: true,
});

function makeDaos() {
  const outboundDao = {
    findByIdempotencyKey: vi.fn(),
    create: vi.fn(),
  } as unknown as WhatsappOutboundMessageDao;
  const templateStatusDao = {
    findByCatalogEntryId: vi.fn(),
  } as unknown as WhatsappTemplateStatusDao;
  const catalogEntryDao = {
    findByKeyForTenant: vi.fn().mockResolvedValue(orderReadyEntry),
  } as unknown as WhatsappTemplateCatalogEntryDao;
  const accountService = {
    getOrCreateForTenant: vi.fn(),
  } as unknown as WhatsappAccountService;
  const quotaService = {
    assertCanSend: vi.fn().mockResolvedValue(undefined),
  } as unknown as WhatsappQuotaService;
  return { outboundDao, templateStatusDao, catalogEntryDao, accountService, quotaService };
}

describe("WhatsappSendService.sendTemplate", () => {
  it("blocks without calling Meta when the template is not APPROVED", async () => {
    const { outboundDao, templateStatusDao, catalogEntryDao, accountService, quotaService } = makeDaos();
    vi.mocked(outboundDao.findByIdempotencyKey).mockResolvedValue(null);
    vi.mocked(templateStatusDao.findByCatalogEntryId).mockResolvedValue(
      mockEntity<WhatsappTemplateStatus>({ status: "PENDING" }),
    );
    vi.mocked(outboundDao.create).mockResolvedValue(
      mockEntity<WhatsappOutboundMessage>({ status: "blocked_not_approved" }),
    );
    const fetchSpy = vi.fn();
    vi.stubGlobal("fetch", fetchSpy);

    const service = new WhatsappSendService(
      outboundDao,
      templateStatusDao,
      catalogEntryDao,
      accountService,
      quotaService,
    );
    const result = await service.sendTemplate(
      "acc-1",
      "token-1",
      "phone-1",
      "order_ready",
      "5215500000000",
      { nombre: "Ana", modelo: "A52" },
      "order-ready:note-1",
    );

    expect(fetchSpy).not.toHaveBeenCalled();
    expect(outboundDao.create).toHaveBeenCalledWith(
      expect.objectContaining({ status: "blocked_not_approved" }),
    );
    expect(result.status).toBe("blocked_not_approved");
  });

  it("sends via Graph API and stores the message id when the template is APPROVED", async () => {
    const { outboundDao, templateStatusDao, catalogEntryDao, accountService, quotaService } = makeDaos();
    vi.mocked(outboundDao.findByIdempotencyKey).mockResolvedValue(null);
    vi.mocked(templateStatusDao.findByCatalogEntryId).mockResolvedValue(
      mockEntity<WhatsappTemplateStatus>({ status: "APPROVED" }),
    );
    vi.mocked(outboundDao.create).mockResolvedValue(
      mockEntity<WhatsappOutboundMessage>({ status: "sent", metaMessageId: "wamid-1" }),
    );
    vi.stubGlobal(
      "fetch",
      vi
        .fn()
        .mockResolvedValue({ ok: true, json: async () => ({ messages: [{ id: "wamid-1" }] }) }),
    );

    const service = new WhatsappSendService(
      outboundDao,
      templateStatusDao,
      catalogEntryDao,
      accountService,
      quotaService,
    );
    const result = await service.sendTemplate(
      "acc-1",
      "token-1",
      "phone-1",
      "order_ready",
      "5215500000000",
      { nombre: "Ana", modelo: "A52" },
      "order-ready:note-1",
    );

    expect(outboundDao.create).toHaveBeenCalledWith(
      expect.objectContaining({ status: "sent", metaMessageId: "wamid-1" }),
    );
    expect(result.metaMessageId).toBe("wamid-1");
  });

  it("blocks without calling Meta when the catalog entry no longer exists", async () => {
    const { outboundDao, templateStatusDao, catalogEntryDao, accountService, quotaService } = makeDaos();
    vi.mocked(outboundDao.findByIdempotencyKey).mockResolvedValue(null);
    vi.mocked(catalogEntryDao.findByKeyForTenant).mockResolvedValue(null);
    vi.mocked(outboundDao.create).mockResolvedValue(
      mockEntity<WhatsappOutboundMessage>({ status: "blocked_catalog_missing" }),
    );
    const fetchSpy = vi.fn();
    vi.stubGlobal("fetch", fetchSpy);

    const service = new WhatsappSendService(
      outboundDao,
      templateStatusDao,
      catalogEntryDao,
      accountService,
      quotaService,
    );
    const result = await service.sendTemplate(
      "acc-1",
      "token-1",
      "phone-1",
      "order_ready",
      "5215500000000",
      { nombre: "Ana", modelo: "A52" },
      "order-ready:note-1",
    );

    expect(fetchSpy).not.toHaveBeenCalled();
    expect(templateStatusDao.findByCatalogEntryId).not.toHaveBeenCalled();
    expect(outboundDao.create).toHaveBeenCalledWith(
      expect.objectContaining({ status: "blocked_catalog_missing" }),
    );
    expect(result.status).toBe("blocked_catalog_missing");
  });

  it("does not resend when the idempotency key already has a row", async () => {
    const { outboundDao, templateStatusDao, catalogEntryDao, accountService, quotaService } = makeDaos();
    vi.mocked(outboundDao.findByIdempotencyKey).mockResolvedValue(
      mockEntity<WhatsappOutboundMessage>({ status: "sent" }),
    );
    const fetchSpy = vi.fn();
    vi.stubGlobal("fetch", fetchSpy);

    const service = new WhatsappSendService(
      outboundDao,
      templateStatusDao,
      catalogEntryDao,
      accountService,
      quotaService,
    );
    const result = await service.sendTemplate(
      "acc-1",
      "token-1",
      "phone-1",
      "order_ready",
      "5215500000000",
      { nombre: "Ana", modelo: "A52" },
      "order-ready:note-1",
    );

    expect(fetchSpy).not.toHaveBeenCalled();
    expect(outboundDao.create).not.toHaveBeenCalled();
    expect(result.status).toBe("sent");
  });
});

describe("WhatsappSendService.sendFreeText", () => {
  it("sends via Graph API when the last inbound message was within 24h", async () => {
    const { outboundDao, templateStatusDao, catalogEntryDao, accountService, quotaService } = makeDaos();
    const fetchMock = vi
      .fn()
      .mockResolvedValue({ ok: true, json: async () => ({ messages: [{ id: "wamid-2" }] }) });
    vi.stubGlobal("fetch", fetchMock);

    const service = new WhatsappSendService(
      outboundDao,
      templateStatusDao,
      catalogEntryDao,
      accountService,
      quotaService,
    );
    const lastInboundAt = new Date(Date.now() - 60_000);

    await service.sendFreeText("phone-1", "token-1", "5215500000000", "hola", lastInboundAt);

    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining("/phone-1/messages"),
      expect.objectContaining({ method: "POST" }),
    );
  });

  it("rejects without calling Meta when the window is closed", async () => {
    const { outboundDao, templateStatusDao, catalogEntryDao, accountService, quotaService } = makeDaos();
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    const service = new WhatsappSendService(
      outboundDao,
      templateStatusDao,
      catalogEntryDao,
      accountService,
      quotaService,
    );
    const lastInboundAt = new Date(Date.now() - 25 * 60 * 60 * 1000);

    await expect(
      service.sendFreeText("phone-1", "token-1", "5215500000000", "hola", lastInboundAt),
    ).rejects.toThrow(WhatsappWindowClosedError);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("rejects without calling Meta when there is no prior inbound message", async () => {
    const { outboundDao, templateStatusDao, catalogEntryDao, accountService, quotaService } = makeDaos();
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    const service = new WhatsappSendService(
      outboundDao,
      templateStatusDao,
      catalogEntryDao,
      accountService,
      quotaService,
    );

    await expect(
      service.sendFreeText("phone-1", "token-1", "5215500000000", "hola", null),
    ).rejects.toThrow(WhatsappWindowClosedError);
    expect(fetchMock).not.toHaveBeenCalled();
  });
});

describe("WhatsappSendService.notifyOrderReady", () => {
  it("does nothing when the note has no contact number", async () => {
    const { outboundDao, templateStatusDao, catalogEntryDao, accountService, quotaService } = makeDaos();
    const service = new WhatsappSendService(
      outboundDao,
      templateStatusDao,
      catalogEntryDao,
      accountService,
      quotaService,
    );

    const result = await service.notifyOrderReady({
      id: "note-1",
      customerName: "Ana",
      model: "A52",
      contactNumber: null,
    });

    expect(result).toBeNull();
    expect(accountService.getOrCreateForTenant).not.toHaveBeenCalled();
  });
});
