import type { FC } from "react";
import { Building2 } from "lucide-react";

import { Button } from "@ui/button/button";
import { BranchAssignmentField } from "./branch-assignment-field";
import { RoleCheckboxes } from "./role-checkboxes";
import { RolePermissionsPreview } from "./role-permissions-preview";
import { UserAccountSection } from "./user-account-section";
import { UserFormSection } from "./user-form-section";
import { UserPayFields } from "./user-pay-fields";
import { UserSummaryCard } from "./user-summary-card";
import type { UserFormProps } from "../props/user-form-props";

export const UserForm: FC<UserFormProps> = ({
  form,
  isEdit,
  disabled,
  saving,
  branches,
  showPassword,
  userSummary,
  permissionSummary,
  permissionsLoading,
  aside,
  onTogglePassword,
  onChange,
  onRolesChange,
  onBranchAssignmentChange,
  onSubmit,
  onCancel,
}) => {
  const isOwner = form.roles.includes("owner");

  return (
    <form onSubmit={onSubmit} className="flex flex-col">
      <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <UserFormSection
            step={1}
            title="Datos de acceso"
            description="Con estos datos inicia sesión."
          >
            <UserAccountSection
              form={form}
              isEdit={isEdit}
              disabled={disabled}
              showPassword={showPassword}
              onTogglePassword={onTogglePassword}
              onChange={onChange}
            />
          </UserFormSection>

          <UserFormSection
            step={2}
            title="Rol"
            description="Define qué puede ver y hacer en el taller."
          >
            <RoleCheckboxes roles={form.roles} disabled={disabled} onChange={onRolesChange} />
          </UserFormSection>

          <UserFormSection
            step={3}
            title="Sucursales"
            description="Dónde trabaja y cuál es su sucursal principal."
          >
            {isOwner ? (
              <div className="flex items-center gap-3 rounded-xl bg-gray-50 p-4 text-sm text-gray-600 dark:bg-white/3 dark:text-gray-300">
                <Building2 className="size-5 shrink-0 text-brand-500" aria-hidden />
                El administrador accede a todas las sucursales.
              </div>
            ) : (
              <BranchAssignmentField
                branches={branches}
                branchIds={form.branchIds}
                primaryBranchId={form.primaryBranchId}
                disabled={disabled}
                onChange={onBranchAssignmentChange}
              />
            )}
          </UserFormSection>

          <UserFormSection
            step={4}
            title="Pago"
            description="Opcional. Sirve para calcular la nómina."
          >
            <UserPayFields form={form} disabled={disabled} onChange={onChange} />
          </UserFormSection>
        </div>

        <aside className="custom-scrollbar space-y-6 lg:sticky lg:top-0 lg:max-h-[calc(100dvh-20rem)] lg:overflow-y-auto lg:pr-1">
          <UserSummaryCard summary={userSummary} />
          <RolePermissionsPreview
            summary={permissionSummary}
            loading={permissionsLoading}
            hasRoles={form.roles.length > 0}
            fullAccess={isOwner}
          />
          {aside}
        </aside>
      </div>

      <div className="sticky bottom-0 z-20 mt-6 -mx-1 flex justify-end gap-2 border-t border-gray-200 bg-gray-50/95 px-1 py-3 backdrop-blur sm:py-4 dark:border-gray-800 dark:bg-gray-950/95">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          className="min-h-11 flex-1 sm:flex-none"
        >
          Cancelar
        </Button>
        <Button
          type="submit"
          variant="primary"
          disabled={saving}
          className="min-h-11 flex-1 sm:flex-none"
        >
          {saving ? "Guardando..." : isEdit ? "Guardar cambios" : "Crear usuario"}
        </Button>
      </div>
    </form>
  );
};
