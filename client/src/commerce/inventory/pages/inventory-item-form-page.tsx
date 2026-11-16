import { useEffect, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router";

import Alert from "@ui/alert/alert";
import Button from "@ui/button/button";
import Input from "@ui/inputs/input";
import Label from "@ui/inputs/label";
import Select from "@ui/select/select";
import PageShell from "@common/components/page-shell/page-shell";
import useBranch from "@common/hooks/use-branch";

import { useInventory, type InventoryItemKind } from "../hooks/use-inventory";
import { useInventoryItemContext } from "../hooks/use-inventory-item-context";
import InventoryItemContextPanel from "../components/inventory-item-context-panel";
import { useSuppliers } from "@commerce/suppliers/hooks/use-suppliers";

interface InventoryPrefillState {
  prefillFromPriceList?: { name: string; costPrice: string; supplierId: string };
}

interface InventoryFormState {
  name: string;
  sku: string;
  kind: InventoryItemKind;
  costPrice: string;
  salePrice: string;
  minStock: string;
  supplierId: string;
}

const KIND_LABELS: Record<InventoryItemKind, string> = {
  accessory: "Accesorio",
  part: "Parte",
};

const emptyForm: InventoryFormState = {
  name: "",
  sku: "",
  kind: "accessory",
  costPrice: "",
  salePrice: "",
  minStock: "0",
  supplierId: "",
};

const InventoryItemFormPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { id } = useParams<{ id: string }>();
  const isEdit = Boolean(id);
  const { activeBranchId } = useBranch();

  const { items, loading, saving, error, fetchAll, create, update } = useInventory();
  const { suppliers, fetchAll: fetchSuppliers } = useSuppliers();
  const { movements, marginPercent } = useInventoryItemContext(isEdit ? id ?? null : null);

  const prefill = (location.state as InventoryPrefillState | null)?.prefillFromPriceList;
  const [form, setForm] = useState<InventoryFormState>(
    prefill ? { ...emptyForm, ...prefill } : emptyForm,
  );

  useEffect(() => {
    fetchAll();
    fetchSuppliers();
  }, [fetchAll, fetchSuppliers]);

  useEffect(() => {
    if (!isEdit || !id) return;
    const item = items.find((i) => i.id === id);
    if (item) {
      setForm({
        name: item.name,
        sku: item.sku ?? "",
        kind: item.kind,
        costPrice: String(item.costPrice),
        salePrice: String(item.salePrice),
        minStock: String(item.minStock),
        supplierId: item.supplierId ?? "",
      });
    }
  }, [isEdit, id, items]);

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!activeBranchId) return;

    const payload = {
      localId: activeBranchId,
      name: form.name,
      sku: form.sku || null,
      kind: form.kind,
      costPrice: Number.parseFloat(form.costPrice),
      salePrice: Number.parseFloat(form.salePrice),
      minStock: Number(form.minStock) || 0,
      supplierId: form.supplierId || null,
    };

    const ok = isEdit && id ? await update(id, payload) : await create(payload);
    if (ok) navigate("/admin/inventory");
  };

  const hasPanel = isEdit && Boolean(id);

  const formCard = (
    <form
      onSubmit={handleSubmit}
      className="space-y-4 rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/3"
    >
      <div>
        <Label className="text-gray-500">Nombre</Label>
        <Input name="name" placeholder="Pantalla A52" value={form.name} onChange={handleChange} required disabled={loading} />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label className="text-gray-500">SKU</Label>
          <Input name="sku" placeholder="Opcional" value={form.sku} onChange={handleChange} disabled={loading} />
        </div>
        <div>
          <Label className="text-gray-500">Tipo</Label>
          <Select
            value={form.kind}
            onChange={(value) => setForm((prev) => ({ ...prev, kind: value as InventoryItemKind }))}
            disabled={loading}
            options={Object.entries(KIND_LABELS).map(([value, label]) => ({ value, label }))}
          />
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div>
          <Label className="text-gray-500">Precio de costo</Label>
          <Input name="costPrice" type="number" placeholder="0.00" value={form.costPrice} onChange={handleChange} required disabled={loading} />
        </div>
        <div>
          <Label className="text-gray-500">Precio de venta</Label>
          <Input name="salePrice" type="number" placeholder="0.00" value={form.salePrice} onChange={handleChange} required disabled={loading} />
        </div>
        <div>
          <Label className="text-gray-500">Stock mínimo</Label>
          <Input name="minStock" type="number" placeholder="0" value={form.minStock} onChange={handleChange} disabled={loading} />
        </div>
      </div>

      <div>
        <Label className="text-gray-500">Proveedor</Label>
        <Select
          value={form.supplierId}
          onChange={(value) => setForm((prev) => ({ ...prev, supplierId: value }))}
          disabled={loading}
          placeholder="Sin proveedor (opcional)"
          options={suppliers.map((s) => ({ value: s.id, label: s.name }))}
        />
      </div>

      <div className="flex justify-end gap-2 pt-1">
        <Button type="button" variant="outline" onClick={() => navigate("/admin/inventory")}>
          Cancelar
        </Button>
        <Button type="submit" variant="primary" disabled={saving}>
          {saving ? "Guardando..." : isEdit ? "Guardar cambios" : "Crear item"}
        </Button>
      </div>
    </form>
  );

  return (
    <PageShell
      title={isEdit ? "Editar item" : "Nuevo item"}
      description={isEdit ? "Modifica los datos del item de inventario." : "Registra un nuevo item de inventario."}
    >
      {error && <Alert variant="error" title="Error" message={error} />}

      <div className={hasPanel ? "grid grid-cols-1 gap-6 lg:grid-cols-3" : "max-w-xl"}>
        <div className={hasPanel ? "lg:col-span-2" : undefined}>{formCard}</div>

        {hasPanel && (
          <div className="lg:col-span-1">
            <InventoryItemContextPanel movements={movements} marginPercent={marginPercent} />
          </div>
        )}
      </div>
    </PageShell>
  );
};

export default InventoryItemFormPage;
