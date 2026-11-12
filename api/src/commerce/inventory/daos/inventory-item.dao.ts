import { Repository } from "typeorm";
import { InventoryItem } from "../entities/inventory-item.entity.js";
import { TenantScopedDao } from "../../../core/daos/tenant-scoped.dao.js";

export class InventoryItemDao extends TenantScopedDao<InventoryItem> {
  constructor(repository: Repository<InventoryItem>) {
    super(repository);
  }

  async findAllOrdered(): Promise<InventoryItem[]> {
    return this.scoped().orderBy("entity.name", "ASC").getMany();
  }

  async findBySku(sku: string): Promise<InventoryItem | null> {
    return this.scoped().andWhere("entity.sku = :sku", { sku }).getOne();
  }

  async findLowStock(): Promise<InventoryItem[]> {
    return this.scoped()
      .andWhere("entity.minStock > 0")
      .andWhere("entity.quantityOnHand <= entity.minStock")
      .orderBy("entity.name", "ASC")
      .getMany();
  }
}
