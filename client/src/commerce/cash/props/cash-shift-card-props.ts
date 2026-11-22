import type { CashShiftInfo } from "../types/cash-page";

export interface CashShiftCardProps {
  shift: CashShiftInfo;
  branchName: string;
  onIncome: () => void;
  onExpense: () => void;
  onClose: () => void;
}
