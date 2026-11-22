import type { ApexOptions } from "apexcharts";

const currency = new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN" });

export const buildCashFlowOptions = (categories: string[]): ApexOptions => ({
  colors: ["#12b76a", "#f04438"],
  chart: { fontFamily: "inherit", type: "bar", toolbar: { show: false } },
  plotOptions: { bar: { columnWidth: "45%", borderRadius: 4, borderRadiusApplication: "end" } },
  dataLabels: { enabled: false },
  grid: { xaxis: { lines: { show: false } }, yaxis: { lines: { show: true } } },
  xaxis: { categories, axisBorder: { show: false }, axisTicks: { show: false } },
  yaxis: { labels: { formatter: (value: number) => currency.format(value) } },
  legend: { show: true, position: "top", horizontalAlign: "left" },
  tooltip: { y: { formatter: (value: number) => currency.format(value) } },
});
