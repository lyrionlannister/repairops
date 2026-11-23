import type { ApexOptions } from "apexcharts";

export const buildRevenueByPlanOptions = (
  categories: string[],
  currencyFormatter: Intl.NumberFormat,
): ApexOptions => ({
  colors: ["#465fff"],
  chart: { fontFamily: "inherit", type: "bar", height: 300, toolbar: { show: false } },
  plotOptions: {
    bar: { horizontal: false, columnWidth: "45%", borderRadius: 4, borderRadiusApplication: "end" },
  },
  dataLabels: { enabled: false },
  xaxis: { categories, axisBorder: { show: false }, axisTicks: { show: false } },
  yaxis: {
    labels: {
      style: { colors: ["#6B7280"] },
      formatter: (val: number) => currencyFormatter.format(val),
    },
  },
  grid: { yaxis: { lines: { show: true } } },
  tooltip: { y: { formatter: (val: number) => currencyFormatter.format(val) } },
});

export const buildSubscriptionStatusDonutOptions = (
  labels: string[],
  colors: string[],
): ApexOptions => ({
  colors,
  labels,
  chart: { fontFamily: "inherit", type: "donut" },
  stroke: { width: 0 },
  dataLabels: { enabled: false },
  legend: { show: true, position: "bottom", fontSize: "13px" },
  plotOptions: { pie: { donut: { size: "70%" } } },
  tooltip: { y: { formatter: (val: number) => `${val} taller${val === 1 ? "" : "es"}` } },
});
