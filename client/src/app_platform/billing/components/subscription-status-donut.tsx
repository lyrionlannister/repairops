import type { FC } from "react";
import Chart from "react-apexcharts";
import { buildSubscriptionStatusDonutOptions } from "../utils/chart-options";
import { STATUS_CHART_COLOR, STATUS_LABELS } from "../utils/format";
import type { SubscriptionStatus } from "../types/plan";
import type { SubscriptionStatusDonutProps } from "../props/subscription-status-donut-props";

export const SubscriptionStatusDonut: FC<SubscriptionStatusDonutProps> = ({
  subscriptionsByStatus,
}) => {
  const entries = Object.entries(subscriptionsByStatus) as [SubscriptionStatus, number][];
  const total = entries.reduce((sum, [, count]) => sum + count, 0);

  return (
    <div className="flex flex-col rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/3 sm:p-6">
      <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
        Talleres por estado
      </h3>
      <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{total} en total</p>
      {total === 0 ? (
        <p className="py-16 text-center text-sm text-gray-500 dark:text-gray-400">
          Todavía no hay talleres registrados.
        </p>
      ) : (
        <Chart
          options={buildSubscriptionStatusDonutOptions(
            entries.map(([status]) => STATUS_LABELS[status]),
            entries.map(([status]) => STATUS_CHART_COLOR[status]),
          )}
          series={entries.map(([, count]) => count)}
          type="donut"
          height={300}
        />
      )}
    </div>
  );
};
