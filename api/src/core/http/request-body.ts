import type { Request } from "express";

export function bodyOf(req: Request): Record<string, unknown> {
  const body: unknown = req.body;
  return typeof body === "object" && body !== null ? (body as Record<string, unknown>) : {};
}

export const optionalString = (value: unknown): string | undefined =>
  typeof value === "string" ? value : undefined;
