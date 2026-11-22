import { useCallback, useState } from "react";
import { useApiClient } from "@common/hooks/use-api-client";
import { useBranch } from "@common/hooks/use-branch";
import { ALL_BRANCHES } from "@common/contexts/branch-context";
import type { EmployeePerformanceReport, AccessorySalesReport, RepairNotesByTypeReport } from "../types/reports";

export const useReports = () => {
  const { apiClient } = useApiClient();
  const { activeBranchId } = useBranch();
  const [employeePerformance, setEmployeePerformance] = useState<EmployeePerformanceReport | null>(null);
  const [accessorySales, setAccessorySales] = useState<AccessorySalesReport | null>(null);
  const [repairNotesByType, setRepairNotesByType] = useState<RepairNotesByTypeReport | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchReports = useCallback(
    async (periodStart: string, periodEnd: string) => {
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
        const [performanceRes, accessoryRes, byTypeRes] = await Promise.all([
          apiClient(`/reports/employee-performance?${query}`),
          apiClient(`/reports/accessory-sales?${query}`),
          apiClient(`/reports/repair-notes-by-type?${query}`),
        ]);
        if (!performanceRes.ok || !accessoryRes.ok || !byTypeRes.ok) {
          throw new Error("Error al cargar los reportes");
        }
        setEmployeePerformance((await performanceRes.json()) as EmployeePerformanceReport);
        setAccessorySales((await accessoryRes.json()) as AccessorySalesReport);
        setRepairNotesByType((await byTypeRes.json()) as RepairNotesByTypeReport);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Error desconocido");
      } finally {
        setLoading(false);
      }
    },
    [apiClient, activeBranchId],
  );

  return { employeePerformance, accessorySales, repairNotesByType, loading, error, fetchReports };
};
