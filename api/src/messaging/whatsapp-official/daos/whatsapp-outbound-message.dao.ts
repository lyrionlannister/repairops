import { Repository } from "typeorm";
import { singleton, inject } from "tsyringe";
import { repositoryToken } from "../../../core/di/repository-token.js";
import { WhatsappOutboundMessage } from "../entities/whatsapp-outbound-message.entity.js";
import { TenantScopedDao } from "../../../core/daos/tenant-scoped.dao.js";

@singleton()
export class WhatsappOutboundMessageDao extends TenantScopedDao<WhatsappOutboundMessage> {
  constructor(
    @inject(repositoryToken(WhatsappOutboundMessage))
    repository: Repository<WhatsappOutboundMessage>,
  ) {
    super(repository);
  }

  async findByIdempotencyKey(idempotencyKey: string): Promise<WhatsappOutboundMessage | null> {
    return this.scoped()
      .andWhere("entity.idempotencyKey = :idempotencyKey", { idempotencyKey })
      .getOne();
  }

  // Sin tope superior: el período vigente siempre es "desde periodStart hasta
  // ahora" -- al renovar, el webhook de Stripe adelanta currentPeriodStart, así
  // que este mismo conteo vuelve a arrancar en 0 sin necesitar un corte explícito.
  async countSentSince(periodStart: Date): Promise<number> {
    return this.scoped()
      .andWhere("entity.status = :status", { status: "sent" })
      .andWhere("entity.createdAt >= :periodStart", { periodStart })
      .getCount();
  }

  // El webhook de status de Meta no trae JWT: resuelve el tenant por el
  // meta_message_id antes de poder entrar a runWithTenant -- siempre dentro
  // de allowSystemScope(), mismo criterio que
  // SubscriptionDao.findByStripeCustomerIdAcrossTenants.
  async findByMetaMessageIdAcrossTenants(
    metaMessageId: string,
  ): Promise<WhatsappOutboundMessage | null> {
    return this.repository
      .createQueryBuilder("entity")
      .where("entity.metaMessageId = :metaMessageId", { metaMessageId })
      .getOne();
  }

  // Rango cerrado [start, end): para comparar el periodo actual contra el anterior
  // de la misma duración (trend del dashboard de platform-admin).
  async sumCostBetween(start: Date, end: Date): Promise<string> {
    const row = await this.repository
      .createQueryBuilder("entity")
      .select("COALESCE(SUM(entity.metaCostUsd), 0)", "total")
      .andWhere("entity.createdAt >= :start", { start })
      .andWhere("entity.createdAt < :end", { end })
      .andWhere("entity.metaCostUsd IS NOT NULL")
      .getRawOne<{ total: string }>();
    return row?.total ?? "0";
  }

  // Excepción deliberada al filtro de tenant, solo para el dashboard de
  // platform-admin -- siempre dentro de allowSystemScope().
  async sumCostByTenantSince(since: Date): Promise<WhatsappCostByTenantRow[]> {
    return this.repository
      .createQueryBuilder("entity")
      .innerJoin("entity.tenant", "tenant")
      .select("tenant.id", "tenantId")
      .addSelect("tenant.name", "tenantName")
      .addSelect("COUNT(*)", "messageCount")
      .addSelect("COALESCE(SUM(entity.metaCostUsd), 0)", "totalCostUsd")
      .andWhere("entity.createdAt >= :since", { since })
      .andWhere("entity.metaCostUsd IS NOT NULL")
      .groupBy("tenant.id")
      .addGroupBy("tenant.name")
      .orderBy("totalCostUsd", "DESC")
      .getRawMany<WhatsappCostByTenantRow>();
  }
}

export interface WhatsappCostByTenantRow {
  tenantId: string;
  tenantName: string;
  messageCount: string;
  totalCostUsd: string;
}
