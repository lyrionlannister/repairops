import type { FC } from "react";

import { Button } from "@ui/button/button";

import type { BranchRecord } from "@common/contexts/branch-context";
import type { UserFormData, UserRole } from "../hooks/use-users";
import { BranchAssignmentField } from "./branch-assignment-field";
import { UserAccountSection } from "./user-account-section";

interface UserFormProps {
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

export const UserForm: FC<UserFormProps> = ({
  form,
  isEdit,
  disabled,
  saving,
  branches,
  showPassword,
  onTogglePassword,
  onChange,
  onRolesChange,
  onBranchAssignmentChange,
  onSubmit,
  onCancel,
}) => (
  <form
    onSubmit={onSubmit}
    className="space-y-4 rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/3"
  >
    <UserAccountSection
      form={form}
      isEdit={isEdit}
      disabled={disabled}
      showPassword={showPassword}
      onTogglePassword={onTogglePassword}
      onChange={onChange}
      onRolesChange={onRolesChange}
    />

    {!form.roles.includes("owner") && (
      <BranchAssignmentField
        branches={branches}
        branchIds={form.branchIds}
        primaryBranchId={form.primaryBranchId}
        disabled={disabled}
        onChange={onBranchAssignmentChange}
      />
    )}

    <div className="flex justify-end gap-2 pt-1">
      <Button type="button" variant="outline" onClick={onCancel}>
        Cancelar
      </Button>
      <Button type="submit" variant="primary" disabled={saving}>
        {saving ? "Guardando..." : isEdit ? "Guardar cambios" : "Crear usuario"}
      </Button>
    </div>
  </form>
);
