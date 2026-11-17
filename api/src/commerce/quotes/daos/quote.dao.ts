import { Repository } from "typeorm";
import { singleton, inject } from "tsyringe";
import { repositoryToken } from "../../../core/di/repository-token.js";
import { Quote } from "../entities/quote.entity.js";
import { TenantScopedDao } from "../../../core/daos/tenant-scoped.dao.js";

@singleton()
export class QuoteDao extends TenantScopedDao<Quote> {
  constructor(@inject(repositoryToken(Quote)) repository: Repository<Quote>) {
    super(repository);
  }

  async findAllOrdered(branchId?: string | null): Promise<Quote[]> {
    return this.scoped()
      .andWhere(branchId ? "entity.localId = :branchId" : "1 = 1", { branchId })
      .orderBy("entity.createdAt", "DESC").getMany();
  }
}
