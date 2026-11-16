import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router";

import { Button } from "@ui/button/button";
import { Input } from "@ui/inputs/input";
import { Label } from "@ui/inputs/label";
import { Select } from "@ui/select/select";
import { PageShell } from "@common/components/page-shell/page-shell";
import { EyeIcon, EyeCloseIcon } from "@common/icons";

import { useUsers, ROLE_LABELS, PAY_CYCLE_LABELS, type PayCycle, type UserRole } from "../hooks/use-users";
import { useEmployeeContext } from "../hooks/use-employee-context";
import { EmployeeContextPanel } from "../components/employee-context-panel";

interface UserFormState {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  role: UserRole;
  salaryAmount: string;
  payCycle: PayCycle | "";
}

const emptyForm: UserFormState = {
  firstName: "",
  lastName: "",
  email: "",
  password: "",
  role: "employee",
  salaryAmount: "",
  payCycle: "",
};

export const UserFormPage: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEdit = Boolean(id);

  const {
    users, loading, fetchUsers,
    createUser, creating,
    updateUser, updating,
  } = useUsers();
  const context = useEmployeeContext(isEdit ? id ?? null : null);
  const [form, setForm] = useState<UserFormState>(emptyForm);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  useEffect(() => {
    if (!isEdit || !id) return;
    const user = users.find((u) => u.id === id);
    if (user) {
      setForm({
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        password: "",
        role: user.role,
        salaryAmount: user.salaryAmount != null ? String(user.salaryAmount) : "",
        payCycle: user.payCycle ?? "",
      });
    }
  }, [isEdit, id, users]);

  const updateField = (field: keyof UserFormState, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const saving = creating || updating;

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    const base = {
      firstName: form.firstName,
      lastName: form.lastName,
      email: form.email,
      role: form.role,
      salaryAmount: form.salaryAmount ? Number(form.salaryAmount) : undefined,
      payCycle: form.payCycle || undefined,
    };

    const ok = isEdit && id
      // password vacío en edición = no cambiar la contraseña actual.
      ? await updateUser(id, { ...base, ...(form.password ? { password: form.password } : {}) })
      : await createUser({ ...base, password: form.password });

    if (ok) navigate("/app/users");
  };

  const formEl = (
    <form
      onSubmit={handleSubmit}
      className="space-y-4 rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/3"
    >
      <div>
        <Label className="text-gray-500">
          Nombre <span className="text-error-500">*</span>
        </Label>
        <Input
          name="firstName"
          value={form.firstName}
          onChange={(e) => updateField("firstName", e.target.value)}
          disabled={loading || saving}
          required
        />
      </div>

      <div>
        <Label className="text-gray-500">
          Apellido <span className="text-error-500">*</span>
        </Label>
        <Input
          name="lastName"
          value={form.lastName}
          onChange={(e) => updateField("lastName", e.target.value)}
          disabled={loading || saving}
          required
        />
      </div>

      <div>
        <Label className="text-gray-500">
          Email <span className="text-error-500">*</span>
        </Label>
        <Input
          type="email"
          name="email"
          value={form.email}
          onChange={(e) => updateField("email", e.target.value)}
          disabled={loading || saving}
          required
        />
      </div>

      <div>
        <Label className="text-gray-500">
          Contraseña {!isEdit && <span className="text-error-500">*</span>}
        </Label>
        <div className="relative">
          <Input
            type={showPassword ? "text" : "password"}
            placeholder={isEdit ? "Dejar vacío para no cambiarla" : "Mínimo 8 caracteres"}
            name="password"
            value={form.password}
            onChange={(e) => updateField("password", e.target.value)}
            disabled={loading || saving}
            required={!isEdit}
          />
          <span
            onClick={() => setShowPassword(!showPassword)}
            className="absolute z-30 -translate-y-1/2 cursor-pointer right-4 top-1/2"
          >
            {showPassword ? (
              <EyeIcon className="fill-gray-500 dark:fill-gray-400 size-5" />
            ) : (
              <EyeCloseIcon className="fill-gray-500 dark:fill-gray-400 size-5" />
            )}
          </span>
        </div>
      </div>

      <div>
        <Label className="text-gray-500">Rol</Label>
        <Select
          value={form.role}
          onChange={(value) => updateField("role", value)}
          disabled={loading || saving}
          options={Object.entries(ROLE_LABELS).map(([value, label]) => ({ value, label }))}
        />
      </div>

      <div>
        <Label className="text-gray-500">Salario</Label>
        <Input
          type="number"
          placeholder="Ej. 4500"
          name="salaryAmount"
          value={form.salaryAmount}
          onChange={(e) => updateField("salaryAmount", e.target.value)}
          disabled={loading || saving}
        />
      </div>

      <div>
        <Label className="text-gray-500">Ciclo de pago</Label>
        <Select
          value={form.payCycle}
          onChange={(value) => updateField("payCycle", value)}
          disabled={loading || saving}
          placeholder="Sin ciclo de pago"
          options={Object.entries(PAY_CYCLE_LABELS).map(([value, label]) => ({ value, label }))}
        />
      </div>

      <div className="flex justify-end gap-2 pt-1">
        <Button type="button" variant="outline" onClick={() => navigate("/app/users")}>
          Cancelar
        </Button>
        <Button type="submit" variant="primary" disabled={saving}>
          {saving ? "Guardando..." : isEdit ? "Guardar cambios" : "Crear usuario"}
        </Button>
      </div>
    </form>
  );

  return (
    <PageShell
      title={isEdit ? "Editar usuario" : "Nuevo usuario"}
      description={isEdit ? "Modifica los datos del usuario." : "Crea un usuario para el tenant actual."}
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

