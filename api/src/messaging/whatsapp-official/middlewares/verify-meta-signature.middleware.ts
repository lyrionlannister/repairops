import type { NextFunction, Request, Response } from "express";
import { verifyMetaSignature } from "../utils/verify-signature.js";
import { requiredEnv } from "../../../core/config/env.js";

export function verifyMetaSignatureMiddleware(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  const rawBody = (req as unknown as { rawBody?: Buffer }).rawBody;
  const signatureHeader = req.header("x-hub-signature-256");

  if (
    !rawBody ||
    !verifyMetaSignature(rawBody, signatureHeader, requiredEnv("WHATSAPP_APP_SECRET"))
  ) {
    res.sendStatus(401);
    return;
  }
  next();
}
