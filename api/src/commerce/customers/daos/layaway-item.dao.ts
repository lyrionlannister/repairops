import { Repository } from "typeorm";
import { singleton, inject } from "tsyringe";
import { repositoryToken } from "../../../core/di/repository-token.js";
import { LayawayItem } from "../entities/layaway-item.entity.js";
import { TenantScopedDao } from "../../../core/daos/tenant-scoped.dao.js";

@singleton()
export class LayawayItemDao extends TenantScopedDao<LayawayItem> {
  constructor(@inject(repositoryToken(LayawayItem)) repository: Repository<LayawayItem>) {
    super(repository);
  }

  async findByLayawayId(layawayId: string): Promise<LayawayItem[]> {
    return this.scoped().andWhere("entity.layawayId = :layawayId", { layawayId }).getMany();
  }
}
