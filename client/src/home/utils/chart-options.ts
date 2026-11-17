import type { ApexOptions } from "apexcharts";

export const buildConversationsBarOptions = (monthLabels: string[]): ApexOptions => ({
  colors: ["#465fff"],
  chart: { fontFamily: "inherit", type: "bar", height: 350, toolbar: { show: false } },
  plotOptions: {
    bar: { horizontal: false, columnWidth: "55%", borderRadius: 4, borderRadiusApplication: "end" },
  },
  dataLabels: { enabled: false },
  stroke: { show: true, width: 3, colors: ["transparent"] },
  xaxis: { categories: monthLabels, axisBorder: { show: false }, axisTicks: { show: false } },
  yaxis: { title: { text: undefined } },
  grid: { yaxis: { lines: { show: true } } },
  fill: { opacity: 1 },
  tooltip: { x: { show: false }, y: { formatter: (val: number) => `${val} conversaciones` } },
});

export const buildConversationsAreaOptions = (dailyCategories: string[]): ApexOptions => ({
  colors: ["#465fff"],
  chart: { fontFamily: "inherit", type: "area", height: 350, toolbar: { show: false } },
  stroke: { curve: "smooth", width: 2 },
  fill: { type: "gradient", gradient: { opacityFrom: 0.4, opacityTo: 0 } },
  markers: { size: 0, hover: { size: 5 } },
  dataLabels: { enabled: false },
  grid: { xaxis: { lines: { show: false } }, yaxis: { lines: { show: true } } },
  xaxis: {
    categories: dailyCategories,
    axisBorder: { show: false },
    axisTicks: { show: false },
    labels: { rotate: 0, hideOverlappingLabels: true },
    tooltip: { enabled: false },
  },
  yaxis: { labels: { style: { colors: ["#6B7280"] } }, title: { text: "" } },
  tooltip: { enabled: true, y: { formatter: (val: number) => `${val} mensajes` } },
});

export const buildBusinessAreaOptions = (
  dailyBusinessCategories: string[],
  currencyFormatter: Intl.NumberFormat,
): ApexOptions => ({
  colors: ["#12b76a", "#465fff"],
  chart: { fontFamily: "inherit", type: "area", height: 350, toolbar: { show: false } },
  stroke: { curve: "smooth", width: 2 },
  fill: { type: "gradient", gradient: { opacityFrom: 0.4, opacityTo: 0 } },
  markers: { size: 0, hover: { size: 5 } },
  dataLabels: { enabled: false },
  grid: { xaxis: { lines: { show: false } }, yaxis: { lines: { show: true } } },
  xaxis: {
    categories: dailyBusinessCategories,
    axisBorder: { show: false },
    axisTicks: { show: false },
    labels: { rotate: 0, hideOverlappingLabels: true },
    tooltip: { enabled: false },
  },
  yaxis: { labels: { style: { colors: ["#6B7280"] } }, title: { text: "" } },
  legend: { show: true, position: "top", horizontalAlign: "left" },
  tooltip: { enabled: true, y: { formatter: (val: number) => currencyFormatter.format(val) } },
});

export const buildBusinessStackedBarOptions = (
  monthLabels: string[],
  currencyFormatter: Intl.NumberFormat,
): ApexOptions => ({
  colors: ["#12b76a", "#465fff"],
  chart: { fontFamily: "inherit", type: "bar", height: 350, stacked: true, toolbar: { show: false } },
  plotOptions: {
    bar: { horizontal: false, columnWidth: "55%", borderRadius: 4, borderRadiusApplication: "end" },
  },
  dataLabels: { enabled: false },
  stroke: { show: true, width: 3, colors: ["transparent"] },
  xaxis: { categories: monthLabels, axisBorder: { show: false }, axisTicks: { show: false } },
  yaxis: { title: { text: undefined } },
  grid: { yaxis: { lines: { show: true } } },
  fill: { opacity: 1 },
  legend: { show: true, position: "top", horizontalAlign: "left" },
  tooltip: { y: { formatter: (val: number) => currencyFormatter.format(val) } },
});
