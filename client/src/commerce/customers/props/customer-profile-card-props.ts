import type { Customer } from "../types/customers";
import type { ProfileDraft } from "../types/customer-detail";

export interface CustomerProfileCardProps {
  customer: Customer;
  editing: boolean;
  draft: ProfileDraft;
  saving: boolean;
  error: string | null;
  onDraftChange: (draft: ProfileDraft) => void;
  onStart: () => void;
  onCancel: () => void;
  onSave: () => void;
}
