import { singleton } from "tsyringe";
import AppDataSource from "../../../core/config/data-source.js";
import { getCurrentTenantId } from "../../../core/tenancy/tenant-context.js";
import { BranchDao } from "../../../identity/branches/daos/branch.dao.js";
import { InventoryItemDao } from "../daos/inventory-item.dao.js";
import { InventoryCountDao } from "../daos/inventory-count.dao.js";
import { InventoryCountItemDao } from "../daos/inventory-count-item.dao.js";
import { InventoryCount } from "../entities/inventory-count.entity.js";
import { InventoryCountItem } from "../entities/inventory-count-item.entity.js";
import { InventoryService } from "./inventory.service.js";

export class InventoryCountCloseBlockedError extends Error {
  constructor(public readonly missingReasonItemIds: string[]) {
    super("Hay líneas con diferencia sin motivo: no se puede cerrar el conteo");
    this.name = "InventoryCountCloseBlockedError";
  }
}

@singleton()
export class InventoryCountService {
  constructor(
    private countDao: InventoryCountDao,
    private countItemDao: InventoryCountItemDao,
    private branchDao: BranchDao,
    private itemDao: InventoryItemDao,
    private inventoryService: InventoryService,
  ) {}

  async getById(id: string): Promise<InventoryCount | null> {
    return this.countDao.findById(id);
  }

  async getItems(countId: string): Promise<InventoryCountItem[]> {
    return this.countItemDao.findByCountId(countId);
  }

  // Siembra una InventoryCountItem por cada item ACTUAL de la sucursal, sin
  // "cantidad esperada" -- el esperado se lee en vivo al cerrar (arqueo
  // ciego, mismo criterio que CashService.closeSession).
  async open(branchId: string, openedByEmployeeId?: string | null): Promise<InventoryCount> {
    const branch = await this.branchDao.findById(branchId);
    if (!branch) throw new Error("Sucursal no encontrada");

    const tenantId = getCurrentTenantId();
    const items = await this.itemDao.findByLocalId(branchId);

    return AppDataSource.transaction(async (manager) => {
      const count = manager.create(InventoryCount, {
        tenantId,
        branchId,
        status: "open",
        openedByEmployeeId: openedByEmployeeId ?? null,
        closedByEmployeeId: null,
        closedAt: null,
      });
      const savedCount = await manager.save(count);

      for (const item of items) {
        const countItem = manager.create(InventoryCountItem, {
          tenantId,
          countId: savedCount.id,
          inventoryItemId: item.id,
          countedQuantity: null,
          reason: null,
          appliedMovementId: null,
        });
        await manager.save(countItem);
      }

      return savedCount;
    });
  }

  async setCounted(countItemId: string, countedQuantity: number, reason?: string | null): Promise<InventoryCountItem> {
    const countItem = await this.countItemDao.findById(countItemId);
    if (!countItem) throw new Error("Línea de conteo no encontrada");

    const count = await this.countDao.findById(countItem.countId);
    if (!count || count.status !== "open") {
      throw new Error("El conteo ya está cerrado");
    }

    const updated = await this.countItemDao.update(countItemId, {
      countedQuantity,
      reason: reason ?? null,
    });
    return updated as InventoryCountItem;
  }

  // Todo-o-nada por conteo completo (mismo criterio que SaleService.create/
  // ReturnService.create): si CUALQUIER linea con diferencia no tiene reason,
  // nada se aplica y se reporta cuales faltan. Lineas sin diferencia o sin
  // contar no generan movimiento.
  async close(countId: string, closedByEmployeeId?: string | null): Promise<InventoryCount> {
    const count = await this.countDao.findById(countId);
    if (!count) throw new Error("Conteo no encontrado");
    if (count.status !== "open") throw new Error("El conteo ya está cerrado");

    const items = await this.countItemDao.findByCountId(countId);
    const toAdjust: Array<{ countItem: InventoryCountItem; delta: number }> = [];
    const missingReason: string[] = [];

    for (const countItem of items) {
      if (countItem.countedQuantity === null) continue;
      const item = await this.itemDao.findById(countItem.inventoryItemId);
      if (!item) continue;
      const delta = countItem.countedQuantity - item.quantityOnHand;
      if (delta === 0) continue;
      if (!countItem.reason) {
        missingReason.push(countItem.id);
        continue;
      }
      toAdjust.push({ countItem, delta });
    }

    if (missingReason.length > 0) {
      throw new InventoryCountCloseBlockedError(missingReason);
    }

    return AppDataSource.transaction(async (manager) => {
      for (const { countItem, delta } of toAdjust) {
        const movement = await this.inventoryService.applyMovement(manager, {
          inventoryItemId: countItem.inventoryItemId,
          type: "adjustment",
          quantity: delta,
          reason: countItem.reason,
          relatedEntityType: "count",
          relatedEntityId: countItem.id,
        });
        await manager.update(InventoryCountItem, countItem.id, { appliedMovementId: movement.id });
      }

      await manager.update(InventoryCount, countId, {
        status: "closed",
        closedByEmployeeId: closedByEmployeeId ?? null,
        closedAt: new Date(),
      });

      return (await manager.findOneBy(InventoryCount, { id: countId })) as InventoryCount;
    });
  }
}
