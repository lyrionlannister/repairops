import type { CashBranchStatus } from "../types/cash";

export interface CashBranchCardProps {
  status: CashBranchStatus;
  onView: (branchId: string) => void;
}
