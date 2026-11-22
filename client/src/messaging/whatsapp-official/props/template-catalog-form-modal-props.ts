import type { CatalogFormData } from "../types/format";

export interface TemplateCatalogFormModalProps {
  isOpen: boolean;
  isEditing: boolean;
  form: CatalogFormData;
  saving: boolean;
  onFieldChange: <K extends keyof CatalogFormData>(field: K, value: CatalogFormData[K]) => void;
  onSubmit: (event: React.SubmitEvent<HTMLFormElement>) => void;
  onClose: () => void;
}
