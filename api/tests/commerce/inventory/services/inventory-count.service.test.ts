import "reflect-metadata";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import AppDataSource from "../../../../src/core/config/data-source.js";
import { InventoryItem } from "../../../../src/commerce/inventory/entities/inventory-item.entity.js";
import { InventoryMovement } from "../../../../src/commerce/inventory/entities/inventory-movement.entity.js";
import { InventoryItemDao } from "../../../../src/commerce/inventory/daos/inventory-item.dao.js";
import { InventoryMovementDao } from "../../../../src/commerce/inventory/daos/inventory-movement.dao.js";
import { InventoryReservation } from "../../../../src/commerce/inventory/entities/inventory-reservation.entity.js";
import { InventoryReservationDao } from "../../../../src/commerce/inventory/daos/inventory-reservation.dao.js";
import { InventoryService } from "../../../../src/commerce/inventory/services/inventory.service.js";
import { InventoryCount } from "../../../../src/commerce/inventory/entities/inventory-count.entity.js";
import { InventoryCountItem } from "../../../../src/commerce/inventory/entities/inventory-count-item.entity.js";
import { InventoryCountDao } from "../../../../src/commerce/inventory/daos/inventory-count.dao.js";
import { InventoryCountItemDao } from "../../../../src/commerce/inventory/daos/inventory-count-item.dao.js";
import { InventoryCountService, InventoryCountCloseBlockedError } from "../../../../src/commerce/inventory/services/inventory-count.service.js";
import { Branch } from "../../../../src/identity/branches/entities/branch.entity.js";
import { BranchDao } from "../../../../src/identity/branches/daos/branch.dao.js";
import { runWithTenant } from "../../../../src/core/tenancy/tenant-context.js";

