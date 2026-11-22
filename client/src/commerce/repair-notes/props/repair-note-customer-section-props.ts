import type { Customer } from "@commerce/customers/types/customers";

export interface RepairNoteCustomerSectionProps {
  customerId: string;
  customerName: string;
  contactNumber: string;
  saving: boolean;
  onCustomerChange: (customerId: string, customer: Customer | null) => void;
  onCustomerNameChange: (value: string) => void;
  onContactNumberChange: (value: string) => void;
}
