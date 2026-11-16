import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router";
import { ArrowLeft } from "lucide-react";

import Alert from "@ui/alert/alert";
import Button from "@ui/button/button";
import Input from "@ui/inputs/input";
import Label from "@ui/inputs/label";
import PageMeta from "@common/pages/page-meta";

import { useCustomers } from "../hooks/use-customers";

interface CustomerFormState {
  name: string;
  phone: string;
  email: string;
  creditLimit: string;
}

const emptyForm: CustomerFormState = { name: "", phone: "", email: "", creditLimit: "0" };

const CustomerFormPage: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEdit = Boolean(id);

  const { customers, creditBalances, loading, saving, error, fetchAll, fetchCreditBalance, create, update } =
    useCustomers();
  const [form, setForm] = useState<CustomerFormState>(emptyForm);

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
      fetchCreditBalance(customer.id);
    }
  }, [isEdit, id, customers, fetchCreditBalance]);

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    const payload = { name: form.name, phone: form.phone, email: form.email || null, creditLimit: Number(form.creditLimit) || 0 };
    const ok = isEdit && id ? await update(id, payload) : Boolean(await create(payload));
    if (ok) navigate("/admin/customers");
  };

  return (
    <div className="space-y-6">
      <PageMeta
        title={isEdit ? "Editar cliente" : "Nuevo cliente"}
        description="Catálogo de clientes"
      />
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate("/admin/customers")}
          className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-700 dark:hover:bg-gray-800 dark:hover:text-white"
        >
          <ArrowLeft className="size-5" />
        </button>
        <div>
          <h1 className="text-2xl font-semibold text-brand-600 dark:text-brand-400">
            {isEdit ? "Editar cliente" : "Nuevo cliente"}
          </h1>
          <p className="mt-0.5 text-sm text-gray-500 dark:text-gray-400">
            {isEdit ? "Modifica los datos del cliente." : "Registra un nuevo cliente para el tenant."}
          </p>
        </div>
      </div>

      {error && <Alert variant="error" title="Error" message={error} />}

      <form
        onSubmit={handleSubmit}
        className="max-w-lg space-y-4 rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/3"
      >
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
          {isEdit && id && creditBalances[id] && (
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              Saldo actual: ${creditBalances[id].balance.toLocaleString("es-MX")} · Disponible: $
              {creditBalances[id].available.toLocaleString("es-MX")}
            </p>
          )}
        </div>

        <div className="flex justify-end gap-2 pt-1">
          <Button type="button" variant="outline" onClick={() => navigate("/admin/customers")} disabled={saving}>
            Cancelar
          </Button>
          <Button type="submit" variant="primary" disabled={saving}>
            {isEdit ? "Guardar cambios" : "Crear cliente"}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default CustomerFormPage;
