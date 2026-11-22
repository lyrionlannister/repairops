import { useParams } from "react-router";

import { PageShell } from "@common/components/page-shell/page-shell";

import { useUserFormPage } from "../hooks/use-user-form-page";
import { useEmployeeContext } from "../hooks/use-employee-context";
import { EmployeeContextPanel } from "../components/employee-context-panel";
import { UserForm } from "../components/user-form";

export const UserFormPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const page = useUserFormPage(id);
  const context = useEmployeeContext(page.isEdit ? (id ?? null) : null);

  const formEl = (
    <UserForm
      form={page.form}
      isEdit={page.isEdit}
      disabled={page.disabled}
      saving={page.saving}
      branches={page.branches}
      showPassword={page.showPassword}
      onTogglePassword={page.togglePassword}
      onChange={page.setField}
      onRolesChange={page.setRoles}
      onBranchAssignmentChange={page.setBranchAssignment}
      onSubmit={page.submit}
      onCancel={page.cancel}
    />
  );

  return (
    <PageShell
      title={page.isEdit ? "Editar usuario" : "Nuevo usuario"}
      description={page.isEdit ? "Modifica los datos del usuario." : "Crea un usuario para tu equipo."}
    >
      {page.isEdit ? (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2">{formEl}</div>
          <div className="lg:col-span-1">
            <EmployeeContextPanel {...context} />
          </div>
        </div>
      ) : (
        <div className="max-w-xl">{formEl}</div>
      )}
    </PageShell>
  );
};
