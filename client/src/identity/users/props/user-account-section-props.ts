import type { UserFormData, UserTextField } from "../types/users";

export interface UserAccountSectionProps {
  form: UserFormData;
  isEdit: boolean;
  disabled: boolean;
  showPassword: boolean;
  onTogglePassword: () => void;
  onChange: (field: UserTextField, value: string) => void;
}
