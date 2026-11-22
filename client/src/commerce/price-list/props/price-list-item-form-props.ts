import type { PriceListItemFormData } from "../types/price-list";
import type { Supplier } from "@commerce/suppliers/types/suppliers";

export interface PriceListItemFormProps {
  form: PriceListItemFormData;
  loading: boolean;
  saving: boolean;
  isEdit: boolean;
  suppliers: Supplier[];
  hasPanel: boolean;
  onChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onSupplierChange: (supplierId: string) => void;
  onSubmit: (event: React.SubmitEvent<HTMLFormElement>) => void;
  onCancel: () => void;
}
