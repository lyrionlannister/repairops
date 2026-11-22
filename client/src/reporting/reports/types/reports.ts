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
