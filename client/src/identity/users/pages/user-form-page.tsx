import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router";

import { PageShell } from "@common/components/page-shell/page-shell";

import { useUsers, type UserFormData } from "../hooks/use-users";
import { useEmployeeContext } from "../hooks/use-employee-context";
import { EmployeeContextPanel } from "../components/employee-context-panel";
import { UserForm } from "../components/user-form";
import { userToForm } from "../utils/user-to-form";
import { useBranch } from "@common/hooks/use-branch";

const INITIAL_FORM: UserFormData = {
  firstName: "",
  lastName: "",
  email: "",
  password: "",
  role: "employee",
  salaryAmount: "",
  payCycle: "",
  branchIds: [],
  primaryBranchId: "",
};

export const UserFormPage: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEdit = Boolean(id);

  const { users, loading, fetchUsers, createUser, creating, updateUser, updating } = useUsers();
  const { branches, workingBranchId } = useBranch();
  const context = useEmployeeContext(isEdit ? (id ?? null) : null);
  const [form, setForm] = useState<UserFormData>(INITIAL_FORM);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  useEffect(() => {
    if (!isEdit || !id) return;
    const user = users.find((u) => u.id === id);
    if (user) setForm(userToForm(user));
  }, [isEdit, id, users]);

  // Usuario nuevo: arranca en la sucursal en la que está trabajando el owner.
  useEffect(() => {
    if (isEdit || !workingBranchId) return;
    setForm((prev) =>
      prev.branchIds.length > 0
        ? prev
        : { ...prev, branchIds: [workingBranchId], primaryBranchId: workingBranchId },
    );
  }, [isEdit, workingBranchId]);

  const updateField = (field: Exclude<keyof UserFormData, "branchIds">, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const saving = creating || updating;
  const disabled = loading || saving;

  const handleSubmit = async (event: React.SubmitEvent<HTMLFormElement>) => {
    event.preventDefault();
    const ok = isEdit && id ? await updateUser(id, form) : await createUser(form);
    if (ok) navigate("/identity/users");
  };

  const formEl = (
    <UserForm
      form={form}
      isEdit={isEdit}
      disabled={disabled}
      saving={saving}
      branches={branches}
      showPassword={showPassword}
      onTogglePassword={() => setShowPassword((prev) => !prev)}
      onChange={updateField}
      onBranchAssignmentChange={(branchIds, primaryBranchId) =>
        setForm((prev) => ({ ...prev, branchIds, primaryBranchId }))
      }
      onSubmit={handleSubmit}
      onCancel={() => navigate("/identity/users")}
    />
  );

  return (
    <PageShell
      title={isEdit ? "Editar usuario" : "Nuevo usuario"}
      description={isEdit ? "Modifica los datos del usuario." : "Crea un usuario para tu equipo."}
    >
      {isEdit && id ? (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2">{formEl}</div>
          <div className="lg:col-span-1">
            <EmployeeContextPanel {...context} />
          </div>
        </div>
      ) : (
        <div className="max-w-xl">{formEl}</div>
      )}
    </PageShell>
  );
};
