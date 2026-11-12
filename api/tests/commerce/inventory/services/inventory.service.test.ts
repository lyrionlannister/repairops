import "reflect-metadata";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import AppDataSource from "../../../../src/core/config/data-source.js";
import { InventoryItem } from "../../../../src/commerce/inventory/entities/inventory-item.entity.js";
import { InventoryMovement } from "../../../../src/commerce/inventory/entities/inventory-movement.entity.js";
import { InventoryItemDao } from "../../../../src/commerce/inventory/daos/inventory-item.dao.js";
import { InventoryMovementDao } from "../../../../src/commerce/inventory/daos/inventory-movement.dao.js";
import { InventoryService } from "../../../../src/commerce/inventory/services/inventory.service.js";
import { runWithTenant } from "../../../../src/core/tenancy/tenant-context.js";

// Integration test against a real Postgres. Proves applyMovement's atomic
// guard: the UPDATE validates cantidad_disponible + delta >= 0 in the same
// statement, so concurrent "out" movements can never drive stock negative
// nor silently lose a decrement (same pattern as consumeControlNumber).
describe("InventoryService.registerMovement concurrency", () => {
  let service: InventoryService;
  const tenantId = `${Date.now()}1`;

  beforeAll(async () => {
    await AppDataSource.initialize();
    const itemDao = new InventoryItemDao(AppDataSource.getRepository(InventoryItem));
    const movementDao = new InventoryMovementDao(AppDataSource.getRepository(InventoryMovement));
    service = new InventoryService(itemDao, movementDao);
  });

  afterAll(async () => {
    await AppDataSource.destroy();
  });

  it("never lets concurrent 'out' movements drive stock negative", async () => {
    const item = await runWithTenant(tenantId, () =>
      service.create({
        localId: "1",
        name: "Pantalla A52",
        sku: "A52-SCR",
        kind: "part",
        costPrice: 500,
        salePrice: 900,
      }),
    );

    // Seed stock a 10 con un movimiento "in".
    await runWithTenant(tenantId, () =>
      service.registerMovement({ inventoryItemId: item.id, type: "in", quantity: 10 }),
    );

    // 5 salidas concurrentes de 2 unidades cada una: exactamente agotan el
    // stock, ninguna debe fallar y ninguna debe perderse.
    const results = await runWithTenant(tenantId, () =>
      Promise.allSettled(
        Array.from({ length: 5 }, () =>
          service.registerMovement({ inventoryItemId: item.id, type: "out", quantity: 2 }),
        ),
      ),
    );
    expect(results.every((r) => r.status === "fulfilled")).toBe(true);

    const final = await runWithTenant(tenantId, () => service.getById(item.id));
    expect(final?.quantityOnHand).toBe(0);

    // Una salida adicional ya sin stock debe rechazarse, no dejar negativo.
    await expect(
      runWithTenant(tenantId, () =>
        service.registerMovement({ inventoryItemId: item.id, type: "out", quantity: 1 }),
      ),
    ).rejects.toThrow();

    const afterRejected = await runWithTenant(tenantId, () => service.getById(item.id));
    expect(afterRejected?.quantityOnHand).toBe(0);
  });
});

describe("InventoryService.bulkImport", () => {
  let service: InventoryService;
  const tenantId = `${Date.now()}2`;

  beforeAll(async () => {
    await AppDataSource.initialize();
    const itemDao = new InventoryItemDao(AppDataSource.getRepository(InventoryItem));
    const movementDao = new InventoryMovementDao(AppDataSource.getRepository(InventoryMovement));
    service = new InventoryService(itemDao, movementDao);
  });

  afterAll(async () => {
    await AppDataSource.destroy();
  });

  it("crea cada fila con su stock inicial registrado como movimiento 'in'", async () => {
    const result = await runWithTenant(tenantId, () =>
      service.bulkImport("1", [
        { name: "Funda A", sku: null, kind: "accessory", costPrice: 10, salePrice: 30, quantity: 5 },
        { name: "Pantalla B", sku: null, kind: "part", costPrice: 100, salePrice: 200, quantity: 0 },
      ]),
    );

    expect(result).toEqual({ imported: 2 });

    const items = await runWithTenant(tenantId, () => service.getAll());
    const fundaA = items.find((i) => i.name === "Funda A");
    const pantallaB = items.find((i) => i.name === "Pantalla B");
    expect(fundaA?.quantityOnHand).toBe(5);
    expect(pantallaB?.quantityOnHand).toBe(0);

    const movements = await runWithTenant(tenantId, () => service.getMovements(fundaA!.id));
    expect(movements).toHaveLength(1);
    expect(movements[0].type).toBe("in");
  });

  it("no crea nada si la lista de filas está vacía", async () => {
    await expect(runWithTenant(tenantId, () => service.bulkImport("1", []))).rejects.toThrow(
      "No hay filas para importar",
    );
  });
});

// Búsqueda por SKU (escáner) y alerta de stock mínimo -- piezas de la
// Fase 1 (paridad visible: búsqueda por código de barras, alertas de stock).
describe("InventoryService.getBySku / getLowStock", () => {
  let service: InventoryService;
  const tenantId = `${Date.now()}6`;

  beforeAll(async () => {
    await AppDataSource.initialize();
    const itemDao = new InventoryItemDao(AppDataSource.getRepository(InventoryItem));
    const movementDao = new InventoryMovementDao(AppDataSource.getRepository(InventoryMovement));
    service = new InventoryService(itemDao, movementDao);
  });

  afterAll(async () => {
    await AppDataSource.destroy();
  });

  it("finds an item by its sku and returns null for an unknown one", async () => {
    await runWithTenant(tenantId, () =>
      service.create({
        localId: "1",
        name: "Cargador USB-C",
        sku: "CHG-USBC-01",
        kind: "accessory",
        costPrice: 50,
        salePrice: 120,
        minStock: 0,
      }),
    );

    const found = await runWithTenant(tenantId, () => service.getBySku("CHG-USBC-01"));
    expect(found?.name).toBe("Cargador USB-C");

    const missing = await runWithTenant(tenantId, () => service.getBySku("NO-EXISTE"));
    expect(missing).toBeNull();
  });

  it("only lists items whose stock is at or below their configured minimum", async () => {
    const low = await runWithTenant(tenantId, () =>
      service.create({
        localId: "1",
        name: "Pantalla con alerta",
        sku: "LOW-01",
        kind: "part",
        costPrice: 400,
        salePrice: 700,
        minStock: 3,
      }),
    );
    const healthy = await runWithTenant(tenantId, () =>
      service.create({
        localId: "1",
        name: "Pantalla sin alerta",
        sku: "LOW-02",
        kind: "part",
        costPrice: 400,
        salePrice: 700,
        minStock: 3,
      }),
    );
    await runWithTenant(tenantId, () =>
      service.create({
        localId: "1",
        name: "Sin minimo configurado",
        sku: "LOW-03",
        kind: "part",
        costPrice: 400,
        salePrice: 700,
        minStock: 0,
      }),
    );

    await runWithTenant(tenantId, () =>
      Promise.all([
        service.registerMovement({ inventoryItemId: low.id, type: "in", quantity: 2 }),
        service.registerMovement({ inventoryItemId: healthy.id, type: "in", quantity: 10 }),
      ]),
    );

    const lowStock = await runWithTenant(tenantId, () => service.getLowStock());
    const names = lowStock.map((i) => i.name);
    expect(names).toContain("Pantalla con alerta");
    expect(names).not.toContain("Pantalla sin alerta");
    expect(names).not.toContain("Sin minimo configurado");
  });
});
