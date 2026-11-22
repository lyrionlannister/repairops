import type { RepairNoteRecord } from "../types/repair-notes";
import type { DeliveryPaymentLine } from "../types/repair-note-delivery";
import type { CustomerCreditBalance } from "@commerce/customers/types/customers";

export interface RepairNoteDeliveryModalProps {
  isOpen: boolean;
  note: RepairNoteRecord | null;
  total: number;
  advancePaid: number;
  balance: number;
  payments: DeliveryPaymentLine[];
  paymentsSum: number;
  employeeId: string;
  credit: CustomerCreditBalance | null;
  hasCashSession: boolean;
  hasCashPayment: boolean;
  problem: string | null;
  error: string | null;
  saving: boolean;
  onClose: () => void;
  onEmployeeChange: (id: string) => void;
  onPaymentChange: (index: number, patch: Partial<DeliveryPaymentLine>) => void;
  onAddPayment: () => void;
  onRemovePayment: (index: number) => void;
  onSubmit: () => void;
}
