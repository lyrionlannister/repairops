import type { InventoryItemFormData, InventoryItemKind } from "../types/inventory";
import type { Supplier } from "@commerce/suppliers/types/suppliers";

export interface InventoryItemFormProps {
  form: InventoryItemFormData;
  loading: boolean;
  saving: boolean;
  isEdit: boolean;
  suppliers: Supplier[];
  onChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onKindChange: (kind: InventoryItemKind) => void;
  onSupplierChange: (supplierId: string) => void;
  onSubmit: (event: React.SubmitEvent<HTMLFormElement>) => void;
  onCancel: () => void;
}
