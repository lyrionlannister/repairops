export interface SaleFilters {
  branchId: string | null;
  customerId?: string;
  createdByEmployeeId?: string;
  search?: string;
  // Zona horaria del taller: acota al mes calendario en curso.
  currentMonthIn?: string;
}

export interface SaleStats {
  count: number;
  total: string;
}
