import { useMemo } from "react";
import Chart from "react-apexcharts";
import type { ApexOptions } from "apexcharts";
import {
  MessageSquare,
  CalendarDays,
  Clock,
  CalendarCheck2,
  TrendingUp,
  Wallet,
  PackageOpen,
  Banknote,
  ArrowUpRight,
  ArrowDownRight,
  Wrench,
} from "lucide-react";
import Input from "@ui/inputs/input";
import PageShell from "@common/components/page-shell/page-shell";
import { useDashboardPage } from "../hooks/use-dashboard-page";
import type { Trend } from "../hooks/use-dashboard-page";

const TrendBadge: React.FC<{ trend: Trend | null; inverted?: boolean }> = ({ trend, inverted }) => {
  if (!trend) return null;
  const positiveClasses = inverted
    ? "bg-white/20 text-white"
    : "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400";
  const negativeClasses = inverted
    ? "bg-white/20 text-white"
    : "bg-red-100 text-red-700 dark:bg-red-500/10 dark:text-red-400";
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${trend.up ? positiveClasses : negativeClasses}`}
    >
      {trend.up ? <ArrowUpRight className="size-3.5" /> : <ArrowDownRight className="size-3.5" />}
      {trend.pct}%
    </span>
  );
};

const formatRelativeTime = (dateValue: string): string => {
  const date = new Date(dateValue);
  if (Number.isNaN(date.getTime())) return "";
  const diffMs = Date.now() - date.getTime();
  const minutes = Math.floor(diffMs / 60_000);
  if (minutes < 1) return "hace un momento";
  if (minutes < 60) return `hace ${minutes} min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `hace ${hours} h`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `hace ${days} d`;
  return date.toLocaleDateString("es-MX", { day: "2-digit", month: "short" });
};

