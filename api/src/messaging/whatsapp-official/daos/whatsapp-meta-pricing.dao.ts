import { Repository } from "typeorm";
import { singleton, inject } from "tsyringe";
import { repositoryToken } from "../../../core/di/repository-token.js";
import { BaseDao } from "../../../core/daos/base.dao.js";
import {
  WhatsappMetaPricing,
  type WhatsappMetaPricingCategory,
} from "../entities/whatsapp-meta-pricing.entity.js";

// Catálogo de la plataforma, sin tenant_id -- igual criterio que StripePriceDao.
@singleton()
export class WhatsappMetaPricingDao extends BaseDao<WhatsappMetaPricing> {
  constructor(
    @inject(repositoryToken(WhatsappMetaPricing)) repository: Repository<WhatsappMetaPricing>,
  ) {
    super(repository);
  }

  async findByCategory(category: WhatsappMetaPricingCategory): Promise<WhatsappMetaPricing | null> {
    return this.repository.findOneBy({ category });
  }
}
