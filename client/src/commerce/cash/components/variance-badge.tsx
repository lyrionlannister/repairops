import type { FC } from "react";
import { VARIANCE_LABELS, formatMoney, varianceKind } from "../utils/format";
import type { VarianceBadgeProps } from "../props/variance-badge-props";

const TONES = {
  shortage: "bg-error-50 text-error-600 dark:bg-error-500/15 dark:text-error-400",
  overage: "bg-warning-50 text-warning-700 dark:bg-warning-500/15 dark:text-warning-400",
  exact: "bg-success-50 text-success-600 dark:bg-success-500/15 dark:text-success-400",
};

export const VarianceBadge: FC<VarianceBadgeProps> = ({ variance }) => {
  const kind = varianceKind(variance);
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium tabular-nums ${TONES[kind]}`}
    >
      {VARIANCE_LABELS[kind]}
      {kind !== "exact" && <span>{formatMoney(variance?.replace(/^-/, ""))}</span>}
    </span>
  );
};
