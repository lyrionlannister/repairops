import type { RefObject } from "react";
import type { Customer } from "@commerce/customers/types/customers";
import type { InventoryItem } from "@commerce/inventory/types/inventory";
import type { QuoteFormData } from "../types/quotes";
import type { QuoteItemLine } from "../types/quote-item-lines";

export interface QuoteFormProps {
  formRef: RefObject<HTMLFormElement | null>;
  step: number;
  isLast: boolean;
  onStepClick: (step: number) => void;
  form: QuoteFormData;
  saving: boolean;
  isEdit: boolean;
  showCustomerHistory: boolean;
  onCustomerChange: (customerId: string, customer: Customer | null) => void;
  onCustomerNameChange: (value: string) => void;
  onContactNumberChange: (value: string) => void;
  onValidUntilChange: (value: string) => void;
  onCreatedByEmployeeIdChange: (value: string) => void;
  onKindChange: (kind: QuoteFormData["kind"]) => void;
  onBrandChange: (value: string) => void;
  onModelChange: (value: string) => void;
  onReportedFailureChange: (value: string) => void;
  onServiceTypeIdsChange: (serviceTypeIds: string[]) => void;
  itemLines: QuoteItemLine[];
  inventoryItems: InventoryItem[];
  onInventoryItemChange: (index: number, inventoryItemId: string) => void;
  onLineChange: (index: number, patch: Partial<QuoteItemLine>) => void;
  onAddLine: () => void;
  onRemoveLine: (index: number) => void;
  onBack: () => void;
  onNext: () => void;
  onSubmit: (event: React.SubmitEvent<HTMLFormElement>) => void;
  onCancel: () => void;
}
