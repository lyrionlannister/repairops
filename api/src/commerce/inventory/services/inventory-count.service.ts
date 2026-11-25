import { singleton } from "tsyringe";
import { isUniqueViolation } from "../../../core/database/unique-violation.js";
import { currentUserId } from "../../../identity/authz/access.js";
import { InventoryItem } from "../entities/inventory-item.entity.js";
import AppDataSource from "../../../core/config/data-source.js";
import { getCurrentTenantId } from "../../../core/tenancy/tenant-context.js";
import { BranchDao } from "../../../identity/branches/daos/branch.dao.js";
import { InventoryItemDao } from "../daos/inventory-item.dao.js";
import { InventoryCountDao } from "../daos/inventory-count.dao.js";
import { InventoryCountItemDao } from "../daos/inventory-count-item.dao.js";
import { InventoryCount } from "../entities/inventory-count.entity.js";
import { InventoryCountItem } from "../entities/inventory-count-item.entity.js";
import { InventoryService } from "./inventory.service.js";
import { LocalService } from "../../../app_platform/local/services/local.service.js";
import { BusinessError } from "../../../core/http/business-error.js";

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
    private localService: LocalService,
  ) {}

  async getById(id: string): Promise<InventoryCount | null> {
    return this.countDao.findById(id);
  }

  async getItems(
    countId: string,
  ): Promise<Array<InventoryCountItem & { itemName: string | null; itemSku: string | null }>> {
    const items = await this.countItemDao.findByCountId(countId);
    const labels = await this.itemDao.findLabels(items.map((item) => item.inventoryItemId));
    return items.map((item) => {
      const label = labels.get(String(item.inventoryItemId));
      return Object.assign(item, { itemName: label?.name ?? null, itemSku: label?.sku ?? null });
    });
  }

  // Siembra una InventoryCountItem por cada item ACTUAL de la sucursal, sin
  // "cantidad esperada" -- el esperado se lee en vivo al cerrar (arqueo
  // ciego, mismo criterio que CashService.closeSession).
  async open(branchId: string): Promise<InventoryCount> {
    const branch = await this.branchDao.findById(branchId);
    if (!branch) throw new BusinessError("Sucursal no encontrada");
    if (await this.countDao.findOpenByBranch(branchId)) {
      throw new BusinessError("Ya hay un conteo abierto en esta sucursal: ciérralo antes de abrir otro");
    }

    const tenantId = getCurrentTenantId();
    const items = await this.itemDao.findByLocalId(branchId);
    return AppDataSource.transaction(async (manager) => {
      const countNumber = await this.localService.consumeFolio("count", manager);
      const count = manager.create(InventoryCount, {
        tenantId,
        branchId,
        countNumber,
        status: "open",
        openedByEmployeeId: currentUserId(),
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
    }).catch((error: unknown) => {
      if (isUniqueViolation(error)) {
        throw new BusinessError("Ya hay un conteo abierto en esta sucursal: ciérralo antes de abrir otro");
      }
      throw error;
    });
  }

  async setCounted(
    countItemId: string,
    countedQuantity: number,
    reason?: string | null,
  ): Promise<InventoryCountItem> {
    const countItem = await this.countItemDao.findById(countItemId);
    if (!countItem) throw new BusinessError("Línea de conteo no encontrada");

    const count = await this.countDao.findById(countItem.countId);
    if (!count || count.status !== "open") {
      throw new BusinessError("El conteo ya está cerrado");
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
  // El cierre se reclama con un UPDATE condicional dentro de la transacción:
  // dos cierres simultáneos nunca aplican dos veces los ajustes. Las
  // diferencias se calculan ahí mismo contra el stock vigente.
  async close(countId: string): Promise<InventoryCount> {
    const count = await this.countDao.findById(countId);
    if (!count) throw new BusinessError("Conteo no encontrado");
    if (count.status !== "open") throw new BusinessError("El conteo ya está cerrado");
    const tenantId = getCurrentTenantId();

    return AppDataSource.transaction(async (manager) => {
      const claimed = await manager
        .createQueryBuilder()
        .update(InventoryCount)
        .set({ status: "closed", closedByEmployeeId: currentUserId(), closedAt: new Date() })
        .where("id = :id AND tenant_id = :tenantId AND estado = 'open'", { id: count.id, tenantId })
        .execute();
      if (!claimed.affected) throw new BusinessError("El conteo ya está cerrado");

      const items = await manager.find(InventoryCountItem, {
        where: { countId: count.id, tenantId },
      });
      const toAdjust: Array<{ countItem: InventoryCountItem; delta: number }> = [];
      const missingReason: string[] = [];
      for (const countItem of items) {
        if (countItem.countedQuantity === null) continue;
        const item = await manager.findOneBy(InventoryItem, {
          id: countItem.inventoryItemId,
          tenantId,
        });
        if (!item) continue;
        const delta = countItem.countedQuantity - item.quantityOnHand;
        if (delta === 0) continue;
        if (!countItem.reason) missingReason.push(countItem.id);
        else toAdjust.push({ countItem, delta });
      }
      if (missingReason.length > 0) throw new InventoryCountCloseBlockedError(missingReason);

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

      return (await manager.findOneBy(InventoryCount, { id: count.id })) as InventoryCount;
    });
  }
}
