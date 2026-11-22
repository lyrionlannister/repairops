import type { BranchFormData } from "../types/branches";

export interface BranchFormProps {
  form: BranchFormData;
  loading: boolean;
  saving: boolean;
  isEdit: boolean;
  onChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onSubmit: (event: React.SubmitEvent<HTMLFormElement>) => void;
  onCancel: () => void;
}
