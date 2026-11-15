import { Decimal } from "decimal.js";

// Motor de cálculo único del POS (cap. 3 del plan de cierre): precio →
// descuento → impuesto → redondeo, en ese orden fijo, con Decimal de punta
// a punta. Lo usa SaleService; nada más en el sistema suma totales de
// dinero por su cuenta (ver skill money-precision).
export interface SaleTotalsLine {
  quantity: number;
  unitPrice: number;
  discountPercent?: number;
}

export interface SaleTotalsLineResult {
  lineSubtotal: string;
  lineDiscount: string;
  lineTotal: string;
}

export interface SaleTotalsResult {
  subtotal: string;
  discountAmount: string;
  taxAmount: string;
  total: string;
  lines: SaleTotalsLineResult[];
}

const money2 = (value: Decimal) => value.toDecimalPlaces(2, Decimal.ROUND_HALF_UP);

export function calculateSaleTotals(items: SaleTotalsLine[], taxRatePercent: number): SaleTotalsResult {
  const taxRate = new Decimal(taxRatePercent).dividedBy(100);

  let subtotal = new Decimal(0);
  let discountAmount = new Decimal(0);
  const lines: SaleTotalsLineResult[] = [];

  for (const item of items) {
    const lineSubtotal = money2(new Decimal(item.unitPrice).times(item.quantity));
    const lineDiscount = money2(lineSubtotal.times(new Decimal(item.discountPercent ?? 0).dividedBy(100)));
    const lineTotal = money2(lineSubtotal.minus(lineDiscount));

    subtotal = subtotal.plus(lineSubtotal);
    discountAmount = discountAmount.plus(lineDiscount);
    lines.push({
      lineSubtotal: lineSubtotal.toFixed(2),
      lineDiscount: lineDiscount.toFixed(2),
      lineTotal: lineTotal.toFixed(2),
    });
  }

  subtotal = money2(subtotal);
  discountAmount = money2(discountAmount);
  const taxableBase = subtotal.minus(discountAmount);
  const taxAmount = money2(taxableBase.times(taxRate));
  const total = money2(taxableBase.plus(taxAmount));

  return {
    subtotal: subtotal.toFixed(2),
    discountAmount: discountAmount.toFixed(2),
    taxAmount: taxAmount.toFixed(2),
    total: total.toFixed(2),
    lines,
  };
}
