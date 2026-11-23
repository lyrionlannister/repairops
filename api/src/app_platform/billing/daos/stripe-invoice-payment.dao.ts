import { Repository } from "typeorm";
import { singleton, inject } from "tsyringe";
import { QueryFailedError } from "typeorm";
import { repositoryToken } from "../../../core/di/repository-token.js";
import { TenantScopedDao } from "../../../core/daos/tenant-scoped.dao.js";
import { StripeInvoicePayment } from "../entities/stripe-invoice-payment.entity.js";

export interface RevenueByPlanRow {
  planKey: string;
  billingInterval: "month" | "year";
  total: string;
}

@singleton()
export class StripeInvoicePaymentDao extends TenantScopedDao<StripeInvoicePayment> {
  constructor(
    @inject(repositoryToken(StripeInvoicePayment)) repository: Repository<StripeInvoicePayment>,
  ) {
    super(repository);
  }

  // Insert-first por stripe_invoice_id: un reintento del webhook de Stripe no
  // debe contarse dos veces en el dashboard de ingresos.
  async claim(data: Partial<StripeInvoicePayment>): Promise<boolean> {
    try {
      await this.create(data);
      return true;
    } catch (error) {
      if (error instanceof QueryFailedError && (error as { code?: string }).code === "23505") {
        return false;
      }
      throw error;
    }
  }

  // Excepción deliberada al filtro de tenant, solo para el dashboard de
  // platform-admin -- siempre dentro de allowSystemScope().
  async sumSince(since: Date): Promise<string> {
    const row = await this.repository
      .createQueryBuilder("entity")
      .select("COALESCE(SUM(entity.amount), 0)", "total")
      .andWhere("entity.paidAt >= :since", { since })
      .getRawOne<{ total: string }>();
    return row?.total ?? "0";
  }

  // Rango cerrado [start, end): para comparar el periodo actual contra el anterior
  // de la misma duración (trend del dashboard de platform-admin).
  async sumBetween(start: Date, end: Date): Promise<string> {
    const row = await this.repository
      .createQueryBuilder("entity")
      .select("COALESCE(SUM(entity.amount), 0)", "total")
      .andWhere("entity.paidAt >= :start", { start })
      .andWhere("entity.paidAt < :end", { end })
      .getRawOne<{ total: string }>();
    return row?.total ?? "0";
  }

  async revenueByPlanSince(since: Date): Promise<RevenueByPlanRow[]> {
    return this.repository
      .createQueryBuilder("entity")
      .select("entity.planKey", "planKey")
      .addSelect("entity.billingInterval", "billingInterval")
      .addSelect("COALESCE(SUM(entity.amount), 0)", "total")
      .andWhere("entity.paidAt >= :since", { since })
      .groupBy("entity.planKey")
      .addGroupBy("entity.billingInterval")
      .getRawMany<RevenueByPlanRow>();
  }

  async findRecent(limit: number): Promise<StripeInvoicePayment[]> {
    return this.repository
      .createQueryBuilder("entity")
      .innerJoinAndSelect("entity.tenant", "tenant")
      .orderBy("entity.paidAt", "DESC")
      .limit(limit)
      .getMany();
  }
}
