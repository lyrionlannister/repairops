import "reflect-metadata";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import AppDataSource from "../../../../src/core/config/data-source.js";
import { InventoryItem } from "../../../../src/commerce/inventory/entities/inventory-item.entity.js";
import { InventoryItemDao } from "../../../../src/commerce/inventory/daos/inventory-item.dao.js";
import { runWithTenant } from "../../../../src/core/tenancy/tenant-context.js";

describe("InventoryItemDao.findPage / lookup / stats", () => {
  let dao: InventoryItemDao;
  const base = Date.now();
  const tenantA = `${base}51`;
  const tenantB = `${base}52`;

  const item = (
    tenantId: string,
    name: string,
    sku: string | null,
    qty: number,
    minStock: number,
    cost: string,
  ) => ({
    tenantId,
    localId: "1",
    name,
    sku,
    kind: "part" as const,
    costPrice: cost,
    salePrice: "1.00",
    quantityOnHand: qty,
    minStock,
  });

  beforeAll(async () => {
    await AppDataSource.initialize();
    dao = new InventoryItemDao(AppDataSource.getRepository(InventoryItem));
    await AppDataSource.getRepository(InventoryItem).save([
      item(tenantA, "Batería iPhone 11", "BAT-11", 10, 2, "0.10"),
      item(tenantA, "Pantalla A15", "PAN-A15", 2, 0, "0.20"),
      item(tenantA, "Mica", null, 5, 6, "100.05"),
      item(tenantB, "Batería ajena", "BAT-X", 0, 5, "999.00"),
    ]);
  });

  afterAll(async () => {
    await AppDataSource.destroy();
  });

  const inTenantA = <T>(fn: () => Promise<T>) => runWithTenant(tenantA, fn);

  it("pages by name and searches name or SKU", async () => {
    const first = await inTenantA(() => dao.findPage({ branchId: null }, { page: 1, pageSize: 2 }));
    expect(first.total).toBe(3);
    expect(first.items.map((i) => i.name)).toEqual(["Batería iPhone 11", "Mica"]);
    const bySku = await inTenantA(() =>
      dao.findPage({ branchId: null, search: "pan-a" }, { page: 1, pageSize: 10 }),
    );
    expect(bySku.items.map((i) => i.name)).toEqual(["Pantalla A15"]);
  });

  it("filters critical stock with the dashboard threshold (min stock or 3)", async () => {
    const critical = await inTenantA(() =>
      dao.findPage({ branchId: null, criticalOnly: true }, { page: 1, pageSize: 10 }),
    );
    expect(critical.items.map((i) => i.name)).toEqual(["Mica", "Pantalla A15"]);
  });

  it("computes stats over the whole filter with exact money", async () => {
    const stats = await inTenantA(() => dao.stats({ branchId: null }));
    expect(stats.skuCount).toBe(3);
    // 10 * 0.10 + 2 * 0.20 + 5 * 100.05 = 501.65
    expect(stats.stockValueAtCost).toBe("501.65");
    expect(stats.criticalCount).toBe(2);
    expect(stats.criticalItems.map((i) => i.name)).toEqual(["Pantalla A15", "Mica"]);
  });

  it("never mixes another tenant's items", async () => {
    const lookup = await inTenantA(() => dao.lookup({ branchId: null, search: "bater" }, 10));
    expect(lookup.map((i) => i.name)).toEqual(["Batería iPhone 11"]);
    const statsB = await runWithTenant(tenantB, () => dao.stats({ branchId: null }));
    expect(statsB).toMatchObject({ skuCount: 1, stockValueAtCost: "0.00", criticalCount: 1 });
  });
});
