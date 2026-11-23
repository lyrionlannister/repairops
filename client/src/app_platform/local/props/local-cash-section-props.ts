import type { LocalOperationSectionProps } from "./local-operation-section-props";

export interface LocalCashSectionProps extends LocalOperationSectionProps {
  cashBranchId: string | null;
  onViewCashBranch: (branchId: string | null) => void;
  onSubmit: (event: React.SubmitEvent<HTMLFormElement>) => void;
}
