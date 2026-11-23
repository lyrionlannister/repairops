import type { FC } from "react";
import Chart from "react-apexcharts";
import { buildRevenueByPlanOptions } from "../utils/chart-options";
import { intervalLabel, planLabel } from "../utils/format";
import type { BillingRevenueChartProps } from "../props/billing-revenue-chart-props";

const MXN_FORMATTER = new Intl.NumberFormat("es-MX", {
  style: "currency",
  currency: "MXN",
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

export const BillingRevenueChart: FC<BillingRevenueChartProps> = ({ rows, days }) => {
  const categories = rows.map(
    (row) => `${planLabel(row.planKey)} (${intervalLabel(row.billingInterval)})`,
  );
  const series = rows.map((row) => Number(row.total));

  return (
    <div className="rounded-2xl border border-gray-200 bg-white px-5 pt-5 dark:border-gray-800 dark:bg-white/3 sm:px-6 sm:pt-6">
      <div className="mb-1">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">Ingreso por plan</h3>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Últimos {days} días</p>
      </div>
      {rows.length === 0 ? (
        <p className="py-16 text-center text-sm text-gray-500 dark:text-gray-400">
          Todavía no hay pagos cobrados en este periodo.
        </p>
      ) : (
        <Chart
          options={buildRevenueByPlanOptions(categories, MXN_FORMATTER)}
          series={[{ name: "Ingreso", data: series }]}
          type="bar"
          height={300}
        />
      )}
    </div>
  );
};
