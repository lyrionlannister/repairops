import { singleton } from "tsyringe";
import { Decimal } from "decimal.js";
import { allowSystemScope } from "../../../core/tenancy/tenant-context.js";
import { SubscriptionDao } from "../daos/subscription.dao.js";
import {
  StripeInvoicePaymentDao,
  type RevenueByPlanRow,
} from "../daos/stripe-invoice-payment.dao.js";
import { WhatsappOutboundMessageDao } from "../../../messaging/whatsapp-official/daos/whatsapp-outbound-message.dao.js";

export const DASHBOARD_PERIOD_DAYS = [7, 30, 90] as const;
export type DashboardPeriodDays = (typeof DASHBOARD_PERIOD_DAYS)[number];
const DEFAULT_PERIOD_DAYS: DashboardPeriodDays = 30;
const DAY_MS = 24 * 60 * 60 * 1000;

export interface Trend {
  pct: number;
  up: boolean;
}

export interface RecentPayment {
  tenantName: string;
  planKey: string;
  billingInterval: string;
  amount: string;
  currency: string;
  paidAt: Date;
}

export interface WhatsappCostByTenant {
  tenantName: string;
  messageCount: number;
  totalCostUsd: string;
}

export interface ActivityItem {
  kind: "signup" | "payment" | "cancellation";
  tenantName: string;
  amount?: string;
  occurredAt: Date;
}

export interface BillingOverview {
  days: DashboardPeriodDays;
  revenue: string;
  revenueTrend: Trend | null;
  newTenants: number;
  newTenantsTrend: Trend | null;
  whatsappCostTotal: string;
  whatsappCostTrend: Trend | null;
  canceledTenants: number;
  canceledTenantsTrend: Trend | null;
  subscriptionsByStatus: Record<string, number>;
  revenueByPlan: RevenueByPlanRow[];
  recentPayments: RecentPayment[];
  whatsappCostByTenant: WhatsappCostByTenant[];
  recentActivity: ActivityItem[];
}

// Porcentaje de cambio con Decimal contra el periodo previo de igual duración; sin
// periodo previo (0) no hay badge -- no se inventa un %. Mismo criterio que
// reporting/dashboard/services/dashboard.service.ts (trendOf), duplicado a
// propósito: son contextos distintos (billing vs reporting operativo), no vale
// la pena acoplarlos por una función de 6 líneas.
function trendOf(current: string, previous: string): Trend | null {
  const prev = new Decimal(previous);
  if (prev.isZero()) return null;
  const pct = new Decimal(current).minus(prev).dividedBy(prev.abs()).times(100);
  return { pct: Math.round(pct.abs().toNumber()), up: !pct.isNegative() };
}

// Para el dashboard SaaS del platform-admin -- "ingresos" es lo efectivamente
// cobrado en el periodo (stripe_invoice_payments, ledger real), no un MRR
// proyectado a partir de las subscripciones activas. El gasto de WhatsApp es el
// costo real que Meta cobra a la plataforma (no lo que el tenant paga por su
// paquete, eso es stripe_invoice_payments/whatsapp_message_packages -- el otro
// lado del flujo de dinero), por tenant sin importar si usa la cuenta
// compartida o la propia. No hay tasa de cancelación (requeriría snapshots de
// estado que hoy no se guardan) ni embudo de marketing (no hay tracking de
// anuncios/sesiones) -- mejor no mostrarlo que inventar un número.
@singleton()
export class BillingDashboardService {
  constructor(
    private subscriptionDao: SubscriptionDao,
    private stripeInvoicePaymentDao: StripeInvoicePaymentDao,
    private whatsappOutboundMessageDao: WhatsappOutboundMessageDao,
  ) {}

  async getOverview(days: DashboardPeriodDays = DEFAULT_PERIOD_DAYS): Promise<BillingOverview> {
    const now = new Date();
    const since = new Date(now.getTime() - days * DAY_MS);
    const previousSince = new Date(now.getTime() - 2 * days * DAY_MS);

    const [
      statusRows,
      revenue,
      previousRevenue,
      revenueByPlan,
      recentPayments,
      whatsappCostByTenant,
      whatsappCostTotal,
      previousWhatsappCostTotal,
      newTenants,
      previousNewTenants,
      canceledTenants,
      previousCanceledTenants,
      recentSignups,
      recentCanceled,
    ] = await allowSystemScope(() =>
      Promise.all([
        this.subscriptionDao.countByStatusAcrossTenants(),
        this.stripeInvoicePaymentDao.sumBetween(since, now),
        this.stripeInvoicePaymentDao.sumBetween(previousSince, since),
        this.stripeInvoicePaymentDao.revenueByPlanSince(since),
        this.stripeInvoicePaymentDao.findRecent(10),
        this.whatsappOutboundMessageDao.sumCostByTenantSince(since),
        this.whatsappOutboundMessageDao.sumCostBetween(since, now),
        this.whatsappOutboundMessageDao.sumCostBetween(previousSince, since),
        this.subscriptionDao.countCreatedBetween(since, now),
        this.subscriptionDao.countCreatedBetween(previousSince, since),
        this.subscriptionDao.countCanceledBetween(since, now),
        this.subscriptionDao.countCanceledBetween(previousSince, since),
        this.subscriptionDao.findRecentSignupsAcrossTenants(5),
        this.subscriptionDao.findRecentCanceledAcrossTenants(5),
      ]),
    );

    const subscriptionsByStatus = Object.fromEntries(
      statusRows.map((row) => [row.status, Number(row.total)]),
    );

    const activity: ActivityItem[] = [
      ...recentPayments.map((payment) => ({
        kind: "payment" as const,
        tenantName: payment.tenant!.name,
        amount: payment.amount,
        occurredAt: payment.paidAt,
      })),
      ...recentSignups.map((subscription) => ({
        kind: "signup" as const,
        tenantName: subscription.tenant!.name,
        occurredAt: subscription.tenant!.createdAt,
      })),
      ...recentCanceled.map((subscription) => ({
        kind: "cancellation" as const,
        tenantName: subscription.tenant!.name,
        occurredAt: subscription.updatedAt,
      })),
    ]
      .sort((a, b) => b.occurredAt.getTime() - a.occurredAt.getTime())
      .slice(0, 8);

    return {
      days,
      revenue,
      revenueTrend: trendOf(revenue, previousRevenue),
      newTenants,
      newTenantsTrend: trendOf(String(newTenants), String(previousNewTenants)),
      whatsappCostTotal,
      whatsappCostTrend: trendOf(whatsappCostTotal, previousWhatsappCostTotal),
      canceledTenants,
      canceledTenantsTrend: trendOf(String(canceledTenants), String(previousCanceledTenants)),
      subscriptionsByStatus,
      revenueByPlan,
      recentPayments: recentPayments.map((payment) => ({
        tenantName: payment.tenant!.name,
        planKey: payment.planKey,
        billingInterval: payment.billingInterval,
        amount: payment.amount,
        currency: payment.currency,
        paidAt: payment.paidAt,
      })),
      whatsappCostByTenant: whatsappCostByTenant.map((row) => ({
        tenantName: row.tenantName,
        messageCount: Number(row.messageCount),
        totalCostUsd: row.totalCostUsd,
      })),
      recentActivity: activity,
    };
  }
}
