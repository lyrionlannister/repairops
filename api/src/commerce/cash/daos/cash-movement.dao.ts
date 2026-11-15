import { Repository } from "typeorm";
import { singleton, inject } from "tsyringe";
import { repositoryToken } from "../../../core/di/repository-token.js";
import { CashMovement } from "../entities/cash-movement.entity.js";
import { TenantScopedDao } from "../../../core/daos/tenant-scoped.dao.js";

@singleton()
export class CashMovementDao extends TenantScopedDao<CashMovement> {
  constructor(@inject(repositoryToken(CashMovement)) repository: Repository<CashMovement>) {
    super(repository);
  }

  async findBySession(cashSessionId: string): Promise<CashMovement[]> {
    return this.scoped()
      .andWhere("entity.cashSessionId = :cashSessionId", { cashSessionId })
      .orderBy("entity.createdAt", "ASC")
      .getMany();
  }
}
