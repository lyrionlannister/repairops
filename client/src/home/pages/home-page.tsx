import { useMemo } from "react";
import { PageShell } from "@common/components/page-shell/page-shell";
import { useDashboardPage } from "../hooks/use-dashboard-page";
import { DashboardRevenueCards } from "../components/dashboard-revenue-cards";
import { DashboardSecondaryStats } from "../components/dashboard-secondary-stats";
import { DashboardRecentActivity } from "../components/dashboard-recent-activity";
import { DashboardConversationStats } from "../components/dashboard-conversation-stats";
import { DashboardMainChart } from "../components/dashboard-main-chart";
import { DashboardSecondaryCharts } from "../components/dashboard-secondary-charts";

export const HomePage: React.FC = () => {
  const {
    daily,
    monthly,
    weekCount,
    year,
    showMoney,
    businessMetrics,
    totalYear,
    todayCount,
    lastInteraction,
    dailyCategories,
    monthLabels,
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

  return (
    <PageShell scrollHeader title="Panel inicial" description="Métricas operativas del negocio y la atención.">
      <section className="grid grid-cols-1 gap-4 md:gap-6 lg:grid-cols-3">
        {showMoney && (
          <div className="flex flex-col gap-4 md:gap-6 lg:col-span-2">
            <DashboardRevenueCards
              monthlyRevenue={businessMetrics.monthlyRevenue}
              weeklyRevenue={businessMetrics.weeklyRevenue}
              todayRevenue={businessMetrics.todayRevenue}
              monthDelta={monthDelta}
              todayDelta={todayDelta}
            />
            <DashboardMainChart
              dailyBusinessSeries={dailyBusinessSeries}
              dailyBusinessCategories={dailyBusinessCategories}
              currencyFormatter={currencyFormatter}
            />
          </div>
        )}
        <div
          className={`flex flex-col gap-4 md:gap-6 ${showMoney ? "" : "lg:col-span-3 lg:grid lg:grid-cols-2"}`}
        >
          <DashboardSecondaryStats
            openRepairNotes={businessMetrics.openRepairNotes}
            criticalStockItems={businessMetrics.criticalStockItems}
            openCashSessions={businessMetrics.openCashSessions}
          />
          <div className="flex-1">
            <DashboardRecentActivity recentActivity={recentActivity} />
          </div>
        </div>
      </section>

      <DashboardConversationStats
        lastInteraction={lastInteraction}
        todayCount={todayCount}
        weekCount={weekCount}
        totalYear={totalYear}
        year={year}
      />

      <DashboardSecondaryCharts
        daily={daily}
        monthly={monthly}
        dailyCategories={dailyCategories}
        monthLabels={monthLabels}
        year={year}
        monthlyBusinessSeries={showMoney ? monthlyBusinessSeries : null}
        currencyFormatter={currencyFormatter}
      />
    </PageShell>
  );
};
