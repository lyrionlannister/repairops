import { Input } from "@ui/inputs/input";
import { Label } from "@ui/inputs/label";
import { EyeIcon, EyeCloseIcon } from "@common/icons";

import type { UserAccountSectionProps } from "../props/user-account-section-props";

export const UserAccountSection: React.FC<UserAccountSectionProps> = ({
  form,
  isEdit,
  disabled,
  showPassword,
  onTogglePassword,
  onChange,
}) => (
  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
    <div>
      <Label className="text-gray-500">
        Nombre <span className="text-error-500">*</span>
      </Label>
      <Input
        name="firstName"
        placeholder="Ej. Ana"
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
        placeholder="Ej. López"
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
        placeholder="ana@taller.com"
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
        <button
          type="button"
          onClick={onTogglePassword}
          aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
          className="absolute top-1/2 right-1 z-30 flex size-10 -translate-y-1/2 items-center justify-center rounded-lg"
        >
          {showPassword ? (
            <EyeIcon className="size-5 fill-gray-500 dark:fill-gray-400" />
          ) : (
            <EyeCloseIcon className="size-5 fill-gray-500 dark:fill-gray-400" />
          )}
        </button>
      </div>
    </div>
  </div>
);
