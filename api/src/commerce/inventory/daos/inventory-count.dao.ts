import { Repository } from "typeorm";
import { singleton, inject } from "tsyringe";
import { repositoryToken } from "../../../core/di/repository-token.js";
import { InventoryCount } from "../entities/inventory-count.entity.js";
import { TenantScopedDao } from "../../../core/daos/tenant-scoped.dao.js";

@singleton()
export class InventoryCountDao extends TenantScopedDao<InventoryCount> {
  constructor(@inject(repositoryToken(InventoryCount)) repository: Repository<InventoryCount>) {
    super(repository);
  }

  async findOpenByBranch(branchId: string): Promise<InventoryCount | null> {
    return this.scoped()
      .andWhere("entity.branchId = :branchId AND entity.status = 'open'", { branchId })
      .getOne();
  }

  async findAllOrdered(): Promise<InventoryCount[]> {
    return this.scoped().orderBy("entity.openedAt", "DESC").getMany();
  }
}
