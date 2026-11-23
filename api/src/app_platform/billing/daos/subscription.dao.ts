import { Repository } from "typeorm";
import { singleton, inject } from "tsyringe";
import { repositoryToken } from "../../../core/di/repository-token.js";
import { TenantScopedDao } from "../../../core/daos/tenant-scoped.dao.js";
import { Subscription } from "../entities/subscription.entity.js";

@singleton()
export class SubscriptionDao extends TenantScopedDao<Subscription> {
  constructor(@inject(repositoryToken(Subscription)) repository: Repository<Subscription>) {
    super(repository);
  }

  // left, no inner: una subscription de onboarding todavía no tiene plan.
  async findCurrent(): Promise<Subscription | null> {
    return this.scoped("subscription")
      .leftJoinAndSelect("subscription.plan", "plan")
      .innerJoinAndSelect("subscription.tenant", "tenant")
      .getOne();
  }

  // Exige una transacción activa (runInTransaction): TypeORM rechaza el lock fuera de ella.
  async lockCurrent(): Promise<Subscription | null> {
    return this.scoped("subscription")
      .leftJoinAndSelect("subscription.plan", "plan")
      .setLock("pessimistic_write", undefined, ["subscription"])
      .getOne();
  }

  // Excepción deliberada al filtro de tenant, solo para el admin de plataforma y
  // siempre dentro de allowSystemScope(): lista los talleres con su plan.
  async findAllAcrossTenants(): Promise<Subscription[]> {
    return this.repository
      .createQueryBuilder("subscription")
      .leftJoinAndSelect("subscription.plan", "plan")
      .innerJoinAndSelect("subscription.tenant", "tenant")
      .orderBy("tenant.id", "ASC")
      .getMany();
  }

  async findByTenantPublicIdAcrossTenants(tenantPublicId: string): Promise<Subscription | null> {
    return this.repository
      .createQueryBuilder("subscription")
      .innerJoinAndSelect("subscription.tenant", "tenant")
      .where("tenant.publicId = :tenantPublicId", { tenantPublicId })
      .getOne();
  }

  // El webhook de Stripe no trae JWT: resuelve el tenant por el customer antes
  // de poder entrar a runWithTenant -- siempre dentro de allowSystemScope().
  async findByStripeCustomerIdAcrossTenants(
    stripeCustomerId: string,
  ): Promise<Subscription | null> {
    return this.repository
      .createQueryBuilder("subscription")
      .leftJoinAndSelect("subscription.plan", "plan")
      .where("subscription.stripeCustomerId = :stripeCustomerId", { stripeCustomerId })
      .getOne();
  }

  async countByStatusAcrossTenants(): Promise<Array<{ status: string; total: string }>> {
    return this.repository
      .createQueryBuilder("subscription")
      .select("subscription.status", "status")
      .addSelect("COUNT(*)", "total")
      .groupBy("subscription.status")
      .getRawMany();
  }

  // "Taller nuevo" = tenant.createdAt, no subscription.createdAt -- mismo instante en el
  // registro, pero el concepto correcto es cuándo se creó el taller.
  async countCreatedBetween(start: Date, end: Date): Promise<number> {
    return this.repository
      .createQueryBuilder("subscription")
      .innerJoin("subscription.tenant", "tenant")
      .where("tenant.createdAt >= :start", { start })
      .andWhere("tenant.createdAt < :end", { end })
      .getCount();
  }

  async countCanceledBetween(start: Date, end: Date): Promise<number> {
    return this.repository
      .createQueryBuilder("subscription")
      .where("subscription.status = :status", { status: "canceled" })
      .andWhere("subscription.updatedAt >= :start", { start })
      .andWhere("subscription.updatedAt < :end", { end })
      .getCount();
  }

  async findRecentSignupsAcrossTenants(limit: number): Promise<Subscription[]> {
    return this.repository
      .createQueryBuilder("subscription")
      .innerJoinAndSelect("subscription.tenant", "tenant")
      .orderBy("tenant.createdAt", "DESC")
      .limit(limit)
      .getMany();
  }

  async findRecentCanceledAcrossTenants(limit: number): Promise<Subscription[]> {
    return this.repository
      .createQueryBuilder("subscription")
      .innerJoinAndSelect("subscription.tenant", "tenant")
      .where("subscription.status = :status", { status: "canceled" })
      .orderBy("subscription.updatedAt", "DESC")
      .limit(limit)
      .getMany();
  }
}
