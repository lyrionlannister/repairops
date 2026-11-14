import { describe, expect, it, vi, afterEach } from "vitest";
import { WhatsappSendService } from "../../../../src/messaging/whatsapp-official/services/whatsapp-send.service.js";
import type { WhatsappOutboundMessageDao } from "../../../../src/messaging/whatsapp-official/daos/whatsapp-outbound-message.dao.js";
import type { WhatsappTemplateStatusDao } from "../../../../src/messaging/whatsapp-official/daos/whatsapp-template-status.dao.js";
import type { WhatsappAccountService } from "../../../../src/messaging/whatsapp-official/services/whatsapp-account.service.js";
import type { WhatsappOutboundMessage } from "../../../../src/messaging/whatsapp-official/entities/whatsapp-outbound-message.entity.js";
import type { WhatsappTemplateStatus } from "../../../../src/messaging/whatsapp-official/entities/whatsapp-template-status.entity.js";
import { mockEntity } from "../../../support/mock-entity.js";

afterEach(() => {
  vi.unstubAllGlobals();
});

function makeDaos() {
  const outboundDao = {
    findByIdempotencyKey: vi.fn(),
    create: vi.fn(),
  } as unknown as WhatsappOutboundMessageDao;
  const templateStatusDao = {
    findByCatalogKey: vi.fn(),
  } as unknown as WhatsappTemplateStatusDao;
  const accountService = {
    getOrCreateForTenant: vi.fn(),
  } as unknown as WhatsappAccountService;
  return { outboundDao, templateStatusDao, accountService };
}

describe("WhatsappSendService.sendTemplate", () => {
  it("blocks without calling Meta when the template is not APPROVED", async () => {
    const { outboundDao, templateStatusDao, accountService } = makeDaos();
    vi.mocked(outboundDao.findByIdempotencyKey).mockResolvedValue(null);
    vi.mocked(templateStatusDao.findByCatalogKey).mockResolvedValue(
      mockEntity<WhatsappTemplateStatus>({ status: "PENDING" }),
    );
    vi.mocked(outboundDao.create).mockResolvedValue(
      mockEntity<WhatsappOutboundMessage>({ status: "blocked_not_approved" }),
    );
    const fetchSpy = vi.fn();
    vi.stubGlobal("fetch", fetchSpy);

    const service = new WhatsappSendService(outboundDao, templateStatusDao, accountService);
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
    const { outboundDao, templateStatusDao, accountService } = makeDaos();
    vi.mocked(outboundDao.findByIdempotencyKey).mockResolvedValue(null);
    vi.mocked(templateStatusDao.findByCatalogKey).mockResolvedValue(
      mockEntity<WhatsappTemplateStatus>({ status: "APPROVED" }),
    );
    vi.mocked(outboundDao.create).mockResolvedValue(
      mockEntity<WhatsappOutboundMessage>({ status: "sent", metaMessageId: "wamid-1" }),
    );
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({ ok: true, json: async () => ({ messages: [{ id: "wamid-1" }] }) }),
    );

    const service = new WhatsappSendService(outboundDao, templateStatusDao, accountService);
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

  it("does not resend when the idempotency key already has a row", async () => {
    const { outboundDao, templateStatusDao, accountService } = makeDaos();
    vi.mocked(outboundDao.findByIdempotencyKey).mockResolvedValue(
      mockEntity<WhatsappOutboundMessage>({ status: "sent" }),
    );
    const fetchSpy = vi.fn();
    vi.stubGlobal("fetch", fetchSpy);

    const service = new WhatsappSendService(outboundDao, templateStatusDao, accountService);
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

describe("WhatsappSendService.notifyOrderReady", () => {
  it("does nothing when the note has no contact number", async () => {
    const { outboundDao, templateStatusDao, accountService } = makeDaos();
    const service = new WhatsappSendService(outboundDao, templateStatusDao, accountService);

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
