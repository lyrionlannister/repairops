import { Repository } from "typeorm";
import { singleton, inject } from "tsyringe";
import { repositoryToken } from "../../../core/di/repository-token.js";
import { SaleItem } from "../entities/sale-item.entity.js";
import { TenantScopedDao } from "../../../core/daos/tenant-scoped.dao.js";

@singleton()
export class SaleItemDao extends TenantScopedDao<SaleItem> {
  constructor(@inject(repositoryToken(SaleItem)) repository: Repository<SaleItem>) {
    super(repository);
  }

  async findBySaleId(saleId: string): Promise<SaleItem[]> {
    return this.scoped().andWhere("entity.saleId = :saleId", { saleId }).getMany();
  }
}