const DashboardPage: React.FC = () => {
  const {
    daily,
    monthly,
    weekCount,
    year,
    businessMetrics,
    totalYear,
    todayCount,
    lastInteraction,
    dailyCategories,
    monthLabels,
    setYear,
    dailyBusinessSeries,
    dailyBusinessCategories,
    monthlyBusinessSeries,
    todayDelta,
    monthDelta,
    recentActivity,
  } = useDashboardPage();

  const currencyFormatter = useMemo(
    () =>
      new Intl.NumberFormat("es-MX", {
        style: "currency",
        currency: "MXN",
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }),
    [],
  );


  const barOptions: ApexOptions = {
    colors: ["#465fff"],
    chart: {
      fontFamily: "inherit",
      type: "bar",
      height: 350,
      toolbar: { show: false },
    },
    plotOptions: {
      bar: {
        horizontal: false,
        columnWidth: "55%",
        borderRadius: 4,
        borderRadiusApplication: "end",
      },
    },
    dataLabels: { enabled: false },
    stroke: { show: true, width: 3, colors: ["transparent"] },
    xaxis: {
      categories: monthLabels,
      axisBorder: { show: false },
      axisTicks: { show: false },
    },
    yaxis: { title: { text: undefined } },
    grid: { yaxis: { lines: { show: true } } },
    fill: { opacity: 1 },
    tooltip: {
      x: { show: false },
      y: { formatter: (val: number) => `${val} conversaciones` },
    },
  };

  const areaOptions: ApexOptions = {
    colors: ["#465fff"],
    chart: {
      fontFamily: "inherit",
      type: "area",
      height: 350,
      toolbar: { show: false },
    },
    stroke: { curve: "smooth", width: 2 },
    fill: {
      type: "gradient",
      gradient: { opacityFrom: 0.4, opacityTo: 0 },
    },
    markers: { size: 0, hover: { size: 5 } },
    dataLabels: { enabled: false },
    grid: {
      xaxis: { lines: { show: false } },
      yaxis: { lines: { show: true } },
    },
    xaxis: {
      categories: dailyCategories,
      axisBorder: { show: false },
      axisTicks: { show: false },
      labels: { rotate: 0, hideOverlappingLabels: true },
      tooltip: { enabled: false },
    },
    yaxis: { labels: { style: { colors: ["#6B7280"] } }, title: { text: "" } },
    tooltip: {
      enabled: true,
      y: { formatter: (val: number) => `${val} mensajes` },
    },
  };

  const businessAreaOptions: ApexOptions = {
    colors: ["#12b76a", "#465fff"],
    chart: {
      fontFamily: "inherit",
      type: "area",
      height: 350,
      toolbar: { show: false },
    },
    stroke: { curve: "smooth", width: 2 },
    fill: {
      type: "gradient",
      gradient: { opacityFrom: 0.4, opacityTo: 0 },
    },
    markers: { size: 0, hover: { size: 5 } },
    dataLabels: { enabled: false },
    grid: {
      xaxis: { lines: { show: false } },
      yaxis: { lines: { show: true } },
    },
    xaxis: {
      categories: dailyBusinessCategories,
      axisBorder: { show: false },
      axisTicks: { show: false },
      labels: { rotate: 0, hideOverlappingLabels: true },
      tooltip: { enabled: false },
    },
    yaxis: { labels: { style: { colors: ["#6B7280"] } }, title: { text: "" } },
    legend: { show: true, position: "top", horizontalAlign: "left" },
    tooltip: {
      enabled: true,
      y: { formatter: (val: number) => currencyFormatter.format(val) },
    },
  };

  const businessStackedBarOptions: ApexOptions = {
    colors: ["#12b76a", "#465fff"],
    chart: {
      fontFamily: "inherit",
      type: "bar",
      height: 350,
      stacked: true,
      toolbar: { show: false },
    },
    plotOptions: {
      bar: {
        horizontal: false,
        columnWidth: "55%",
        borderRadius: 4,
        borderRadiusApplication: "end",
      },
    },
    dataLabels: { enabled: false },
    stroke: { show: true, width: 3, colors: ["transparent"] },
    xaxis: {
      categories: monthLabels,
      axisBorder: { show: false },
      axisTicks: { show: false },
    },
    yaxis: { title: { text: undefined } },
    grid: { yaxis: { lines: { show: true } } },
    fill: { opacity: 1 },
    legend: { show: true, position: "top", horizontalAlign: "left" },
    tooltip: {
      y: { formatter: (val: number) => currencyFormatter.format(val) },
    },
  };

  return (
    <PageShell
      title="Panel inicial"
      description="Métricas operativas del negocio y la atención."
    >
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3 md:gap-5">
        <div className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-brand-500 to-brand-600 p-6 shadow-theme-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg lg:col-span-2">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/15">
            <Banknote className="size-6 text-white" />
          </div>
          <div className="mt-5 flex items-end justify-between">
            <div>
              <span className="text-sm text-white/80">Ventas este mes</span>
              <h4 className="mt-2 text-3xl font-bold text-white">
                {currencyFormatter.format(businessMetrics.monthlyRevenue)}
              </h4>
            </div>
            <TrendBadge trend={monthDelta} inverted />
          </div>
        </div>

        <div className="group rounded-2xl border border-gray-200 bg-white p-5 shadow-theme-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-brand-200 hover:shadow-lg dark:border-gray-800 dark:bg-gray-900 md:p-6">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-violet-100 dark:bg-violet-500/10">
            <Wallet className="size-5 text-violet-600 dark:text-violet-400" />
          </div>
          <div className="mt-4 flex items-end justify-between">
            <div>
              <span className="text-sm text-gray-500 dark:text-gray-400">Ingreso del día</span>
              <h4 className="mt-2 text-2xl font-bold text-gray-900 dark:text-white">
                {currencyFormatter.format(businessMetrics.todayRevenue)}
              </h4>
            </div>
            <TrendBadge trend={todayDelta} />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 md:gap-5">
        <div className="group rounded-2xl border border-gray-200 bg-white p-4 shadow-theme-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-brand-200 hover:shadow-lg dark:border-gray-800 dark:bg-gray-900">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-teal-100 dark:bg-teal-500/10">
            <Banknote className="size-4 text-teal-600 dark:text-teal-400" />
          </div>
          <div className="mt-3">
            <span className="text-xs text-gray-500 dark:text-gray-400">Ventas esta semana</span>
            <h4 className="mt-1 text-lg font-bold text-gray-900 dark:text-white">
              {currencyFormatter.format(businessMetrics.weeklyRevenue)}
            </h4>
          </div>
        </div>

        <div className="group rounded-2xl border border-gray-200 bg-white p-4 shadow-theme-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-brand-200 hover:shadow-lg dark:border-gray-800 dark:bg-gray-900">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-100 dark:bg-brand-500/10">
            <PackageOpen className="size-4 text-brand-600 dark:text-brand-400" />
          </div>
          <div className="mt-3">
            <span className="text-xs text-gray-500 dark:text-gray-400">Notas abiertas</span>
            <h4 className="mt-1 text-lg font-bold text-gray-900 dark:text-white">
              {businessMetrics.openRepairNotes}
            </h4>
          </div>
        </div>

        <div className="group rounded-2xl border border-gray-200 bg-white p-4 shadow-theme-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-brand-200 hover:shadow-lg dark:border-gray-800 dark:bg-gray-900">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-500/10">
            <TrendingUp className="size-4 text-blue-600 dark:text-blue-400" />
          </div>
          <div className="mt-3">
            <span className="text-xs text-gray-500 dark:text-gray-400">Stock crítico</span>
            <h4 className="mt-1 text-lg font-bold text-gray-900 dark:text-white">
              {businessMetrics.criticalStockItems}
            </h4>
          </div>
        </div>

        <div className="group rounded-2xl border border-gray-200 bg-white p-4 shadow-theme-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-brand-200 hover:shadow-lg dark:border-gray-800 dark:bg-gray-900">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-orange-100 dark:bg-orange-500/10">
            <CalendarDays className="size-4 text-orange-500 dark:text-orange-400" />
          </div>
          <div className="mt-3">
            <span className="text-xs text-gray-500 dark:text-gray-400">Caja abierta</span>
            <h4 className="mt-1 text-lg font-bold text-gray-900 dark:text-white">
              {businessMetrics.openCashSessions}
            </h4>
          </div>
        </div>
      </div>

      {/* Actividad reciente: ventas y notas de reparación mas recientes (datos ya cargados por el dashboard) */}
      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white p-5 shadow-theme-sm dark:border-gray-800 dark:bg-white/3 sm:p-6">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">Actividad reciente</h3>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Últimas ventas y notas de reparación</p>
        {recentActivity.length === 0 ? (
          <p className="mt-4 text-sm text-gray-400 dark:text-gray-500">Sin actividad registrada todavía.</p>
        ) : (
          <div className="mt-4 divide-y divide-gray-100 dark:divide-gray-800">
            {recentActivity.map((item) => (
              <div key={`${item.kind}-${item.id}`} className="flex items-center justify-between gap-3 py-3">
                <div className="flex items-center gap-3">
                  <div
                    className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${
                      item.kind === "sale"
                        ? "bg-emerald-100 dark:bg-emerald-500/10"
                        : "bg-blue-100 dark:bg-blue-500/10"
                    }`}
                  >
                    {item.kind === "sale" ? (
                      <Banknote className="size-4 text-emerald-600 dark:text-emerald-400" />
                    ) : (
                      <Wrench className="size-4 text-blue-600 dark:text-blue-400" />
                    )}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-800 dark:text-white/90">{item.title}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{item.subtitle}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-gray-800 dark:text-white/90">
                    {currencyFormatter.format(item.amount)}
                  </p>
                  <p className="text-xs text-gray-400 dark:text-gray-500">{formatRelativeTime(item.date)}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5 md:gap-6">
        <div className="group rounded-2xl border border-gray-200 bg-white p-5 shadow-theme-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-brand-200 hover:shadow-lg dark:border-gray-800 dark:bg-white/3 md:p-6">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-violet-100 dark:bg-violet-900/30">
            <Clock className="size-6 text-violet-600 dark:text-violet-400" />
          </div>
          <div className="mt-5">
            <span className="text-sm text-gray-500 dark:text-gray-400">Última interacción</span>
            <h4 className="mt-2 text-xl font-bold text-gray-800 dark:text-white/90">{lastInteraction}</h4>
          </div>
        </div>

        <div className="group rounded-2xl border border-gray-200 bg-white p-5 shadow-theme-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-brand-200 hover:shadow-lg dark:border-gray-800 dark:bg-white/3 md:p-6">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-100 dark:bg-emerald-900/30">
            <CalendarCheck2 className="size-6 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div className="mt-5">
            <span className="text-sm text-gray-500 dark:text-gray-400">Mensajes hoy</span>
            <h4 className="mt-2 text-xl font-bold text-gray-800 dark:text-white/90">{todayCount}</h4>
          </div>
        </div>

        <div className="group rounded-2xl border border-gray-200 bg-white p-5 shadow-theme-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-brand-200 hover:shadow-lg dark:border-gray-800 dark:bg-white/3 md:p-6">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand-100 dark:bg-brand-900/30">
            <TrendingUp className="size-6 text-brand-600 dark:text-brand-400" />
          </div>
          <div className="mt-5">
            <span className="text-sm text-gray-500 dark:text-gray-400">Esta semana</span>
            <h4 className="mt-2 text-xl font-bold text-gray-800 dark:text-white/90">{weekCount}</h4>
          </div>
        </div>

        <div className="group rounded-2xl border border-gray-200 bg-white p-5 shadow-theme-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-brand-200 hover:shadow-lg dark:border-gray-800 dark:bg-white/3 md:p-6">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-100 dark:bg-blue-900/30">
            <MessageSquare className="size-6 text-blue-600 dark:text-blue-400" />
          </div>
          <div className="mt-5">
            <span className="text-sm text-gray-500 dark:text-gray-400">Total conversaciones {year}</span>
            <h4 className="mt-2 text-xl font-bold text-gray-800 dark:text-white/90">{totalYear}</h4>
          </div>
        </div>

        <div className="group rounded-2xl border border-gray-200 bg-white p-5 shadow-theme-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-brand-200 hover:shadow-lg dark:border-gray-800 dark:bg-white/3 md:p-6">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-orange-100 dark:bg-orange-900/30">
            <CalendarDays className="size-6 text-orange-500 dark:text-orange-400" />
          </div>
          <div className="mt-5">
            <span className="mb-2 block text-sm text-gray-500 dark:text-gray-400">Filtrar por año</span>
            <Input type="number" value={year} onChange={(e) => setYear(Number(e.target.value))} />
          </div>
        </div>
      </div>

      {/* Chart principal: ventas y reparaciones por dia, mas ancha para dar jerarquia */}
      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white px-5 pt-5 dark:border-gray-800 dark:bg-white/3 sm:px-6 sm:pt-6">
        <div className="mb-1">
          <h3 className="text-lg font-semibold text-brand-600 dark:text-brand-400">
            Ventas y reparaciones por día
          </h3>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Últimos 30 días
          </p>
        </div>
        <div className="max-w-full overflow-x-auto">
          <Chart
            options={businessAreaOptions}
            series={[
              { name: "Ventas", data: dailyBusinessSeries.map((p) => p.sales) },
              { name: "Reparaciones", data: dailyBusinessSeries.map((p) => p.repairs) },
            ]}
            type="area"
            height={320}
          />
        </div>
      </div>

      {/* Charts secundarias: mas chicas, en fila */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white px-5 pt-5 dark:border-gray-800 dark:bg-white/3 sm:px-6 sm:pt-6">
          <div className="mb-1">
            <h3 className="text-base font-semibold text-brand-600 dark:text-brand-400">
              Conversaciones por día
            </h3>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Últimos 30 días
            </p>
          </div>
          <div className="max-w-full overflow-x-auto">
            <Chart
              options={areaOptions}
              series={[{ name: "Mensajes", data: daily.map((p) => p.count) }]}
              type="area"
              height={230}
            />
          </div>
        </div>

        <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white px-5 pt-5 dark:border-gray-800 dark:bg-white/3 sm:px-6 sm:pt-6">
          <div className="mb-1">
            <h3 className="text-base font-semibold text-brand-600 dark:text-brand-400">
              Conversaciones por mes
            </h3>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Total mensual del año {year}
            </p>
          </div>
          <div className="max-w-full overflow-x-auto">
            <Chart
              options={barOptions}
              series={[{ name: "Conversaciones", data: monthly.map((p) => p.count) }]}
              type="bar"
              height={230}
            />
          </div>
        </div>

        <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white px-5 pt-5 dark:border-gray-800 dark:bg-white/3 sm:px-6 sm:pt-6">
          <div className="mb-1">
            <h3 className="text-base font-semibold text-brand-600 dark:text-brand-400">
              Ventas vs. reparaciones (mes)
            </h3>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Total mensual del año {year}
            </p>
          </div>
          <div className="max-w-full overflow-x-auto">
            <Chart
              options={businessStackedBarOptions}
              series={[
                { name: "Ventas", data: monthlyBusinessSeries.salesData },
                { name: "Reparaciones", data: monthlyBusinessSeries.repairsData },
              ]}
              type="bar"
              height={230}
            />
          </div>
        </div>
      </div>
    </PageShell>
  );
};

export default DashboardPage;
