import { describe, expect, it, vi, afterEach } from "vitest";
import {
  WhatsappTemplateCatalogService,
  WhatsappTemplateCatalogConflictError,
} from "../../../../src/messaging/whatsapp-official/services/whatsapp-template-catalog.service.js";
import type { WhatsappTemplateCatalogEntryDao } from "../../../../src/messaging/whatsapp-official/daos/whatsapp-template-catalog-entry.dao.js";
import type { WhatsappTemplateStatusDao } from "../../../../src/messaging/whatsapp-official/daos/whatsapp-template-status.dao.js";
import type { WhatsappAccountService } from "../../../../src/messaging/whatsapp-official/services/whatsapp-account.service.js";
import type { WhatsappTemplateCatalogEntry } from "../../../../src/messaging/whatsapp-official/entities/whatsapp-template-catalog-entry.entity.js";
import type { WhatsappTemplateStatus } from "../../../../src/messaging/whatsapp-official/entities/whatsapp-template-status.entity.js";
import type { WhatsappAccount } from "../../../../src/messaging/whatsapp-official/entities/whatsapp-account.entity.js";
import { mockEntity } from "../../../support/mock-entity.js";

afterEach(() => {
  vi.unstubAllGlobals();
});

function makeCatalogDao() {
  return {
    findAllForTenant: vi.fn().mockResolvedValue([]),
    findAllSystem: vi.fn().mockResolvedValue([]),
    getOrSeedDefaultsForTenant: vi.fn(),
    findByIdForTenant: vi.fn(),
    createForTenant: vi.fn(),
    updateForTenant: vi.fn(),
    deleteForTenant: vi.fn(),
    createSystem: vi.fn(),
    updateSystem: vi.fn(),
    deleteSystem: vi.fn(),
  } as unknown as WhatsappTemplateCatalogEntryDao;
}

function makeStatusDao() {
  return {
    findByCatalogEntryId: vi.fn().mockResolvedValue(null),
    update: vi.fn(),
  } as unknown as WhatsappTemplateStatusDao;
}

function makeAccountService() {
  return {
    getOrCreateForTenant: vi.fn().mockResolvedValue(
      mockEntity<WhatsappAccount>({ wabaId: "waba-1", accessToken: "token-1" }),
    ),
  } as unknown as WhatsappAccountService;
}

const createDto = {
  key: "promo_verano",
  metaName: "promo_verano",
  category: "MARKETING" as const,
  language: "es_MX",
  text: "Hola {{nombre}}, tenemos una promo para ti",
  variables: ["nombre"],
};

const entry = mockEntity<WhatsappTemplateCatalogEntry>({
  id: "entry-1",
  key: "promo_verano",
  metaName: "promo_verano",
  category: "MARKETING",
  language: "es_MX",
  text: "Hola {{nombre}}, tenemos una promo para ti",
  variables: ["nombre"],
  enabled: true,
});

