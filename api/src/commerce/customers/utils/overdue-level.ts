import { Decimal } from "decimal.js";

export type OverdueLevel = "none" | "low" | "medium" | "high";

// Umbrales de negocio sobre la parte de la deuda en mora: <25% sin alerta,
// 25-35% amarillo, >35-50% naranja, >50% rojo.
export function overdueLevel(balance: Decimal.Value, overdue: Decimal.Value): OverdueLevel {
  const total = new Decimal(balance);
  if (total.lessThanOrEqualTo(0)) return "none";
  const pct = new Decimal(overdue).dividedBy(total).times(100);
  if (pct.greaterThan(50)) return "high";
  if (pct.greaterThan(35)) return "medium";
  if (pct.greaterThanOrEqualTo(25)) return "low";
  return "none";
}
