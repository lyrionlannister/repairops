import { Check } from "lucide-react";

import { ROLE_LABELS, type UserRole } from "../hooks/use-users";
import { toggleRole } from "../utils/roles";
import { ROLE_DESCRIPTIONS } from "../utils/role-permissions";
import type { RoleCheckboxesProps } from "../props/role-checkboxes-props";

export const RoleCheckboxes: React.FC<RoleCheckboxesProps> = ({ roles, disabled, onChange }) => (
  <fieldset>
    <legend className="sr-only">Roles</legend>
    <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
      {(Object.keys(ROLE_LABELS) as UserRole[]).map((role) => {
        const checked = roles.includes(role);
        return (
          <label
            key={role}
            className={`relative flex min-h-11 cursor-pointer items-start gap-3 rounded-xl border-2 p-4 transition-colors has-focus-visible:ring-2 has-focus-visible:ring-brand-500/40 ${
              checked
                ? "border-brand-500 bg-brand-50/60 dark:bg-brand-500/10"
                : "border-gray-200 hover:border-gray-300 dark:border-gray-800 dark:hover:border-gray-700"
            } ${disabled ? "cursor-not-allowed opacity-60" : ""}`}
          >
            <input
              type="checkbox"
              checked={checked}
              disabled={disabled}
              onChange={(event) => onChange(toggleRole(roles, role, event.target.checked))}
              className="sr-only"
            />
            <span className="flex flex-1 flex-col pr-6">
              <span className="text-sm font-semibold text-gray-800 dark:text-white/90">
                {ROLE_LABELS[role]}
              </span>
              <span className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
                {ROLE_DESCRIPTIONS[role]}
              </span>
            </span>
            <span
              className={`absolute top-4 right-4 flex size-5 items-center justify-center rounded-full border-2 ${
                checked
                  ? "border-brand-500 bg-brand-500 text-white"
                  : "border-gray-300 dark:border-gray-600"
              }`}
              aria-hidden
            >
              {checked && <Check className="size-3" strokeWidth={3} />}
            </span>
          </label>
        );
      })}
    </div>
    <p className="mt-3 text-xs text-gray-500 dark:text-gray-400">
      Puedes combinar roles y sus permisos se suman. El administrador ya tiene todos y va solo.
    </p>
  </fieldset>
);
