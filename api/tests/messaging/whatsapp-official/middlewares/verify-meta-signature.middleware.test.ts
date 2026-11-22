import { createHmac } from "node:crypto";
import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import type { Request, Response } from "express";
import { verifyMetaSignatureMiddleware } from "../../../../src/messaging/whatsapp-official/middlewares/verify-meta-signature.middleware.js";

const appSecret = "test-app-secret";

function makeReq(body: unknown, signatureHeader?: string): Request {
  return {
    body,
    rawBody: Buffer.from(JSON.stringify(body)),
    header: vi.fn().mockReturnValue(signatureHeader),
  } as unknown as Request;
}

function signatureFor(body: unknown): string {
  return `sha256=${createHmac("sha256", appSecret).update(JSON.stringify(body)).digest("hex")}`;
}

describe("verifyMetaSignatureMiddleware", () => {
  const originalAppSecret = process.env.WHATSAPP_APP_SECRET;

  beforeEach(() => {
    process.env.WHATSAPP_APP_SECRET = appSecret;
  });

  afterEach(() => {
    process.env.WHATSAPP_APP_SECRET = originalAppSecret;
  });

  it("deja pasar una firma valida", () => {
    const body = { entry: [] };
    const res = { sendStatus: vi.fn() } as unknown as Response;
    const next = vi.fn();

    verifyMetaSignatureMiddleware(makeReq(body, signatureFor(body)), res, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(res.sendStatus).not.toHaveBeenCalled();
  });

  it("rechaza una firma invalida con 401 sin llegar al controller", () => {
    const res = { sendStatus: vi.fn() } as unknown as Response;
    const next = vi.fn();

    verifyMetaSignatureMiddleware(makeReq({ entry: [] }, "sha256=invalido"), res, next);

    expect(res.sendStatus).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });

  it("rechaza con 401 si falta el body crudo", () => {
    const res = { sendStatus: vi.fn() } as unknown as Response;
    const next = vi.fn();
    const req = { body: {}, header: vi.fn().mockReturnValue("sha256=abc") } as unknown as Request;

    verifyMetaSignatureMiddleware(req, res, next);

    expect(res.sendStatus).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });
});
