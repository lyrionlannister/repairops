import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router";

import Alert from "@ui/alert/alert";
import Button from "@ui/button/button";
import Input from "@ui/inputs/input";
import Label from "@ui/inputs/label";
import PageShell from "@common/components/page-shell/page-shell";
import useBranch from "@common/hooks/use-branch";

import { useBranches } from "../hooks/use-branches";
import { useBranchContext } from "../hooks/use-branch-context";
import BranchContextPanel from "../components/branch-context-panel";

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
  const context = useBranchContext(isEdit ? id ?? null : null);

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

  const formCard = (
    <form
      onSubmit={handleSubmit}
      className="space-y-4 rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/3"
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
  );

  return (
    <PageShell
      title={isEdit ? "Editar sucursal" : "Nueva sucursal"}
      description={isEdit ? "Modifica los datos de la sucursal." : "Registra una nueva sucursal para el tenant."}
    >
      {error && <Alert variant="error" title="Error" message={error} />}

      {isEdit && id ? (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2">{formCard}</div>
          <div className="lg:col-span-1 space-y-4">
            <BranchContextPanel {...context} />
          </div>
        </div>
      ) : (
        <div className="max-w-xl">{formCard}</div>
      )}
    </PageShell>
  );
};

export default BranchFormPage;
