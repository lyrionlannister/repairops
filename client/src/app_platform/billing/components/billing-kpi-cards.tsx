import type { FC } from "react";
import { Wallet, Building2, MessageCircle, UserX } from "lucide-react";
import { StatCard } from "@/home/components/stat-card";
import { formatMoney, formatUsd, invertTrendDirection } from "../utils/format";
import type { BillingKpiCardsProps } from "../props/billing-kpi-cards-props";

export const BillingKpiCards: FC<BillingKpiCardsProps> = ({
  revenue,
  revenueTrend,
  newTenants,
  newTenantsTrend,
  whatsappCostTotal,
  whatsappCostTrend,
  canceledTenants,
  canceledTenantsTrend,
}) => (
  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:gap-6 xl:grid-cols-4">
    <StatCard
      icon={<Wallet />}
      iconTone="bg-brand-50 text-brand-600 dark:bg-brand-500/10 dark:text-brand-400"
      label="Ingresos cobrados"
      value={formatMoney(revenue)}
      trend={revenueTrend}
    />
    <StatCard
      icon={<Building2 />}
      iconTone="bg-success-50 text-success-600 dark:bg-success-500/10 dark:text-success-400"
      label="Talleres nuevos"
      value={newTenants}
      trend={newTenantsTrend}
    />
    <StatCard
      icon={<MessageCircle />}
      iconTone="bg-violet-50 text-violet-600 dark:bg-violet-500/10 dark:text-violet-400"
      label="Gasto WhatsApp (Meta)"
      value={formatUsd(whatsappCostTotal)}
      trend={invertTrendDirection(whatsappCostTrend)}
    />
    <StatCard
      icon={<UserX />}
      iconTone="bg-error-50 text-error-600 dark:bg-error-500/10 dark:text-error-400"
      label="Talleres cancelados"
      value={canceledTenants}
      trend={invertTrendDirection(canceledTenantsTrend)}
    />
  </div>
);
