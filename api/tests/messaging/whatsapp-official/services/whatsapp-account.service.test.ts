import { describe, expect, it, vi, beforeEach } from "vitest";
import { WhatsappAccountService } from "../../../../src/messaging/whatsapp-official/services/whatsapp-account.service.js";
import type { WhatsappAccountDao } from "../../../../src/messaging/whatsapp-official/daos/whatsapp-account.dao.js";

function makeDao() {
  return {
    getOrCreateForTenant: vi.fn(),
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
    (dao.getOrCreateForTenant as any).mockResolvedValue({ id: "wa-1" });

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
