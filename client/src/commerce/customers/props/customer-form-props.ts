import type { CustomerFormData } from "../types/customers";

export interface CustomerFormProps {
  form: CustomerFormData;
  loading: boolean;
  saving: boolean;
  isEdit: boolean;
  hasPanel: boolean;
  onChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onSubmit: (event: React.SubmitEvent<HTMLFormElement>) => void;
  onCancel: () => void;
}
