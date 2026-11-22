import type { UserRole } from "../hooks/use-users";
import type { BranchRecord } from "@common/types/branch-context";
import type { UserFormData } from "../types/users";

export interface UserFormProps {
  form: UserFormData;
  isEdit: boolean;
  disabled: boolean;
  saving: boolean;
  branches: BranchRecord[];
  showPassword: boolean;
  onTogglePassword: () => void;
  onChange: (field: Exclude<keyof UserFormData, "branchIds" | "roles">, value: string) => void;
  onRolesChange: (roles: UserRole[]) => void;
  onBranchAssignmentChange: (branchIds: string[], primaryBranchId: string) => void;
  onSubmit: (event: React.SubmitEvent<HTMLFormElement>) => void;
  onCancel: () => void;
}
