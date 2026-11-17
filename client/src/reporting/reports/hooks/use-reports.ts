import { useCallback, useState } from "react";
import { useApiClient } from "@common/hooks/use-api-client";

export interface EmployeePerformanceRow {
  employeeId: string;
  employeeName: string;
  attributedAmount: number;
  salaryAmount: number;
  coversSalary: boolean;
  repairNotesCount: number;
  salesCount: number;
}

export interface EmployeePerformanceReport {
  attributionBasis: string;
  periodStart: string;
  periodEnd: string;
  employees: EmployeePerformanceRow[];
}

export interface AccessorySalesReport {
  periodStart: string;
  periodEnd: string;
  groupBy: "item" | "day" | "week";
  totalRevenue: number;
  averageTicket: number;
  salesCount: number;
  data: Array<{ key: string; label: string; quantity: number; revenue: number }>;
}

export interface RepairNotesByTypeReport {
  periodStart: string;
  periodEnd: string;
  totalNotes: number;
  totalRevenue: number;
  byType: Array<{ type: string; label: string; count: number; totalValue: number }>;
  byStatus: Array<{ status: string; count: number; totalValue: number }>;
}

export const useReports = () => {
  const { apiClient } = useApiClient();
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
        Object.entries({ periodStart, periodEnd }).filter(([, value]) => value),
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
    [apiClient],
  );

  return { employeePerformance, accessorySales, repairNotesByType, loading, error, fetchReports };
};
