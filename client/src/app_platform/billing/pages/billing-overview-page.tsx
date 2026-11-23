import { useEffect } from "react";
import { PageShell } from "@common/components/page-shell/page-shell";
import { Button } from "@ui/button/button";
import { useBillingOverview } from "../hooks/use-billing-overview";
import { PeriodToggle } from "../components/period-toggle";
import { BillingKpiCards } from "../components/billing-kpi-cards";
import { SubscriptionStatusDonut } from "../components/subscription-status-donut";
import { BillingRevenueChart } from "../components/billing-revenue-chart";
import { RecentPaymentsTable } from "../components/recent-payments-table";
import { WhatsappCostTable } from "../components/whatsapp-cost-table";
import { BillingActivityFeed } from "../components/billing-activity-feed";

export const BillingOverviewPage: React.FC = () => {
  const { overview, days, loading, error, fetchOverview, changePeriod } = useBillingOverview();

  useEffect(() => {
    fetchOverview();
  }, [fetchOverview]);

  return (
    <PageShell
      scrollHeader
      title="Panel SaaS"
      description="Ingresos, gasto y estado de suscripción de todos los talleres."
      action={<PeriodToggle value={days} disabled={loading} onChange={changePeriod} />}
    >
      {loading && !overview ? (
        <p className="p-10 text-center text-sm text-gray-500 dark:text-gray-400">Cargando...</p>
      ) : error || !overview ? (
        <div className="flex flex-col items-center justify-center gap-4 p-10 text-center">
          <p className="text-sm text-error-500">{error ?? "No se pudo cargar el panel"}</p>
          <Button variant="secondary" onClick={() => fetchOverview()}>
            Reintentar
          </Button>
        </div>
      ) : (
        <div className="flex flex-col gap-4 md:gap-6">
          <BillingKpiCards
            revenue={overview.revenue}
            revenueTrend={overview.revenueTrend}
            newTenants={overview.newTenants}
            newTenantsTrend={overview.newTenantsTrend}
            whatsappCostTotal={overview.whatsappCostTotal}
            whatsappCostTrend={overview.whatsappCostTrend}
            canceledTenants={overview.canceledTenants}
            canceledTenantsTrend={overview.canceledTenantsTrend}
          />

          <div className="grid grid-cols-1 gap-4 md:gap-6 xl:grid-cols-3">
            <div className="flex flex-col gap-4 md:gap-6 xl:col-span-2">
              <BillingRevenueChart rows={overview.revenueByPlan} days={overview.days} />
              <RecentPaymentsTable payments={overview.recentPayments} />
              <WhatsappCostTable rows={overview.whatsappCostByTenant} days={overview.days} />
            </div>
            <div className="flex flex-col gap-4 md:gap-6">
              <SubscriptionStatusDonut subscriptionsByStatus={overview.subscriptionsByStatus} />
              <BillingActivityFeed activity={overview.recentActivity} />
            </div>
          </div>
        </div>
      )}
    </PageShell>
  );
};
