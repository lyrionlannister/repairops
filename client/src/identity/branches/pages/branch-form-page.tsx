import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router";
import { ArrowLeft } from "lucide-react";

import Alert from "@ui/alert/alert";
import Button from "@ui/button/button";
import Input from "@ui/inputs/input";
import Label from "@ui/inputs/label";
import PageMeta from "@common/pages/page-meta";
import useBranch from "@common/hooks/use-branch";

import { useBranches } from "../hooks/use-branches";

interface BranchFormState {
  name: string;
  address: string;
  phone: string;
}

const emptyForm: BranchFormState = { name: "", address: "", phone: "" };

const BranchFormPage: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEdit = Boolean(id);

  const { branches, loading, saving, error, fetchAll, create, update } = useBranches();
  const { refreshBranches } = useBranch();
  const [form, setForm] = useState<BranchFormState>(emptyForm);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  useEffect(() => {
    if (!isEdit || !id) return;
    const branch = branches.find((b) => b.id === id);
    if (branch) setForm({ name: branch.name, address: branch.address ?? "", phone: branch.phone ?? "" });
  }, [isEdit, id, branches]);

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    const ok = isEdit && id ? await update(id, form) : await create(form);
    if (ok) {
      await refreshBranches();
      navigate("/admin/branches");
    }
  };

  return (
    <div className="space-y-6">
      <PageMeta
        title={isEdit ? "Editar sucursal" : "Nueva sucursal"}
        description="Sucursales del tenant"
      />
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate("/admin/branches")}
          className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-700 dark:hover:bg-gray-800 dark:hover:text-white"
        >
          <ArrowLeft className="size-5" />
        </button>
        <div>
          <h1 className="text-2xl font-semibold text-brand-600 dark:text-brand-400">
            {isEdit ? "Editar sucursal" : "Nueva sucursal"}
          </h1>
          <p className="mt-0.5 text-sm text-gray-500 dark:text-gray-400">
            {isEdit ? "Modifica los datos de la sucursal." : "Registra una nueva sucursal para el tenant."}
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
          <Input name="name" value={form.name} onChange={handleChange} placeholder="Ej. Sucursal Centro" required disabled={loading} />
        </div>

        <div>
          <Label className="text-gray-500">Dirección</Label>
          <Input name="address" value={form.address} onChange={handleChange} placeholder="Calle y número" disabled={loading} />
        </div>

        <div>
          <Label className="text-gray-500">Teléfono</Label>
          <Input name="phone" value={form.phone} onChange={handleChange} placeholder="Ej. 833 123 4567" disabled={loading} />
        </div>

        <div className="flex justify-end gap-2 pt-1">
          <Button type="button" variant="outline" onClick={() => navigate("/admin/branches")}>
            Cancelar
          </Button>
          <Button type="submit" variant="primary" disabled={saving}>
            {isEdit ? "Guardar cambios" : "Crear sucursal"}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default BranchFormPage;
