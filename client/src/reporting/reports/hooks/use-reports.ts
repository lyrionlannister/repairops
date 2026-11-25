import { useCallback, useRef, useState } from "react";
import { useApiClient } from "@common/hooks/use-api-client";
import { useBranch } from "@common/hooks/use-branch";
import { ALL_BRANCHES } from "@common/contexts/branch-context";
import type {
  EmployeePerformanceReport,
  AccessorySalesReport,
  RepairNotesByTypeReport,
} from "../types/reports";

const LOAD_ERROR = "No pudimos cargar los reportes. Intenta de nuevo en unos segundos.";

const readError = async (response: Response) => {
  const body = (await response.json().catch(() => null)) as { error?: string } | null;
  return body?.error ?? LOAD_ERROR;
};

export const useReports = () => {
  const { apiClient } = useApiClient();
  const { activeBranchId } = useBranch();
  const [employeePerformance, setEmployeePerformance] = useState<EmployeePerformanceReport | null>(
    null,
  );
  const [accessorySales, setAccessorySales] = useState<AccessorySalesReport | null>(null);
  const [repairNotesByType, setRepairNotesByType] = useState<RepairNotesByTypeReport | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Cambiar fechas rapido dispara varias cargas: solo la ultima pinta resultados.
  const requestSeq = useRef(0);

  const fetchReports = useCallback(
    async (periodStart: string, periodEnd: string) => {
      const seq = ++requestSeq.current;
      setLoading(true);
      setError(null);
      // Sin fechas, el API usa el mes en curso hasta hoy en la zona horaria del taller.
      const query = new URLSearchParams(
        Object.entries({
          periodStart,
          periodEnd,
          branchId: activeBranchId === ALL_BRANCHES ? "" : activeBranchId,
        }).filter(([, value]) => value),
      ).toString();
      try {
        const responses = await Promise.all([
          apiClient(`/reports/employee-performance?${query}`),
          apiClient(`/reports/accessory-sales?${query}`),
          apiClient(`/reports/repair-notes-by-type?${query}`),
        ]);
        const failed = responses.find((response) => !response.ok);
        if (failed) throw new Error(await readError(failed));
        const [performance, accessory, byType] = await Promise.all(
          responses.map((response) => response.json()),
        );
        if (seq !== requestSeq.current) return;
        setEmployeePerformance(performance as EmployeePerformanceReport);
        setAccessorySales(accessory as AccessorySalesReport);
        setRepairNotesByType(byType as RepairNotesByTypeReport);
      } catch (err) {
        if (seq === requestSeq.current) setError(err instanceof Error ? err.message : LOAD_ERROR);
      } finally {
        if (seq === requestSeq.current) setLoading(false);
      }
    },
    [apiClient, activeBranchId],
  );

  return { employeePerformance, accessorySales, repairNotesByType, loading, error, fetchReports };
};
