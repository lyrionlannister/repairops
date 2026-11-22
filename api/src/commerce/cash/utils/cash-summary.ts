import { Decimal } from "decimal.js";
import type {
  CashMovement,
  CashMovementMethod,
  CashMovementRelatedEntityType,
} from "../entities/cash-movement.entity.js";
import type { CashCutRow, CashSummary, CashVarianceStats } from "../types/cash-report.types.js";

const METHODS: CashMovementMethod[] = ["efectivo", "tarjeta", "transferencia"];

interface Totals {
  income: Decimal;
  expense: Decimal;
}

const zero = (): Totals => ({ income: new Decimal(0), expense: new Decimal(0) });

const add = (totals: Totals, movement: CashMovement): void => {
  const amount = new Decimal(String(movement.amount));
  if (movement.type === "income") totals.income = totals.income.plus(amount);
  else totals.expense = totals.expense.plus(amount);
};

const money = (value: Decimal): string => value.toFixed(2);

const hourKey = (date: Date, timeZone: string): string => {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    hourCycle: "h23",
  }).formatToParts(date);
  const get = (type: string) => parts.find((part) => part.type === type)?.value ?? "00";
  return `${get("year")}-${get("month")}-${get("day")}T${get("hour")}:00`;
};

export function cashMethodTotals(
  movements: readonly CashMovement[],
): Record<CashMovementMethod, Totals> {
  const byMethod = Object.fromEntries(METHODS.map((method) => [method, zero()])) as Record<
    CashMovementMethod,
    Totals
  >;
  movements.forEach((movement) => add(byMethod[movement.method], movement));
  return byMethod;
}

export function buildCashSummary(
  movements: readonly CashMovement[],
  options: { hideAmounts: boolean; timeZone: string },
): CashSummary {
  const total = zero();
  movements.forEach((movement) => add(total, movement));
  const byMethod = cashMethodTotals(movements);

  const origins = new Map<CashMovementRelatedEntityType, { count: number; totals: Totals }>();
  const hours = new Map<string, Totals>();
  for (const movement of movements) {
    const origin = origins.get(movement.relatedEntityType) ?? { count: 0, totals: zero() };
    origin.count += 1;
    add(origin.totals, movement);
    origins.set(movement.relatedEntityType, origin);

    const key = hourKey(new Date(movement.createdAt), options.timeZone);
    const hour = hours.get(key) ?? zero();
    add(hour, movement);
    hours.set(key, hour);
  }

  const hide = options.hideAmounts;
  return {
    amountsHidden: hide,
    movementCount: movements.length,
    totalIncome: money(total.income),
    totalExpense: money(total.expense),
    net: money(total.income.minus(total.expense)),
    byMethod: Object.fromEntries(
      METHODS.map((method) => [
        method,
        hide && method === "efectivo"
          ? null
          : { income: money(byMethod[method].income), expense: money(byMethod[method].expense) },
      ]),
    ) as CashSummary["byMethod"],
    byOrigin: [...origins.entries()]
      .map(([origin, { count, totals }]) => ({
        origin,
        count,
        income: hide ? null : money(totals.income),
        expense: hide ? null : money(totals.expense),
      }))
      .sort((a, b) => b.count - a.count),
    hourly: hide
      ? null
      : [...hours.entries()]
          .sort(([a], [b]) => a.localeCompare(b))
          .map(([hour, totals]) => ({
            hour,
            income: money(totals.income),
            expense: money(totals.expense),
          })),
  };
}

export function buildVarianceStats(cuts: readonly CashCutRow[], month: string): CashVarianceStats {
  let shortage = new Decimal(0);
  let overage = new Decimal(0);
  let income = new Decimal(0);
  let withVariance = 0;
  for (const cut of cuts) {
    const variance = new Decimal(cut.variance ?? 0);
    if (variance.isNegative()) shortage = shortage.plus(variance.abs());
    if (variance.greaterThan(0)) overage = overage.plus(variance);
    if (!variance.isZero()) withVariance += 1;
    income = income.plus(cut.totalIncome);
  }
  return {
    month,
    closedCount: cuts.length,
    withVarianceCount: withVariance,
    shortageTotal: money(shortage),
    overageTotal: money(overage),
    netVariance: money(overage.minus(shortage)),
    averageIncomePerShift: money(
      cuts.length === 0
        ? new Decimal(0)
        : income.dividedBy(cuts.length).toDecimalPlaces(2, Decimal.ROUND_HALF_UP),
    ),
  };
}
