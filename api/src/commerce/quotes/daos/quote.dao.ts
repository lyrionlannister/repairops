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

  async findAllOrdered(): Promise<Quote[]> {
    return this.scoped().orderBy("entity.createdAt", "DESC").getMany();
  }
}
