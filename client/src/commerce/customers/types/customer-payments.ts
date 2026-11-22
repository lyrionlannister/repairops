export interface CustomerPaymentRecord {
  id: string;
  customerId: string;
  localId: string;
  amount: number;
  method: CustomerPaymentMethod;
  createdByEmployeeId: string | null;
  createdAt: string;
}

export interface RegisterCustomerPaymentInput {
  localId: string;
  amount: number;
  method: CustomerPaymentMethod;
  createdByEmployeeId?: string;
}

export type CustomerPaymentMethod = "efectivo" | "tarjeta" | "transferencia";
