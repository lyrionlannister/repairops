import type { FC } from "react";
import { formatUsage, STATUS_LABELS } from "../utils/format";
import type { PlanUsageCardProps } from "../props/plan-usage-card-props";

export const PlanUsageCard: FC<PlanUsageCardProps> = ({ summary }) => (
  <div className="flex flex-col gap-3 rounded-2xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-white/3 sm:flex-row sm:items-center sm:justify-between">
    <div>
      <p className="text-xs font-semibold uppercase text-gray-400">Plan</p>
      <p className="text-sm font-medium text-gray-800 dark:text-white/90">
        {summary.plan?.name ?? "Sin plan"} · {STATUS_LABELS[summary.status]}
      </p>
    </div>
    <dl className="grid grid-cols-2 gap-4 text-sm">
      <div>
        <dt className="text-xs text-gray-500 dark:text-gray-400">Usuarios activos</dt>
        <dd className="font-medium text-gray-800 dark:text-white/90">
          {formatUsage(summary.usage.users, summary.limits?.users ?? null)}
        </dd>
      </div>
      <div>
        <dt className="text-xs text-gray-500 dark:text-gray-400">Sucursales activas</dt>
        <dd className="font-medium text-gray-800 dark:text-white/90">
          {formatUsage(summary.usage.branches, summary.limits?.branches ?? null)}
        </dd>
      </div>
    </dl>
  </div>
);
