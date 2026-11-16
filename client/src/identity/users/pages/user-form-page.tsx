import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router";
import { ArrowLeft } from "lucide-react";

import Alert from "@ui/alert/alert";
import Button from "@ui/button/button";
import Input from "@ui/inputs/input";
import Label from "@ui/inputs/label";
import Select from "@ui/select/select";
import PageMeta from "@common/pages/page-meta";
import { EyeIcon, EyeCloseIcon } from "@common/icons";

import { useUsers, ROLE_LABELS, PAY_CYCLE_LABELS, type PayCycle, type UserRole } from "../hooks/use-users";

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

const UserFormPage: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEdit = Boolean(id);

  const {
    users, loading, fetchUsers,
    createUser, creating, createError,
    updateUser, updating, updateError,
  } = useUsers();
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
  const error = createError || updateError;

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

    if (ok) navigate("/admin/users");
  };

  return (
    <div className="space-y-6">
      <PageMeta
        title={isEdit ? "Editar usuario" : "Nuevo usuario"}
        description="Usuarios del sistema"
      />
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate("/admin/users")}
          className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-700 dark:hover:bg-gray-800 dark:hover:text-white"
        >
          <ArrowLeft className="size-5" />
        </button>
        <div>
          <h1 className="text-2xl font-semibold text-brand-600 dark:text-brand-400">
            {isEdit ? "Editar usuario" : "Nuevo usuario"}
          </h1>
          <p className="mt-0.5 text-sm text-gray-500 dark:text-gray-400">
            {isEdit ? "Modifica los datos del usuario." : "Crea un usuario para el tenant actual."}
          </p>
        </div>
      </div>

      {error && <Alert variant="error" title="Error" message={error} />}

      <form
        onSubmit={handleSubmit}
        className="max-w-lg space-y-4 rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/3"
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
          <Button type="button" variant="outline" onClick={() => navigate("/admin/users")}>
            Cancelar
          </Button>
          <Button type="submit" variant="primary" disabled={saving}>
            {saving ? "Guardando..." : isEdit ? "Guardar cambios" : "Crear usuario"}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default UserFormPage;
