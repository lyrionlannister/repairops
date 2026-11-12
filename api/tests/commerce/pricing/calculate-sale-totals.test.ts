import { describe, expect, it } from "vitest";
import { calculateSaleTotals } from "../../../src/commerce/pricing/calculate-sale-totals.js";

// Prueba de dinero exacto del motor de cálculo único del POS (cap. 3 del
// plan, skill money-precision): no usa Postgres, es aritmética pura con
// Decimal -- debe seguir el orden precio -> descuento -> impuesto -> redondeo.
describe("calculateSaleTotals", () => {
  it("applies no discount and the given tax rate", () => {
    const result = calculateSaleTotals([{ quantity: 2, unitPrice: 30 }], 16);
    expect(result.subtotal).toBe("60.00");
    expect(result.discountAmount).toBe("0.00");
    expect(result.taxAmount).toBe("9.60");
    expect(result.total).toBe("69.60");
  });

  it("applies a per-line discount before tax", () => {
    const result = calculateSaleTotals([{ quantity: 1, unitPrice: 100, discountPercent: 20 }], 16);
    expect(result.lines[0].lineSubtotal).toBe("100.00");
    expect(result.lines[0].lineDiscount).toBe("20.00");
    expect(result.lines[0].lineTotal).toBe("80.00");
    // Impuesto se calcula sobre la base ya descontada: 80 * 0.16 = 12.80
    expect(result.discountAmount).toBe("20.00");
    expect(result.taxAmount).toBe("12.80");
    expect(result.total).toBe("92.80");
  });

  it("sums multiple lines with independent discounts", () => {
    const result = calculateSaleTotals(
      [
        { quantity: 1, unitPrice: 50 },
        { quantity: 3, unitPrice: 20, discountPercent: 10 },
      ],
      0,
    );
    // Línea 1: 50. Línea 2: 60 subtotal, 6 descuento, 54 total.
    expect(result.subtotal).toBe("110.00");
    expect(result.discountAmount).toBe("6.00");
    expect(result.taxAmount).toBe("0.00");
    expect(result.total).toBe("104.00");
  });

  it("never produces a binary floating-point rounding artifact (0.1 + 0.2 class of bug)", () => {
    // Montos elegidos para que number nativo de JS produzca basura binaria
    // si el cálculo no pasa por Decimal: 0.1 + 0.2 = 0.30000000000000004.
    const result = calculateSaleTotals(
      [
        { quantity: 1, unitPrice: 10.1 },
        { quantity: 1, unitPrice: 10.2 },
      ],
      0,
    );
    expect(result.subtotal).toBe("20.30");
    expect(result.total).toBe("20.30");
  });

  it("rounds each line with ROUND_HALF_UP at 2 decimals", () => {
    const result = calculateSaleTotals([{ quantity: 3, unitPrice: 10, discountPercent: 12.5 }], 0);
    // 30 subtotal, 12.5% = 3.75 descuento exacto, total 26.25 -- sin residuo.
    expect(result.lines[0].lineDiscount).toBe("3.75");
    expect(result.lines[0].lineTotal).toBe("26.25");
  });
});
