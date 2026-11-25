import { Repository } from "typeorm";
import { singleton, inject } from "tsyringe";
import { repositoryToken } from "../../../core/di/repository-token.js";
import { Layaway } from "../entities/layaway.entity.js";
import { TenantScopedDao } from "../../../core/daos/tenant-scoped.dao.js";
import { Customer } from "../entities/customer.entity.js";
import { containsPattern } from "../../../core/database/like-pattern.js";
import type { Page, PageRequest } from "../../../core/common/types/page.types.js";
import type { LayawayFilters, LayawayListRow } from "../types/layaway-page.types.js";

@singleton()
export class LayawayDao extends TenantScopedDao<Layaway> {
  constructor(@inject(repositoryToken(Layaway)) repository: Repository<Layaway>) {
    super(repository);
  }

  async findPage(filters: LayawayFilters, request: PageRequest): Promise<Page<LayawayListRow>> {
    const builder = this.scoped()
      .leftJoinAndMapOne(
        "entity.customer",
        Customer,
        "customer",
        "customer.id = entity.customerId AND customer.tenantId = entity.tenantId",
      );
    if (filters.branchId) builder.andWhere("entity.localId = :branchId", { branchId: filters.branchId });
    if (filters.customerId) builder.andWhere("entity.customerId = :customerId", { customerId: filters.customerId });
    if (filters.status) builder.andWhere("entity.status = :status", { status: filters.status });
    if (filters.search) builder.andWhere("customer.name ILIKE :like", { like: containsPattern(filters.search) });
    const page = await this.paginate(builder.orderBy("entity.createdAt", "DESC").addOrderBy("entity.id", "DESC"), request);
    return {
      ...page,
      items: page.items.map((row) => {
        const { customer, ...layaway } = row as typeof row & { customer?: Customer };
        return Object.assign(Object.create(Object.getPrototypeOf(row)), layaway, {
          customerName: customer?.name ?? null,
        }) as LayawayListRow;
      }),
    };
  }

  async findOpenDue(today: string): Promise<Layaway[]> {
    return this.scoped()
      .andWhere("entity.status = 'open'")
      .andWhere("entity.expiresAt < :today", { today })
      .getMany();
  }

  async findAllOrdered(branchId?: string | null, customerId?: string): Promise<Layaway[]> {
    return this.scoped()
      .andWhere(branchId ? "entity.localId = :branchId" : "1 = 1", { branchId })
      .andWhere(customerId ? "entity.customerId = :customerId" : "1 = 1", { customerId })
      .orderBy("entity.createdAt", "DESC")
      .getMany();
  }
}
