import { Repository } from "typeorm";
import { singleton, inject } from "tsyringe";
import { repositoryToken } from "../../../core/di/repository-token.js";
import { QuoteItem } from "../entities/quote-item.entity.js";
import { TenantScopedDao } from "../../../core/daos/tenant-scoped.dao.js";

@singleton()
export class QuoteItemDao extends TenantScopedDao<QuoteItem> {
  constructor(@inject(repositoryToken(QuoteItem)) repository: Repository<QuoteItem>) {
    super(repository);
  }

  async findByQuoteId(quoteId: string): Promise<QuoteItem[]> {
    return this.scoped().andWhere("entity.quoteId = :quoteId", { quoteId }).getMany();
  }
}
