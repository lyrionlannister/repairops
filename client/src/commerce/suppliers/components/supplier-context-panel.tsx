import { Boxes, DollarSign, TriangleAlert } from "lucide-react";
import type { SupplierCriticalItem } from "../hooks/use-supplier-context";

interface SupplierContextPanelProps {
  skuCount: number;
  stockValueAtCost: number;
  criticalItems: SupplierCriticalItem[];
}

export const SupplierContextPanel: React.FC<SupplierContextPanelProps> = ({
  skuCount,
  stockValueAtCost,
  criticalItems,
}) => (
  <div className="space-y-4 lg:col-span-1">
    <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/3">
      <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-100 dark:bg-brand-500/10">
        <Boxes className="size-5 text-brand-600 dark:text-brand-400" />
      </div>
      <div className="mt-4">
        <span className="text-sm text-gray-500 dark:text-gray-400">Catálogo surtido</span>
        <h4 className="mt-2 text-2xl font-bold text-gray-900 dark:text-white">{skuCount}</h4>
      </div>
    </div>

    <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/3">
      <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-100 dark:bg-emerald-500/10">
        <DollarSign className="size-5 text-emerald-600 dark:text-emerald-400" />
      </div>
      <div className="mt-4">
        <span className="text-sm text-gray-500 dark:text-gray-400">Valor de stock a costo</span>
        <h4 className="mt-2 text-2xl font-bold text-gray-900 dark:text-white">
          ${stockValueAtCost.toLocaleString("es-MX", { minimumFractionDigits: 2 })}
        </h4>
      </div>
    </div>

    <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/3">
      <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-orange-100 dark:bg-orange-500/10">
        <TriangleAlert className="size-5 text-orange-500 dark:text-orange-400" />
      </div>
      <div className="mt-4">
        <span className="mb-2 block text-sm text-gray-500 dark:text-gray-400">Stock crítico</span>
        {criticalItems.length === 0 ? (
          <p className="text-sm text-gray-400">Sin items en stock crítico.</p>
        ) : (
          <ul className="max-h-48 space-y-1.5 overflow-y-auto text-sm">
            {criticalItems.map((i) => (
              <li key={i.id} className="flex items-center justify-between gap-2 text-gray-700 dark:text-gray-300">
                <span className="truncate">{i.name}</span>
                <span className="shrink-0 font-medium text-orange-600 dark:text-orange-400">{i.quantityOnHand}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  </div>
);

