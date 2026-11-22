import type { UserFormData, UserTextField } from "../types/users";

export interface UserPayFieldsProps {
  form: UserFormData;
  disabled: boolean;
  onChange: (field: UserTextField, value: string) => void;
}
