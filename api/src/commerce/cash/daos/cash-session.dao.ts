import { Repository } from "typeorm";
import { singleton, inject } from "tsyringe";
import { repositoryToken } from "../../../core/di/repository-token.js";
import { CashSession } from "../entities/cash-session.entity.js";
import { TenantScopedDao } from "../../../core/daos/tenant-scoped.dao.js";

@singleton()
export class CashSessionDao extends TenantScopedDao<CashSession> {
  constructor(@inject(repositoryToken(CashSession)) repository: Repository<CashSession>) {
    super(repository);
  }

  async findOpenByLocal(localId: string): Promise<CashSession | null> {
    return this.scoped()
      .andWhere("entity.localId = :localId", { localId })
      .andWhere("entity.status = 'open'")
      .getOne();
  }

  async findAllOrdered(branchId?: string | null): Promise<CashSession[]> {
    return this.scoped()
      .andWhere(branchId ? "entity.localId = :branchId" : "1 = 1", { branchId })
      .orderBy("entity.openedAt", "DESC").getMany();
  }
}
