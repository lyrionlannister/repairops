import { Repository } from "typeorm";
import { singleton, inject } from "tsyringe";
import { repositoryToken } from "../../../core/di/repository-token.js";
import { InventoryItem } from "../entities/inventory-item.entity.js";
import { TenantScopedDao } from "../../../core/daos/tenant-scoped.dao.js";
import { containsPattern } from "../../../core/database/like-pattern.js";
import type { Page, PageRequest } from "../../../core/common/types/page.types.js";
import type { InventoryFilters, InventoryStats } from "../types/inventory-page.types.js";

// Mismo umbral que el conteo "Stock critico" del dashboard (DashboardDao.getOperationalCounts).
const CRITICAL = "entity.quantityOnHand <= GREATEST(entity.minStock, 3)";
const CRITICAL_ITEMS_SHOWN = 10;

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

  async findPage(filters: InventoryFilters, request: PageRequest): Promise<Page<InventoryItem>> {
    const builder = this.filtered(filters).orderBy("entity.name", "ASC").addOrderBy("entity.id", "ASC");
    return this.paginate(builder, request);
  }

  async lookup(filters: InventoryFilters, limit: number): Promise<InventoryItem[]> {
    return this.filtered(filters).orderBy("entity.name", "ASC").addOrderBy("entity.id", "ASC").take(limit).getMany();
  }

  // Valor y conteos se calculan en Postgres (numeric exacto) sobre todo el filtro, no
  // sobre la pagina que tenga la pantalla.
  async stats(filters: InventoryFilters): Promise<InventoryStats> {
    const [totals, criticalItems] = await Promise.all([
      this.filtered(filters)
        .select("COUNT(*)::int", "skuCount")
        .addSelect(
          "COALESCE(SUM(entity.quantityOnHand * entity.costPrice), 0)::numeric(14,2)::text",
          "stockValueAtCost",
        )
        .addSelect(`COUNT(*) FILTER (WHERE ${CRITICAL})::int`, "criticalCount")
        .getRawOne<{ skuCount: number; stockValueAtCost: string; criticalCount: number }>(),
      this.filtered({ ...filters, criticalOnly: true })
        .select(["entity.id", "entity.publicId", "entity.name", "entity.quantityOnHand"])
        .orderBy("entity.quantityOnHand", "ASC")
        .addOrderBy("entity.name", "ASC")
        .take(CRITICAL_ITEMS_SHOWN)
        .getMany(),
    ]);
    return {
      skuCount: Number(totals?.skuCount ?? 0),
      stockValueAtCost: totals?.stockValueAtCost ?? "0.00",
      criticalCount: Number(totals?.criticalCount ?? 0),
      criticalItems,
    };
  }

  private filtered(filters: InventoryFilters) {
    const builder = this.scoped();
    if (filters.branchId) builder.andWhere("entity.localId = :branchId", { branchId: filters.branchId });
    if (filters.supplierId) builder.andWhere("entity.supplierId = :supplierId", { supplierId: filters.supplierId });
    if (filters.criticalOnly) builder.andWhere(CRITICAL);
    if (filters.search) {
      builder.andWhere("(entity.name ILIKE :like OR entity.sku ILIKE :like)", {
        like: containsPattern(filters.search),
      });
    }
    return builder;
  }

  async findLabels(ids: string[]): Promise<Map<string, { name: string; sku: string | null }>> {
    const unique = [...new Set(ids.map(String))];
    if (unique.length === 0) return new Map();
    const items = await this.scoped()
      .select(["entity.id", "entity.name", "entity.sku"])
      .andWhere("entity.id IN (:...ids)", { ids: unique })
      .getMany();
    return new Map(items.map((item) => [String(item.id), { name: item.name, sku: item.sku }]));
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