describe("WhatsappTemplateCatalogService -- empresa", () => {
  it("create rejects a duplicate key with a conflict error, never touches the DAO", async () => {
    const catalogDao = makeCatalogDao();
    vi.mocked(catalogDao.findAllForTenant).mockResolvedValue([entry]);
    const service = new WhatsappTemplateCatalogService(catalogDao, makeStatusDao(), makeAccountService());

    await expect(service.create(createDto)).rejects.toThrow(WhatsappTemplateCatalogConflictError);
    expect(catalogDao.createForTenant).not.toHaveBeenCalled();
  });

  it("create rejects a duplicate metaName even with a different key", async () => {
    const catalogDao = makeCatalogDao();
    vi.mocked(catalogDao.findAllForTenant).mockResolvedValue([{ ...entry, key: "other_key" }]);
    const service = new WhatsappTemplateCatalogService(catalogDao, makeStatusDao(), makeAccountService());

    await expect(service.create({ ...createDto, key: "other_key_2" })).rejects.toThrow(
      WhatsappTemplateCatalogConflictError,
    );
  });

  it("create persists a fresh entry with triggerEvent null and enabled true", async () => {
    const catalogDao = makeCatalogDao();
    vi.mocked(catalogDao.createForTenant).mockResolvedValue(entry);
    const service = new WhatsappTemplateCatalogService(catalogDao, makeStatusDao(), makeAccountService());

    await service.create(createDto);

    expect(catalogDao.createForTenant).toHaveBeenCalledWith(
      expect.objectContaining({ ...createDto, triggerEvent: null, enabled: true }),
    );
  });

  it("update never calls Meta when the entry was never synced", async () => {
    const catalogDao = makeCatalogDao();
    vi.mocked(catalogDao.findByIdForTenant).mockResolvedValue(entry);
    vi.mocked(catalogDao.updateForTenant).mockResolvedValue({ ...entry, text: "nuevo texto" });
    const statusDao = makeStatusDao();
    const fetchSpy = vi.fn();
    vi.stubGlobal("fetch", fetchSpy);

    const service = new WhatsappTemplateCatalogService(catalogDao, statusDao, makeAccountService());
    await service.update("entry-1", { text: "nuevo texto" });

    expect(fetchSpy).not.toHaveBeenCalled();
    expect(catalogDao.updateForTenant).toHaveBeenCalledWith("entry-1", { text: "nuevo texto" });
  });

  it("update calls Meta and resets status to PENDING when the entry is already registered there", async () => {
    const catalogDao = makeCatalogDao();
    vi.mocked(catalogDao.findByIdForTenant).mockResolvedValue(entry);
    vi.mocked(catalogDao.updateForTenant).mockResolvedValue({ ...entry, text: "nuevo texto" });
    const statusDao = makeStatusDao();
    vi.mocked(statusDao.findByCatalogEntryId).mockResolvedValue(
      mockEntity<WhatsappTemplateStatus>({ id: "status-1", metaTemplateId: "meta-123", status: "APPROVED" }),
    );
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true, json: async () => ({ success: true }) }));

    const service = new WhatsappTemplateCatalogService(catalogDao, statusDao, makeAccountService());
    await service.update("entry-1", { text: "nuevo texto" });

    expect(statusDao.update).toHaveBeenCalledWith("status-1", expect.objectContaining({ status: "PENDING" }));
  });

  it("update ignores immutable fields silently -- the DTO doesn't even declare them", async () => {
    const catalogDao = makeCatalogDao();
    vi.mocked(catalogDao.findByIdForTenant).mockResolvedValue(entry);
    vi.mocked(catalogDao.updateForTenant).mockResolvedValue(entry);
    const service = new WhatsappTemplateCatalogService(catalogDao, makeStatusDao(), makeAccountService());

    await service.update("entry-1", { enabled: false } as any);

    expect(catalogDao.updateForTenant).toHaveBeenCalledWith("entry-1", { enabled: false });
  });

  it("delete calls Meta first and only deletes locally if Meta confirms", async () => {
    const catalogDao = makeCatalogDao();
    vi.mocked(catalogDao.findByIdForTenant).mockResolvedValue(entry);
    vi.mocked(catalogDao.deleteForTenant).mockResolvedValue(true);
    const statusDao = makeStatusDao();
    vi.mocked(statusDao.findByCatalogEntryId).mockResolvedValue(
      mockEntity<WhatsappTemplateStatus>({ id: "status-1", metaTemplateId: "meta-123" }),
    );
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ success: true }) });
    vi.stubGlobal("fetch", fetchMock);

    const service = new WhatsappTemplateCatalogService(catalogDao, statusDao, makeAccountService());
    const result = await service.delete("entry-1");

    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining("message_templates?name=promo_verano"),
      expect.objectContaining({ method: "DELETE" }),
    );
    expect(catalogDao.deleteForTenant).toHaveBeenCalledWith("entry-1");
    expect(result).toBe(true);
  });

  it("delete propagates Meta's rejection and never deletes anything local", async () => {
    const catalogDao = makeCatalogDao();
    vi.mocked(catalogDao.findByIdForTenant).mockResolvedValue(entry);
    const statusDao = makeStatusDao();
    vi.mocked(statusDao.findByCatalogEntryId).mockResolvedValue(
      mockEntity<WhatsappTemplateStatus>({ id: "status-1", metaTemplateId: "meta-123" }),
    );
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({ ok: false, status: 400, json: async () => ({ error: { message: "En uso" } }) }),
    );

    const service = new WhatsappTemplateCatalogService(catalogDao, statusDao, makeAccountService());

    await expect(service.delete("entry-1")).rejects.toThrow("En uso");
    expect(catalogDao.deleteForTenant).not.toHaveBeenCalled();
  });

  it("delete never calls Meta when the entry was never synced there", async () => {
    const catalogDao = makeCatalogDao();
    vi.mocked(catalogDao.findByIdForTenant).mockResolvedValue(entry);
    vi.mocked(catalogDao.deleteForTenant).mockResolvedValue(true);
    const fetchSpy = vi.fn();
    vi.stubGlobal("fetch", fetchSpy);

    const service = new WhatsappTemplateCatalogService(catalogDao, makeStatusDao(), makeAccountService());
    await service.delete("entry-1");

    expect(fetchSpy).not.toHaveBeenCalled();
    expect(catalogDao.deleteForTenant).toHaveBeenCalledWith("entry-1");
  });
});

describe("WhatsappTemplateCatalogService -- sistema", () => {
  it("createSystem rejects a duplicate key within the system scope", async () => {
    const catalogDao = makeCatalogDao();
    vi.mocked(catalogDao.findAllSystem).mockResolvedValue([entry]);
    const service = new WhatsappTemplateCatalogService(catalogDao, makeStatusDao(), makeAccountService());

    await expect(service.createSystem(createDto)).rejects.toThrow(WhatsappTemplateCatalogConflictError);
    expect(catalogDao.createSystem).not.toHaveBeenCalled();
  });

  it("updateSystem and deleteSystem never call Meta -- no system account exists yet", async () => {
    const catalogDao = makeCatalogDao();
    vi.mocked(catalogDao.updateSystem).mockResolvedValue(entry);
    vi.mocked(catalogDao.deleteSystem).mockResolvedValue(true);
    const fetchSpy = vi.fn();
    vi.stubGlobal("fetch", fetchSpy);

    const service = new WhatsappTemplateCatalogService(catalogDao, makeStatusDao(), makeAccountService());
    await service.updateSystem("entry-1", { text: "nuevo" });
    await service.deleteSystem("entry-1");

    expect(fetchSpy).not.toHaveBeenCalled();
  });
});
