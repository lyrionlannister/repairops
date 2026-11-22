import { Label } from "@ui/inputs/label";
import type { BranchAssignmentFieldProps } from "../props/branch-assignment-field-props";

// Sucursales de un usuario que no es owner: una o varias, y una principal (la sucursal en
// la que opera, que él no puede cambiar). El owner accede a todas y no usa este campo.
export const BranchAssignmentField: React.FC<BranchAssignmentFieldProps> = ({
  branches,
  branchIds,
  primaryBranchId,
  disabled,
  onChange,
}) => {
  const toggle = (id: string) => {
    const next = branchIds.includes(id) ? branchIds.filter((b) => b !== id) : [...branchIds, id];
    const primary = next.includes(primaryBranchId) ? primaryBranchId : (next[0] ?? "");
    onChange(next, primary);
  };

  return (
    <div>
      <Label className="text-gray-500">
        Sucursales <span className="text-error-500">*</span>
      </Label>
      <div className="mt-1 space-y-2 rounded-xl border border-gray-200 p-3 dark:border-gray-700">
        {branches.map((branch) => {
          const checked = branchIds.includes(branch.id);
          return (
            <div key={branch.id} className="flex min-h-11 items-center justify-between gap-3">
              <label className="flex flex-1 items-center gap-3 text-sm text-gray-700 dark:text-gray-300">
                <input
                  type="checkbox"
                  className="size-4"
                  checked={checked}
                  disabled={disabled}
                  onChange={() => toggle(branch.id)}
                />
                {branch.name}
                {!branch.isActive && <span className="text-xs text-gray-400">(desactivada)</span>}
              </label>
              <label
                className={`flex items-center gap-2 text-xs ${checked ? "text-gray-600 dark:text-gray-300" : "text-gray-300 dark:text-gray-600"}`}
              >
                <input
                  type="radio"
                  name="primaryBranch"
                  className="size-4"
                  checked={primaryBranchId === branch.id}
                  disabled={disabled || !checked}
                  onChange={() => onChange(branchIds, branch.id)}
                />
                Principal
              </label>
            </div>
          );
        })}
      </div>
      <p className="mt-1 text-xs text-gray-400">
        El usuario trabaja en su sucursal principal y no puede cambiarla; solo el dueño cambia de sucursal.
      </p>
    </div>
  );
};
