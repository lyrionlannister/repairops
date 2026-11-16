import { Repository } from "typeorm";
import { singleton, inject } from "tsyringe";
import { repositoryToken } from "../../../core/di/repository-token.js";
import { ReturnItem } from "../entities/return-item.entity.js";
import { TenantScopedDao } from "../../../core/daos/tenant-scoped.dao.js";

@singleton()
export class ReturnItemDao extends TenantScopedDao<ReturnItem> {
  constructor(@inject(repositoryToken(ReturnItem)) repository: Repository<ReturnItem>) {
    super(repository);
  }

  async findByReturnId(returnId: string): Promise<ReturnItem[]> {
    return this.scoped().andWhere("entity.returnId = :returnId", { returnId }).getMany();
  }

  // Suma lo ya devuelto de una linea de venta a traves de TODAS sus
  // devoluciones previas -- nunca un campo cacheado en SaleItem (prohibicion
  // explicita de SPEC-pos-sale-cycle.md). El caller (ReturnService) corre
  // esto bajo el lock pesimista de SaleItem para que sea seguro bajo
  // concurrencia.
  async sumReturnedQuantityForSaleItem(saleItemId: string): Promise<number> {
    const row = await this.scoped()
      .select("COALESCE(SUM(entity.quantity), 0)", "total")
      .andWhere("entity.saleItemId = :saleItemId", { saleItemId })
      .getRawOne<{ total: string }>();
    return Number(row?.total ?? 0);
  }
}
