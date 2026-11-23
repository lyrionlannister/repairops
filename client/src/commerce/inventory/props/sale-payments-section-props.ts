import type { SalePaymentLine } from "../types/sale-cart";

export interface SalePaymentsSectionProps {
  payments: SalePaymentLine[];
  isOnline: boolean;
  paymentsSum: number;
  paymentsMatchTotal: boolean;
  hasCreditoWithoutCustomer: boolean;
  hasCreditoWithoutDueDate: boolean;
  total: number;
  onPaymentChange: (index: number, patch: Partial<SalePaymentLine>) => void;
  onAddPayment: () => void;
  onRemovePayment: (index: number) => void;
}
