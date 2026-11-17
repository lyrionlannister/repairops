import { Repository } from "typeorm";
import { singleton, inject } from "tsyringe";
import { repositoryToken } from "../../../core/di/repository-token.js";
import { InventoryItem } from "../entities/inventory-item.entity.js";
import { TenantScopedDao } from "../../../core/daos/tenant-scoped.dao.js";

@singleton()
export class InventoryItemDao extends TenantScopedDao<InventoryItem> {
  constructor(@inject(repositoryToken(InventoryItem)) repository: Repository<InventoryItem>) {
    super(repository);
  }

  async findAllOrdered(branchId?: string | null): Promise<InventoryItem[]> {
    return this.scoped()
      .andWhere(branchId ? "entity.localId = :branchId" : "1 = 1", { branchId })
      .orderBy("entity.name", "ASC").getMany();
  }

  async findBySku(sku: string): Promise<InventoryItem | null> {
    return this.scoped().andWhere("entity.sku = :sku", { sku }).getOne();
  }

  async findByLocalId(localId: string): Promise<InventoryItem[]> {
    return this.scoped().andWhere("entity.localId = :localId", { localId }).orderBy("entity.name", "ASC").getMany();
  }

  async findLowStock(): Promise<InventoryItem[]> {
    return this.scoped()
      .andWhere("entity.minStock > 0")
      .andWhere("entity.quantityOnHand <= entity.minStock")
      .orderBy("entity.name", "ASC")
      .getMany();
  }
}
