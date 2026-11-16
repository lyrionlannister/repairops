import type { FC } from "react";
import { formatMoney } from "../utils/format";

interface SaleCartTotalsProps {
  subtotal: number;
  taxRate: number;
  taxAmount: number;
  total: number;
}

export const SaleCartTotals: FC<SaleCartTotalsProps> = ({ subtotal, taxRate, taxAmount, total }) => (
  <div className="space-y-2 border-t border-gray-100 pt-4 dark:border-gray-800">
    <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
      <span>Subtotal</span>
      <span>{formatMoney(subtotal)}</span>
    </div>
    {taxRate > 0 && (
      <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
        <span>Impuesto ({taxRate}%)</span>
        <span>{formatMoney(taxAmount)}</span>
      </div>
    )}
    <div className="flex items-center justify-between">
      <span className="text-sm text-gray-500 dark:text-gray-400">Total</span>
      <span className="text-xl font-semibold text-gray-800 dark:text-white/90">{formatMoney(total)}</span>
    </div>
  </div>
);
