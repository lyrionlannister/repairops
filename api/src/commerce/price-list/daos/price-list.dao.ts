import { Repository } from "typeorm";
import { singleton, inject } from "tsyringe";
import { repositoryToken } from "../../../core/di/repository-token.js";
import { PriceListItem } from "../entities/price-list-item.entity.js";
import { TenantScopedDao } from "../../../core/daos/tenant-scoped.dao.js";
import type { PriceListItemInput } from "../types/price-list-item-input.types.js";
import type { PriceListFilters } from "../types/price-list-page.types.js";
import { containsPattern } from "../../../core/database/like-pattern.js";
import type { Page, PageRequest } from "../../../core/common/types/page.types.js";

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

  async findPage(filters: PriceListFilters, request: PageRequest): Promise<Page<PriceListItem>> {
    const builder = this.scoped().leftJoinAndSelect("entity.supplier", "supplier");
    if (filters.brand) builder.andWhere("entity.brand = :brand", { brand: filters.brand });
    if (filters.supplierId) builder.andWhere("entity.supplierId = :supplierId", { supplierId: filters.supplierId });
    if (filters.search) {
      builder.andWhere("(entity.model ILIKE :like OR entity.brand ILIKE :like)", {
        like: containsPattern(filters.search),
      });
    }
    builder.orderBy("entity.brand", "ASC").addOrderBy("entity.model", "ASC").addOrderBy("entity.id", "ASC");
    return this.paginate(builder, request);
  }

  async findWithSupplier(id: string): Promise<PriceListItem | null> {
    return this.scoped()
      .leftJoinAndSelect("entity.supplier", "supplier")
      .andWhere("entity.id = :id", { id })
      .getOne();
  }

  async distinctBrands(): Promise<string[]> {
    const rows = await this.scoped()
      .select("DISTINCT entity.brand", "brand")
      .orderBy("entity.brand", "ASC")
      .getRawMany<{ brand: string }>();
    return rows.map((row) => row.brand);
  }

  async searchByModel(query: string): Promise<PriceListItem[]> {
    return this.scoped()
      .leftJoinAndSelect("entity.supplier", "supplier")
      .andWhere("entity.model ILIKE :query", { query: containsPattern(query) })
      .orderBy("entity.brand", "ASC")
      .addOrderBy("entity.model", "ASC")
      .take(20)
      .getMany();
  }

  // Resolución del precio de lista aplicable a un item de inventario: la
  // lista de precios no tiene FK al item (solo proveedor + marca/modelo), así
  // que el vínculo es proveedor del item + modelo igual al nombre del item.
  // Si no hay fila, no hay precio de lista aplicable y manda precio_venta.
  async findBySupplierAndModel(supplierId: string, model: string): Promise<PriceListItem | null> {
    return this.scoped()
      .andWhere("entity.supplierId = :supplierId", { supplierId })
      .andWhere("entity.model = :model", { model })
      .getOne();
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
