export interface SaleItemInput {
  lineType: SaleItemLineType;
  referenceId: string;
  quantity: number;
  unitPrice: number;
  discountPercent?: number;
}

export interface Sale {
  id: string;
  localId: string;
  saleNumber: number;
  customerId: string | null;
  customerName: string | null;
  subtotal: number;
  discountAmount: number;
  taxAmount: number;
  totalValue: number;
  createdByEmployeeId: string | null;
  createdAt: string;
}

export interface PaymentInput {
  method: PaymentMethod;
  amount: number;
  providerReference?: string;
  providerAuthorizationCode?: string;
}

export interface CreateSalePayload {
  applyTax?: boolean;
  localId: string;
  cashSessionId: string;
  customerId?: string;
  customerName?: string;
  payments: PaymentInput[];
  createdByEmployeeId?: string;
  idempotencyKey?: string;
  items: SaleItemInput[];
}

export type PaymentMethod = "efectivo" | "tarjeta" | "transferencia" | "credito";

export type SaleItemLineType = "inventory_item" | "service_type";
