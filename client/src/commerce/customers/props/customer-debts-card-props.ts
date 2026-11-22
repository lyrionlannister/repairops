import type { CustomerDebtRow } from "../types/customer-detail";

export interface CustomerDebtsCardProps {
  debts: CustomerDebtRow[];
  balance: number;
  onRegisterPayment: () => void;
}
