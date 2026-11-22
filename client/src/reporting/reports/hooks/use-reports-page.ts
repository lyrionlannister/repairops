import { useEffect, useState } from "react";

import { useBranch } from "@common/hooks/use-branch";
import { useLocal } from "@app-platform/local/hooks/use-local";
import { useCash } from "@commerce/cash/hooks/use-cash";

import { useReports } from "./use-reports";

// Suma/resta en centavos enteros: nunca se acumulan flotantes de dinero.
const toCents = (amount: number) => Math.round(amount * 100);

// Lógica de la página de reportes. El período vacío significa "el que decide el API"
// (mes en curso hasta hoy, en la zona horaria del taller): el cliente nunca usa su
// propio reloj para saber qué día es.
export const useReportsPage = () => {
  const { local, fetchLocal } = useLocal();
  const { workingBranchId } = useBranch();
  const { session, summary, fetchOpenSession, fetchSummary } = useCash();
  const reports = useReports();
  const { fetchReports, employeePerformance, accessorySales, repairNotesByType } = reports;

  const [periodStart, setPeriodStart] = useState("");
  const [periodEnd, setPeriodEnd] = useState("");

  useEffect(() => {
    fetchLocal();
  }, [fetchLocal]);

  useEffect(() => {
    fetchReports(periodStart, periodEnd);
  }, [fetchReports, periodStart, periodEnd]);

  useEffect(() => {
    if (workingBranchId) fetchOpenSession(workingBranchId);
  }, [workingBranchId, fetchOpenSession]);

  useEffect(() => {
    if (session) fetchSummary(session.id);
  }, [session, fetchSummary]);

  const cashIncomeCents = toCents(Number(summary?.totalIncome ?? 0));
  const expectedCents = toCents(repairNotesByType?.totalRevenue ?? 0) + toCents(accessorySales?.totalRevenue ?? 0);
  const differenceCents = cashIncomeCents - expectedCents;

  return {
    ...reports,
    employeePerformance,
    session,
    currency: local?.currency ?? "MXN",
    periodStart: periodStart || repairNotesByType?.periodStart || "",
    periodEnd: periodEnd || repairNotesByType?.periodEnd || "",
    setPeriodStart,
    setPeriodEnd,
    cash: {
      income: cashIncomeCents / 100,
      expectedTotal: expectedCents / 100,
      difference: differenceCents / 100,
      matches: Math.abs(differenceCents) < 1,
    },
  };
};
