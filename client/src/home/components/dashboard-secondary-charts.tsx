import type { FC } from "react";
import Chart from "react-apexcharts";
import type { Point } from "../hooks/use-dashboard-page";
import { buildConversationsAreaOptions, buildConversationsBarOptions, buildBusinessStackedBarOptions } from "../utils/chart-options";

interface DashboardSecondaryChartsProps {
  daily: Point[];
  monthly: Point[];
  dailyCategories: string[];
  monthLabels: string[];
  year: number;
  // null cuando el rol no ve importes: la gráfica de dinero no se pinta.
  monthlyBusinessSeries: { salesData: number[]; repairsData: number[] } | null;
  currencyFormatter: Intl.NumberFormat;
}

export const DashboardSecondaryCharts: FC<DashboardSecondaryChartsProps> = ({
  daily,
  monthly,
  dailyCategories,
  monthLabels,
  year,
  monthlyBusinessSeries,
  currencyFormatter,
}) => (
  <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
    <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white px-5 pt-5 dark:border-gray-800 dark:bg-white/3 sm:px-6 sm:pt-6">
      <div className="mb-1">
        <h3 className="text-base font-semibold text-brand-600 dark:text-brand-400">Conversaciones por día</h3>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Últimos 30 días</p>
      </div>
      <div className="max-w-full overflow-x-auto">
        <Chart
          options={buildConversationsAreaOptions(dailyCategories)}
          series={[{ name: "Mensajes", data: daily.map((p) => p.count) }]}
          type="area"
          height={230}
        />
      </div>
    </div>

    <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white px-5 pt-5 dark:border-gray-800 dark:bg-white/3 sm:px-6 sm:pt-6">
      <div className="mb-1">
        <h3 className="text-base font-semibold text-brand-600 dark:text-brand-400">Conversaciones por mes</h3>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Total mensual del año {year}</p>
      </div>
      <div className="max-w-full overflow-x-auto">
        <Chart
          options={buildConversationsBarOptions(monthLabels)}
          series={[{ name: "Conversaciones", data: monthly.map((p) => p.count) }]}
          type="bar"
          height={230}
        />
      </div>
    </div>

    {monthlyBusinessSeries && (
    <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white px-5 pt-5 dark:border-gray-800 dark:bg-white/3 sm:px-6 sm:pt-6">
      <div className="mb-1">
        <h3 className="text-base font-semibold text-brand-600 dark:text-brand-400">Ventas vs. reparaciones (mes)</h3>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Total mensual del año {year}</p>
      </div>
      <div className="max-w-full overflow-x-auto">
        <Chart
          options={buildBusinessStackedBarOptions(monthLabels, currencyFormatter)}
          series={[
            { name: "Ventas", data: monthlyBusinessSeries.salesData },
            { name: "Reparaciones", data: monthlyBusinessSeries.repairsData },
          ]}
          type="bar"
          height={230}
        />
      </div>
    </div>
    )}
  </div>
);
