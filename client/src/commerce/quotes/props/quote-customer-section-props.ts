import type { Customer } from "@commerce/customers/types/customers";

export interface QuoteCustomerSectionProps {
  customerId: string;
  customerName: string;
  contactNumber: string;
  validUntil: string;
  createdByEmployeeId: string;
  saving: boolean;
  onCustomerChange: (customerId: string, customer: Customer | null) => void;
  onCustomerNameChange: (value: string) => void;
  onContactNumberChange: (value: string) => void;
  onValidUntilChange: (value: string) => void;
  onCreatedByEmployeeIdChange: (value: string) => void;
}
