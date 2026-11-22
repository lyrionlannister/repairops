import type { FC } from "react";
import Chart from "react-apexcharts";
import { BarChart3 } from "lucide-react";
import { buildCashFlowOptions } from "../utils/chart-options";
import type { CashFlowChartProps } from "../props/cash-flow-chart-props";

export const CashFlowChart: FC<CashFlowChartProps> = ({ flow }) => (
  <section className="flex h-full min-h-80 flex-col rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/3">
    <h3 className="text-base font-semibold text-gray-800 dark:text-white/90">Flujo del turno</h3>
    <p className="text-sm text-gray-500 dark:text-gray-400">Ingresos y egresos por hora</p>

    {!flow || flow.categories.length === 0 ? (
      <div className="flex flex-1 flex-col items-center justify-center gap-2 text-center text-sm text-gray-400">
        <BarChart3 className="size-8 opacity-50" aria-hidden />
        Aún no hay movimientos en este turno.
      </div>
    ) : (
      <div className="-mx-2 mt-2 min-w-0 flex-1">
        <Chart
          options={buildCashFlowOptions(flow.categories)}
          series={[
            { name: "Ingresos", data: flow.income },
            { name: "Egresos", data: flow.expense },
          ]}
          type="bar"
          height={260}
        />
      </div>
    )}
  </section>
);
