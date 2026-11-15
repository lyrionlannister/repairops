import { describe, expect, it, vi, afterEach } from "vitest";
import { WhatsappTemplateService } from "../../../../src/messaging/whatsapp-official/services/whatsapp-template.service.js";
import type { WhatsappTemplateStatusDao } from "../../../../src/messaging/whatsapp-official/daos/whatsapp-template-status.dao.js";
import type { WhatsappTemplateCatalogEntryDao } from "../../../../src/messaging/whatsapp-official/daos/whatsapp-template-catalog-entry.dao.js";
import type { WhatsappAccount } from "../../../../src/messaging/whatsapp-official/entities/whatsapp-account.entity.js";
import type { WhatsappTemplateStatus } from "../../../../src/messaging/whatsapp-official/entities/whatsapp-template-status.entity.js";
import type { WhatsappTemplateCatalogEntry } from "../../../../src/messaging/whatsapp-official/entities/whatsapp-template-catalog-entry.entity.js";
import { mockEntity } from "../../../support/mock-entity.js";

afterEach(() => {
  vi.unstubAllGlobals();
});

function makeStatusDao() {
  return {
    findByCatalogEntryId: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
  } as unknown as WhatsappTemplateStatusDao;
}

function makeCatalogDao(entries: WhatsappTemplateCatalogEntry[]) {
  return {
    getOrSeedDefaultsForTenant: vi.fn().mockResolvedValue(entries),
  } as unknown as WhatsappTemplateCatalogEntryDao;
}

const account = mockEntity<WhatsappAccount>({
  id: "acc-1",
  wabaId: "waba-1",
  accessToken: "token-1",
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

describe("WhatsappTemplateService.reconcile", () => {
  it("creates in Meta a catalog entry with no row and nothing on the WABA yet", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValueOnce({ ok: true, json: async () => ({ data: [] }) }).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ id: "meta-123", status: "PENDING", category: "UTILITY" }),
      }),
    );
    const statusDao = makeStatusDao();
    const catalogDao = makeCatalogDao([orderReadyEntry]);
    vi.mocked(statusDao.findByCatalogEntryId).mockResolvedValue(null);
    vi.mocked(statusDao.create).mockResolvedValue(
      mockEntity<WhatsappTemplateStatus>({ id: "row-1", catalogEntryId: "entry-1", status: "PENDING" }),
    );

    const service = new WhatsappTemplateService(statusDao, catalogDao);
    const result = await service.reconcile(account);

    expect(statusDao.create).toHaveBeenCalledWith(
      expect.objectContaining({ catalogEntryId: "entry-1", metaTemplateId: "meta-123", status: "PENDING" }),
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
    const statusDao = makeStatusDao();
    const catalogDao = makeCatalogDao([orderReadyEntry]);
    vi.mocked(statusDao.findByCatalogEntryId).mockResolvedValue(
      mockEntity<WhatsappTemplateStatus>({ id: "row-1", accountId: "acc-1", catalogEntryId: "entry-1", status: "PENDING" }),
    );
    vi.mocked(statusDao.update).mockResolvedValue(
      mockEntity<WhatsappTemplateStatus>({ id: "row-1", accountId: "acc-1", catalogEntryId: "entry-1", status: "APPROVED" }),
    );

    const service = new WhatsappTemplateService(statusDao, catalogDao);
    const result = await service.reconcile(account);

    expect(statusDao.update).toHaveBeenCalledWith("row-1", expect.objectContaining({ status: "APPROVED" }));
    expect(statusDao.create).not.toHaveBeenCalled();
    expect(result[0].status).toBe("APPROVED");
  });

  it("re-links the row to a new account when the tenant switched WhatsApp accounts (Etapa 2)", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ data: [{ id: "meta-999", name: "orden_lista_recoger", status: "PENDING" }] }),
      }),
    );
    const statusDao = makeStatusDao();
    const catalogDao = makeCatalogDao([orderReadyEntry]);
    vi.mocked(statusDao.findByCatalogEntryId).mockResolvedValue(
      mockEntity<WhatsappTemplateStatus>({
        id: "row-1",
        accountId: "acc-old-pilot",
        catalogEntryId: "entry-1",
        metaTemplateId: "meta-old-pilot",
        status: "APPROVED",
      }),
    );
    vi.mocked(statusDao.update).mockResolvedValue(
      mockEntity<WhatsappTemplateStatus>({ id: "row-1", accountId: "acc-1", catalogEntryId: "entry-1", status: "PENDING" }),
    );

    const service = new WhatsappTemplateService(statusDao, catalogDao);
    await service.reconcile(account);

    expect(statusDao.update).toHaveBeenCalledWith(
      "row-1",
      expect.objectContaining({ accountId: "acc-1", metaTemplateId: "meta-999", status: "PENDING" }),
    );
    expect(statusDao.create).not.toHaveBeenCalled();
  });

  it("skips a disabled catalog entry -- never syncs, never calls Meta for it", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValueOnce({ ok: true, json: async () => ({ data: [] }) }));
    const statusDao = makeStatusDao();
    const catalogDao = makeCatalogDao([mockEntity<WhatsappTemplateCatalogEntry>({ ...orderReadyEntry, enabled: false })]);

    const service = new WhatsappTemplateService(statusDao, catalogDao);
    const result = await service.reconcile(account);

    expect(result).toHaveLength(0);
    expect(statusDao.create).not.toHaveBeenCalled();
    expect(statusDao.update).not.toHaveBeenCalled();
  });
});
