import { Decimal } from "decimal.js";

export function toMoney(value: Decimal.Value): string {
  return new Decimal(value).toDecimalPlaces(2, Decimal.ROUND_HALF_UP).toFixed(2);
}

export function toMoneyOrNull(value: Decimal.Value | null | undefined): string | null {
  return value === null || value === undefined ? null : toMoney(value);
}
