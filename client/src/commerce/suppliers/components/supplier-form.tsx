import type { FC } from "react";

import { Button } from "@ui/button/button";
import { Input } from "@ui/inputs/input";
import { Label } from "@ui/inputs/label";
import { Toggle } from "@ui/toggle/toggle";

import type { Supplier, SupplierFormData } from "../hooks/use-suppliers";

interface SupplierFormProps {
  form: SupplierFormData;
  loading: boolean;
  saving: boolean;
  isEdit: boolean;
  supplier?: Supplier;
  onChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onSubmit: (event: React.SubmitEvent<HTMLFormElement>) => void;
  onCancel: () => void;
  onToggleActive: () => void;
}

export const SupplierForm: FC<SupplierFormProps> = ({
  form,
  loading,
  saving,
  isEdit,
  supplier,
  onChange,
  onSubmit,
  onCancel,
  onToggleActive,
}) => (
  <form
    onSubmit={onSubmit}
    className={[
      "space-y-4 rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/3",
      isEdit ? "lg:col-span-2" : "",
    ].join(" ")}
  >
    <div className="grid gap-4 sm:grid-cols-2">
      <div>
        <Label className="text-gray-500">Nombre</Label>
        <Input
          name="name"
          value={form.name}
          onChange={onChange}
          placeholder="Ej. Tecnomax"
          required
          disabled={loading}
        />
      </div>

      <div>
        <Label className="text-gray-500">Teléfono</Label>
        <Input
          name="phone"
          value={form.phone}
          onChange={onChange}
          placeholder="Ej. 3195083168"
          disabled={loading}
        />
      </div>

      <div>
        <Label className="text-gray-500">Email</Label>
        <Input
          type="email"
          name="email"
          value={form.email}
          onChange={onChange}
          placeholder="Ej. contacto@tecnomax.com"
          disabled={loading}
        />
      </div>

      <div>
        <Label className="text-gray-500">Nombre de contacto</Label>
        <Input
          name="contactName"
          value={form.contactName}
          onChange={onChange}
          placeholder="Ej. Juan Pérez"
          disabled={loading}
        />
      </div>

      <div className="sm:col-span-2">
        <Label className="text-gray-500">Dirección</Label>
        <Input
          name="address"
          value={form.address}
          onChange={onChange}
          placeholder="Calle y número"
          disabled={loading}
        />
      </div>
    </div>

    {isEdit && supplier && (
      <div className="flex items-center justify-between rounded-xl border border-gray-200 p-3 dark:border-gray-700">
        <div>
          <Label className="text-gray-500">Activo</Label>
          <p className="text-xs text-gray-400">
            Un proveedor inactivo no aparece para elegir en productos nuevos.
          </p>
        </div>
        <Toggle checked={supplier.isActive} onChange={onToggleActive} disabled={saving} />
      </div>
    )}

    <div className="flex justify-end gap-2 pt-1">
      <Button type="button" variant="outline" onClick={onCancel}>
        Cancelar
      </Button>
      <Button type="submit" variant="primary" disabled={saving}>
        {isEdit ? "Guardar cambios" : "Crear proveedor"}
      </Button>
    </div>
  </form>
);
