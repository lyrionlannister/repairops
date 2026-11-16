import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router";

import Alert from "@ui/alert/alert";
import Button from "@ui/button/button";
import Input from "@ui/inputs/input";
import Label from "@ui/inputs/label";
import PageShell from "@common/components/page-shell/page-shell";

import { useSuppliers } from "../hooks/use-suppliers";
import { useSupplierContext } from "../hooks/use-supplier-context";
import SupplierContextPanel from "../components/supplier-context-panel";

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
  const context = useSupplierContext(isEdit ? id ?? null : null);

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
    <PageShell
      title={isEdit ? "Editar proveedor" : "Nuevo proveedor"}
      description={isEdit ? "Modifica los datos del proveedor." : "Registra un nuevo proveedor para el tenant."}
    >
      {error && <Alert variant="error" title="Error" message={error} />}

      <div className={isEdit ? "grid grid-cols-1 gap-6 lg:grid-cols-3" : "mx-auto w-full max-w-xl"}>
        <form
          onSubmit={handleSubmit}
          className={[
            "space-y-4 rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/3",
            isEdit ? "lg:col-span-2" : "",
          ].join(" ")}
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

        {isEdit && <SupplierContextPanel {...context} />}
      </div>
    </PageShell>
  );
};

export default SupplierFormPage;
