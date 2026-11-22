import type { SaleItemLineType } from "@commerce/inventory/types/sales";

export interface SaleItemRecord {
  id: string;
  lineType: SaleItemLineType;
  referenceId: string;
  quantity: number;
  unitPrice: number;
  discountAmount: number;
}

export interface SaleWithItems {
  id: string;
  saleNumber: number;
  totalValue: number;
  items: SaleItemRecord[];
}

export interface SaleListItem {
  id: string;
  saleNumber: number;
  customerId: string | null;
  totalValue: number;
  createdAt: string;
}

export interface ReturnItemInput {
  saleItemId: string;
  quantity: number;
  refundAmount: number;
}

export interface CreateReturnPayload {
  saleId: string;
  cashSessionId: string;
  refundMethod: RefundMethod;
  reason: string;
  totalRefunded: number;
  idempotencyKey?: string;
  items: ReturnItemInput[];
}

export interface ReturnRecord {
  id: string;
  returnNumber: number;
  saleId: string;
  totalRefunded: number;
}

export type RefundMethod = "efectivo" | "tarjeta" | "transferencia";
