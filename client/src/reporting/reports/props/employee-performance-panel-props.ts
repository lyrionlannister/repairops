import type { EmployeePerformanceReport, EmployeePerformanceRow } from "../types/reports";

export interface EmployeePerformancePanelProps {
  report: EmployeePerformanceReport | null;
  currency: string;
}

export interface EmployeePerformanceCellProps {
  row: EmployeePerformanceRow;
  currency: string;
}
