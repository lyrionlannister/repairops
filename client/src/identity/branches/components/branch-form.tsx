import type { FC } from "react";

import { Button } from "@ui/button/button";
import { Input } from "@ui/inputs/input";
import { Label } from "@ui/inputs/label";

import type { BranchFormData } from "../hooks/use-branches";

interface BranchFormProps {
  form: BranchFormData;
  loading: boolean;
  saving: boolean;
  isEdit: boolean;
  onChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onSubmit: (event: React.SubmitEvent<HTMLFormElement>) => void;
  onCancel: () => void;
}

export const BranchForm: FC<BranchFormProps> = ({
  form,
  loading,
  saving,
  isEdit,
  onChange,
  onSubmit,
  onCancel,
}) => (
  <form
    onSubmit={onSubmit}
    className="space-y-4 rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/3"
  >
    <div>
      <Label className="text-gray-500">Nombre</Label>
      <Input
        name="name"
        value={form.name}
        onChange={onChange}
        placeholder="Ej. Sucursal Centro"
        required
        disabled={loading}
      />
    </div>

    <div>
      <Label className="text-gray-500">Dirección</Label>
      <Input
        name="address"
        value={form.address}
        onChange={onChange}
        placeholder="Calle y número"
        disabled={loading}
      />
    </div>

    <div>
      <Label className="text-gray-500">Teléfono</Label>
      <Input
        name="phone"
        value={form.phone}
        onChange={onChange}
        placeholder="Ej. 833 123 4567"
        disabled={loading}
      />
    </div>

    <div className="flex justify-end gap-2 pt-1">
      <Button type="button" variant="outline" onClick={onCancel}>
        Cancelar
      </Button>
      <Button type="submit" variant="primary" disabled={saving}>
        {isEdit ? "Guardar cambios" : "Crear sucursal"}
      </Button>
    </div>
  </form>
);
