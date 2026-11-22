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

  async findCurrent(): Promise<Subscription | null> {
    return this.scoped("subscription").innerJoinAndSelect("subscription.plan", "plan").getOne();
  }

  // Exige una transacción activa (runInTransaction): TypeORM rechaza el lock fuera de ella.
  async lockCurrent(): Promise<Subscription | null> {
    return this.scoped("subscription")
      .innerJoinAndSelect("subscription.plan", "plan")
      .setLock("pessimistic_write", undefined, ["subscription"])
      .getOne();
  }

  // Excepción deliberada al filtro de tenant, solo para el admin de plataforma y
  // siempre dentro de allowSystemScope(): lista los talleres con su plan.
  async findAllAcrossTenants(): Promise<Subscription[]> {
    return this.repository
      .createQueryBuilder("subscription")
      .innerJoinAndSelect("subscription.plan", "plan")
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
}
