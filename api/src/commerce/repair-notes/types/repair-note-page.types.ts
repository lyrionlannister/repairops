export interface RepairNoteFilters {
  branchId: string | null;
  customerId?: string;
  assignedEmployeeId?: string;
  status?: string;
  search?: string;
}

export interface RepairNoteStats {
  total: number;
  open: number;
}
