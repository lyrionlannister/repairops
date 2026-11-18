import { Repository } from "typeorm";
import { singleton, inject } from "tsyringe";
import { repositoryToken } from "../../../core/di/repository-token.js";
import { Layaway } from "../entities/layaway.entity.js";
import { TenantScopedDao } from "../../../core/daos/tenant-scoped.dao.js";

@singleton()
export class LayawayDao extends TenantScopedDao<Layaway> {
  constructor(@inject(repositoryToken(Layaway)) repository: Repository<Layaway>) {
    super(repository);
  }

  async findAllOrdered(branchId?: string | null): Promise<Layaway[]> {
    return this.scoped()
      .andWhere(branchId ? "entity.localId = :branchId" : "1 = 1", { branchId })
      .orderBy("entity.createdAt", "DESC")
      .getMany();
  }
}
