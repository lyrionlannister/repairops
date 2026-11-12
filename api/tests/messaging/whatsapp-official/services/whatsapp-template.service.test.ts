import { describe, expect, it, vi, afterEach } from "vitest";
import { WhatsappTemplateService } from "../../../../src/messaging/whatsapp-official/services/whatsapp-template.service.js";
import type { WhatsappTemplateStatusDao } from "../../../../src/messaging/whatsapp-official/daos/whatsapp-template-status.dao.js";
import type { WhatsappAccount } from "../../../../src/messaging/whatsapp-official/entities/whatsapp-account.entity.js";
import type { WhatsappTemplateStatus } from "../../../../src/messaging/whatsapp-official/entities/whatsapp-template-status.entity.js";
import { mockEntity } from "../../../support/mock-entity.js";

afterEach(() => {
  vi.unstubAllGlobals();
});

function makeDao() {
  return {
    findByCatalogKey: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
  } as unknown as WhatsappTemplateStatusDao;
}

const account = mockEntity<WhatsappAccount>({
  id: "acc-1",
  wabaId: "waba-1",
  accessToken: "token-1",
});

describe("WhatsappTemplateService.reconcile", () => {
  it("creates in Meta a catalog entry with no row and nothing on the WABA yet", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValueOnce({ ok: true, json: async () => ({ data: [] }) }).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ id: "meta-123", status: "PENDING", category: "UTILITY" }),
      }),
    );
    const dao = makeDao();
    vi.mocked(dao.findByCatalogKey).mockResolvedValue(null);
    vi.mocked(dao.create).mockResolvedValue(
      mockEntity<WhatsappTemplateStatus>({ id: "row-1", catalogKey: "order_ready", status: "PENDING" }),
    );

    const service = new WhatsappTemplateService(dao);
    const result = await service.reconcile(account);

    expect(dao.create).toHaveBeenCalledWith(
      expect.objectContaining({ catalogKey: "order_ready", metaTemplateId: "meta-123", status: "PENDING" }),
    );
    expect(result).toHaveLength(1);
  });

  it("refreshes status for a row that already exists and the WABA reports a status change", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ data: [{ id: "meta-123", name: "orden_lista_recoger", status: "APPROVED" }] }),
      }),
    );
    const dao = makeDao();
    vi.mocked(dao.findByCatalogKey).mockResolvedValue(
      mockEntity<WhatsappTemplateStatus>({ id: "row-1", catalogKey: "order_ready", status: "PENDING" }),
    );
    vi.mocked(dao.update).mockResolvedValue(
      mockEntity<WhatsappTemplateStatus>({ id: "row-1", catalogKey: "order_ready", status: "APPROVED" }),
    );

    const service = new WhatsappTemplateService(dao);
    const result = await service.reconcile(account);

    expect(dao.update).toHaveBeenCalledWith("row-1", expect.objectContaining({ status: "APPROVED" }));
    expect(dao.create).not.toHaveBeenCalled();
    expect(result[0].status).toBe("APPROVED");
  });
});
