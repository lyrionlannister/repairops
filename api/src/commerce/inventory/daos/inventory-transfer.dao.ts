import { Repository } from "typeorm";
import { singleton, inject } from "tsyringe";
import { repositoryToken } from "../../../core/di/repository-token.js";
import { InventoryTransfer } from "../entities/inventory-transfer.entity.js";
import { TenantScopedDao } from "../../../core/daos/tenant-scoped.dao.js";

@singleton()
export class InventoryTransferDao extends TenantScopedDao<InventoryTransfer> {
  constructor(@inject(repositoryToken(InventoryTransfer)) repository: Repository<InventoryTransfer>) {
    super(repository);
  }

  async findAllOrdered(): Promise<InventoryTransfer[]> {
    return this.scoped().orderBy("entity.createdAt", "DESC").getMany();
  }
}
