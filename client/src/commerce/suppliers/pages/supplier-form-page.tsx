import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router";

import { PageShell } from "@common/components/page-shell/page-shell";

import { useSuppliers, type SupplierFormData } from "../hooks/use-suppliers";
import { useSupplierContext } from "../hooks/use-supplier-context";
import { SupplierContextPanel } from "../components/supplier-context-panel";
import { SupplierForm } from "../components/supplier-form";

const emptyForm: SupplierFormData = { name: "", phone: "", email: "", address: "", contactName: "" };

export const SupplierFormPage: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEdit = Boolean(id);

  const { suppliers, loading, saving, fetchAll, create, update, setActive } = useSuppliers();
  const [form, setForm] = useState<SupplierFormData>(emptyForm);
  const context = useSupplierContext(isEdit ? id ?? null : null);

  const supplier = isEdit && id ? suppliers.find((s) => s.id === id) : undefined;

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  useEffect(() => {
    if (!isEdit || !id) return;
    const found = suppliers.find((s) => s.id === id);
    if (found) {
      setForm({
        name: found.name,
        phone: found.phone ?? "",
        email: found.email ?? "",
        address: found.address ?? "",
        contactName: found.contactName ?? "",
      });
    }
  }, [isEdit, id, suppliers]);

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (event: React.SubmitEvent<HTMLFormElement>) => {
    event.preventDefault();
    const payload = {
      name: form.name,
      phone: form.phone,
      email: form.email || null,
      address: form.address || null,
      contactName: form.contactName || null,
    };
    const ok = isEdit && id ? await update(id, payload) : await create(payload);
    if (ok) navigate("/commerce/suppliers");
  };

  return (
    <PageShell
      title={isEdit ? "Editar proveedor" : "Nuevo proveedor"}
      description={isEdit ? "Modifica los datos del proveedor." : "Registra un nuevo proveedor."}
    >

      <div className={isEdit ? "grid grid-cols-1 gap-6 lg:grid-cols-3" : "mx-auto w-full max-w-xl"}>
        <SupplierForm
          form={form}
          loading={loading}
          saving={saving}
          isEdit={isEdit}
          supplier={supplier}
          onChange={handleChange}
          onSubmit={handleSubmit}
          onCancel={() => navigate("/commerce/suppliers")}
          onToggleActive={() => supplier && setActive(supplier.id, !supplier.isActive)}
        />

        {isEdit && <SupplierContextPanel {...context} />}
      </div>
    </PageShell>
  );
};

