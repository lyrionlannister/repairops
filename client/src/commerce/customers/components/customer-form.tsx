import type { FC } from "react";

import { Button } from "@ui/button/button";
import { Input } from "@ui/inputs/input";
import { Label } from "@ui/inputs/label";
import type { CustomerFormProps } from "../props/customer-form-props";

export const CustomerForm: FC<CustomerFormProps> = ({
  form,
  loading,
  saving,
  isEdit,
  hasPanel,
  onChange,
  onSubmit,
  onCancel,
}) => (
  <form
    onSubmit={onSubmit}
    className={[
      "space-y-4 rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/3",
      hasPanel ? "lg:col-span-2" : "mx-auto w-full max-w-xl",
    ].join(" ")}
  >
    <div>
      <Label className="text-gray-500">Nombre</Label>
      <Input
        name="name"
        value={form.name}
        onChange={onChange}
        placeholder="Ej. Juan Pérez"
        required
        disabled={loading}
      />
    </div>

    <div>
      <Label className="text-gray-500">Teléfono (opcional)</Label>
      <Input
        name="phone"
        value={form.phone}
        onChange={onChange}
        placeholder="Ej. 833 123 4567"
        disabled={loading}
      />
    </div>

    <div>
      <Label className="text-gray-500">Email (opcional)</Label>
      <Input
        name="email"
        type="email"
        value={form.email}
        onChange={onChange}
        placeholder="cliente@correo.com"
        disabled={loading}
      />
    </div>

    <div>
      <Label className="text-gray-500">Límite de crédito</Label>
      <Input
        name="creditLimit"
        type="number"
        value={form.creditLimit}
        onChange={onChange}
        disabled={loading}
      />
    </div>

    <div className="flex justify-end gap-2 pt-1">
      <Button type="button" variant="outline" onClick={onCancel} disabled={saving}>
        Cancelar
      </Button>
      <Button type="submit" variant="primary" disabled={saving}>
        {isEdit ? "Guardar cambios" : "Crear cliente"}
      </Button>
    </div>
  </form>
);
