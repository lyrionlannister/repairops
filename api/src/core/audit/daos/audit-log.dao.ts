import { Repository } from "typeorm";
import { singleton, inject } from "tsyringe";
import { repositoryToken } from "../../di/repository-token.js";
import { AuditLog } from "../entities/audit-log.entity.js";
import { BaseDao } from "../../daos/base.dao.js";

// Sin TenantScopedDao a propósito: los eventos se escriben también sin
// tenant resuelto (login fallido) y la lectura es del platform-admin, no
// de un tenant. Quien escribe pone el tenantId explícito.
@singleton()
export class AuditLogDao extends BaseDao<AuditLog> {
  constructor(@inject(repositoryToken(AuditLog)) repository: Repository<AuditLog>) {
    super(repository);
  }

  async listByTenant(tenantId: string, limit = 100): Promise<AuditLog[]> {
    return this.repository.find({
      where: { tenantId },
      order: { createdAt: "DESC" },
      take: limit,
    });
  }
}
