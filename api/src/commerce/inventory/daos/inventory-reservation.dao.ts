import { Repository } from "typeorm";
import { singleton, inject } from "tsyringe";
import { repositoryToken } from "../../../core/di/repository-token.js";
import { InventoryReservation, InventoryReservationRelatedEntityType } from "../entities/inventory-reservation.entity.js";
import { TenantScopedDao } from "../../../core/daos/tenant-scoped.dao.js";

@singleton()
export class InventoryReservationDao extends TenantScopedDao<InventoryReservation> {
  constructor(@inject(repositoryToken(InventoryReservation)) repository: Repository<InventoryReservation>) {
    super(repository);
  }

  async findByRelatedEntity(
    relatedEntityType: InventoryReservationRelatedEntityType,
    relatedEntityId: string,
  ): Promise<InventoryReservation | null> {
    return this.scoped()
      .andWhere("entity.relatedEntityType = :relatedEntityType", { relatedEntityType })
      .andWhere("entity.relatedEntityId = :relatedEntityId", { relatedEntityId })
      .getOne();
  }

  // Suma de reservas activas de un item -- nunca cacheada, siempre calculada
  // (ver InventoryService.getAvailableQuantity).
  async sumActiveQuantityForItem(inventoryItemId: string): Promise<number> {
    const row = await this.scoped()
      .select("COALESCE(SUM(entity.quantity), 0)", "total")
      .andWhere("entity.inventoryItemId = :inventoryItemId", { inventoryItemId })
      .andWhere("entity.status = 'active'")
      .getRawOne<{ total: string }>();
    return Number(row?.total ?? 0);
  }

  // Una sola consulta agrupada para todo el tenant -- evita N+1 al listar el
  // inventario completo con su disponible (ver InventoryService.getAllWithAvailability).
  async sumActiveQuantityByItemForTenant(): Promise<Map<string, number>> {
    const rows = await this.scoped()
      .select("entity.inventoryItemId", "inventoryItemId")
      .addSelect("SUM(entity.quantity)", "total")
      .andWhere("entity.status = 'active'")
      .groupBy("entity.inventoryItemId")
      .getRawMany<{ inventoryItemId: string; total: string }>();
    return new Map(rows.map((r) => [r.inventoryItemId, Number(r.total)]));
  }
}
