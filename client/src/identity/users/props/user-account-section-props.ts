import type { UserRole } from "../hooks/use-users";
import type { UserFormData } from "../types/users";

export interface UserAccountSectionProps {
  form: UserFormData;
  isEdit: boolean;
  disabled: boolean;
  showPassword: boolean;
  onTogglePassword: () => void;
  onChange: (field: Exclude<keyof UserFormData, "branchIds" | "roles">, value: string) => void;
  onRolesChange: (roles: UserRole[]) => void;
}
