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

  return (
    <PageShell
      title={page.isEdit ? "Editar usuario" : "Nuevo usuario"}
      description={
        page.isEdit
          ? "Modifica los datos, el rol o las sucursales del usuario."
          : "Da de alta a alguien de tu equipo."
      }
    >
      <UserForm
        form={page.form}
        isEdit={page.isEdit}
        disabled={page.disabled}
        saving={page.saving}
        branches={page.branches}
        showPassword={page.showPassword}
        userSummary={page.userSummary}
        permissionSummary={page.permissionSummary}
        permissionsLoading={page.permissionsLoading}
        aside={page.isEdit ? <EmployeeContextPanel {...context} /> : null}
        onTogglePassword={page.togglePassword}
        onChange={page.setField}
        onRolesChange={page.setRoles}
        onBranchAssignmentChange={page.setBranchAssignment}
        onSubmit={page.submit}
        onCancel={page.cancel}
      />
    </PageShell>
  );
};
