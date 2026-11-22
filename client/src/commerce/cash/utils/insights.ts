import { METHOD_LABELS, ORIGIN_LABELS, originLink } from "./format";
import type { CashMovementMethod, CashMovementRecord, CashSummary } from "../types/cash";
import type {
  CashBreakdownRow,
  CashFlowSeries,
  CashMovementFilters,
  CashMovementRow,
} from "../types/cash-page";

const METHODS = Object.keys(METHOD_LABELS) as CashMovementMethod[];

// Proporciones solo para el ancho de las barras: el dinero mostrado sigue siendo el texto de la API.
const shareOf = (part: number, total: number) => (total > 0 ? Math.round((part / total) * 100) : 0);

export const methodRows = (
  summary: CashSummary | null,
  movements: readonly CashMovementRecord[],
): CashBreakdownRow[] => {
  const counts = new Map<CashMovementMethod, number>();
  movements.forEach((m) => counts.set(m.method, (counts.get(m.method) ?? 0) + 1));
  const total = movements.length;
  return METHODS.map((method) => {
    const amounts = summary?.byMethod[method] ?? null;
    return {
      key: method,
      label: METHOD_LABELS[method],
      count: counts.get(method) ?? 0,
      income: amounts?.income ?? null,
      expense: amounts?.expense ?? null,
      share: shareOf(counts.get(method) ?? 0, total),
    };
  });
};

export const originRows = (summary: CashSummary | null): CashBreakdownRow[] => {
  const origins = summary?.byOrigin ?? [];
  const total = origins.reduce((sum, origin) => sum + origin.count, 0);
  return origins.map((origin) => ({
    key: origin.origin,
    label: ORIGIN_LABELS[origin.origin],
    count: origin.count,
    income: origin.income,
    expense: origin.expense,
    share: shareOf(origin.count, total),
  }));
};

export const flowSeries = (summary: CashSummary | null): CashFlowSeries | null => {
  if (!summary?.hourly) return null;
  return {
    categories: summary.hourly.map((point) => `${point.hour.slice(11, 13)}:00`),
    income: summary.hourly.map((point) => Number(point.income)),
    expense: summary.hourly.map((point) => Number(point.expense)),
  };
};

export const movementRows = (
  movements: readonly CashMovementRecord[],
  nameOf: (id: string | null) => string,
  filters: CashMovementFilters,
): CashMovementRow[] =>
  movements
    .filter(
      (m) =>
        (!filters.type || m.type === filters.type) &&
        (!filters.method || m.method === filters.method) &&
        (!filters.origin || m.relatedEntityType === filters.origin),
    )
    .slice()
    .reverse()
    .map((m) => ({
      ...m,
      originLabel: ORIGIN_LABELS[m.relatedEntityType] ?? m.relatedEntityType,
      originHref: originLink(m.relatedEntityType, m.relatedEntityId),
      createdByName: nameOf(m.createdByEmployeeId),
    }));
