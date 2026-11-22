import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router";

import { PageShell } from "@common/components/page-shell/page-shell";

import { useCustomers } from "../hooks/use-customers";
import { useCustomerContext } from "../hooks/use-customer-context";
import { CustomerContextPanel } from "../components/customer-context-panel";
import { CustomerForm } from "../components/customer-form";
import type { CustomerFormData } from "../types/customers";

const emptyForm: CustomerFormData = { name: "", phone: "", email: "", creditLimit: "0" };

export const CustomerFormPage: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEdit = Boolean(id);

  const { customers, loading, saving, fetchAll, create, update } = useCustomers();
  const [form, setForm] = useState<CustomerFormData>(emptyForm);
  const context = useCustomerContext(isEdit ? (id ?? null) : null);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  useEffect(() => {
    if (!isEdit || !id) return;
    const customer = customers.find((c) => c.id === id);
    if (customer) {
      setForm({
        name: customer.name,
        phone: customer.phone,
        email: customer.email ?? "",
        creditLimit: String(customer.creditLimit),
      });
    }
  }, [isEdit, id, customers]);

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
      creditLimit: Number(form.creditLimit) || 0,
    };
    const ok = isEdit && id ? await update(id, payload) : Boolean(await create(payload));
    if (ok) navigate("/commerce/customers");
  };

  const hasPanel = isEdit && Boolean(id);

  return (
    <PageShell
      title={isEdit ? "Editar cliente" : "Nuevo cliente"}
      description={isEdit ? "Modifica los datos del cliente." : "Registra un nuevo cliente."}
    >
      {hasPanel ? (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <CustomerForm
            form={form}
            loading={loading}
            saving={saving}
            isEdit={isEdit}
            hasPanel
            onChange={handleChange}
            onSubmit={handleSubmit}
            onCancel={() => navigate("/commerce/customers")}
          />
          <CustomerContextPanel {...context} />
        </div>
      ) : (
        <CustomerForm
          form={form}
          loading={loading}
          saving={saving}
          isEdit={isEdit}
          hasPanel={false}
          onChange={handleChange}
          onSubmit={handleSubmit}
          onCancel={() => navigate("/commerce/customers")}
        />
      )}
    </PageShell>
  );
};
