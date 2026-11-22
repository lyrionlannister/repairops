export interface SaleCartTotalsProps {
  subtotal: number;
  taxRate: number;
  taxAmount: number;
  total: number;
  applyTax: boolean;
  onApplyTaxChange: (value: boolean) => void;
}
