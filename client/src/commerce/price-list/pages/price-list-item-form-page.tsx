import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router";

import { Button } from "@ui/button/button";
import { Input } from "@ui/inputs/input";
import { Label } from "@ui/inputs/label";
import { PageShell } from "@common/components/page-shell/page-shell";

import { usePriceList } from "../hooks/use-price-list";
import { useSuppliers } from "@commerce/suppliers/hooks/use-suppliers";

interface PriceListItemFormState {
  brand: string;
  model: string;
  price: string;
  supplierId: string;
}

const emptyForm: PriceListItemFormState = { brand: "", model: "", price: "", supplierId: "" };

export const PriceListItemFormPage: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEdit = Boolean(id);

  const { items, loading, saving, fetchAll, create, update } = usePriceList();
  const { suppliers, fetchAll: fetchSuppliers } = useSuppliers();
  const [form, setForm] = useState<PriceListItemFormState>(emptyForm);

  useEffect(() => {
    fetchAll();
    fetchSuppliers();
  }, [fetchAll, fetchSuppliers]);

  useEffect(() => {
    if (!isEdit || !id) return;
    const item = items.find((i) => i.id === id);
    if (item) {
      setForm({ brand: item.brand, model: item.model, price: String(item.price), supplierId: item.supplierId });
    }
  }, [isEdit, id, items]);

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    const payload = {
      brand: form.brand,
      model: form.model,
      price: Number.parseFloat(form.price),
      supplierId: form.supplierId,
    };
    const ok = isEdit && id ? await update(id, payload) : await create(payload);
    if (ok) navigate("/commerce/price-list");
  };

  return (
    <PageShell
      title={isEdit ? "Editar producto" : "Nuevo producto"}
      description={isEdit ? "Modifica los datos del producto." : "Agrega un nuevo producto a la lista de precios."}
    >
      <form
        onSubmit={handleSubmit}
        className="max-w-lg space-y-4 rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/3"
      >
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label className="text-gray-500">Marca</Label>
            <Input name="brand" placeholder="Samsung" value={form.brand} onChange={handleChange} required disabled={loading} />
          </div>
          <div>
            <Label className="text-gray-500">Modelo</Label>
            <Input name="model" placeholder="A32 5G" value={form.model} onChange={handleChange} required disabled={loading} />
          </div>
        </div>

        <div>
          <Label className="text-gray-500">Proveedor</Label>
          <select
            name="supplierId"
            value={form.supplierId}
            onChange={(event) => setForm((prev) => ({ ...prev, supplierId: event.target.value }))}
            required
            disabled={loading}
            className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-800 focus:border-brand-300 focus:outline-none dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200"
          >
            <option value="" disabled>Seleccionar proveedor</option>
            {suppliers.map((supplier) => (
              <option key={supplier.id} value={supplier.id}>{supplier.name}</option>
            ))}
          </select>
        </div>

        <div>
          <Label className="text-gray-500">Precio</Label>
          <Input name="price" type="number" placeholder="200" value={form.price} onChange={handleChange} required disabled={loading} />
        </div>

        <div className="flex justify-end gap-2 pt-1">
          <Button type="button" variant="outline" onClick={() => navigate("/commerce/price-list")}>
            Cancelar
          </Button>
          <Button type="submit" variant="primary" disabled={saving}>
            {isEdit ? "Guardar cambios" : "Crear producto"}
          </Button>
        </div>
      </form>
    </PageShell>
  );
};
