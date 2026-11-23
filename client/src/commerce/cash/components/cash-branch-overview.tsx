import type { FC } from "react";
import { CashBranchCard } from "./cash-branch-card";
import type { CashBranchOverviewProps } from "../props/cash-branch-overview-props";

export const CashBranchOverview: FC<CashBranchOverviewProps> = ({
  rows,
  loading,
  openCount,
  onView,
}) => {
  if (loading && rows.length === 0) {
    return <p className="text-sm text-gray-500 dark:text-gray-400">Cargando cajas...</p>;
  }
  return (
    <div className="space-y-4">
      <p className="text-sm text-gray-500 dark:text-gray-400">
        <span className="font-semibold text-gray-800 dark:text-white/90">{openCount}</span> de{" "}
        {rows.length} {rows.length === 1 ? "caja abierta" : "cajas abiertas"}
      </p>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
        {rows.map((status) => (
          <CashBranchCard key={status.branchId} status={status} onView={onView} />
        ))}
      </div>
    </div>
  );
};
