import { Repository } from "typeorm";
import { singleton, inject } from "tsyringe";
import { repositoryToken } from "../../../core/di/repository-token.js";
import { InventoryMovement } from "../entities/inventory-movement.entity.js";
import { TenantScopedDao } from "../../../core/daos/tenant-scoped.dao.js";

@singleton()
export class InventoryMovementDao extends TenantScopedDao<InventoryMovement> {
  constructor(@inject(repositoryToken(InventoryMovement)) repository: Repository<InventoryMovement>) {
    super(repository);
  }

  async findByItem(inventoryItemId: string): Promise<InventoryMovement[]> {
    return this.scoped()
      .andWhere("entity.inventoryItemId = :inventoryItemId", { inventoryItemId })
      .orderBy("entity.createdAt", "DESC")
      .getMany();
  }
}
