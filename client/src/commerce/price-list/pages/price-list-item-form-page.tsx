import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router";

import { PageShell } from "@common/components/page-shell/page-shell";

import { usePriceList } from "../hooks/use-price-list";
import { useSupplierPriceItems } from "../hooks/use-supplier-price-items";
import { useSuppliers } from "@commerce/suppliers/hooks/use-suppliers";
import { PriceListSupplierPanel } from "../components/price-list-supplier-panel";
import { PriceListItemForm } from "../components/price-list-item-form";
import type { PriceListItemFormData } from "../types/price-list";

const emptyForm: PriceListItemFormData = { brand: "", model: "", price: "", supplierId: "" };

export const PriceListItemFormPage: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEdit = Boolean(id);

  const { loading, saving, fetchById, create, update } = usePriceList();
  const { suppliers, fetchAll: fetchSuppliers } = useSuppliers();
  const [form, setForm] = useState<PriceListItemFormData>(emptyForm);

  useEffect(() => {
    fetchSuppliers();
  }, [fetchSuppliers]);

  useEffect(() => {
    if (!isEdit || !id) return;
    fetchById(id).then((item) => {
      if (!item) return;
      setForm({
        brand: item.brand,
        model: item.model,
        price: String(item.price),
        supplierId: item.supplierId,
      });
    });
  }, [isEdit, id, fetchById]);

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (event: React.SubmitEvent<HTMLFormElement>) => {
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

  const selectedSupplier = suppliers.find((s) => s.id === form.supplierId);
  const { otherItems, otherCount } = useSupplierPriceItems(form.supplierId, id);

  return (
    <PageShell
      title={isEdit ? "Editar producto" : "Nuevo producto"}
      description={
        isEdit
          ? "Modifica los datos del producto."
          : "Agrega un nuevo producto a la lista de precios."
      }
    >
      <div className={selectedSupplier ? "grid grid-cols-1 gap-6 lg:grid-cols-3" : undefined}>
        <PriceListItemForm
          form={form}
          loading={loading}
          saving={saving}
          isEdit={isEdit}
          suppliers={suppliers}
          hasPanel={Boolean(selectedSupplier)}
          onChange={handleChange}
          onSupplierChange={(supplierId) => setForm((prev) => ({ ...prev, supplierId }))}
          onSubmit={handleSubmit}
          onCancel={() => navigate("/commerce/price-list")}
        />

        {selectedSupplier && (
          <PriceListSupplierPanel supplierName={selectedSupplier.name} otherItems={otherItems} otherCount={otherCount} />
        )}
      </div>
    </PageShell>
  );
};
