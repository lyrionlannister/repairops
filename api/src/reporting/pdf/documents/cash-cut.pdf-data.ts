import { Decimal } from "decimal.js";
import type { Local } from "../../../app_platform/local/entities/local.entity.js";
import type { BrandPalette } from "../../../app_platform/local/utils/brand-palette.js";
import type { CashCut } from "../../../commerce/cash/services/cash.service.js";
import { moneyString } from "../format-money.js";
import { paletteOf, toPdfLocal, type PdfLocal } from "./pdf-local.js";

const METHOD_LABELS: Record<string, string> = {
  efectivo: "Efectivo",
  tarjeta: "Tarjeta",
  transferencia: "Transferencia",
};

const ORIGIN_LABELS: Record<string, string> = {
  sale: "Ventas",
  repair_note: "Reparaciones",
  repair_note_item: "Reparaciones",
  layaway: "Apartados",
  layaway_item: "Apartados",
  return: "Devoluciones",
  customer_payment: "Abonos de clientes",
  quote: "Cotizaciones",
  count: "Conteo de inventario",
  manual: "Manual",
};

export interface CashCutPdfData {
  id: string;
  closedDate: string;
  openedAt: string;
  closedAt: string;
  openedByName: string;
  closedByName: string;
  openingBalance: string;
  cashIncome: string;
  cashExpense: string;
  expectedCash: string;
  countedCash: string;
  variance: string;
  varianceReason: string | null;
  totalIncome: string;
  totalExpense: string;
  net: string;
  byMethod: Array<{ label: string; income: string; expense: string }>;
  byOrigin: Array<{ label: string; count: number; income: string; expense: string }>;
  movements: Array<{ time: string; type: string; method: string; note: string; amount: string }>;
  local: PdfLocal;
  palette: BrandPalette;
}

export function toCashCutPdfData(
  { cut, summary, movements, expectedCash }: CashCut,
  local: Local | null,
): CashCutPdfData {
  const timeZone = local?.timeZone ?? "America/Mexico_City";
  const dateTime = (value: Date | string | null) =>
    value
      ? new Date(value).toLocaleString("es-MX", {
          timeZone,
          dateStyle: "short",
          timeStyle: "short",
        })
      : "—";
  const cash = summary.byMethod.efectivo ?? { income: "0", expense: "0" };

  return {
    id: cut.id,
    closedDate: new Date(cut.closedAt ?? cut.openedAt).toLocaleDateString("en-CA", { timeZone }),
    openedAt: dateTime(cut.openedAt),
    closedAt: dateTime(cut.closedAt),
    openedByName: cut.openedByName ?? "—",
    closedByName: cut.closedByName ?? "—",
    openingBalance: moneyString(cut.openingBalance),
    cashIncome: moneyString(cash.income),
    cashExpense: moneyString(cash.expense),
    expectedCash: moneyString(expectedCash),
    countedCash: moneyString(cut.closingBalance ?? "0"),
    variance: moneyString(cut.variance ?? "0"),
    varianceReason: cut.varianceReason,
    totalIncome: moneyString(cut.totalIncome),
    totalExpense: moneyString(cut.totalExpense),
    net: moneyString(new Decimal(cut.totalIncome).minus(cut.totalExpense)),
    byMethod: Object.entries(summary.byMethod).map(([method, amounts]) => ({
      label: METHOD_LABELS[method] ?? method,
      income: moneyString(amounts?.income ?? "0"),
      expense: moneyString(amounts?.expense ?? "0"),
    })),
    byOrigin: summary.byOrigin.map((origin) => ({
      label: ORIGIN_LABELS[origin.origin] ?? origin.origin,
      count: origin.count,
      income: moneyString(origin.income ?? "0"),
      expense: moneyString(origin.expense ?? "0"),
    })),
    movements: movements.map((movement) => ({
      time: new Date(movement.createdAt).toLocaleTimeString("es-MX", {
        timeZone,
        timeStyle: "short",
      }),
      type: movement.type === "income" ? "Ingreso" : "Egreso",
      method: METHOD_LABELS[movement.method] ?? movement.method,
      note: movement.note ?? ORIGIN_LABELS[movement.relatedEntityType] ?? "",
      amount: moneyString(String(movement.amount)),
    })),
    local: toPdfLocal(local),
    palette: paletteOf(local),
  };
}
