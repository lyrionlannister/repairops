import { Repository } from "typeorm";
import { singleton, inject } from "tsyringe";
import { repositoryToken } from "../../../core/di/repository-token.js";
import { PriceListItem } from "../entities/price-list-item.entity.js";
import { TenantScopedDao } from "../../../core/daos/tenant-scoped.dao.js";
import type { PriceListItemInput } from "../types/price-list-item-input.types.js";

@singleton()
export class PriceListDao extends TenantScopedDao<PriceListItem> {
  constructor(@inject(repositoryToken(PriceListItem)) repository: Repository<PriceListItem>) {
    super(repository);
  }

  async findAllOrdered(): Promise<PriceListItem[]> {
    return this.scoped()
      .leftJoinAndSelect("entity.supplier", "supplier")
      .orderBy("entity.brand", "ASC")
      .addOrderBy("entity.model", "ASC")
      .getMany();
  }

  async searchByModel(query: string): Promise<PriceListItem[]> {
    return this.scoped()
      .leftJoinAndSelect("entity.supplier", "supplier")
      .andWhere("entity.model ILIKE :query", { query: `%${query}%` })
      .orderBy("entity.brand", "ASC")
      .addOrderBy("entity.model", "ASC")
      .take(20)
      .getMany();
  }

  async replaceForSupplier(supplierId: string, items: PriceListItemInput[]): Promise<void> {
    const tenantId = this.currentTenantId();
    await this.repository.manager.transaction(async (manager) => {
      await manager
        .createQueryBuilder()
        .delete()
        .from(PriceListItem)
        .where("id_proveedor = :supplierId AND tenant_id = :tenantId", { supplierId, tenantId })
        .execute();
      const entities = items.map((item) =>
        manager.create(PriceListItem, {
          brand: item.brand,
          model: item.model,
          price: item.price,
          supplierId,
          tenantId,
        }),
      );
      await manager.save(entities, { chunk: 100 });
    });
  }
}
