import type { Customer } from "@commerce/customers/types/customers";

export interface CustomerSelectProps {
  value: string;
  onChange: (customerId: string, customer: Customer | null) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}
