import { Label } from "@ui/inputs/label";
import { CheckboxField } from "@ui/checkbox/checkbox-field";

import { ROLE_LABELS, type UserRole } from "../hooks/use-users";
import { toggleRole } from "../utils/roles";

interface RoleCheckboxesProps {
  roles: UserRole[];
  disabled: boolean;
  onChange: (roles: UserRole[]) => void;
}

export const RoleCheckboxes: React.FC<RoleCheckboxesProps> = ({ roles, disabled, onChange }) => (
  <fieldset className="sm:col-span-2">
    <Label className="text-gray-500">
      Roles <span className="text-error-500">*</span>
    </Label>
    <div className="mt-1 grid grid-cols-1 gap-2 xsm:grid-cols-2 md:grid-cols-4">
      {(Object.keys(ROLE_LABELS) as UserRole[]).map((role) => (
        <div key={role} className="flex min-h-11 items-center">
          <CheckboxField
            checked={roles.includes(role)}
            label={ROLE_LABELS[role]}
            disabled={disabled}
            onChange={(checked) => onChange(toggleRole(roles, role, checked))}
          />
        </div>
      ))}
    </div>
    <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
      Los permisos se suman. El dueño ya tiene todos y no se combina con otro rol.
    </p>
  </fieldset>
);
