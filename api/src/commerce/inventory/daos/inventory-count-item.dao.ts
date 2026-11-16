import { Repository } from "typeorm";
import { singleton, inject } from "tsyringe";
import { repositoryToken } from "../../../core/di/repository-token.js";
import { InventoryCountItem } from "../entities/inventory-count-item.entity.js";
import { TenantScopedDao } from "../../../core/daos/tenant-scoped.dao.js";

@singleton()
export class InventoryCountItemDao extends TenantScopedDao<InventoryCountItem> {
  constructor(@inject(repositoryToken(InventoryCountItem)) repository: Repository<InventoryCountItem>) {
    super(repository);
  }

  async findByCountId(countId: string): Promise<InventoryCountItem[]> {
    return this.scoped().andWhere("entity.countId = :countId", { countId }).getMany();
  }
}
