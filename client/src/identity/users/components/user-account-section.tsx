import { Input } from "@ui/inputs/input";
import { Label } from "@ui/inputs/label";
import { Select } from "@ui/select/select";
import { RoleCheckboxes } from "./role-checkboxes";
import { EyeIcon, EyeCloseIcon } from "@common/icons";

import { PAY_CYCLE_LABELS } from "../hooks/use-users";
import type { UserAccountSectionProps } from "../props/user-account-section-props";

export const UserAccountSection: React.FC<UserAccountSectionProps> = ({
  form,
  isEdit,
  disabled,
  showPassword,
  onTogglePassword,
  onChange,
  onRolesChange,
}) => (
  <div className="grid gap-4 sm:grid-cols-2">
    <div>
      <Label className="text-gray-500">
        Nombre <span className="text-error-500">*</span>
      </Label>
      <Input
        name="firstName"
        value={form.firstName}
        onChange={(e) => onChange("firstName", e.target.value)}
        disabled={disabled}
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
        onChange={(e) => onChange("lastName", e.target.value)}
        disabled={disabled}
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
        onChange={(e) => onChange("email", e.target.value)}
        disabled={disabled}
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
          onChange={(e) => onChange("password", e.target.value)}
          disabled={disabled}
          required={!isEdit}
        />
        <span
          onClick={onTogglePassword}
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

    <RoleCheckboxes roles={form.roles} disabled={disabled} onChange={onRolesChange} />

    <div>
      <Label className="text-gray-500">Ciclo de pago</Label>
      <Select
        value={form.payCycle}
        onChange={(value) => onChange("payCycle", value)}
        disabled={disabled}
        placeholder="Sin ciclo de pago"
        options={Object.entries(PAY_CYCLE_LABELS).map(([value, label]) => ({ value, label }))}
      />
    </div>

    <div>
      <Label className="text-gray-500">Salario</Label>
      <Input
        type="number"
        placeholder="Ej. 4500"
        name="salaryAmount"
        value={form.salaryAmount}
        onChange={(e) => onChange("salaryAmount", e.target.value)}
        disabled={disabled}
      />
    </div>
  </div>
);
