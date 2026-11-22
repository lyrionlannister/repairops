import { ArrowUpRight, ArrowDownRight } from "lucide-react";
import type { TrendBadgeProps } from "../props/trend-badge-props";

export const TrendBadge: React.FC<TrendBadgeProps> = ({ trend, inverted }) => {
  if (!trend) return null;
  const positiveClasses = inverted
    ? "bg-white/20 text-white"
    : "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400";
  const negativeClasses = inverted
    ? "bg-white/20 text-white"
    : "bg-red-100 text-red-700 dark:bg-red-500/10 dark:text-red-400";
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${trend.up ? positiveClasses : negativeClasses}`}
    >
      {trend.up ? <ArrowUpRight className="size-3.5" /> : <ArrowDownRight className="size-3.5" />}
      {trend.pct}%
    </span>
  );
};
