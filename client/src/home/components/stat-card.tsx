import type { FC } from "react";
import { TrendBadge } from "./trend-badge";
import type { StatCardProps } from "../props/stat-card-props";

export const StatCard: FC<StatCardProps> = ({ icon, iconTone, label, value, trend }) => (
  <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/3 md:p-6">
    <div className={`flex size-11 items-center justify-center rounded-xl [&>svg]:size-5 ${iconTone}`}>{icon}</div>
    <div className="mt-5 flex items-end justify-between gap-2">
      <div className="min-w-0">
        <span className="text-sm text-gray-500 dark:text-gray-400">{label}</span>
        <h4 className="mt-1.5 truncate text-2xl font-bold text-gray-800 dark:text-white/90">{value}</h4>
      </div>
      {trend !== undefined && <TrendBadge trend={trend} />}
    </div>
  </div>
);
