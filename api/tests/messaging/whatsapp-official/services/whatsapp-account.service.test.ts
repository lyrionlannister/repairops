import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { WhatsappAccountService } from "../../../../src/messaging/whatsapp-official/services/whatsapp-account.service.js";
import type { WhatsappAccountDao } from "../../../../src/messaging/whatsapp-official/daos/whatsapp-account.dao.js";
import type { WhatsappAccount } from "../../../../src/messaging/whatsapp-official/entities/whatsapp-account.entity.js";
import { WhatsappGraphApiError } from "../../../../src/messaging/whatsapp-official/clients/whatsapp-graph.client.js";
import { mockEntity } from "../../../support/mock-entity.js";

function makeDao() {
  return {
    getOrCreateForTenant: vi.fn(),
    connectOwnAccount: vi.fn(),
  } as unknown as WhatsappAccountDao;
}

describe("WhatsappAccountService.getOrCreateForTenant", () => {
  beforeEach(() => {
    process.env.WHATSAPP_PILOT_WABA_ID = "waba-123";
    process.env.WHATSAPP_PILOT_PHONE_NUMBER_ID = "phone-123";
    process.env.WHATSAPP_PILOT_ACCESS_TOKEN = "token-123";
  });

  it("seeds the pilot account from env vars", async () => {
    const dao = makeDao();
    vi.mocked(dao.getOrCreateForTenant).mockResolvedValue(mockEntity<WhatsappAccount>({ id: "wa-1" }));

    const service = new WhatsappAccountService(dao);
    await service.getOrCreateForTenant();

    expect(dao.getOrCreateForTenant).toHaveBeenCalledWith({
      wabaId: "waba-123",
      phoneNumberId: "phone-123",
      accessToken: "token-123",
      ownedByPlatform: true,
    });
  });

  it("throws if a pilot env var is missing", async () => {
    delete process.env.WHATSAPP_PILOT_WABA_ID;
    const dao = makeDao();
    const service = new WhatsappAccountService(dao);

    await expect(service.getOrCreateForTenant()).rejects.toThrow(
      "WHATSAPP_PILOT_WABA_ID is required",
    );
  });
});

describe("WhatsappAccountService.connectOwnAccount", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  const dto = { wabaId: "waba-own", phoneNumberId: "phone-own", accessToken: "token-own" };

  it("verifies credentials against Meta before touching the DAO", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({ ok: true, json: async () => ({ id: "phone-own" }) })
      .mockResolvedValueOnce({ ok: true, json: async () => ({ data: [] }) });
    vi.stubGlobal("fetch", fetchMock);

    const dao = makeDao();
    vi.mocked(dao.connectOwnAccount).mockResolvedValue(
      mockEntity<WhatsappAccount>({ id: "wa-1", ownedByPlatform: false }),
    );

    const service = new WhatsappAccountService(dao);
    const result = await service.connectOwnAccount(dto);

    expect(result.ownedByPlatform).toBe(false);
    expect(dao.connectOwnAccount).toHaveBeenCalledWith(dto);
  });

  it("never calls the DAO when Meta rejects the credentials", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false,
        status: 401,
        json: async () => ({ error: { message: "Invalid OAuth access token" } }),
      }),
    );

    const dao = makeDao();
    const service = new WhatsappAccountService(dao);

    await expect(service.connectOwnAccount(dto)).rejects.toThrow(WhatsappGraphApiError);
    expect(dao.connectOwnAccount).not.toHaveBeenCalled();
  });
});
