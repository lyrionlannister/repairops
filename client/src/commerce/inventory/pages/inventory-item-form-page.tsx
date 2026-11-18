import { useEffect, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router";

import { PageShell } from "@common/components/page-shell/page-shell";
import { useBranch } from "@common/hooks/use-branch";

import { useInventory, type InventoryItemFormData } from "../hooks/use-inventory";
import { useInventoryItemContext } from "../hooks/use-inventory-item-context";
import { InventoryItemContextPanel } from "../components/inventory-item-context-panel";
import { InventoryItemForm } from "../components/inventory-item-form";
import { useSuppliers } from "@commerce/suppliers/hooks/use-suppliers";

interface InventoryPrefillState {
  prefillFromPriceList?: { name: string; costPrice: string; supplierId: string };
}

const emptyForm: InventoryItemFormData = {
  name: "",
  sku: "",
  kind: "accessory",
  costPrice: "",
  salePrice: "",
  minStock: "0",
  supplierId: "",
};

export const InventoryItemFormPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { id } = useParams<{ id: string }>();
  const isEdit = Boolean(id);
  const { workingBranchId } = useBranch();

  const { items, loading, saving, fetchAll, create, update } = useInventory();
  const { suppliers, fetchAll: fetchSuppliers } = useSuppliers();
  const { movements, marginPercent } = useInventoryItemContext(isEdit ? id ?? null : null);

  const prefill = (location.state as InventoryPrefillState | null)?.prefillFromPriceList;
  const [form, setForm] = useState<InventoryItemFormData>(
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

  const handleSubmit = async (event: React.SubmitEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!workingBranchId) return;

    const payload = {
      localId: workingBranchId,
      name: form.name,
      sku: form.sku || null,
      kind: form.kind,
      costPrice: Number.parseFloat(form.costPrice),
      salePrice: Number.parseFloat(form.salePrice),
      minStock: Number(form.minStock) || 0,
      supplierId: form.supplierId || null,
    };

    const ok = isEdit && id ? await update(id, payload) : await create(payload);
    if (ok) navigate("/commerce/inventory");
  };

  const hasPanel = isEdit && Boolean(id);

  const formCard = (
    <InventoryItemForm
      form={form}
      loading={loading}
      saving={saving}
      isEdit={isEdit}
      suppliers={suppliers}
      onChange={handleChange}
      onKindChange={(kind) => setForm((prev) => ({ ...prev, kind }))}
      onSupplierChange={(supplierId) => setForm((prev) => ({ ...prev, supplierId }))}
      onSubmit={handleSubmit}
      onCancel={() => navigate("/commerce/inventory")}
    />
  );

  return (
    <PageShell
      title={isEdit ? "Editar producto" : "Nuevo producto"}
      description={isEdit ? "Modifica los datos del producto." : "Registra un nuevo producto en el inventario."}
    >

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

