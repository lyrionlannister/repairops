import type { CustomerPaymentMethod } from "./customer-payments";

export interface RegisterPaymentForm {
  amount: string;
  method: CustomerPaymentMethod;
  createdByEmployeeId: string;
}
