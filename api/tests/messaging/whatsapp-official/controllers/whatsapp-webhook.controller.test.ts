import { createHmac } from "node:crypto";
import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import type { Request, Response } from "express";
import { WhatsappWebhookController } from "../../../../src/messaging/whatsapp-official/controllers/whatsapp-webhook.controller.js";
import type { WhatsappWebhookService } from "../../../../src/messaging/whatsapp-official/services/whatsapp-webhook.service.js";

const appSecret = "test-app-secret";
const verifyToken = "test-verify-token";

function makeRes() {
  const res = { status: vi.fn(), send: vi.fn(), sendStatus: vi.fn() } as unknown as Response;
  vi.mocked(res.status).mockReturnValue(res);
  return res;
}

function makeReq(body: unknown, signatureHeader?: string): Request {
  const rawBody = Buffer.from(JSON.stringify(body));
  return {
    body,
    rawBody,
    header: vi.fn().mockReturnValue(signatureHeader),
    query: {},
  } as unknown as Request;
}

function signatureFor(body: unknown): string {
  const raw = JSON.stringify(body);
  return `sha256=${createHmac("sha256", appSecret).update(raw).digest("hex")}`;
}

describe("WhatsappWebhookController.receive", () => {
  const originalAppSecret = process.env.WHATSAPP_APP_SECRET;
  const originalVerifyToken = process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN;

  beforeEach(() => {
    process.env.WHATSAPP_APP_SECRET = appSecret;
    process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN = verifyToken;
  });

  afterEach(() => {
    process.env.WHATSAPP_APP_SECRET = originalAppSecret;
    process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN = originalVerifyToken;
  });

  it("rejects an invalid signature with 401 without touching the service", async () => {
    const service = { handleIncomingMessage: vi.fn() } as unknown as WhatsappWebhookService;
    const controller = new WhatsappWebhookController(service);
    const req = makeReq({ entry: [] }, "sha256=invalido");
    const res = makeRes();

    await controller.receive(req, res);

    expect(res.sendStatus).toHaveBeenCalledWith(401);
    expect(service.handleIncomingMessage).not.toHaveBeenCalled();
  });

  it("processes an incoming text message and acks 200 with a valid signature", async () => {
    const service = { handleIncomingMessage: vi.fn().mockResolvedValue(undefined) } as unknown as WhatsappWebhookService;
    const controller = new WhatsappWebhookController(service);
    const payload = {
      entry: [
        {
          changes: [
            {
              value: {
                metadata: { phone_number_id: "phone-1" },
                contacts: [{ wa_id: "5215500000000", profile: { name: "Ana" } }],
                messages: [{ from: "5215500000000", type: "text", text: { body: "hola" } }],
              },
            },
          ],
        },
      ],
    };
    const req = makeReq(payload, signatureFor(payload));
    const res = makeRes();

    await controller.receive(req, res);

    expect(service.handleIncomingMessage).toHaveBeenCalledWith({
      phoneNumberId: "phone-1",
      from: "5215500000000",
      body: "hola",
      contactName: "Ana",
    });
    expect(res.sendStatus).toHaveBeenCalledWith(200);
  });
});

describe("WhatsappWebhookController.verify", () => {
  const originalVerifyToken = process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN;

  beforeEach(() => {
    process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN = verifyToken;
  });

  afterEach(() => {
    process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN = originalVerifyToken;
  });

  it("echoes the challenge when mode and token match", () => {
    const service = {} as unknown as WhatsappWebhookService;
    const controller = new WhatsappWebhookController(service);
    const req = {
      query: { "hub.mode": "subscribe", "hub.verify_token": verifyToken, "hub.challenge": "123" },
    } as unknown as Request;
    const res = makeRes();

    controller.verify(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.send).toHaveBeenCalledWith("123");
  });

  it("rejects a wrong verify token with 403", () => {
    const service = {} as unknown as WhatsappWebhookService;
    const controller = new WhatsappWebhookController(service);
    const req = {
      query: { "hub.mode": "subscribe", "hub.verify_token": "incorrecto", "hub.challenge": "123" },
    } as unknown as Request;
    const res = makeRes();

    controller.verify(req, res);

    expect(res.sendStatus).toHaveBeenCalledWith(403);
  });
});
