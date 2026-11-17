import { Decimal } from "decimal.js";

// Unico formateo de dinero de los documentos. Recibe cadenas decimales ("1234.5")
// y nunca pasa por Number (ver skill money-precision).
export function formatMoney(value: string | null | undefined): string {
  if (value === null || value === undefined || value === "") return "—";
  const amount = new Decimal(value).toDecimalPlaces(2, Decimal.ROUND_HALF_UP);
  const [integer = "0", cents = "00"] = amount.abs().toFixed(2).split(".");
  const grouped = integer.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  return `${amount.isNegative() ? "-" : ""}$${grouped}.${cents}`;
}

export const moneyString = (value: Decimal.Value): string => new Decimal(value).toFixed(2);
