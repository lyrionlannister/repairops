import type { CashBranchStatus } from "../types/cash";

export interface CashBranchOverviewProps {
  rows: CashBranchStatus[];
  loading: boolean;
  openCount: number;
  onView: (branchId: string) => void;
}
