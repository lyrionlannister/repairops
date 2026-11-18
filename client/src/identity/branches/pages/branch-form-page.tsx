import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router";

import { PageShell } from "@common/components/page-shell/page-shell";
import { useBranch } from "@common/hooks/use-branch";

import { useBranches, type BranchFormData } from "../hooks/use-branches";
import { useBranchContext } from "../hooks/use-branch-context";
import { BranchContextPanel } from "../components/branch-context-panel";
import { BranchForm } from "../components/branch-form";

const emptyForm: BranchFormData = { name: "", address: "", phone: "" };

export const BranchFormPage: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEdit = Boolean(id);

  const { branches, loading, saving, fetchAll, create, update } = useBranches();
  const { refreshBranches } = useBranch();
  const [form, setForm] = useState<BranchFormData>(emptyForm);
  const context = useBranchContext(isEdit ? (id ?? null) : null);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  useEffect(() => {
    if (!isEdit || !id) return;
    const branch = branches.find((b) => b.id === id);
    if (branch)
      setForm({ name: branch.name, address: branch.address ?? "", phone: branch.phone ?? "" });
  }, [isEdit, id, branches]);

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (event: React.SubmitEvent<HTMLFormElement>) => {
    event.preventDefault();
    const ok = isEdit && id ? await update(id, form) : await create(form);
    if (ok) {
      await refreshBranches();
      navigate("/identity/branches");
    }
  };

  const formCard = (
    <BranchForm
      form={form}
      loading={loading}
      saving={saving}
      isEdit={isEdit}
      onChange={handleChange}
      onSubmit={handleSubmit}
      onCancel={() => navigate("/identity/branches")}
    />
  );

  return (
    <PageShell
      title={isEdit ? "Editar sucursal" : "Nueva sucursal"}
      description={isEdit ? "Modifica los datos de la sucursal." : "Registra una nueva sucursal."}
    >
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
