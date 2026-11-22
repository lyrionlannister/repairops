import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { useBranch } from "@common/hooks/use-branch";
import { useUsers, type UserFormData, type UserRole } from "./use-users";
import { userToForm } from "../utils/user-to-form";

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
  const editingUser = id ? users.find((u) => u.id === id) : undefined;

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  useEffect(() => {
    if (editingUser) setForm(userToForm(editingUser));
  }, [editingUser]);

  // Un usuario nuevo arranca en la sucursal de trabajo del dueño.
  useEffect(() => {
    if (isEdit || !workingBranchId) return;
    setForm((prev) =>
      prev.branchIds.length > 0 ? prev : { ...prev, branchIds: [workingBranchId], primaryBranchId: workingBranchId },
    );
  }, [isEdit, workingBranchId]);

  const saving = creating || updating;

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
    showPassword,
    togglePassword: () => setShowPassword((prev) => !prev),
    setField: (field: Exclude<keyof UserFormData, "branchIds" | "roles">, value: string) =>
      setForm((prev) => ({ ...prev, [field]: value })),
    setRoles: (roles: UserRole[]) => setForm((prev) => ({ ...prev, roles })),
    setBranchAssignment: (branchIds: string[], primaryBranchId: string) =>
      setForm((prev) => ({ ...prev, branchIds, primaryBranchId })),
    submit,
    cancel: () => navigate("/identity/users"),
  };
};
