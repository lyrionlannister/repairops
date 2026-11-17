import { Repository } from "typeorm";
import { singleton, inject } from "tsyringe";
import { repositoryToken } from "../../../core/di/repository-token.js";
import { QuoteServiceType } from "../entities/quote-service-type.entity.js";
import { TenantScopedDao } from "../../../core/daos/tenant-scoped.dao.js";

@singleton()
export class QuoteServiceTypeDao extends TenantScopedDao<QuoteServiceType> {
  constructor(@inject(repositoryToken(QuoteServiceType)) repository: Repository<QuoteServiceType>) {
    super(repository);
  }

  async findByQuoteId(quoteId: string): Promise<QuoteServiceType[]> {
    return this.scoped().andWhere("entity.quoteId = :quoteId", { quoteId }).getMany();
  }
}
