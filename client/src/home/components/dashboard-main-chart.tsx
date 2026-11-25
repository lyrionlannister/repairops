import type { FC } from "react";
import Chart from "react-apexcharts";
import { buildBusinessAreaOptions } from "../utils/chart-options";
import type { DashboardMainChartProps } from "../props/dashboard-main-chart-props";

export const DashboardMainChart: FC<DashboardMainChartProps> = ({
  dailyBusinessSeries,
  dailyBusinessCategories,
  currencyFormatter,
}) => (
  <div className="flex flex-1 flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white px-5 pt-5 dark:border-gray-800 dark:bg-white/3 sm:px-6 sm:pt-6">
    <div className="mb-1">
      <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
        Cobrado por día
      </h3>
      <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
        Ventas de mostrador y pagos de reparaciones, últimos 30 días
      </p>
    </div>
    {/* ApexCharts mide su contenedor al montar: el absolute le da un alto definido aunque el card crezca por flex. */}
    <div className="relative min-h-80 flex-1">
      <div className="absolute inset-0">
        <Chart
          options={buildBusinessAreaOptions(dailyBusinessCategories, currencyFormatter)}
          series={[
            { name: "Ventas", data: dailyBusinessSeries.map((p) => p.sales) },
            { name: "Cobros de reparaciones", data: dailyBusinessSeries.map((p) => p.repairs) },
          ]}
          type="area"
          height="100%"
        />
      </div>
    </div>
  </div>
);
