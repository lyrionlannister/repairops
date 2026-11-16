import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router";
import { ArrowLeft } from "lucide-react";

import Alert from "@ui/alert/alert";
import Button from "@ui/button/button";
import Input from "@ui/inputs/input";
import Label from "@ui/inputs/label";
import PageMeta from "@common/pages/page-meta";

import { useSuppliers } from "../hooks/use-suppliers";

interface SupplierFormState {
  name: string;
  phone: string;
}

const emptyForm: SupplierFormState = { name: "", phone: "" };

const SupplierFormPage: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEdit = Boolean(id);

  const { suppliers, loading, saving, error, fetchAll, create, update } = useSuppliers();
  const [form, setForm] = useState<SupplierFormState>(emptyForm);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  useEffect(() => {
    if (!isEdit || !id) return;
    const supplier = suppliers.find((s) => s.id === id);
    if (supplier) setForm({ name: supplier.name, phone: supplier.phone ?? "" });
  }, [isEdit, id, suppliers]);

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    const ok = isEdit && id
      ? await update(id, { name: form.name, phone: form.phone })
      : await create({ name: form.name, phone: form.phone });
    if (ok) navigate("/admin/suppliers");
  };

  return (
    <div className="space-y-6">
      <PageMeta
        title={isEdit ? "Editar proveedor" : "Nuevo proveedor"}
        description="Catálogo de proveedores"
      />
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate("/admin/suppliers")}
          className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-700 dark:hover:bg-gray-800 dark:hover:text-white"
        >
          <ArrowLeft className="size-5" />
        </button>
        <div>
          <h1 className="text-2xl font-semibold text-brand-600 dark:text-brand-400">
            {isEdit ? "Editar proveedor" : "Nuevo proveedor"}
          </h1>
          <p className="mt-0.5 text-sm text-gray-500 dark:text-gray-400">
            {isEdit ? "Modifica los datos del proveedor." : "Registra un nuevo proveedor para el tenant."}
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
          <Input name="name" value={form.name} onChange={handleChange} placeholder="Ej. Tecnomax" required disabled={loading} />
        </div>

        <div>
          <Label className="text-gray-500">Teléfono</Label>
          <Input name="phone" value={form.phone} onChange={handleChange} placeholder="Ej. 3195083168" disabled={loading} />
        </div>

        <div className="flex justify-end gap-2 pt-1">
          <Button type="button" variant="outline" onClick={() => navigate("/admin/suppliers")}>
            Cancelar
          </Button>
          <Button type="submit" variant="primary" disabled={saving}>
            {isEdit ? "Guardar cambios" : "Crear proveedor"}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default SupplierFormPage;
