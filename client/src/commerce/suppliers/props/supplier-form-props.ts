import type { Supplier, SupplierFormData } from "../types/suppliers";

export interface SupplierFormProps {
  form: SupplierFormData;
  loading: boolean;
  saving: boolean;
  isEdit: boolean;
  supplier?: Supplier;
  onChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onSubmit: (event: React.SubmitEvent<HTMLFormElement>) => void;
  onCancel: () => void;
  onToggleActive: () => void;
}
