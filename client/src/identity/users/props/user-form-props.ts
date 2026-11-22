import type { ReactNode } from "react";
import type { UserRole } from "../hooks/use-users";
import type { BranchRecord } from "@common/types/branch-context";
import type { UserFormData, UserTextField } from "../types/users";
import type { PermissionSummary } from "../types/role-permissions";
import type { UserSummary } from "../types/user-summary";

export interface UserFormProps {
  form: UserFormData;
  isEdit: boolean;
  disabled: boolean;
  saving: boolean;
  branches: BranchRecord[];
  showPassword: boolean;
  userSummary: UserSummary;
  permissionSummary: PermissionSummary;
  permissionsLoading: boolean;
  aside?: ReactNode;
  onTogglePassword: () => void;
  onChange: (field: UserTextField, value: string) => void;
  onRolesChange: (roles: UserRole[]) => void;
  onBranchAssignmentChange: (branchIds: string[], primaryBranchId: string) => void;
  onSubmit: (event: React.SubmitEvent<HTMLFormElement>) => void;
  onCancel: () => void;
}