describe("InventoryCountService", () => {
  let inventoryService: InventoryService;
  let countService: InventoryCountService;
  let branchDao: BranchDao;
  const tenantId = `${Date.now()}7`;

  beforeAll(async () => {
    await AppDataSource.initialize();
    const itemDao = new InventoryItemDao(AppDataSource.getRepository(InventoryItem));
    const movementDao = new InventoryMovementDao(AppDataSource.getRepository(InventoryMovement));
    const reservationDao = new InventoryReservationDao(AppDataSource.getRepository(InventoryReservation));
    inventoryService = new InventoryService(itemDao, movementDao, reservationDao);
    branchDao = new BranchDao(AppDataSource.getRepository(Branch));
    countService = new InventoryCountService(
      new InventoryCountDao(AppDataSource.getRepository(InventoryCount)),
      new InventoryCountItemDao(AppDataSource.getRepository(InventoryCountItem)),
      branchDao,
      itemDao,
      inventoryService,
    );
  });

  afterAll(async () => {
    await AppDataSource.destroy();
  });

  it("seeds one count item per current inventory item of the branch, with nothing counted yet", async () => {
    const branch = await runWithTenant(tenantId, () => branchDao.create({ name: "Sucursal conteo 1" }));
    await runWithTenant(tenantId, () =>
      inventoryService.create({ localId: branch.id, name: "Item A", sku: "CNT-A", kind: "accessory", costPrice: 5, salePrice: 10, minStock: 0 }),
    );
    await runWithTenant(tenantId, () =>
      inventoryService.create({ localId: branch.id, name: "Item B", sku: "CNT-B", kind: "accessory", costPrice: 5, salePrice: 10, minStock: 0 }),
    );

    const count = await runWithTenant(tenantId, () => countService.open(branch.id));
    const items = await runWithTenant(tenantId, () => countService.getItems(count.id));
    expect(items).toHaveLength(2);
    expect(items.every((i) => i.countedQuantity === null)).toBe(true);
  });

  it("closes with no adjustments when counted matches quantityOnHand", async () => {
    const branch = await runWithTenant(tenantId, () => branchDao.create({ name: "Sucursal conteo 2" }));
    const item = await runWithTenant(tenantId, () =>
      inventoryService.create({ localId: branch.id, name: "Item exacto", sku: "CNT-EXACT", kind: "accessory", costPrice: 5, salePrice: 10, minStock: 0 }),
    );
    await runWithTenant(tenantId, () => inventoryService.registerMovement({ inventoryItemId: item.id, type: "in", quantity: 10 }));

    const count = await runWithTenant(tenantId, () => countService.open(branch.id));
    const [countItem] = await runWithTenant(tenantId, () => countService.getItems(count.id));
    await runWithTenant(tenantId, () => countService.setCounted(countItem.id, 10));

    const closed = await runWithTenant(tenantId, () => countService.close(count.id));
    expect(closed.status).toBe("closed");
    const stock = await runWithTenant(tenantId, () => inventoryService.getById(item.id));
    expect(stock?.quantityOnHand).toBe(10);
  });

  it("applies a real adjustment (shortage and surplus) when justified, and blocks the whole close when a line lacks a reason", async () => {
    const branch = await runWithTenant(tenantId, () => branchDao.create({ name: "Sucursal conteo 3" }));
    const shortageItem = await runWithTenant(tenantId, () =>
      inventoryService.create({ localId: branch.id, name: "Faltante", sku: "CNT-SHORT", kind: "accessory", costPrice: 5, salePrice: 10, minStock: 0 }),
    );
    const surplusItem = await runWithTenant(tenantId, () =>
      inventoryService.create({ localId: branch.id, name: "Sobrante", sku: "CNT-SURPLUS", kind: "accessory", costPrice: 5, salePrice: 10, minStock: 0 }),
    );
    await runWithTenant(tenantId, () => inventoryService.registerMovement({ inventoryItemId: shortageItem.id, type: "in", quantity: 10 }));
    await runWithTenant(tenantId, () => inventoryService.registerMovement({ inventoryItemId: surplusItem.id, type: "in", quantity: 10 }));

    const count = await runWithTenant(tenantId, () => countService.open(branch.id));
    const items = await runWithTenant(tenantId, () => countService.getItems(count.id));
    const shortageCountItem = items.find((i) => i.inventoryItemId === shortageItem.id)!;
    const surplusCountItem = items.find((i) => i.inventoryItemId === surplusItem.id)!;

    // Faltante sin motivo -> bloquea el cierre completo, nada se aplica.
    await runWithTenant(tenantId, () => countService.setCounted(shortageCountItem.id, 7));
    await runWithTenant(tenantId, () => countService.setCounted(surplusCountItem.id, 12, "Conteo físico real"));

    await expect(runWithTenant(tenantId, () => countService.close(count.id))).rejects.toThrow(InventoryCountCloseBlockedError);

    const stockUnchanged = await runWithTenant(tenantId, () => inventoryService.getById(surplusItem.id));
    expect(stockUnchanged?.quantityOnHand).toBe(10); // nada se aplico todavia

    // Ahora con motivo en ambas, cierra y aplica los dos ajustes.
    await runWithTenant(tenantId, () => countService.setCounted(shortageCountItem.id, 7, "Merma no registrada"));
    const closed = await runWithTenant(tenantId, () => countService.close(count.id));
    expect(closed.status).toBe("closed");

    const [shortageAfter, surplusAfter] = await runWithTenant(tenantId, () =>
      Promise.all([inventoryService.getById(shortageItem.id), inventoryService.getById(surplusItem.id)]),
    );
    expect(shortageAfter?.quantityOnHand).toBe(7);
    expect(surplusAfter?.quantityOnHand).toBe(12);
  });

  it("ignores lines that were never counted (countedQuantity null)", async () => {
    const branch = await runWithTenant(tenantId, () => branchDao.create({ name: "Sucursal conteo 4" }));
    const item = await runWithTenant(tenantId, () =>
      inventoryService.create({ localId: branch.id, name: "No contado", sku: "CNT-SKIP", kind: "accessory", costPrice: 5, salePrice: 10, minStock: 0 }),
    );
    await runWithTenant(tenantId, () => inventoryService.registerMovement({ inventoryItemId: item.id, type: "in", quantity: 3 }));

    const count = await runWithTenant(tenantId, () => countService.open(branch.id));
    const closed = await runWithTenant(tenantId, () => countService.close(count.id));
    expect(closed.status).toBe("closed");
    const stock = await runWithTenant(tenantId, () => inventoryService.getById(item.id));
    expect(stock?.quantityOnHand).toBe(3);
  });
});
