import { useParams } from "react-router";

import { PageShell } from "@common/components/page-shell/page-shell";

import { useBranchFormPage } from "../hooks/use-branch-form-page";
import { useBranchContext } from "../hooks/use-branch-context";
import { useDiscountCaps } from "../hooks/use-discount-caps";
import { BranchContextPanel } from "../components/branch-context-panel";
import { BranchForm } from "../components/branch-form";
import { DiscountCapsCard } from "../components/discount-caps-card";

export const BranchFormPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const page = useBranchFormPage(id);
  const context = useBranchContext(page.isEdit ? (id ?? null) : null);
  const discountCaps = useDiscountCaps(page.isEdit ? (id ?? null) : null);

  const formCard = (
    <BranchForm
      form={page.form}
      loading={page.loading}
      saving={page.saving}
      isEdit={page.isEdit}
      onChange={page.change}
      onSubmit={page.submit}
      onCancel={page.cancel}
    />
  );

  return (
    <PageShell
      title={page.isEdit ? "Editar sucursal" : "Nueva sucursal"}
      description={page.isEdit ? "Modifica los datos de la sucursal." : "Registra una nueva sucursal."}
    >
      {page.isEdit ? (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="space-y-6 lg:col-span-2">
            {formCard}
            <DiscountCapsCard
              form={discountCaps.form}
              loading={discountCaps.loading}
              saving={discountCaps.saving}
              onChange={discountCaps.setCap}
              onSave={discountCaps.save}
            />
          </div>
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
