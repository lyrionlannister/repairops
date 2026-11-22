import { ShoppingCart, Wrench } from "lucide-react";
import type { EmployeeContextPanelProps } from "../props/employee-context-panel-props";

export const EmployeeContextPanel: React.FC<EmployeeContextPanelProps> = ({
  salesCount,
  salesTotal,
  notesTotal,
  notesOpenCount,
}) => {
  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/3">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-success-100 dark:bg-success-500/10">
            <ShoppingCart className="size-5 text-success-600 dark:text-success-400" />
          </div>
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">Ventas atendidas</p>
            <p className="text-lg font-semibold text-gray-800 dark:text-white/90">{salesCount}</p>
          </div>
        </div>
        <p className="mt-3 text-sm text-gray-500 dark:text-gray-400">
          Total facturado: {`$${salesTotal.toLocaleString("es-MX", { minimumFractionDigits: 2 })}`}
        </p>
      </div>

      <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/3">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-100 dark:bg-brand-500/10">
            <Wrench className="size-5 text-brand-600 dark:text-brand-400" />
          </div>
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">Reparaciones asignadas</p>
            <p className="text-lg font-semibold text-gray-800 dark:text-white/90">{notesTotal}</p>
          </div>
        </div>
        <p className="mt-3 text-sm text-gray-500 dark:text-gray-400">Abiertas actualmente: {notesOpenCount}</p>
      </div>
    </div>
  );
};

