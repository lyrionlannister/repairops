import type { FC } from "react";
import Chart from "react-apexcharts";
import { buildBusinessAreaOptions } from "../utils/chart-options";
import type { DashboardMainChartProps } from "../props/dashboard-main-chart-props";

export const DashboardMainChart: FC<DashboardMainChartProps> = ({
  dailyBusinessSeries,
  dailyBusinessCategories,
  currencyFormatter,
}) => (
  <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white px-5 pt-5 dark:border-gray-800 dark:bg-white/3 sm:px-6 sm:pt-6">
    <div className="mb-1">
      <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">Ventas y reparaciones por día</h3>
      <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Últimos 30 días</p>
    </div>
    <div className="max-w-full overflow-x-auto">
      <Chart
        options={buildBusinessAreaOptions(dailyBusinessCategories, currencyFormatter)}
        series={[
          { name: "Ventas", data: dailyBusinessSeries.map((p) => p.sales) },
          { name: "Reparaciones", data: dailyBusinessSeries.map((p) => p.repairs) },
        ]}
        type="area"
        height={320}
      />
    </div>
  </div>
);
