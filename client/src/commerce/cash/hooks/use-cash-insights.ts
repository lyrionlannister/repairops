import { useCallback, useEffect, useMemo, useState } from "react";
import { useEmployees } from "@identity/users/hooks/use-employees";
import { formatElapsed } from "../utils/format";
import { flowSeries, methodRows, movementRows, originRows } from "../utils/insights";
import type { CashMovementRecord, CashSessionRecord, CashSummary } from "../types/cash";
import type { CashMovementFilters, CashShiftInfo } from "../types/cash-page";

const NO_FILTERS: CashMovementFilters = { type: "", method: "", origin: "" };

export const useCashInsights = (
  session: CashSessionRecord | null,
  movements: CashMovementRecord[],
  summary: CashSummary | null,
) => {
  const { employees, fetchAll } = useEmployees();
  const [filters, setFilters] = useState<CashMovementFilters>(NO_FILTERS);
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 60_000);
    return () => window.clearInterval(timer);
  }, []);

  const nameOf = useCallback(
    (id: string | null) => {
      if (!id) return "—";
      const employee = employees.find((e) => e.id === id);
      return employee ? `${employee.firstName} ${employee.lastName}`.trim() : "—";
    },
    [employees],
  );

  const shift: CashShiftInfo | null = session
    ? {
        openedByName: nameOf(session.openedByEmployeeId),
        openedAt: session.openedAt,
        elapsed: formatElapsed(session.openedAt, now),
        movementCount: summary?.movementCount ?? movements.length,
      }
    : null;

  const rows = useMemo(
    () => movementRows(movements, nameOf, filters),
    [movements, nameOf, filters],
  );

  return {
    shift,
    amountsHidden: summary?.amountsHidden ?? false,
    methods: useMemo(() => methodRows(summary, movements), [summary, movements]),
    origins: useMemo(() => originRows(summary), [summary]),
    flow: useMemo(() => flowSeries(summary), [summary]),
    rows,
    filters,
    setFilter: (key: keyof CashMovementFilters, value: string) =>
      setFilters((prev) => ({ ...prev, [key]: value })),
    clearFilters: () => setFilters(NO_FILTERS),
    hasFilters: Boolean(filters.type || filters.method || filters.origin),
  };
};
