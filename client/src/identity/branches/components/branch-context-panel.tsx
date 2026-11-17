import { Fragment } from "react";
import { Package, Receipt, Wrench, Wallet } from "lucide-react";
import { formatMoney } from "../utils/format";

interface BranchContextPanelProps {
  skuCount: number;
  stockValue: number;
  criticalCount: number;
  monthlySalesTotal: number;
  monthlySalesCount: number;
  openRepairNotesCount: number;
  cashSessionOpen: boolean;
}

export const BranchContextPanel = ({
  skuCount,
  stockValue,
  criticalCount,
  monthlySalesTotal,
  monthlySalesCount,
  openRepairNotesCount,
  cashSessionOpen,
}: BranchContextPanelProps) => (
  <Fragment>
    <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/3">
      <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-100 dark:bg-blue-500/10">
        <Package className="size-5 text-blue-600 dark:text-blue-400" />
      </div>
      <div className="mt-4">
        <span className="text-sm text-gray-500 dark:text-gray-400">Inventario de la sucursal</span>
        <h4 className="mt-2 text-xl font-bold text-gray-900 dark:text-white">{skuCount} SKUs</h4>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Valor en stock: {formatMoney(stockValue)}
        </p>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Stock crítico: {criticalCount} {criticalCount === 1 ? "producto" : "productos"}
        </p>
      </div>
    </div>

    <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/3">
      <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-100 dark:bg-emerald-500/10">
        <Receipt className="size-5 text-emerald-600 dark:text-emerald-400" />
      </div>
      <div className="mt-4">
        <span className="text-sm text-gray-500 dark:text-gray-400">Ventas del mes</span>
        <h4 className="mt-2 text-xl font-bold text-gray-900 dark:text-white">{formatMoney(monthlySalesTotal)}</h4>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          {monthlySalesCount} {monthlySalesCount === 1 ? "venta" : "ventas"}
        </p>
      </div>
    </div>

    <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/3">
      <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-orange-100 dark:bg-orange-500/10">
        <Wrench className="size-5 text-orange-600 dark:text-orange-400" />
      </div>
      <div className="mt-4">
        <span className="text-sm text-gray-500 dark:text-gray-400">Reparaciones</span>
        <h4 className="mt-2 text-xl font-bold text-gray-900 dark:text-white">
          {openRepairNotesCount} {openRepairNotesCount === 1 ? "nota abierta" : "notas abiertas"}
        </h4>
      </div>
    </div>

    <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/3">
      <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-violet-100 dark:bg-violet-500/10">
        <Wallet className="size-5 text-violet-600 dark:text-violet-400" />
      </div>
      <div className="mt-4">
        <span className="text-sm text-gray-500 dark:text-gray-400">Caja</span>
        <h4
          className={`mt-2 text-xl font-bold ${
            cashSessionOpen ? "text-emerald-600 dark:text-emerald-400" : "text-gray-500 dark:text-gray-400"
          }`}
        >
          {cashSessionOpen ? "Caja abierta" : "Caja cerrada"}
        </h4>
      </div>
    </div>
  </Fragment>
);

