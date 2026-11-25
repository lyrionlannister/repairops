import { Repository } from "typeorm";
import { singleton, inject } from "tsyringe";
import { repositoryToken } from "../../../core/di/repository-token.js";
import { Sale } from "../entities/sale.entity.js";
import { TenantScopedDao } from "../../../core/daos/tenant-scoped.dao.js";
import { containsPattern } from "../../../core/database/like-pattern.js";
import type { Page, PageRequest } from "../../../core/common/types/page.types.js";
import type { SaleFilters, SaleStats } from "../types/sale-page.types.js";

@singleton()
export class SaleDao extends TenantScopedDao<Sale> {
  constructor(@inject(repositoryToken(Sale)) repository: Repository<Sale>) {
    super(repository);
  }

  async findAllOrdered(branchId?: string | null, customerId?: string): Promise<Sale[]> {
    return this.scoped()
      .andWhere(branchId ? "entity.localId = :branchId" : "1 = 1", { branchId })
      .andWhere(customerId ? "entity.customerId = :customerId" : "1 = 1", { customerId })
      .orderBy("entity.createdAt", "DESC").getMany();
  }

  async findPage(filters: SaleFilters, request: PageRequest): Promise<Page<Sale>> {
    const builder = this.filtered(filters).orderBy("entity.createdAt", "DESC").addOrderBy("entity.id", "DESC");
    return this.paginate(builder, request);
  }

  // Suma en Postgres (numeric exacto): llega como texto, nunca pasa por float.
  async stats(filters: SaleFilters): Promise<SaleStats> {
    const row = await this.filtered(filters)
      .select("COUNT(*)::int", "count")
      .addSelect("COALESCE(SUM(entity.totalValue), 0)::numeric(14,2)::text", "total")
      .getRawOne<SaleStats>();
    return { count: Number(row?.count ?? 0), total: row?.total ?? "0.00" };
  }

  private filtered(filters: SaleFilters) {
    const builder = this.scoped();
    if (filters.branchId) builder.andWhere("entity.localId = :branchId", { branchId: filters.branchId });
    if (filters.customerId) builder.andWhere("entity.customerId = :customerId", { customerId: filters.customerId });
    if (filters.createdByEmployeeId) {
      builder.andWhere("entity.createdByEmployeeId = :createdByEmployeeId", {
        createdByEmployeeId: filters.createdByEmployeeId,
      });
    }
    if (filters.currentMonthIn) {
      builder.andWhere(
        "(entity.fecha_creacion AT TIME ZONE 'UTC' AT TIME ZONE :tz) >= date_trunc('month', now() AT TIME ZONE :tz)",
        { tz: filters.currentMonthIn },
      );
    }
    if (filters.search) {
      builder.andWhere("(entity.customerName ILIKE :like OR CAST(entity.saleNumber AS text) LIKE :like)", {
        like: containsPattern(filters.search),
      });
    }
    return builder;
  }

  async findByIdempotencyKey(idempotencyKey: string): Promise<Sale | null> {
    return this.scoped().andWhere("entity.idempotencyKey = :idempotencyKey", { idempotencyKey }).getOne();
  }
}
