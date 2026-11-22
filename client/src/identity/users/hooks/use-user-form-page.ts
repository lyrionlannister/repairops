import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router";
import { useBranch } from "@common/hooks/use-branch";
import { useUsers, type UserRole } from "./use-users";
import { useRolePermissions } from "./use-role-permissions";
import { userToForm } from "../utils/user-to-form";
import { buildUserSummary } from "../utils/user-summary";
import type { UserFormData, UserTextField } from "../types/users";

const INITIAL_FORM: UserFormData = {
  firstName: "",
  lastName: "",
  email: "",
  password: "",
  roles: ["employee"],
  salaryAmount: "",
  payCycle: "",
  branchIds: [],
  primaryBranchId: "",
};

export const useUserFormPage = (id: string | undefined) => {
  const navigate = useNavigate();
  const isEdit = Boolean(id);
  const { users, loading, fetchUsers, createUser, creating, updateUser, updating } = useUsers();
  const { branches, workingBranchId } = useBranch();
  const [form, setForm] = useState<UserFormData>(INITIAL_FORM);
  const [showPassword, setShowPassword] = useState(false);
  const { summary: permissionSummary, loading: permissionsLoading } = useRolePermissions(
    form.roles,
  );
  const editingUser = id ? users.find((u) => u.id === id) : undefined;

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  useEffect(() => {
    if (editingUser) setForm(userToForm(editingUser));
  }, [editingUser]);

  // Un usuario nuevo arranca en la sucursal de trabajo del administrador.
  useEffect(() => {
    if (isEdit || !workingBranchId) return;
    setForm((prev) =>
      prev.branchIds.length > 0
        ? prev
        : { ...prev, branchIds: [workingBranchId], primaryBranchId: workingBranchId },
    );
  }, [isEdit, workingBranchId]);

  const saving = creating || updating;
  const userSummary = useMemo(() => buildUserSummary(form, branches), [form, branches]);

  const submit = async (event: React.SubmitEvent<HTMLFormElement>) => {
    event.preventDefault();
    const ok = isEdit && id ? await updateUser(id, form) : await createUser(form);
    if (ok) navigate("/identity/users");
  };

  return {
    isEdit,
    form,
    branches,
    saving,
    disabled: loading || saving,
    userSummary,
    permissionSummary,
    permissionsLoading,
    showPassword,
    togglePassword: () => setShowPassword((prev) => !prev),
    setField: (field: UserTextField, value: string) =>
      setForm((prev) => ({ ...prev, [field]: value })),
    setRoles: (roles: UserRole[]) => setForm((prev) => ({ ...prev, roles })),
    setBranchAssignment: (branchIds: string[], primaryBranchId: string) =>
      setForm((prev) => ({ ...prev, branchIds, primaryBranchId })),
    submit,
    cancel: () => navigate("/identity/users"),
  };
};
