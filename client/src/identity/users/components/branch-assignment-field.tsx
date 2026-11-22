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
      <div className="space-y-2">
        {branches.map((branch) => {
          const checked = branchIds.includes(branch.id);
          return (
            <div
              key={branch.id}
              className={`flex min-h-12 flex-wrap items-center justify-between gap-3 rounded-xl border px-4 py-2 transition-colors ${
                checked
                  ? "border-brand-300 bg-brand-50/50 dark:border-brand-500/40 dark:bg-brand-500/5"
                  : "border-gray-200 dark:border-gray-800"
              }`}
            >
              <label className="flex flex-1 cursor-pointer items-center gap-3 text-sm font-medium text-gray-700 dark:text-gray-300">
                <input
                  type="checkbox"
                  className="size-4 accent-brand-600"
                  checked={checked}
                  disabled={disabled}
                  onChange={() => toggle(branch.id)}
                />
                {branch.name}
                {!branch.isActive && (
                  <span className="text-xs font-normal text-gray-400">(desactivada)</span>
                )}
              </label>
              <label
                className={`flex min-h-11 items-center gap-2 text-xs ${checked ? "cursor-pointer text-gray-600 dark:text-gray-300" : "text-gray-300 dark:text-gray-600"}`}
              >
                <input
                  type="radio"
                  name="primaryBranch"
                  className="size-4 accent-brand-600"
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
      <p className="mt-3 text-xs text-gray-500 dark:text-gray-400">
        Trabaja en su sucursal principal y no puede cambiarla; solo el administrador cambia de
        sucursal.
      </p>
    </div>
  );
};
