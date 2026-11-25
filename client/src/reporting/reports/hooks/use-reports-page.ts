import { useEffect, useMemo, useState } from "react";

import { useLocal } from "@app-platform/local/hooks/use-local";

import { useReports } from "./use-reports";
import type { ReportSummary } from "../types/reports";

// El periodo vacio significa "el que decide el API" (mes en curso hasta hoy, en
// la zona horaria del taller): el cliente nunca usa su propio reloj para saber
// que dia es.
export const useReportsPage = () => {
  const { local, fetchLocal } = useLocal();
  const reports = useReports();
  const { fetchReports, accessorySales, repairNotesByType } = reports;

  const [periodStart, setPeriodStart] = useState("");
  const [periodEnd, setPeriodEnd] = useState("");
  const rangeError =
    periodStart && periodEnd && periodStart > periodEnd
      ? "La fecha “Desde” no puede ser posterior a “Hasta”."
      : null;

  useEffect(() => {
    fetchLocal();
  }, [fetchLocal]);

  useEffect(() => {
    if (!rangeError) fetchReports(periodStart, periodEnd);
  }, [fetchReports, periodStart, periodEnd, rangeError]);

  const summary = useMemo<ReportSummary>(
    () => ({
      notesCount: repairNotesByType?.totalNotes ?? 0,
      notesRevenue: repairNotesByType?.totalRevenue ?? 0,
      salesCount: accessorySales?.salesCount ?? 0,
      salesRevenue: accessorySales?.totalRevenue ?? 0,
      averageTicket: accessorySales?.averageTicket ?? 0,
    }),
    [repairNotesByType, accessorySales],
  );

  return {
    ...reports,
    error: rangeError ?? reports.error,
    summary,
    currency: local?.currency ?? "MXN",
    periodStart: periodStart || repairNotesByType?.periodStart || "",
    periodEnd: periodEnd || repairNotesByType?.periodEnd || "",
    setPeriodStart,
    setPeriodEnd,
  };
};
