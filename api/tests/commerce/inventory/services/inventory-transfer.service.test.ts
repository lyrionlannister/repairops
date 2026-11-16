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
import { InventoryTransfer } from "../../../../src/commerce/inventory/entities/inventory-transfer.entity.js";
import { InventoryTransferDao } from "../../../../src/commerce/inventory/daos/inventory-transfer.dao.js";
import { InventoryTransferService } from "../../../../src/commerce/inventory/services/inventory-transfer.service.js";
import { runWithTenant } from "../../../../src/core/tenancy/tenant-context.js";

describe("InventoryTransferService.create", () => {
  let inventoryService: InventoryService;
  let transferService: InventoryTransferService;
  const tenantId = `${Date.now()}5`;

  beforeAll(async () => {
    await AppDataSource.initialize();
    const itemDao = new InventoryItemDao(AppDataSource.getRepository(InventoryItem));
    const movementDao = new InventoryMovementDao(AppDataSource.getRepository(InventoryMovement));
    const reservationDao = new InventoryReservationDao(AppDataSource.getRepository(InventoryReservation));
    inventoryService = new InventoryService(itemDao, movementDao, reservationDao);
    transferService = new InventoryTransferService(
      new InventoryTransferDao(AppDataSource.getRepository(InventoryTransfer)),
      itemDao,
      inventoryService,
    );
  });

  afterAll(async () => {
    await AppDataSource.destroy();
  });

  it("moves stock between two items of different branches, both sides on the same ledger", async () => {
    const fromItem = await runWithTenant(tenantId, () =>
      inventoryService.create({ localId: "1", name: "Pantalla A", sku: "PANTALLA-A", kind: "part", costPrice: 50, salePrice: 100, minStock: 0 }),
    );
    const toItem = await runWithTenant(tenantId, () =>
      inventoryService.create({ localId: "2", name: "Pantalla A", sku: "PANTALLA-A", kind: "part", costPrice: 50, salePrice: 100, minStock: 0 }),
    );
    await runWithTenant(tenantId, () => inventoryService.registerMovement({ inventoryItemId: fromItem.id, type: "in", quantity: 5 }));

    const transfer = await runWithTenant(tenantId, () =>
      transferService.create({ fromInventoryItemId: fromItem.id, toInventoryItemId: toItem.id, quantity: 3 }),
    );

    const [fromAfter, toAfter] = await runWithTenant(tenantId, () =>
      Promise.all([inventoryService.getById(fromItem.id), inventoryService.getById(toItem.id)]),
    );
    expect(fromAfter?.quantityOnHand).toBe(2);
    expect(toAfter?.quantityOnHand).toBe(3);

    const [fromMovements, toMovements] = await runWithTenant(tenantId, () =>
      Promise.all([inventoryService.getMovements(fromItem.id), inventoryService.getMovements(toItem.id)]),
    );
    const outMove = fromMovements.find((m) => m.relatedEntityType === "transfer" && m.relatedEntityId === transfer.id);
    const inMove = toMovements.find((m) => m.relatedEntityType === "transfer" && m.relatedEntityId === transfer.id);
    expect(outMove?.type).toBe("out");
    expect(inMove?.type).toBe("in");
  });

  it("rejects a transfer between two items of the same branch", async () => {
    const itemA = await runWithTenant(tenantId, () =>
      inventoryService.create({ localId: "3", name: "Bateria", sku: "BAT-SAME", kind: "part", costPrice: 10, salePrice: 20, minStock: 0 }),
    );
    const itemB = await runWithTenant(tenantId, () =>
      inventoryService.create({ localId: "3", name: "Bateria 2", sku: "BAT-SAME-2", kind: "part", costPrice: 10, salePrice: 20, minStock: 0 }),
    );
    await runWithTenant(tenantId, () => inventoryService.registerMovement({ inventoryItemId: itemA.id, type: "in", quantity: 5 }));

    await expect(
      runWithTenant(tenantId, () => transferService.create({ fromInventoryItemId: itemA.id, toInventoryItemId: itemB.id, quantity: 1 })),
    ).rejects.toThrow("misma sucursal");
  });

  it("rejects a transfer when the origin lacks enough stock, and moves nothing", async () => {
    const fromItem = await runWithTenant(tenantId, () =>
      inventoryService.create({ localId: "4", name: "Cargador", sku: "CARG-LOW", kind: "accessory", costPrice: 5, salePrice: 15, minStock: 0 }),
    );
    const toItem = await runWithTenant(tenantId, () =>
      inventoryService.create({ localId: "5", name: "Cargador", sku: "CARG-LOW", kind: "accessory", costPrice: 5, salePrice: 15, minStock: 0 }),
    );
    await runWithTenant(tenantId, () => inventoryService.registerMovement({ inventoryItemId: fromItem.id, type: "in", quantity: 1 }));

    await expect(
      runWithTenant(tenantId, () => transferService.create({ fromInventoryItemId: fromItem.id, toInventoryItemId: toItem.id, quantity: 5 })),
    ).rejects.toThrow();

    const [fromAfter, toAfter] = await runWithTenant(tenantId, () =>
      Promise.all([inventoryService.getById(fromItem.id), inventoryService.getById(toItem.id)]),
    );
    expect(fromAfter?.quantityOnHand).toBe(1);
    expect(toAfter?.quantityOnHand).toBe(0);
  });

  it("rejects a transfer whose item belongs to a different tenant (tenant isolation)", async () => {
    const otherTenantId = `${Date.now()}6`;
    const itemOfTenantA = await runWithTenant(tenantId, () =>
      inventoryService.create({ localId: "6", name: "Funda cross", sku: "FUNDA-CROSS", kind: "accessory", costPrice: 5, salePrice: 10, minStock: 0 }),
    );
    const itemOfTenantB = await runWithTenant(otherTenantId, () =>
      inventoryService.create({ localId: "1", name: "Funda B", sku: "FUNDA-B", kind: "accessory", costPrice: 5, salePrice: 10, minStock: 0 }),
    );

    await expect(
      runWithTenant(otherTenantId, () =>
        transferService.create({ fromInventoryItemId: itemOfTenantA.id, toInventoryItemId: itemOfTenantB.id, quantity: 1 }),
      ),
    ).rejects.toThrow("Item origen no encontrado");
  });
});
