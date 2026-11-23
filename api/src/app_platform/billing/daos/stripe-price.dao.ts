import { Repository } from "typeorm";
import { singleton, inject } from "tsyringe";
import { repositoryToken } from "../../../core/di/repository-token.js";
import { BaseDao } from "../../../core/daos/base.dao.js";
import { StripePrice, type StripePriceKey } from "../entities/stripe-price.entity.js";

// Catálogo de la plataforma, sin tenant_id -- igual criterio que PlanDao.
@singleton()
export class StripePriceDao extends BaseDao<StripePrice> {
  constructor(@inject(repositoryToken(StripePrice)) repository: Repository<StripePrice>) {
    super(repository);
  }

  async findByKey(key: StripePriceKey): Promise<StripePrice | null> {
    return this.repository.findOneBy({ key });
  }

  async findByStripePriceId(stripePriceId: string): Promise<StripePrice | null> {
    return this.repository.findOneBy({ stripePriceId });
  }
}
