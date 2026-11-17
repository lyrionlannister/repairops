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

  return (
    <PageShell title="Panel inicial" description="Métricas operativas del negocio y la atención.">
      <div>
        <h2 className="mb-4 text-base font-semibold text-gray-800 dark:text-white/90">Negocio</h2>
        <div className="flex flex-col gap-4 md:gap-6">
          {showMoney && (
            <DashboardRevenueCards
              monthlyRevenue={businessMetrics.monthlyRevenue}
              todayRevenue={businessMetrics.todayRevenue}
              monthDelta={monthDelta}
              todayDelta={todayDelta}
            />
          )}

          <DashboardSecondaryStats
            weeklyRevenue={showMoney ? businessMetrics.weeklyRevenue : null}
            openRepairNotes={businessMetrics.openRepairNotes}
            criticalStockItems={businessMetrics.criticalStockItems}
            openCashSessions={businessMetrics.openCashSessions}
          />

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-3 md:gap-6">
            {showMoney && (
              <div className="lg:col-span-2">
                <DashboardMainChart
                  dailyBusinessSeries={dailyBusinessSeries}
                  dailyBusinessCategories={dailyBusinessCategories}
                  currencyFormatter={currencyFormatter}
                />
              </div>
            )}
            <DashboardRecentActivity recentActivity={recentActivity} />
          </div>
        </div>
      </div>

      <DashboardConversationStats
        lastInteraction={lastInteraction}
        todayCount={todayCount}
        weekCount={weekCount}
        totalYear={totalYear}
        year={year}
        onYearChange={setYear}
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
