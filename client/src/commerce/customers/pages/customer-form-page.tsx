import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router";

import { Alert } from "@ui/alert/alert";
import { Button } from "@ui/button/button";
import { Input } from "@ui/inputs/input";
import { Label } from "@ui/inputs/label";
import { PageShell } from "@common/components/page-shell/page-shell";

import { useCustomers } from "../hooks/use-customers";
import { useCustomerContext } from "../hooks/use-customer-context";
import { CustomerContextPanel } from "../components/customer-context-panel";

interface CustomerFormState {
  name: string;
  phone: string;
  email: string;
  creditLimit: string;
}

const emptyForm: CustomerFormState = { name: "", phone: "", email: "", creditLimit: "0" };

export const CustomerFormPage: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEdit = Boolean(id);

  const { customers, loading, saving, error, fetchAll, create, update } = useCustomers();
  const [form, setForm] = useState<CustomerFormState>(emptyForm);
  const context = useCustomerContext(isEdit ? id ?? null : null);

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

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    const payload = { name: form.name, phone: form.phone, email: form.email || null, creditLimit: Number(form.creditLimit) || 0 };
    const ok = isEdit && id ? await update(id, payload) : Boolean(await create(payload));
    if (ok) navigate("/app/customers");
  };

  const formFields = (
    <>
      <div>
        <Label className="text-gray-500">Nombre</Label>
        <Input name="name" value={form.name} onChange={handleChange} placeholder="Ej. Juan Pérez" required disabled={loading} />
      </div>

      <div>
        <Label className="text-gray-500">Teléfono</Label>
        <Input name="phone" value={form.phone} onChange={handleChange} placeholder="Ej. 833 123 4567" required disabled={loading} />
      </div>

      <div>
        <Label className="text-gray-500">Email (opcional)</Label>
        <Input name="email" type="email" value={form.email} onChange={handleChange} placeholder="cliente@correo.com" disabled={loading} />
      </div>

      <div>
        <Label className="text-gray-500">Límite de crédito</Label>
        <Input name="creditLimit" type="number" value={form.creditLimit} onChange={handleChange} disabled={loading} />
      </div>

      <div className="flex justify-end gap-2 pt-1">
        <Button type="button" variant="outline" onClick={() => navigate("/app/customers")} disabled={saving}>
          Cancelar
        </Button>
        <Button type="submit" variant="primary" disabled={saving}>
          {isEdit ? "Guardar cambios" : "Crear cliente"}
        </Button>
      </div>
    </>
  );

  let content: React.ReactNode;
  if (isEdit && id) {
    content = (
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <form onSubmit={handleSubmit} className="lg:col-span-2 space-y-4 rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/3">
          {formFields}
        </form>
        <CustomerContextPanel {...context} />
      </div>
    );
  } else {
    content = (
      <form onSubmit={handleSubmit} className="mx-auto w-full max-w-xl space-y-4 rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/3">
        {formFields}
      </form>
    );
  }

  return (
    <PageShell
      title={isEdit ? "Editar cliente" : "Nuevo cliente"}
      description={isEdit ? "Modifica los datos del cliente." : "Registra un nuevo cliente para el tenant."}
    >
      {error && <Alert variant="error" title="Error" message={error} />}
      {content}
    </PageShell>
  );
};

