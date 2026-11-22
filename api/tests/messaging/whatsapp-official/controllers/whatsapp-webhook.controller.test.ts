import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import type { Request, Response } from "express";
import { WhatsappWebhookController } from "../../../../src/messaging/whatsapp-official/controllers/whatsapp-webhook.controller.js";
import type { WhatsappInboundQueueService } from "../../../../src/messaging/whatsapp-official/services/whatsapp-inbound-queue.service.js";

const verifyToken = "test-verify-token";

function makeRes() {
  const res = { status: vi.fn(), send: vi.fn(), sendStatus: vi.fn() } as unknown as Response;
  vi.mocked(res.status).mockReturnValue(res);
  return res;
}

function makeQueue(enqueuePayload = vi.fn().mockResolvedValue(undefined)) {
  return { enqueuePayload } as unknown as WhatsappInboundQueueService;
}

describe("WhatsappWebhookController.receive", () => {
  it("encola el payload y responde 200", async () => {
    const queue = makeQueue();
    const controller = new WhatsappWebhookController(queue);
    const body = { entry: [] };
    const res = makeRes();

    await controller.receive({ body } as Request, res);

    expect(queue.enqueuePayload).toHaveBeenCalledWith(body);
    expect(res.sendStatus).toHaveBeenCalledWith(200);
  });

  it("si no se pudo encolar responde 500 para que Meta reintente", async () => {
    const queue = makeQueue(vi.fn().mockRejectedValue(new Error("redis caido")));
    const controller = new WhatsappWebhookController(queue);
    const res = makeRes();
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    await controller.receive({ body: {} } as Request, res);

    expect(res.sendStatus).toHaveBeenCalledTimes(1);
    expect(res.sendStatus).toHaveBeenCalledWith(500);
    errorSpy.mockRestore();
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
    const controller = new WhatsappWebhookController(makeQueue());
    const req = {
      query: { "hub.mode": "subscribe", "hub.verify_token": verifyToken, "hub.challenge": "123" },
    } as unknown as Request;
    const res = makeRes();

    controller.verify(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.send).toHaveBeenCalledWith("123");
  });

  it("rejects a wrong verify token with 403", () => {
    const controller = new WhatsappWebhookController(makeQueue());
    const req = {
      query: { "hub.mode": "subscribe", "hub.verify_token": "incorrecto", "hub.challenge": "123" },
    } as unknown as Request;
    const res = makeRes();

    controller.verify(req, res);

    expect(res.sendStatus).toHaveBeenCalledWith(403);
  });

  it("rejects a verify token sent as an array with 403", () => {
    const controller = new WhatsappWebhookController(makeQueue());
    const req = {
      query: { "hub.mode": "subscribe", "hub.verify_token": [verifyToken], "hub.challenge": "123" },
    } as unknown as Request;
    const res = makeRes();

    controller.verify(req, res);

    expect(res.sendStatus).toHaveBeenCalledWith(403);
  });
});
