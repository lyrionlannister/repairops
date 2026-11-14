import { createHmac } from "node:crypto";
import { describe, expect, it } from "vitest";
import { verifyMetaSignature } from "../../../../src/messaging/whatsapp-official/utils/verify-signature.js";

const appSecret = "test-app-secret";

function signatureFor(body: string): string {
  return `sha256=${createHmac("sha256", appSecret).update(body).digest("hex")}`;
}

describe("verifyMetaSignature", () => {
  it("accepts a signature computed over the exact raw bytes", () => {
    const rawBody = Buffer.from(JSON.stringify({ entry: [] }));
    const header = signatureFor(rawBody.toString());

    expect(verifyMetaSignature(rawBody, header, appSecret)).toBe(true);
  });

  it("rejects a signature computed with the wrong secret", () => {
    const rawBody = Buffer.from(JSON.stringify({ entry: [] }));
    const wrongHeader = `sha256=${createHmac("sha256", "otro-secreto").update(rawBody).digest("hex")}`;

    expect(verifyMetaSignature(rawBody, wrongHeader, appSecret)).toBe(false);
  });

  it("rejects a tampered body even with a well-formed header", () => {
    const originalBody = Buffer.from(JSON.stringify({ entry: [] }));
    const header = signatureFor(originalBody.toString());
    const tamperedBody = Buffer.from(JSON.stringify({ entry: ["injected"] }));

    expect(verifyMetaSignature(tamperedBody, header, appSecret)).toBe(false);
  });

  it("rejects a missing header", () => {
    const rawBody = Buffer.from("{}");
    expect(verifyMetaSignature(rawBody, undefined, appSecret)).toBe(false);
  });
});
