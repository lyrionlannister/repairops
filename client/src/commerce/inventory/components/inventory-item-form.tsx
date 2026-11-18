import type { FC } from "react";

import { Button } from "@ui/button/button";
import { Input } from "@ui/inputs/input";
import { Label } from "@ui/inputs/label";
import { Select } from "@ui/select/select";

import type { InventoryItemFormData, InventoryItemKind } from "../hooks/use-inventory";
import type { Supplier } from "@commerce/suppliers/hooks/use-suppliers";

const KIND_LABELS: Record<InventoryItemKind, string> = {
  accessory: "Accesorio",
  part: "Parte",
};

interface InventoryItemFormProps {
  form: InventoryItemFormData;
  loading: boolean;
  saving: boolean;
  isEdit: boolean;
  suppliers: Supplier[];
  onChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onKindChange: (kind: InventoryItemKind) => void;
  onSupplierChange: (supplierId: string) => void;
  onSubmit: (event: React.SubmitEvent<HTMLFormElement>) => void;
  onCancel: () => void;
}

export const InventoryItemForm: FC<InventoryItemFormProps> = ({
  form,
  loading,
  saving,
  isEdit,
  suppliers,
  onChange,
  onKindChange,
  onSupplierChange,
  onSubmit,
  onCancel,
}) => (
  <form
    onSubmit={onSubmit}
    className="space-y-4 rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/3"
  >
    <div>
      <Label className="text-gray-500">Nombre</Label>
      <Input name="name" placeholder="Pantalla A52" value={form.name} onChange={onChange} required disabled={loading} />
    </div>

    <div className="grid grid-cols-2 gap-3">
      <div>
        <Label className="text-gray-500">SKU</Label>
        <Input name="sku" placeholder="Opcional" value={form.sku} onChange={onChange} disabled={loading} />
      </div>
      <div>
        <Label className="text-gray-500">Tipo</Label>
        <Select
          value={form.kind}
          onChange={(value) => onKindChange(value as InventoryItemKind)}
          disabled={loading}
          options={Object.entries(KIND_LABELS).map(([value, label]) => ({ value, label }))}
        />
      </div>
    </div>

    <div className="grid grid-cols-3 gap-3">
      <div>
        <Label className="text-gray-500">Precio de costo</Label>
        <Input name="costPrice" type="number" placeholder="0.00" value={form.costPrice} onChange={onChange} required disabled={loading} />
      </div>
      <div>
        <Label className="text-gray-500">Precio de venta</Label>
        <Input name="salePrice" type="number" placeholder="0.00" value={form.salePrice} onChange={onChange} required disabled={loading} />
      </div>
      <div>
        <Label className="text-gray-500">Stock mínimo</Label>
        <Input name="minStock" type="number" placeholder="0" value={form.minStock} onChange={onChange} disabled={loading} />
      </div>
    </div>

    <div>
      <Label className="text-gray-500">Proveedor</Label>
      <Select
        value={form.supplierId}
        onChange={onSupplierChange}
        disabled={loading}
        placeholder="Sin proveedor (opcional)"
        options={suppliers.map((s) => ({ value: s.id, label: s.name }))}
      />
    </div>

    <div className="flex justify-end gap-2 pt-1">
      <Button type="button" variant="outline" onClick={onCancel}>
        Cancelar
      </Button>
      <Button type="submit" variant="primary" disabled={saving}>
        {saving ? "Guardando..." : isEdit ? "Guardar cambios" : "Crear producto"}
      </Button>
    </div>
  </form>
);
