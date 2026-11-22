import { Decimal } from "decimal.js";
import { toMoney } from "../../../core/common/utils/money.js";

/**
 * Redondeo de caja: solo aplica a movimientos en efectivo (tarjeta y
 * transferencia nunca redondean, el banco liquida el monto exacto).
 * `unit` es la unidad del local (ej. 0.50, 1); 0 o negativa desactiva el
 * redondeo. Redondea al multiplo mas cercano.
 */
export function roundCashAmount(amount: Decimal.Value, unit: Decimal.Value): string {
  const step = new Decimal(unit);
  if (step.isZero() || step.isNegative()) return toMoney(amount);
  return toMoney(
    new Decimal(amount).dividedBy(step).toDecimalPlaces(0, Decimal.ROUND_HALF_UP).times(step),
  );
}
