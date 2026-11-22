import type { PaymentMethod } from "./sales";

export type SaleLineItem = { inventoryItemId: string; quantity: string; unitPrice: string };

export type SalePaymentLine = {
  method: PaymentMethod;
  amount: string;
  providerReference: string;
  providerAuthorizationCode: string;
};
