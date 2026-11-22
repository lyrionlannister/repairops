import type { BranchRecord } from "@common/types/branch-context";

export interface BranchAssignmentFieldProps {
  branches: BranchRecord[];
  branchIds: string[];
  primaryBranchId: string;
  disabled: boolean;
  onChange: (branchIds: string[], primaryBranchId: string) => void;
}
