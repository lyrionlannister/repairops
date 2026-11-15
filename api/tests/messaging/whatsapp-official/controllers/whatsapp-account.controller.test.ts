import { describe, expect, it, vi } from "vitest";
import type { Request, Response } from "express";
import { WhatsappAccountController } from "../../../../src/messaging/whatsapp-official/controllers/whatsapp-account.controller.js";
import type { WhatsappAccountService } from "../../../../src/messaging/whatsapp-official/services/whatsapp-account.service.js";
import type { WhatsappTemplateService } from "../../../../src/messaging/whatsapp-official/services/whatsapp-template.service.js";
import type { WhatsappAccount } from "../../../../src/messaging/whatsapp-official/entities/whatsapp-account.entity.js";
import { WhatsappGraphApiError } from "../../../../src/messaging/whatsapp-official/clients/whatsapp-graph.client.js";
import { mockEntity } from "../../../support/mock-entity.js";

function makeRes() {
  const res = { status: vi.fn(), json: vi.fn() } as unknown as Response;
  vi.mocked(res.status).mockReturnValue(res);
  return res;
}

function makeReq(body: unknown): Request {
  return { body } as unknown as Request;
}

const validBody = { wabaId: "waba-own", phoneNumberId: "phone-own", accessToken: "token-own" };

describe("WhatsappAccountController.connectAccount", () => {
  it("returns 400 with validation errors when the body is incomplete", async () => {
    const accountService = { connectOwnAccount: vi.fn() } as unknown as WhatsappAccountService;
    const templateService = {} as unknown as WhatsappTemplateService;
    const controller = new WhatsappAccountController(accountService, templateService);

    await controller.connectAccount(makeReq({ wabaId: "waba-own" }), makeRes());

    expect(accountService.connectOwnAccount).not.toHaveBeenCalled();
  });

  it("returns 200 with the updated status when the service connects the account", async () => {
    const accountService = {
      connectOwnAccount: vi.fn().mockResolvedValue(
        mockEntity<WhatsappAccount>({
          status: "connected",
          phoneNumberId: "phone-own",
          ownedByPlatform: false,
        }),
      ),
    } as unknown as WhatsappAccountService;
    const templateService = {} as unknown as WhatsappTemplateService;
    const controller = new WhatsappAccountController(accountService, templateService);
    const res = makeRes();

    await controller.connectAccount(makeReq(validBody), res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      status: "connected",
      phoneNumberId: "phone-own",
      ownedByPlatform: false,
    });
  });

  it("returns 400 with Meta's message when Meta rejects the credentials", async () => {
    const accountService = {
      connectOwnAccount: vi.fn().mockRejectedValue(
        new WhatsappGraphApiError("Invalid OAuth access token", 401, {}),
      ),
    } as unknown as WhatsappAccountService;
    const templateService = {} as unknown as WhatsappTemplateService;
    const controller = new WhatsappAccountController(accountService, templateService);
    const res = makeRes();

    await controller.connectAccount(makeReq(validBody), res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ error: "Invalid OAuth access token" });
  });
});
