import { createHmac, timingSafeEqual } from "node:crypto";

// Meta firma los bytes crudos del body, no el JSON re-serializado -- por eso
// el caller debe pasar el Buffer de express.json({ verify }) (ver index.ts),
// nunca JSON.stringify(req.body).
export function verifyMetaSignature(
  rawBody: Buffer,
  signatureHeader: string | undefined,
  appSecret: string,
): boolean {
  if (!signatureHeader) return false;

  const [scheme, signature] = signatureHeader.split("=");
  if (scheme !== "sha256" || !signature) return false;

  const expected = createHmac("sha256", appSecret).update(rawBody).digest("hex");
  const expectedBuffer = Buffer.from(expected, "hex");
  const actualBuffer = Buffer.from(signature, "hex");
  if (expectedBuffer.length !== actualBuffer.length) return false;

  return timingSafeEqual(expectedBuffer, actualBuffer);
}
