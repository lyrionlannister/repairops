import type { FC } from "react";
import { CheckboxField } from "@ui/checkbox/checkbox-field";
import { formatMoney } from "../utils/format";

interface SaleCartTotalsProps {
  subtotal: number;
  taxRate: number;
  taxAmount: number;
  total: number;
  applyTax: boolean;
  onApplyTaxChange: (value: boolean) => void;
}

export const SaleCartTotals: FC<SaleCartTotalsProps> = ({
  subtotal,
  taxRate,
  taxAmount,
  total,
  applyTax,
  onApplyTaxChange,
}) => (
  <div className="space-y-2">
    <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
      <span>Subtotal</span>
      <span>{formatMoney(subtotal)}</span>
    </div>
    {taxRate > 0 && (
      <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
        <CheckboxField checked={applyTax} onChange={onApplyTaxChange} label={`Aplicar IVA (${taxRate}%)`} />
        <span>{formatMoney(taxAmount)}</span>
      </div>
    )}
    <div className="flex items-center justify-between">
      <span className="text-sm text-gray-500 dark:text-gray-400">Total</span>
      <span className="text-xl font-semibold text-gray-800 dark:text-white/90">{formatMoney(total)}</span>
    </div>
  </div>
);
