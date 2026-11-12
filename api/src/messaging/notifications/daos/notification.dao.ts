import { Repository } from "typeorm";
import { singleton, inject } from "tsyringe";
import { repositoryToken } from "../../../core/di/repository-token.js";
import { Notification } from "../entities/notification.entity.js";
import { TenantScopedDao } from "../../../core/daos/tenant-scoped.dao.js";

@singleton()
export class NotificationDao extends TenantScopedDao<Notification> {
  constructor(@inject(repositoryToken(Notification)) repository: Repository<Notification>) {
    super(repository);
  }

  async findAllOrdered(unreadOnly = false): Promise<Notification[]> {
    const query = this.scoped().orderBy("entity.createdAt", "DESC").take(50);
    if (unreadOnly) query.andWhere("entity.read = false");
    return query.getMany();
  }

  async markAllRead(): Promise<void> {
    const tenantId = this.currentTenantId();
    await this.repository
      .createQueryBuilder()
      .update()
      .set({ read: true })
      .where("read = false AND tenant_id = :tenantId", { tenantId })
      .execute();
  }
}
