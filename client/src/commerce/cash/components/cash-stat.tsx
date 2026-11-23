import type { FC } from "react";
import type { CashStatProps } from "../props/cash-stat-props";

export const CashStat: FC<CashStatProps> = ({ label, value }) => (
  <div>
    <p className="text-xs text-gray-500 dark:text-gray-400">{label}</p>
    <p className="mt-0.5 text-sm font-semibold text-gray-800 dark:text-white/90">{value}</p>
  </div>
);
