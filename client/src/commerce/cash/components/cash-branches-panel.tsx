import type { FC } from "react";
import { useCashOverview } from "../hooks/use-cash-overview";
import { CashBranchOverview } from "./cash-branch-overview";
import type { CashBranchesPanelProps } from "../props/cash-branches-panel-props";

export const CashBranchesPanel: FC<CashBranchesPanelProps> = ({ onView }) => {
  const { rows, loading, openCount } = useCashOverview();
  return <CashBranchOverview rows={rows} loading={loading} openCount={openCount} onView={onView} />;
};
