import type { FC } from "react";

import { Button } from "@ui/button/button";
import { Input } from "@ui/inputs/input";
import { Label } from "@ui/inputs/label";

import type { PriceListItemFormData } from "../hooks/use-price-list";
import type { Supplier } from "@commerce/suppliers/hooks/use-suppliers";

interface PriceListItemFormProps {
  form: PriceListItemFormData;
  loading: boolean;
  saving: boolean;
  isEdit: boolean;
  suppliers: Supplier[];
  hasPanel: boolean;
  onChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onSupplierChange: (supplierId: string) => void;
  onSubmit: (event: React.SubmitEvent<HTMLFormElement>) => void;
  onCancel: () => void;
}

export const PriceListItemForm: FC<PriceListItemFormProps> = ({
  form,
  loading,
  saving,
  isEdit,
  suppliers,
  hasPanel,
  onChange,
  onSupplierChange,
  onSubmit,
  onCancel,
}) => (
  <form
    onSubmit={onSubmit}
    className={[
      "space-y-4 rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/3",
      hasPanel ? "lg:col-span-2" : "max-w-lg",
    ].join(" ")}
  >
    <div className="grid grid-cols-2 gap-3">
      <div>
        <Label className="text-gray-500">Marca</Label>
        <Input
          name="brand"
          placeholder="Samsung"
          value={form.brand}
          onChange={onChange}
          required
          disabled={loading}
        />
      </div>
      <div>
        <Label className="text-gray-500">Modelo</Label>
        <Input
          name="model"
          placeholder="A32 5G"
          value={form.model}
          onChange={onChange}
          required
          disabled={loading}
        />
      </div>
    </div>

    <div>
      <Label className="text-gray-500">Proveedor</Label>
      <select
        name="supplierId"
        value={form.supplierId}
        onChange={(event) => onSupplierChange(event.target.value)}
        required
        disabled={loading}
        className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-800 focus:border-brand-300 focus:outline-none dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200"
      >
        <option value="" disabled>
          Seleccionar proveedor
        </option>
        {suppliers.map((supplier) => (
          <option key={supplier.id} value={supplier.id}>
            {supplier.name}
          </option>
        ))}
      </select>
    </div>

    <div>
      <Label className="text-gray-500">Precio</Label>
      <Input
        name="price"
        type="number"
        placeholder="200"
        value={form.price}
        onChange={onChange}
        required
        disabled={loading}
      />
    </div>

    <div className="flex justify-end gap-2 pt-1">
      <Button type="button" variant="outline" onClick={onCancel}>
        Cancelar
      </Button>
      <Button type="submit" variant="primary" disabled={saving}>
        {isEdit ? "Guardar cambios" : "Crear producto"}
      </Button>
    </div>
  </form>
);
