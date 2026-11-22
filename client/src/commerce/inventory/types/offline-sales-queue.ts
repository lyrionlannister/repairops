import type { CreateSalePayload } from "./sales";

export interface QueuedSale {
  localFolio: string;
  idempotencyKey: string;
  payload: CreateSalePayload;
  queuedAt: string;
  lastError?: string;
}
